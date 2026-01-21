// resource-cards.js - рендеринг карточек по типам ресурсов

function formatDate(dateStr) {
    if (!dateStr) return '';
    const formats = [
        { regex: /(\d{2})\.(\d{2})\.(\d{4})/, format: (m) => `${m[1]}.${m[2]}.${m[3]}` },
        { regex: /(\d{4})-(\d{2})-(\d{2})/, format: (m) => `${m[3]}.${m[2]}.${m[1]}` }
    ];

    for (let fmt of formats) {
        const match = dateStr.match(fmt.regex);
        if (match) return fmt.format(match);
    }
    return dateStr;
}

function renderDatesBlock(resource) {
    if (!resource.dates || Object.keys(resource.dates).length === 0) return '';

    let dates = '';
    const dateLabels = {
        'registration': '📋 Регистрация:',
        'event': '📅 Событие:',
        'qualification': '⚡ Квалификация:',
        'final': '🏆 Финал:',
        'applicationDeadline': '⏰ Подать заявку:',
        'courses': '📚 Курсы:',
        'admissions': '🎓 Приём:',
        'startOfYear': '🎒 Начало года:',
        'program': '☀️ Программа:'
    };

    Object.entries(resource.dates).forEach(([key, value]) => {
        if (value && dateLabels[key]) {
            dates += `<div class="meta-row">
                <span class="meta-label">${dateLabels[key]}</span>
                <span class="meta-value">${formatDate(value)}</span>
            </div>`;
        }
    });

    return dates ? `<div class="dates-block">${dates}</div>` : '';
}

function renderCostBlock(resource) {
    if (!resource.cost) return '';

    let cost = '';
    if (resource.cost.type === 'бесплатно') {
        cost = '💰 Бесплатно';
    } else if (resource.cost.type === 'платно') {
        cost = `💸 Платно: ${resource.cost.amount} ₽`;
        if (resource.cost.note) cost += ` (${resource.cost.note})`;
    }

    return cost ? `<div class="meta-row">
        <span class="meta-label">💵 Стоимость:</span>
        <span class="meta-value">${cost}</span>
    </div>` : '';
}

function renderBenefits(benefits) {
    if (!benefits) return '';

    const badges = [];
    if (benefits.bvi) badges.push('<span class="benefit-badge bvi">БВИ</span>');
    if (benefits.points100) badges.push('<span class="benefit-badge points">100 баллов</span>');
    if (benefits.additionalPoints > 0) {
        badges.push(`<span class="benefit-badge additional">+${benefits.additionalPoints}</span>`);
    }
    if (benefits.grants) {
        badges.push(`<span class="benefit-badge grants">Гранты ${benefits.grants}</span>`);
    }
    if (benefits.tuitionDiscount) {
        badges.push(`<span class="benefit-badge discount">Скидка ${benefits.tuitionDiscount}</span>`);
    }
    if (benefits.priority) badges.push('<span class="benefit-badge priority">Приоритет</span>');
    if (benefits.earlyAdmission) badges.push('<span class="benefit-badge early">Досрочное зачисление</span>');

    return badges.length > 0 ? `<div class="benefits">${badges.join('')}</div>` : '';
}

function renderOlympiadMeta(resource) {
    let meta = '';

    if (resource.subjects && resource.subjects.length > 0) {
        meta += '<div class="subjects">';
        resource.subjects.forEach(subject => {
            meta += `<span class="subject-tag">${subject}</span>`;
        });
        meta += '</div>';
    }

    return meta;
}

function renderCourseMeta(resource) {
    let meta = '';

    if (resource.subjects && resource.subjects.length > 0) {
        meta += '<div class="subjects">';
        resource.subjects.forEach(subject => {
            meta += `<span class="subject-tag">${subject}</span>`;
        });
        meta += '</div>';
    }

    return meta;
}

function renderSchoolMeta(resource) {
    let meta = '';

    if (resource.profiles && resource.profiles.length > 0) {
        meta += `<div class="meta-row">
            <span class="meta-label">Профили:</span>
            <span class="meta-value">${resource.profiles.join(', ')}</span>
        </div>`;
    }

    if (resource.grades && resource.grades.length > 0) {
        meta += `<div class="meta-row">
            <span class="meta-label">Классы:</span>
            <span class="meta-value">${resource.grades.join(', ')}</span>
        </div>`;
    }

    return meta;
}

