// app.js - главный файл приложения

import { loadUniversities, loadUniversityData } from './data-loader.js';
import { initializeUI, showResults, showMainPage } from './ui-renderer.js';
import { setupEventListeners } from './event-handlers.js';

// Инициализация приложения
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Загружаем список ВУЗов
        await loadUniversities();

        // Инициализируем UI
        initializeUI();

        // При выборе ВУЗа загружаем его данные
        document.getElementById('searchBtn').addEventListener('click', async () => {
            const selectedId = document.getElementById('universitySelect').value;
            if (selectedId) {
                await loadUniversityData(selectedId);
                showResults(selectedId);
            } else {
                alert('Выберите ВУЗ');
            }
        });

        // Кнопка возврата
        document.getElementById('backBtn').addEventListener('click', () => {
            showMainPage();
        });

        // Инициализируем остальные обработчики
        setupEventListeners();
    } catch (error) {
        console.error('Ошибка инициализации приложения:', error);
        alert('Ошибка загрузки приложения');
    }
});