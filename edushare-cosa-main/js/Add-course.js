/* ===================================================== */
/* ============= ADD COURSE PAGE JS ==================== */
/* ===================================================== */

let allCourseCodes = [];
let allSubjects = [];
let allTopics = [];
let selectedCodeId = null;
let selectedSubjectId = null;
let selectedTopicId = null;

// ============ LOAD DATA ============

async function loadCourseCodes() {
    try {
        allCourseCodes = await apiRequest('/course-codes');
    } catch (error) {
        console.warn('Could not load course codes from server, using local list');
        // Fallback: common Ontario codes hardcoded
        allCourseCodes = [
            { id: 1, code: 'ENG1D', title: 'English, Grade 9, Academic', category: 'English', grade: 9 },
            { id: 2, code: 'ENG1P', title: 'English, Grade 9, Applied', category: 'English', grade: 9 },
            { id: 3, code: 'ENG2D', title: 'English, Grade 10, Academic', category: 'English', grade: 10 },
            { id: 4, code: 'ENG2P', title: 'English, Grade 10, Applied', category: 'English', grade: 10 },
            { id: 5, code: 'ENG3U', title: 'English, Grade 11, University', category: 'English', grade: 11 },
            { id: 6, code: 'ENG3C', title: 'English, Grade 11, College', category: 'English', grade: 11 },
            { id: 7, code: 'ENG4U', title: 'English, Grade 12, University', category: 'English', grade: 12 },
            { id: 8, code: 'ENG4C', title: 'English, Grade 12, College', category: 'English', grade: 12 },
            { id: 9, code: 'MTH1W', title: 'Mathematics, Grade 9, Destreamed', category: 'Mathematics', grade: 9 },
            { id: 10, code: 'MPM1D', title: 'Principles of Math, Grade 9, Academic', category: 'Mathematics', grade: 9 },
            { id: 11, code: 'MPM2D', title: 'Principles of Math, Grade 10, Academic', category: 'Mathematics', grade: 10 },
            { id: 12, code: 'MFM2P', title: 'Foundations of Math, Grade 10, Applied', category: 'Mathematics', grade: 10 },
            { id: 13, code: 'MCR3U', title: 'Functions, Grade 11, University', category: 'Mathematics', grade: 11 },
            { id: 14, code: 'MHF4U', title: 'Advanced Functions, Grade 12, University', category: 'Mathematics', grade: 12 },
            { id: 15, code: 'MCV4U', title: 'Calculus & Vectors, Grade 12, University', category: 'Mathematics', grade: 12 },
            { id: 16, code: 'MDM4U', title: 'Data Management, Grade 12, University', category: 'Mathematics', grade: 12 },
            { id: 17, code: 'SNC1D', title: 'Science, Grade 9, Academic', category: 'Science', grade: 9 },
            { id: 18, code: 'SNC1W', title: 'Science, Grade 9, Destreamed', category: 'Science', grade: 9 },
            { id: 19, code: 'SNC2D', title: 'Science, Grade 10, Academic', category: 'Science', grade: 10 },
            { id: 20, code: 'SBI3U', title: 'Biology, Grade 11, University', category: 'Science', grade: 11 },
            { id: 21, code: 'SCH3U', title: 'Chemistry, Grade 11, University', category: 'Science', grade: 11 },
            { id: 22, code: 'SPH3U', title: 'Physics, Grade 11, University', category: 'Science', grade: 11 },
            { id: 23, code: 'SBI4U', title: 'Biology, Grade 12, University', category: 'Science', grade: 12 },
            { id: 24, code: 'SCH4U', title: 'Chemistry, Grade 12, University', category: 'Science', grade: 12 },
            { id: 25, code: 'SPH4U', title: 'Physics, Grade 12, University', category: 'Science', grade: 12 },
            { id: 26, code: 'CGC1D', title: 'Geography of Canada, Grade 9, Academic', category: 'Geography', grade: 9 },
            { id: 27, code: 'CHC2D', title: 'Canadian History Since WWI, Grade 10, Academic', category: 'History', grade: 10 },
            { id: 28, code: 'CHV2O', title: 'Civics and Citizenship, Grade 10, Open', category: 'Social Studies', grade: 10 },
            { id: 29, code: 'FSF1D', title: 'Core French, Grade 9, Academic', category: 'French', grade: 9 },
            { id: 30, code: 'FSF2D', title: 'Core French, Grade 10, Academic', category: 'French', grade: 10 },
            { id: 31, code: 'ICS2O', title: 'Intro to Computer Studies, Grade 10, Open', category: 'Computer Science', grade: 10 },
            { id: 32, code: 'ICS3U', title: 'Intro to Computer Science, Grade 11, University', category: 'Computer Science', grade: 11 },
            { id: 33, code: 'ICS4U', title: 'Computer Science, Grade 12, University', category: 'Computer Science', grade: 12 },
            { id: 34, code: 'AVI1O', title: 'Visual Arts, Grade 9, Open', category: 'Art', grade: 9 },
            { id: 35, code: 'ADA1O', title: 'Drama, Grade 9, Open', category: 'Drama', grade: 9 },
            { id: 36, code: 'AMU1O', title: 'Music, Grade 9, Open', category: 'Music', grade: 9 },
            { id: 37, code: 'PPL1O', title: 'Health & Physical Education, Grade 9, Open', category: 'Physical Education', grade: 9 },
            { id: 38, code: 'BBI1O', title: 'Intro to Business, Grade 9, Open', category: 'Business', grade: 9 },
            { id: 39, code: 'CLU3M', title: 'Understanding Canadian Law, Grade 11, University/College', category: 'Law', grade: 11 },
            { id: 40, code: 'HSP3U', title: 'Intro to Anthropology/Psychology/Sociology, Grade 11, University', category: 'Social Studies', grade: 11 }
        ];
    }
}