function renderSummerProgramMeta(resource) {
    let meta = '';

    if (resource.subjects && resource.subjects.length > 0) {
        meta += '<div class="subjects">';
        resource.subjects.forEach(subject => {
            meta += `<span class="subject-tag">${subject}</span>`;
        });
        meta += '</div>';
    }

    return meta;
}

function renderPracticalEventMeta(resource) {
    let meta = '';

    if (resource.targetAudience && resource.targetAudience.length > 0) {
        meta += `<div class="meta-row">
            <span class="meta-label">Для:</span>
            <span class="meta-value">${resource.targetAudience.join(', ')}</span>
        </div>`;
    }

    return meta;
}

function renderInfoEventMeta(resource) {
    let meta = '';

    if (resource.targetAudience && resource.targetAudience.length > 0) {
        meta += `<div class="meta-row">
            <span class="meta-label">Для:</span>
            <span class="meta-value">${resource.targetAudience.join(', ')}</span>
        </div>`;
    }

    return meta;
}

function renderEducationalEventMeta(resource) {
    let meta = '';

    if (resource.targetAudience && resource.targetAudience.length > 0) {
        meta += `<div class="meta-row">
            <span class="meta-label">Для:</span>
            <span class="meta-value">${resource.targetAudience.join(', ')}</span>
        </div>`;
    }

    return meta;
}

function renderOnlineResourceMeta(resource) {
    return '';
}

export function createResourceCard(resource) {
    const card = document.createElement('div');
    card.className = 'resource-card';

    let content = '';

    // Тип ресурса
    content += `<span class="resource-type ${resource.type}">
        ${getTypeLabel(resource.type)}
    </span>`;

    // Название и описание
    content += `<h3>${resource.name}</h3>`;
    if (resource.description) {
        content += `<p>${resource.description}</p>`;
    }

    // Мета-информация
    content += '<div class="meta-info">';

    // Формат
    if (resource.format) {
        content += `<div class="meta-row">
            <span class="meta-label">Формат:</span>
            <span class="meta-value">${formatLabel(resource.format)}</span>
        </div>`;
    }

    // Целевая аудитория
    if (resource.targetAudience && resource.targetAudience.length > 0 && resource.type !== 'practicalEvent' && resource.type !== 'infoEvent' && resource.type !== 'educationalEvent') {
        content += `<div class="meta-row">
            <span class="meta-label">Для:</span>
            <span class="meta-value">${resource.targetAudience.join(', ')}</span>
        </div>`;
    }

    // Специфичный контент по типам
    switch(resource.type) {
        case 'olympiad':
            content += renderOlympiadMeta(resource);
            break;
        case 'course':
            content += renderCourseMeta(resource);
            break;
        case 'school':
            content += renderSchoolMeta(resource);
            break;
        case 'summerProgram':
            content += renderSummerProgramMeta(resource);
            break;
        case 'practicalEvent':
            content += renderPracticalEventMeta(resource);
            break;
        case 'infoEvent':
            content += renderInfoEventMeta(resource);
            break;
        case 'educationalEvent':
            content += renderEducationalEventMeta(resource);
            break;
        case 'onlineResource':
            content += renderOnlineResourceMeta(resource);
            break;
    }

    // ЗАКОММЕНТИРОВАН БЛОК С ДАТАМИ
    content += renderDatesBlock(resource);

    // Блок стоимости
    content += renderCostBlock(resource);

    // Льготы
    if (resource.benefits) {
        content += renderBenefits(resource.benefits);
    }

    content += '</div>';

    // Ссылка
    if (resource.website) {
        content += `<a href="${resource.website}" target="_blank" class="card-link">Узнать подробнее →</a>`;
    }

    card.innerHTML = content;
    return card;
}

export function getTypeLabel(type) {
    const labels = {
        'olympiad': '🏆 Олимпиада',
        'course': '📚 Курс',
        'school': '🎓 Лицей',
        'summerProgram': '☀️ Летняя программа',
        'practicalEvent': '💡 Практическое событие',
        'infoEvent': 'ℹ️ Информационное событие',
        'educationalEvent': '👨‍🏫 Образовательное событие',
        'onlineResource': '🌐 Онлайн-ресурс'
    };
    return labels[type] || type;
}

export function formatLabel(format) {
    const labels = {
        'очно': 'Очно',
        'онлайн': 'Онлайн',
        'выездное': 'Выездное',
        'смешанное_очно_онлайн': 'Смешанное (очно + онлайн)',
        'очно_выездное': 'Очно выездное'
    };
    return labels[format] || format;
}