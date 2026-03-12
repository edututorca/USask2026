/* ===================================================== */
/* ============= ADD COURSE PAGE JS ==================== */
/* ===================================================== */

let allCourseCodes = [];
let selectedCodeId = null;

// ============ LOAD COURSE CODES ============

async function loadCourseCodes() {
    try {
        allCourseCodes = await apiRequest('/course-codes');
    } catch (error) {
        console.warn('Using local course code list');
        allCourseCodes = [
            { id: 1, code: 'ENG1D', title: 'English, Grade 9, Academic', category: 'English', grade: 9 },
            { id: 2, code: 'ENG1P', title: 'English, Grade 9, Applied', category: 'English', grade: 9 },
            { id: 3, code: 'ENG1W', title: 'English, Grade 9, Destreamed', category: 'English', grade: 9 },
            { id: 4, code: 'ENG2D', title: 'English, Grade 10, Academic', category: 'English', grade: 10 },
            { id: 5, code: 'ENG2P', title: 'English, Grade 10, Applied', category: 'English', grade: 10 },
            { id: 6, code: 'ENG3U', title: 'English, Grade 11, University', category: 'English', grade: 11 },
            { id: 7, code: 'ENG3C', title: 'English, Grade 11, College', category: 'English', grade: 11 },
            { id: 8, code: 'ENG4U', title: 'English, Grade 12, University', category: 'English', grade: 12 },
            { id: 9, code: 'ENG4C', title: 'English, Grade 12, College', category: 'English', grade: 12 },
            { id: 10, code: 'EWC4U', title: 'Writer\'s Craft, Grade 12, University', category: 'English', grade: 12 },
            { id: 11, code: 'MTH1W', title: 'Mathematics, Grade 9, Destreamed', category: 'Mathematics', grade: 9 },
            { id: 12, code: 'MPM1D', title: 'Principles of Math, Grade 9, Academic', category: 'Mathematics', grade: 9 },
            { id: 13, code: 'MFM1P', title: 'Foundations of Math, Grade 9, Applied', category: 'Mathematics', grade: 9 },
            { id: 14, code: 'MPM2D', title: 'Principles of Math, Grade 10, Academic', category: 'Mathematics', grade: 10 },
            { id: 15, code: 'MFM2P', title: 'Foundations of Math, Grade 10, Applied', category: 'Mathematics', grade: 10 },
            { id: 16, code: 'MCR3U', title: 'Functions, Grade 11, University', category: 'Mathematics', grade: 11 },
            { id: 17, code: 'MBF3C', title: 'Foundations for College Math, Grade 11, College', category: 'Mathematics', grade: 11 },
            { id: 18, code: 'MHF4U', title: 'Advanced Functions, Grade 12, University', category: 'Mathematics', grade: 12 },
            { id: 19, code: 'MCV4U', title: 'Calculus & Vectors, Grade 12, University', category: 'Mathematics', grade: 12 },
            { id: 20, code: 'MDM4U', title: 'Data Management, Grade 12, University', category: 'Mathematics', grade: 12 },
            { id: 21, code: 'SNC1D', title: 'Science, Grade 9, Academic', category: 'Science', grade: 9 },
            { id: 22, code: 'SNC1W', title: 'Science, Grade 9, Destreamed', category: 'Science', grade: 9 },
            { id: 23, code: 'SNC2D', title: 'Science, Grade 10, Academic', category: 'Science', grade: 10 },
            { id: 24, code: 'SBI3U', title: 'Biology, Grade 11, University', category: 'Science', grade: 11 },
            { id: 25, code: 'SCH3U', title: 'Chemistry, Grade 11, University', category: 'Science', grade: 11 },
            { id: 26, code: 'SPH3U', title: 'Physics, Grade 11, University', category: 'Science', grade: 11 },
            { id: 27, code: 'SBI4U', title: 'Biology, Grade 12, University', category: 'Science', grade: 12 },
            { id: 28, code: 'SCH4U', title: 'Chemistry, Grade 12, University', category: 'Science', grade: 12 },
            { id: 29, code: 'SPH4U', title: 'Physics, Grade 12, University', category: 'Science', grade: 12 },
            { id: 30, code: 'CGC1D', title: 'Geography of Canada, Grade 9, Academic', category: 'Geography', grade: 9 },
            { id: 31, code: 'CHC2D', title: 'Canadian History Since WWI, Grade 10, Academic', category: 'History', grade: 10 },
            { id: 32, code: 'CHV2O', title: 'Civics and Citizenship, Grade 10, Open', category: 'Social Studies', grade: 10 },
            { id: 33, code: 'FSF1D', title: 'Core French, Grade 9, Academic', category: 'French', grade: 9 },
            { id: 34, code: 'FSF2D', title: 'Core French, Grade 10, Academic', category: 'French', grade: 10 },
            { id: 35, code: 'ICS2O', title: 'Intro to Computer Studies, Grade 10, Open', category: 'Computer Science', grade: 10 },
            { id: 36, code: 'ICS3U', title: 'Intro to Computer Science, Grade 11, University', category: 'Computer Science', grade: 11 },
            { id: 37, code: 'ICS4U', title: 'Computer Science, Grade 12, University', category: 'Computer Science', grade: 12 },
            { id: 38, code: 'AVI1O', title: 'Visual Arts, Grade 9, Open', category: 'Art', grade: 9 },
            { id: 39, code: 'ADA1O', title: 'Drama, Grade 9, Open', category: 'Drama', grade: 9 },
            { id: 40, code: 'AMU1O', title: 'Music, Grade 9, Open', category: 'Music', grade: 9 },
            { id: 41, code: 'PPL1O', title: 'Health & Phys Ed, Grade 9, Open', category: 'Physical Education', grade: 9 },
            { id: 42, code: 'BBI1O', title: 'Intro to Business, Grade 9, Open', category: 'Business', grade: 9 },
            { id: 43, code: 'CLU3M', title: 'Understanding Canadian Law, Grade 11, Uni/College', category: 'Law', grade: 11 },
            { id: 44, code: 'HSP3U', title: 'Intro to Anthropology/Psych/Sociology, Grade 11, Uni', category: 'Social Studies', grade: 11 },
            { id: 45, code: 'NAC1O', title: 'Expressing Aboriginal Cultures, Grade 9, Open', category: 'Indigenous Studies', grade: 9 }
        ];
    }
}