async function loadSubjects() {
    try {
        allSubjects = await apiRequest(API_CONFIG.ENDPOINTS.SUBJECTS);
    } catch (error) {
        console.warn('Could not load subjects:', error.message);
        allSubjects = [];
    }
}

async function loadTopicsForSubject(subjectId) {
    try {
        allTopics = await apiRequest(`${API_CONFIG.ENDPOINTS.TOPICS}?subjectId=${subjectId}`);
    } catch (error) {
        console.warn('Could not load topics:', error.message);
        allTopics = [];
    }
}

// ============ GENERIC AUTOCOMPLETE ============

function setupAutocomplete(inputId, dropdownId, getItems, onSelect, onClear) {
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);
    let debounce = null;

    input.addEventListener('focus', () => {
        const items = getItems();
        if (items.length > 0) renderDropdown(dropdown, items.slice(0, 12), input, onSelect);
    });

    input.addEventListener('input', () => {
        clearTimeout(debounce);
        if (onClear) onClear();

        debounce = setTimeout(() => {
            const query = input.value.trim().toLowerCase();
            const items = getItems();

            if (query.length === 0) {
                if (items.length > 0) renderDropdown(dropdown, items.slice(0, 12), input, onSelect);
                else dropdown.classList.remove('show');
                return;
            }

            const matches = items.filter(item => {
                const searchStr = `${item.name} ${item.meta || ''}`.toLowerCase();
                return searchStr.includes(query);
            });

            if (matches.length > 0) renderDropdown(dropdown, matches.slice(0, 12), input, onSelect);
            else dropdown.classList.remove('show');
        }, 150);
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest(`#${inputId}`) && !e.target.closest(`#${dropdownId}`)) {
            dropdown.classList.remove('show');
        }
    });
}

function renderDropdown(dropdown, items, input, onSelect) {
    dropdown.innerHTML = items.map(item => `
        <div class="autocomplete-item" data-id="${item.id}" data-name="${escapeHtml(item.name)}">
            <div class="ac-name">${escapeHtml(item.name)}</div>
            ${item.meta ? `<div class="ac-meta">${escapeHtml(item.meta)}</div>` : ''}
        </div>
    `).join('');

    dropdown.classList.add('show');

    dropdown.querySelectorAll('.autocomplete-item').forEach(el => {
        el.addEventListener('mousedown', (e) => {
            e.preventDefault();
            input.value = el.dataset.name;
            dropdown.classList.remove('show');
            onSelect(parseInt(el.dataset.id), el.dataset.name);
        });
    });
}

