// state.js - управление состоянием приложения

export let appState = {
    universities: [],
    selectedUniversity: null,
    universityData: null,
    activeFilters: {
        type: 'all',
        benefits: [],
        costFilter: 'all',
        dateFilter: 'all'  // закомментирован в UI, но работает в коде
    }
};

export function setSelectedUniversity(universityId) {
    appState.selectedUniversity = universityId;
}

export function setUniversityData(data) {
    appState.universityData = data;
}

export function setUniversities(universities) {
    appState.universities = universities;
}

export function updateFilter(type, value) {
    if (type === 'type') {
        appState.activeFilters.type = value;
    } else if (type === 'benefits') {
        appState.activeFilters.benefits = value;
    } else if (type === 'costFilter') {
        appState.activeFilters.costFilter = value;
    } else if (type === 'dateFilter') {
        appState.activeFilters.dateFilter = value;
    }
}

export function resetFilters() {
    appState.activeFilters.type = 'all';
    appState.activeFilters.benefits = [];
    appState.activeFilters.costFilter = 'all';
    appState.activeFilters.dateFilter = 'all';
}

export function clearUniversityData() {
    appState.selectedUniversity = null;
    appState.universityData = null;
}