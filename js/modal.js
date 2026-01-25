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

export function openUniversityInfoModal(university) {
    const modal = document.getElementById('resourceModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalDescription = document.getElementById('modalDescription');
    const modalResourcesList = document.getElementById('modalResourcesList');

    // Устанавливаем заголовок
    modalTitle.textContent = `🎓 ${university.name}`;

    // Формируем содержимое модалки
    let content = `
        <div class="university-info">
            ${university.description ? `
                <div class="info-section">
                    <h3 class="section-title">📖 Описание</h3>
                    <p>${university.description}</p>
                </div>
            ` : ''}

            ${university.mainDirections && university.mainDirections.length > 0 ? `
                <div class="info-section">
                    <h3 class="section-title">📚 Основные направления подготовки</h3>
                    <ul class="directions-list">
                        ${university.mainDirections.map(dir => `<li>${dir}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}

            ${university.website ? `
                <div class="info-section">
                    <h3 class="section-title">🌐 Официальный сайт</h3>
                    <a href="${university.website}" target="_blank" class="contact-link">${university.website}</a>
                </div>
            ` : ''}

            ${university.contacts && university.contacts.admissions ? `
                <div class="info-section">
                    <h3 class="section-title">📞 Контакты приёмной комиссии</h3>
                    <div class="contacts-list">
                        ${university.contacts.admissions.website ? `
                            <div class="contact-item">
                                <span class="contact-icon">🌐</span>
                                <a href="${university.contacts.admissions.website}" target="_blank" class="contact-link">
                                    ${university.contacts.admissions.website}
                                </a>
                            </div>
                        ` : ''}
                        ${university.contacts.admissions.email ? `
                            <div class="contact-item">
                                <span class="contact-icon">✉️</span>
                                <a href="mailto:${university.contacts.admissions.email}" class="contact-link">
                                    ${university.contacts.admissions.email}
                                </a>
                            </div>
                        ` : ''}
                        ${university.contacts.admissions.phone ? `
                            <div class="contact-item">
                                <span class="contact-icon">☎️</span>
                                <span class="contact-text">${university.contacts.admissions.phone}</span>
                            </div>
                        ` : ''}
                        ${university.contacts.admissions.hotline ? `
                            <div class="contact-item">
                                <span class="contact-icon">☎️</span>
                                <span class="contact-text">Горячая линия: ${university.contacts.admissions.hotline}</span>
                            </div>
                        ` : ''}
                        ${university.contacts.admissions.mobile ? `
                            <div class="contact-item">
                                <span class="contact-icon">📱</span>
                                <span class="contact-text">${university.contacts.admissions.mobile}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            ` : ''}

            ${university.contacts && university.contacts.school ? `
                <div class="info-section">
                    <h3 class="section-title">🎓 Для школьников</h3>
                    <div class="contacts-list">
                        ${university.contacts.school.website ? `
                            <div class="contact-item">
                                <span class="contact-icon">🌐</span>
                                <a href="${university.contacts.school.website}" target="_blank" class="contact-link">
                                    ${university.contacts.school.website}
                                </a>
                            </div>
                        ` : ''}
                        ${university.contacts.school.email ? `
                            <div class="contact-item">
                                <span class="contact-icon">✉️</span>
                                <a href="mailto:${university.contacts.school.email}" class="contact-link">
                                    ${university.contacts.school.email}
                                </a>
                            </div>
                        ` : ''}
                    </div>
                </div>
            ` : ''}
        </div>

        <div class="modal-university-actions">
            <button id="goToSearchBtn" class="btn btn-primary">Подобрать ресурсы</button>
        </div>
    `;

    modalDescription.innerHTML = '';
    modalResourcesList.innerHTML = content;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Добавляем обработчик для кнопки "Подобрать ресурсы" в модалке
    const goToSearchBtn = document.getElementById('goToSearchBtn');
    if (goToSearchBtn) {
        goToSearchBtn.addEventListener('click', () => {
            closeModal();
            // Запускаем поиск ресурсов
            document.getElementById('searchBtn').click();
        });
    }
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
