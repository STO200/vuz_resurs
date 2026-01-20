// event-handlers.js - обработчики событий

import { updateFilter, resetFilters } from './state.js';
import { showMainPage, renderResults, updateFilterUI } from './ui-renderer.js';

export function setupEventListeners() {
    // Фильтры типа ресурса
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            updateFilter('type', this.dataset.filter);
            updateFilterUI();
            renderResults();
        });
    });

    // Фильтры по стоимости
    document.querySelectorAll('.cost-filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            updateFilter('costFilter', this.dataset.costFilter);
            updateFilterUI();
            renderResults();
        });
    });

    // Фильтры по датам (закомментирован в UI)
    document.querySelectorAll('.date-filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            updateFilter('dateFilter', this.dataset.dateFilter);
            updateFilterUI();
            renderResults();
        });
    });

    // Фильтры по льготам
    document.querySelectorAll('.benefit-filter').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const benefits = Array.from(
                document.querySelectorAll('.benefit-filter:checked')
            ).map(cb => cb.value);
            updateFilter('benefits', benefits);
            renderResults();
        });
    });

    // Кнопка сброса фильтров
    document.getElementById('resetBtn').addEventListener('click', () => {
        resetFilters();
        updateFilterUI();
        renderResults();
    });
}