// ============ COURSE CODE AUTOCOMPLETE ============

function getCourseCodeItems() {
    const category = document.getElementById('categorySelect').value;
    let codes = allCourseCodes;

    // Filter by selected category
    if (category) {
        codes = codes.filter(c => c.category === category);
    }

    return codes.map(c => ({
        id: c.id,
        name: c.code,
        meta: c.title
    }));
}

function onCourseCodeSelect(id, name) {
    selectedCodeId = id;
    const code = allCourseCodes.find(c => c.id === id);
    if (code) {
        const info = document.getElementById('codeInfo');
        info.innerHTML = `<strong>${code.code}</strong> — ${code.title}`;
        info.classList.add('show');

        // Auto-select category if not already set
        const catSelect = document.getElementById('categorySelect');
        if (!catSelect.value && code.category) {
            catSelect.value = code.category;
        }
    }
}

// ============ SUBJECT AUTOCOMPLETE ============

function getSubjectItems() {
    return allSubjects.map(s => ({
        id: s.subject_id || s.SubjectID || s.id,
        name: s.subject_name || s.SubjectName || s.name,
        meta: ''
    }));
}

function onSubjectSelect(id, name) {
    selectedSubjectId = id;
    selectedTopicId = null;
    document.getElementById('topicInput').value = '';
    hideBanners();
    loadTopicsForSubject(id);
}

// ============ TOPIC AUTOCOMPLETE ============

function getTopicItems() {
    return allTopics.map(t => ({
        id: t.topic_id || t.TopicID || t.id || 0,
        name: t.topic_name || t.TopicName || t.name || '',
        meta: ''
    }));
}

function onTopicSelect(id, name) {
    selectedTopicId = id;
    showMatchBanner(name, 'existing topic — questions already available');
}

// ============ WATCHERS ============

function setupCategoryChange() {
    document.getElementById('categorySelect').addEventListener('change', () => {
        // Re-filter course codes
        const input = document.getElementById('courseCodeInput');
        if (input.value) {
            input.dispatchEvent(new Event('input'));
        }
    });
}

function setupSubjectWatcher() {
    const input = document.getElementById('subjectInput');
    input.addEventListener('input', () => {
        const query = input.value.trim().toLowerCase();
        const exact = allSubjects.find(s =>
            (s.subject_name || s.SubjectName || s.name || '').toLowerCase() === query
        );
        if (exact) {
            selectedSubjectId = exact.subject_id || exact.SubjectID || exact.id;
            loadTopicsForSubject(selectedSubjectId);
        } else {
            selectedSubjectId = null;
            allTopics = [];
        }
        selectedTopicId = null;
        hideBanners();
    });
}

function setupTopicWatcher() {
    const input = document.getElementById('topicInput');
    input.addEventListener('blur', () => {
        setTimeout(() => {
            const query = input.value.trim();
            if (query.length < 2) { hideBanners(); return; }

            if (!selectedTopicId) {
                const exact = allTopics.find(t =>
                    (t.topic_name || t.TopicName || t.name || '').toLowerCase() === query.toLowerCase()
                );
                if (exact) {
                    selectedTopicId = exact.topic_id || exact.TopicID || exact.id;
                    showMatchBanner(query, 'existing topic — questions already available');
                } else {
                    showNewBanner('New topic!', 'AI will generate ~5 starter questions.');
                }
            }
        }, 250);
    });
}

// ============ BANNERS ============

function showMatchBanner(name, info) {
    hideBanners();
    document.getElementById('matchName').textContent = name;
    document.getElementById('matchInfo').textContent = ' — ' + info;
    document.getElementById('matchBanner').classList.add('show');
}

