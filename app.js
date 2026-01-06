// Глобальное состояние
let appState = {
    data: null,
    selectedUniversity: null,
    activeFilters: {
        type: 'all',
        benefits: []
    }
};

// Инициализация приложения
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Загружаем данные
        const response = await fetch('data.json');
        appState.data = await response.json();

        // Инициализируем UI
        initializeUI();
        setupEventListeners();
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        alert('Ошибка загрузки данных приложения');
    }
});

// Инициализация UI
function initializeUI() {
    const select = document.getElementById('universitySelect');

    appState.data.universities.forEach(uni => {
        const option = document.createElement('option');
        option.value = uni.id;
        option.textContent = uni.name;
        select.appendChild(option);
    });
}

// Обработчики событий
function setupEventListeners() {
    // Кнопка поиска
    document.getElementById('searchBtn').addEventListener('click', () => {
        const selectedId = document.getElementById('universitySelect').value;
        if (selectedId) {
            showResults(selectedId);
        } else {
            alert('Выберите ВУЗ');
        }
    });

    // Кнопка возврата
    document.getElementById('backBtn').addEventListener('click', () => {
        showMainPage();
    });

    // Фильтры типа ресурса
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Убираем активный класс со всех кнопок
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            // Добавляем активный класс на текущую кнопку
            this.classList.add('active');
            // Обновляем фильтр
            appState.activeFilters.type = this.dataset.filter;
            renderResults();
        });
    });

    // Фильтры по льготам
    document.querySelectorAll('.benefit-filter').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            appState.activeFilters.benefits = Array.from(
                document.querySelectorAll('.benefit-filter:checked')
            ).map(cb => cb.value);
            renderResults();
        });
    });

    // Кнопка сброса фильтров
    document.getElementById('resetBtn').addEventListener('click', () => {
        // Сбрасываем фильтры
        appState.activeFilters.type = 'all';
        appState.activeFilters.benefits = [];

        // Обновляем UI
        document.querySelectorAll('.filter-btn').forEach((btn, idx) => {
            btn.classList.toggle('active', btn.dataset.filter === 'all');
        });
        document.querySelectorAll('.benefit-filter').forEach(cb => cb.checked = false);

        renderResults();
    });
}

// Переход на страницу результатов
function showResults(universityId) {
    appState.selectedUniversity = universityId;

    // Получаем название ВУЗа
    const university = appState.data.universities.find(u => u.id === universityId);
    document.getElementById('resultsTitle').textContent = `Ресурсы для поступления в ${university.name}`;

    // Скрываем главную, показываем результаты
    document.getElementById('mainPage').classList.remove('active');
    document.getElementById('resultsPage').classList.add('active');

    // Сбрасываем фильтры
    appState.activeFilters.type = 'all';
    appState.activeFilters.benefits = [];
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === 'all');
    });
    document.querySelectorAll('.benefit-filter').forEach(cb => cb.checked = false);

    renderResults();
}

// Возврат на главную страницу
function showMainPage() {
    document.getElementById('resultsPage').classList.remove('active');
    document.getElementById('mainPage').classList.add('active');
    appState.selectedUniversity = null;
}

// Рендеринг результатов
function renderResults() {
    const container = document.getElementById('resultsList');
    container.innerHTML = '';

    // Собираем все ресурсы
    let allResources = [
        ...getFilteredOlympiads(),
        ...getFilteredOnlineCourses(),
        ...getFilteredOfflineCourses(),
        ...getFilteredProfileClasses(),
        ...getFilteredFestivals()
    ];

    // Применяем фильтры
    allResources = applyFilters(allResources);

    if (allResources.length === 0) {
        container.innerHTML = '<div class="empty-state"><h3>😕 Ресурсы не найдены</h3><p>Попробуйте изменить фильтры</p></div>';
        return;
    }

    // Рендерим карточки
    allResources.forEach(resource => {
        container.appendChild(createResourceCard(resource));
    });
}

// Фильтрация по ВУЗу
function getFilteredOlympiads() {
    return appState.data.olympiads
        .filter(o => o.relevantUniversities.includes(appState.selectedUniversity))
        .map(o => ({ ...o, type: 'olympiad' }));
}

function getFilteredOnlineCourses() {
    return appState.data.onlineCourses
        .filter(c => c.relevantUniversities.includes(appState.selectedUniversity))
        .map(c => ({ ...c, type: 'online' }));
}

function getFilteredOfflineCourses() {
    return appState.data.offlineCourses
        .filter(c => c.relevantUniversities.includes(appState.selectedUniversity))
        .map(c => ({ ...c, type: 'offline' }));
}

