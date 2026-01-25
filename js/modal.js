// modal.js - модальное окно для типов ресурсов

import { loadResourcesByType } from './data-loader.js';
import { createResourceCard, getTypeLabel } from './resource-cards.js';

const resourceTypeDescriptions = {
    'olympiad': 'Олимпиады - это соревнования, которые дают БВИ (поступление без экзаменов) или 100 баллов за ЕГЭ. Ниже представлены все олимпиады из нашей базы данных.',
    'course': 'Курсы подготовки помогут углубить знания по предметам. Здесь собраны онлайн и очные программы от различных университетов.',
    'school': 'Лицеи и профильные классы при университетах дают преимущества при поступлении. Смотрите все доступные варианты.',
    'summerProgram': 'Летние программы - это интенсивные курсы и школы в июле-августе. Отличная возможность познакомиться с вузом.',
    'practicalEvent': 'Практические события включают хакатоны, кейс-чемпионаты и конкурсы, где можно проявить себя.',
    'infoEvent': 'Информационные события - дни открытых дверей, встречи с деканами, экскурсии по кампусу.',
    'educationalEvent': 'Образовательные события - лекции, мастер-классы, вебинары от преподавателей и студентов.',
    'onlineResource': 'Онлайн-ресурсы - YouTube каналы, Telegram группы, образовательные порталы вузов.'
};

// Кеш загруженных данных
const resourceCache = {};

export async function openResourceModal(resourceType, universities) {
    const modal = document.getElementById('resourceModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalDescription = document.getElementById('modalDescription');
    const modalResourcesList = document.getElementById('modalResourcesList');

    // Устанавливаем заголовок и описание
    const typeLabel = getTypeLabel(resourceType);
    modalTitle.textContent = typeLabel;
    modalDescription.textContent = resourceTypeDescriptions[resourceType] || '';

    // Показываем индикатор загрузки
    modalResourcesList.innerHTML = '<div class="modal-loading"><div class="spinner"></div><p>Загрузка ресурсов...</p></div>';
    modal.classList.add('active');

    // Блокируем прокрутку основной страницы
    document.body.style.overflow = 'hidden';

    try {
        // Проверяем кеш
        let resources;
        const cacheKey = resourceType;
        if (resourceCache[cacheKey]) {
            resources = resourceCache[cacheKey];
        } else {
            resources = await loadResourcesByType(resourceType, universities);
            resourceCache[cacheKey] = resources;
        }

        // Отображаем результаты
        if (resources.length === 0) {
            modalResourcesList.innerHTML = '<div class="modal-empty">Ресурсов этого типа пока нет в базе данных</div>';
        } else {
            renderResourceList(resources, modalResourcesList);
        }
    } catch (error) {
        console.error('Error opening resource modal:', error);
        modalResourcesList.innerHTML = '<div class="modal-empty">Ошибка при загрузке ресурсов. Пожалуйста, попробуйте ещё раз.</div>';
    }
}

export function closeModal() {
    const modal = document.getElementById('resourceModal');
    modal.classList.remove('active');

    // Разблокируем прокрутку основной страницы
    document.body.style.overflow = 'auto';
}

function renderResourceList(resources, container) {
    // Сортируем ресурсы по названию
    const sorted = [...resources].sort((a, b) => {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        return nameA.localeCompare(nameB, 'ru');
    });

    // Очищаем контейнер
    container.innerHTML = '';

    // Создаём список accordion-элементов
    sorted.forEach((resource, index) => {
        const item = document.createElement('div');
        item.className = 'resource-item';
        item.dataset.resourceId = resource.id || index;

        const header = document.createElement('div');
        header.className = 'resource-item-header';
        header.innerHTML = `
            <span class="resource-item-title">${resource.name || 'Без названия'}</span>
            <span class="resource-item-toggle">▼</span>
        `;

        const content = document.createElement('div');
        content.className = 'resource-item-content';
        const contentInner = document.createElement('div');
        contentInner.className = 'resource-item-content-inner';

        // Генерируем полную карточку в содержимом
        const card = createResourceCard(resource);
        contentInner.appendChild(card);
        content.appendChild(contentInner);

        item.appendChild(header);
        item.appendChild(content);

        // Обработчик клика на шапку
        header.addEventListener('click', () => {
            toggleResourceItem(item);
        });

        container.appendChild(item);
    });
}

function toggleResourceItem(item) {
    item.classList.toggle('active');
}

export function setupModalEventListeners() {
    const modal = document.getElementById('resourceModal');
    const modalClose = document.querySelector('.modal-close');
    const modalOverlay = document.querySelector('.modal-overlay');

    // Закрытие по кнопке X
    if (modalClose) {
        modalClose.addEventListener('click', () => {
            closeModal();
        });
    }

    // Закрытие по клику на затемненный фон
    if (modalOverlay) {
        modalOverlay.addEventListener('click', () => {
            closeModal();
        });
    }

    // Закрытие по нажатию ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
}
