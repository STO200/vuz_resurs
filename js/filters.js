// filters.js - логика фильтрации ресурсов

import { appState } from './state.js';

function parseDate(dateStr) {
    const formats = [
        { regex: /(\d{2})\.(\d{2})\.(\d{4})/, format: (m) => new Date(m[3], m[2]-1, m[1]) },
        { regex: /(\d{4})-(\d{2})-(\d{2})/, format: (m) => new Date(m[1], m[2]-1, m[3]) }
    ];

    for (let fmt of formats) {
        const match = dateStr.match(fmt.regex);
        if (match) return fmt.format(match);
    }
    return null;
}

function isDateInRange(dateString, daysFromNow) {
    if (!dateString) return true;
    const date = parseDate(dateString);
    if (!date) return true;
    const today = new Date();
    const futureDate = new Date(today.getTime() + daysFromNow * 24 * 60 * 60 * 1000);
    return date >= today && date <= futureDate;
}

function isRegistrationActive(dates) {
    if (!dates || !dates.registration) return false;
    const [startStr, endStr] = dates.registration.split(' - ');
    if (!endStr) return false;
    const today = new Date();
    const start = parseDate(startStr.trim());
    const end = parseDate(endStr.trim());
    return start && end && today >= start && today <= end;
}

function getEventDate(resource) {
    if (resource.type === 'olympiad' && resource.dates?.final) {
        return resource.dates.final;
    }
    if (resource.dates?.event) {
        return resource.dates.event.split(' ')[0];
    }
    if (resource.dates?.program) {
        return resource.dates.program.split(' ')[0];
    }
    return null;
}

export function getAllResources() {
    if (!appState.universityData) return [];

    const {
        olympiads = [],
        courses = [],
        schools = [],
        summerPrograms = [],
        practicalEvents = [],
        infoEvents = [],
        educationalEvents = [],
        onlineResources = []
    } = appState.universityData;

    let allResources = [];

    allResources.push(...olympiads.map(r => ({ ...r, type: 'olympiad' })));
    allResources.push(...courses.map(r => ({ ...r, type: 'course', categoryType: r.type })));
    allResources.push(...schools.map(r => ({ ...r, type: 'school' })));
    allResources.push(...summerPrograms.map(r => ({ ...r, type: 'summerProgram' })));
    allResources.push(...practicalEvents.map(r => ({ ...r, type: 'practicalEvent' })));
    allResources.push(...infoEvents.map(r => ({ ...r, type: 'infoEvent' })));
    allResources.push(...educationalEvents.map(r => ({ ...r, type: 'educationalEvent' })));
    allResources.push(...onlineResources.map(r => ({ ...r, type: 'onlineResource' })));

    return allResources;
}

export function applyFilters(resources) {
    return resources.filter(resource => {
        // Фильтр по типу
        if (appState.activeFilters.type !== 'all' &&
            resource.type !== appState.activeFilters.type) {
            return false;
        }

        // Фильтр по льготам
        if (appState.activeFilters.benefits.length > 0 && resource.benefits) {
            const hasRequiredBenefits = appState.activeFilters.benefits.some(benefit => {
                if (benefit === 'bvi') return resource.benefits.bvi;
                if (benefit === 'points100') return resource.benefits.points100;
                if (benefit === 'additionalPoints') return resource.benefits.additionalPoints > 0;
                if (benefit === 'grants') return resource.benefits.grants !== null;
                if (benefit === 'tuitionDiscount') return resource.benefits.tuitionDiscount !== null;
                if (benefit === 'priority') return resource.benefits.priority;
                if (benefit === 'earlyAdmission') return resource.benefits.earlyAdmission;
                return false;
            });

            if (!hasRequiredBenefits) return false;
        }

        // Фильтр по стоимости
        if (appState.activeFilters.costFilter !== 'all') {
            if (appState.activeFilters.costFilter === 'free' && resource.cost?.type !== 'бесплатно') {
                return false;
            }
            if (appState.activeFilters.costFilter === 'paid' && resource.cost?.type !== 'платно') {
                return false;
            }
        }

        // Фильтр по датам (закомментирован в UI, но работает в коде)
        if (appState.activeFilters.dateFilter === 'upcoming') {
            const eventDate = getEventDate(resource);
            if (!isDateInRange(eventDate, 90)) return false;
        } else if (appState.activeFilters.dateFilter === 'active-registration') {
            if (!isRegistrationActive(resource.dates)) return false;
        }

        return true;
    });
}