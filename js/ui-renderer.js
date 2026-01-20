// ui-renderer.js - рендеринг UI

import { appState, setSelectedUniversity, resetFilters } from './state.js';
import { getAllResources, applyFilters } from './filters.js';
import { createResourceCard } from './resource-cards.js';

export function initializeUI() {
    const select = document.getElementById('universitySelect');

    appState.universities.forEach(uni => {
        const option = document.createElement('option');
        option.value = uni.id;
        option.textContent = uni.name;
        select.appendChild(option);
    });
}

export function showResults(universityId) {
    setSelectedUniversity(universityId);

    const university = appState.universities.find(u => u.id === universityId);
    document.getElementById('resultsTitle').textContent = `Ресурсы для поступления в ${university.name}`;

    document.getElementById('mainPage').classList.remove('active');
    document.getElementById('resultsPage').classList.add('active');

    resetFilters();
    updateFilterUI();
    renderResults();
}

export function showMainPage() {
    document.getElementById('resultsPage').classList.remove('active');
    document.getElementById('mainPage').classList.add('active');
}

export function renderResults() {
    const container = document.getElementById('resultsList');
    container.innerHTML = '';

    let allResources = getAllResources();
    allResources = applyFilters(allResources);

    if (allResources.length === 0) {
        container.innerHTML = '<div class="empty-state"><h3>😕 Ресурсы не найдены</h3><p>Попробуйте изменить фильтры</p></div>';
        return;
    }

    allResources.forEach(resource => {
        container.appendChild(createResourceCard(resource));
    });
}

export function updateFilterUI() {
    // Синхронизация фильтра по типам
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === appState.activeFilters.type);
    });

    // Синхронизация фильтра по стоимости
    document.querySelectorAll('.cost-filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.costFilter === appState.activeFilters.costFilter);
    });

    // Синхронизация фильтра по датам (закомментирован в UI)
    document.querySelectorAll('.date-filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.dateFilter === appState.activeFilters.dateFilter);
    });

    // Синхронизация фильтра по льготам
    document.querySelectorAll('.benefit-filter').forEach(cb => {
        cb.checked = appState.activeFilters.benefits.includes(cb.value);
    });
}