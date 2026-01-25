// app.js - главный файл приложения

import { loadUniversities, loadUniversityData } from './data-loader.js';
import { initializeUI, showResults, showMainPage } from './ui-renderer.js';
import { setupEventListeners } from './event-handlers.js';
import { openResourceModal, setupModalEventListeners } from './modal.js';

// Инициализация приложения
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Загружаем список ВУЗов
        const universities = await loadUniversities();

        // Инициализируем UI
        initializeUI();

        // Инициализируем обработчики модального окна
        setupModalEventListeners();

        // Добавляем обработчики на карточки типов ресурсов
        const featureCards = document.querySelectorAll('.feature-card');
        const resourceTypeMap = {
            'Олимпиады': 'olympiad',
            'Курсы': 'course',
            'Лицеи': 'school',
            'Летние программы': 'summerProgram',
            'Практические события': 'practicalEvent',
            'Информационные события': 'infoEvent',
            'Образовательные события': 'educationalEvent',
            'Онлайн-ресурсы': 'onlineResource'
        };

        featureCards.forEach(card => {
            card.addEventListener('click', async () => {
                const cardTitle = card.querySelector('h3')?.textContent || '';
                const resourceType = resourceTypeMap[cardTitle];
                if (resourceType && universities && universities.length > 0) {
                    await openResourceModal(resourceType, universities);
                } else {
                    console.error('Resource type not found or no universities loaded');
                }
            });
        });

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