function getFilteredProfileClasses() {
    return appState.data.profileClasses
        .filter(c => c.relevantUniversities.includes(appState.selectedUniversity))
        .map(c => ({ ...c, type: 'classes' }));
}

function getFilteredFestivals() {
    return appState.data.festivals
        .filter(f => f.relevantUniversities.includes(appState.selectedUniversity))
        .map(f => ({ ...f, type: 'festival' }));
}

// Применение фильтров
function applyFilters(resources) {
    return resources.filter(resource => {
        // Фильтр по типу
        if (appState.activeFilters.type !== 'all' && resource.type !== appState.activeFilters.type) {
            return false;
        }

        // Фильтр по льготам (только для олимпиад)
        if (appState.activeFilters.benefits.length > 0 && resource.type === 'olympiad') {
            const hasRequiredBenefits = appState.activeFilters.benefits.some(benefit => {
                if (benefit === 'bvi') return resource.benefits.bvi;
                if (benefit === 'points100') return resource.benefits.points100;
                if (benefit === 'additionalPoints') return resource.benefits.additionalPoints > 0;
                return false;
            });
            return hasRequiredBenefits;
        }

        return true;
    });
}

// Создание карточки ресурса
function createResourceCard(resource) {
    const card = document.createElement('div');
    card.className = 'resource-card';

    let content = '';

    // Заголовок и тип
    content += `<span class="resource-type ${resource.type}">
        ${getTypeLabel(resource.type)}
    </span>`;

    content += `<h3>${resource.name}</h3>`;

    // Описание
    if (resource.description) {
        content += `<p>${resource.description}</p>`;
    }

    // Метаинформация в зависимости от типа
    content += '<div class="meta-info">';

    if (resource.type === 'olympiad') {
        content += `<div class="meta-row">
            <span class="meta-label">Уровень:</span>
            <span class="meta-value">${resource.level}</span>
        </div>`;

        // Предметы
        if (resource.subjects && resource.subjects.length > 0) {
            content += '<div class="subjects">';
            resource.subjects.forEach(subject => {
                content += `<span class="subject-tag">${subject}</span>`;
            });
            content += '</div>';
        }

        // Льготы
        const benefits = [];
        if (resource.benefits.bvi) benefits.push('<span class="benefit-badge bvi">БВИ</span>');
        if (resource.benefits.points100) benefits.push('<span class="benefit-badge points">100 баллов за ЕГЭ</span>');
        if (resource.benefits.additionalPoints > 0) {
            benefits.push(`<span class="benefit-badge additional">+${resource.benefits.additionalPoints} баллов</span>`);
        }
        if (benefits.length > 0) {
            content += '<div class="benefits">' + benefits.join('') + '</div>';
        }
    }

    if (resource.type === 'online' || resource.type === 'offline') {
        content += `<div class="meta-row">
            <span class="meta-label">Организатор:</span>
            <span class="meta-value">${resource.platform || resource.organizer}</span>
        </div>`;

        if (resource.isFree !== undefined) {
            content += `<div class="meta-row">
                <span class="meta-label">Стоимость:</span>
                <span class="meta-value">${resource.isFree ? '💰 Бесплатно' : '💸 Платно'}</span>
            </div>`;
        }

        if (resource.price !== undefined) {
            content += `<div class="meta-row">
                <span class="meta-label">Цена:</span>
                <span class="meta-value">${resource.price === 0 ? 'Уточняется' : resource.price + ' ₽'}</span>
            </div>`;
        }
    }

    if (resource.type === 'classes') {
        content += `<div class="meta-row">
            <span class="meta-label">Профиль:</span>
            <span class="meta-value">${resource.profile}</span>
        </div>`;

        content += `<div class="meta-row">
            <span class="meta-label">Классы:</span>
            <span class="meta-value">${resource.contacts}</span>
        </div>`;
    }

    if (resource.type === 'festival') {
        const date = new Date(resource.date);
        const formattedDate = date.toLocaleDateString('ru-RU', { 
            month: 'long', 
            year: 'numeric' 
        });
        content += `<div class="meta-row">
            <span class="meta-label">Дата:</span>
            <span class="meta-value">${formattedDate}</span>
        </div>`;
    }

    content += '</div>';

    // Ссылка на сайт
    if (resource.website) {
        content += `<a href="${resource.website}" target="_blank" class="card-link">Узнать подробнее →</a>`;
    }

    card.innerHTML = content;
    return card;
}

// Вспомогательная функция для получения названия типа
function getTypeLabel(type) {
    const labels = {
        'olympiad': '🏆 Олимпиада',
        'online': '📱 Онлайн-курс',
        'offline': '📚 Очный курс',
        'classes': '🎓 Профильный класс',
        'festival': '🎉 Фестиваль'
    };
    return labels[type] || type;
}