// ============ AUTOCOMPLETE ============

function setupCourseCodeAutocomplete() {
    const input = document.getElementById('courseCodeInput');
    const dropdown = document.getElementById('courseCodeDropdown');
    let debounce = null;

    function getFilteredCodes() {
        const category = document.getElementById('categorySelect').value;
        let codes = allCourseCodes;
        if (category) codes = codes.filter(c => c.category === category);
        return codes;
    }

    function render(items) {
        if (items.length === 0) { dropdown.classList.remove('show'); return; }

        dropdown.innerHTML = items.slice(0, 15).map(c => `
            <div class="autocomplete-item" data-id="${c.id}" data-code="${escapeHtml(c.code)}" data-title="${escapeHtml(c.title)}" data-category="${escapeHtml(c.category)}">
                <div class="ac-name">${escapeHtml(c.code)}</div>
                <div class="ac-meta">${escapeHtml(c.title)}</div>
            </div>
        `).join('');
        dropdown.classList.add('show');

        dropdown.querySelectorAll('.autocomplete-item').forEach(el => {
            el.addEventListener('mousedown', (e) => {
                e.preventDefault();
                input.value = el.dataset.code;
                selectedCodeId = parseInt(el.dataset.id);
                dropdown.classList.remove('show');

                // Show info
                const info = document.getElementById('codeInfo');
                info.innerHTML = `<strong>${el.dataset.code}</strong> — ${el.dataset.title}`;
                info.classList.add('show');

                // Auto-select category
                const catSelect = document.getElementById('categorySelect');
                if (el.dataset.category && !catSelect.value) {
                    catSelect.value = el.dataset.category;
                }
            });
        });
    }

    // Show all on focus
    input.addEventListener('focus', () => render(getFilteredCodes()));

    // Filter as typing
    input.addEventListener('input', () => {
        clearTimeout(debounce);
        selectedCodeId = null;
        document.getElementById('codeInfo').classList.remove('show');

        debounce = setTimeout(() => {
            const query = input.value.trim().toLowerCase();
            const codes = getFilteredCodes();
            if (query.length === 0) { render(codes); return; }

            const matches = codes.filter(c =>
                c.code.toLowerCase().includes(query) || c.title.toLowerCase().includes(query)
            );
            render(matches);
        }, 150);
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#courseCodeInput') && !e.target.closest('#courseCodeDropdown')) {
            dropdown.classList.remove('show');
        }
    });
}

// Re-filter when category changes
function setupCategoryChange() {
    document.getElementById('categorySelect').addEventListener('change', () => {
        const input = document.getElementById('courseCodeInput');
        if (input === document.activeElement) {
            input.dispatchEvent(new Event('input'));
        }
    });
}

// ============ FORM SUBMIT ============

function setupFormSubmit() {
    document.getElementById('addCourseForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const category = document.getElementById('categorySelect').value;
        const courseCode = document.getElementById('courseCodeInput').value.trim();
        const sectionTag = document.getElementById('sectionTag').value.trim();

        if (!category) { alert('Please select a category.'); return; }
        if (!courseCode) { alert('Please enter a course code.'); return; }

        const btn = document.getElementById('submitBtn');
        btn.disabled = true;
        btn.innerHTML = 'Adding...';

        // Save to server
        try {
            await apiRequest('/user-courses', {
                method: 'POST',
                body: JSON.stringify({
                    course_code: courseCode,
                    course_code_id: selectedCodeId,
                    section_tag: sectionTag,
                    category: category
                })
            });
        } catch (err) {
            console.warn('Server save not available:', err.message);
        }

        // Show banner and redirect
        const banner = document.getElementById('saveBanner');
        const label = sectionTag ? `${courseCode} ${sectionTag}` : courseCode;
        document.getElementById('bannerText').textContent = `${label} added! Redirecting...`;
        banner.classList.add('show');

        setTimeout(() => {
            window.location.href = 'my-courses.html';
        }, 1500);
    });
}

// ============ INIT ============

loadCourseCodes().then(() => {
    setupCourseCodeAutocomplete();
    setupCategoryChange();
    setupFormSubmit();
});