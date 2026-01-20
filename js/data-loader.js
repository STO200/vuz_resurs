// data-loader.js - загрузка данных

import { setUniversities, setUniversityData } from './state.js';

const DATA_PATH = 'data';

export async function loadUniversities() {
    try {
        const response = await fetch(`${DATA_PATH}/index.json`);
        if (!response.ok) throw new Error('Failed to load universities');
        const data = await response.json();
        setUniversities(data.universities);
        return data.universities;
    } catch (error) {
        console.error('Error loading universities:', error);
        alert('Ошибка загрузки списка ВУЗов');
        return [];
    }
}

export async function loadUniversityData(universityId) {
    try {
        const files = [
            'olympiads.json',
            'courses.json',
            'schools.json',
            'summerPrograms.json',
            'practicalEvents.json',
            'infoEvents.json',
            'educationalEvents.json',
            'onlineResources.json'
        ];

        const basePath = `${DATA_PATH}/universities/${universityId}`;
        const responses = await Promise.all(
            files.map(file =>
                fetch(`${basePath}/${file}`)
                    .then(r => r.ok ? r.json() : null)
                    .catch(() => null)
            )
        );

        const data = {
            olympiads: responses[0] || [],
            courses: responses[1] || [],
            schools: responses[2] || [],
            summerPrograms: responses[3] || [],
            practicalEvents: responses[4] || [],
            infoEvents: responses[5] || [],
            educationalEvents: responses[6] || [],
            onlineResources: responses[7] || []
        };

        setUniversityData(data);
        return data;
    } catch (error) {
        console.error('Error loading university data:', error);
        alert('Ошибка загрузки данных ВУЗа');
        return null;
    }
}