function showNewBanner(title, info) {
    hideBanners();
    document.getElementById('newTitle').textContent = title;
    document.getElementById('newInfo').textContent = info;
    document.getElementById('newBanner').classList.add('show');
}

function hideBanners() {
    document.getElementById('matchBanner').classList.remove('show');
    document.getElementById('newBanner').classList.remove('show');
}

// ============ FORM SUBMIT ============

function setupFormSubmit() {
    document.getElementById('addCourseForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const category = document.getElementById('categorySelect').value;
        const courseCode = document.getElementById('courseCodeInput').value.trim();
        const sectionTag = document.getElementById('sectionTag').value.trim();
        const subjectName = document.getElementById('subjectInput').value.trim();
        const topicName = document.getElementById('topicInput').value.trim();

        if (!category) { alert('Please select a category.'); return; }
        if (!courseCode) { alert('Please enter a course code.'); return; }
        if (!subjectName) { alert('Please enter a subject.'); return; }

        const btn = document.getElementById('submitBtn');
        btn.disabled = true;
        btn.innerHTML = 'Adding...';

        let subjectId = selectedSubjectId;
        let isNewTopic = false;

        // Create subject if new
        if (!subjectId) {
            try {
                const result = await apiRequest(API_CONFIG.ENDPOINTS.SUBJECTS, {
                    method: 'POST',
                    body: JSON.stringify({ subject_name: subjectName, category: category })
                });
                subjectId = result.id || result.subject_id || result.insertId;
            } catch (err) { console.warn('Subject create:', err.message); }
        }

        // Create topic if new
        if (topicName && !selectedTopicId && subjectId) {
            isNewTopic = true;
            try {
                const result = await apiRequest(API_CONFIG.ENDPOINTS.TOPICS, {
                    method: 'POST',
                    body: JSON.stringify({ topic_name: topicName, subject_id: subjectId })
                });
                const topicId = result.id || result.topic_id || result.insertId;

                if (topicId) {
                    btn.innerHTML = 'Generating starter questions...';
                    try {
                        await apiRequest('/ai/generate', {
                            method: 'POST',
                            body: JSON.stringify({
                                subject_id: subjectId, topic_id: topicId,
                                topic_name: topicName, count: 5, auto_save: true
                            })
                        });
                    } catch (aiErr) { console.warn('AI gen:', aiErr.message); }
                }
            } catch (err) { console.warn('Topic create:', err.message); }
        }

        // Save user's course (personal class label)
        try {
            await apiRequest('/user-courses', {
                method: 'POST',
                body: JSON.stringify({
                    course_code: courseCode,
                    course_code_id: selectedCodeId,
                    section_tag: sectionTag,
                    subject_id: subjectId,
                    category: category
                })
            });
        } catch (err) { console.warn('User course save:', err.message); }

        showSaveBanner(isNewTopic ? 'Course created with starter questions!' : 'Course added!');
        setTimeout(() => { window.location.href = 'my-courses.html'; }, 1500);
    });
}

function showSaveBanner(text) {
    const banner = document.getElementById('saveBanner');
    document.getElementById('bannerText').textContent = text;
    banner.classList.add('show');
    setTimeout(() => banner.classList.remove('show'), 3000);
}

// ============ INIT ============

Promise.all([loadCourseCodes(), loadSubjects()]).then(() => {
    setupAutocomplete('courseCodeInput', 'courseCodeDropdown', getCourseCodeItems, onCourseCodeSelect, () => {
        selectedCodeId = null;
        document.getElementById('codeInfo').classList.remove('show');
    });
    setupAutocomplete('subjectInput', 'subjectDropdown', getSubjectItems, onSubjectSelect, () => {
        selectedSubjectId = null;
        allTopics = [];
        hideBanners();
    });
    setupAutocomplete('topicInput', 'topicDropdown', getTopicItems, onTopicSelect, () => {
        selectedTopicId = null;
        hideBanners();
    });
    setupCategoryChange();
    setupSubjectWatcher();
    setupTopicWatcher();
    setupFormSubmit();
});