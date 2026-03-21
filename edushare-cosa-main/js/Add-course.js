/* ===================================================== */
/* ============= ADD COURSE PAGE JS ==================== */
/* ===================================================== */

let allCourseCodes = [];
let allSubjects = [];
let selectedCodeId = null;

// ============ LOAD SUBJECTS FROM API ============

async function loadSubjects() {
    const select = document.getElementById('categorySelect');
    try {
        allSubjects = await apiRequest('/subjects');
        select.innerHTML = '<option value="">Select a subject</option>';
        allSubjects.forEach(s => {
            select.innerHTML += `<option value="${s.id}">${escapeHtml(s.name)}</option>`;
        });
        select.innerHTML += '<option value="__new__">+ Add New Subject...</option>';
    } catch (error) {
        console.warn('Failed to load subjects from API, using defaults');
    }
}

// Handle "Add New Subject" selection
document.getElementById('categorySelect').addEventListener('change', function() {
    if (this.value === '__new__') {
        const name = prompt('Enter the new subject name (e.g. "French", "Drama"):');
        if (!name || !name.trim()) {
            this.value = '';
            return;
        }

        // Check if it already exists
        const existing = allSubjects.find(s => s.name.toLowerCase() === name.trim().toLowerCase());
        if (existing) {
            this.value = existing.id;
            alert('That subject already exists — selected it for you.');
            return;
        }

        // Create on server
        apiRequest('/subjects', {
            method: 'POST',
            body: JSON.stringify({ name: name.trim() })
        }).then(result => {
            if (result.success) {
                allSubjects.push({ id: result.id, name: result.name });
                // Add new option before the "+ Add New" option
                const newOpt = document.createElement('option');
                newOpt.value = result.id;
                newOpt.textContent = result.name;
                const addNewOpt = this.querySelector('option[value="__new__"]');
                this.insertBefore(newOpt, addNewOpt);
                this.value = result.id;
            }
        }).catch(err => {
            console.error('Failed to create subject:', err);
            alert('Failed to create subject: ' + (err.message || 'Please try again.'));
            this.value = '';
        });
    }
});

// ============ LOAD COURSE CODES ============

async function loadCourseCodes() {
    try {
        allCourseCodes = await apiRequest('/course-codes');
        // Normalize field names (API returns subject_area, local uses category)
        allCourseCodes = allCourseCodes.map(c => ({
            id: c.id,
            code: c.code,
            title: c.name || c.title,
            category: c.subject_area || c.category,
            grade: c.grade
        }));
    } catch (error) {
        console.warn('Using local course code list');
        allCourseCodes = [
            { id: 1, code: 'ENG1D', title: 'English, Grade 9, Academic', category: 'English', grade: 9 },
            { id: 2, code: 'ENG1P', title: 'English, Grade 9, Applied', category: 'English', grade: 9 },
            { id: 3, code: 'ENG2D', title: 'English, Grade 10, Academic', category: 'English', grade: 10 },
            { id: 4, code: 'ENG3U', title: 'English, Grade 11, University', category: 'English', grade: 11 },
            { id: 5, code: 'ENG4U', title: 'English, Grade 12, University', category: 'English', grade: 12 },
            { id: 6, code: 'MPM1D', title: 'Principles of Math, Grade 9, Academic', category: 'Mathematics', grade: 9 },
            { id: 7, code: 'MPM2D', title: 'Principles of Math, Grade 10, Academic', category: 'Mathematics', grade: 10 },
            { id: 8, code: 'MCR3U', title: 'Functions, Grade 11, University', category: 'Mathematics', grade: 11 },
            { id: 9, code: 'MHF4U', title: 'Advanced Functions, Grade 12, University', category: 'Mathematics', grade: 12 },
            { id: 10, code: 'SNC1D', title: 'Science, Grade 9, Academic', category: 'Science', grade: 9 },
            { id: 11, code: 'SNC2D', title: 'Science, Grade 10, Academic', category: 'Science', grade: 10 },
            { id: 12, code: 'SBI3U', title: 'Biology, Grade 11, University', category: 'Science', grade: 11 },
            { id: 13, code: 'SCH3U', title: 'Chemistry, Grade 11, University', category: 'Science', grade: 11 },
            { id: 14, code: 'SPH3U', title: 'Physics, Grade 11, University', category: 'Science', grade: 11 },
            { id: 15, code: 'CHC2D', title: 'Canadian History Since WWI, Grade 10, Academic', category: 'History', grade: 10 },
            { id: 16, code: 'ICS3U', title: 'Intro to Computer Science, Grade 11, University', category: 'Computer Science', grade: 11 },
            { id: 17, code: 'ICS4U', title: 'Computer Science, Grade 12, University', category: 'Computer Science', grade: 12 },
            { id: 18, code: 'FSF1D', title: 'Core French, Grade 9, Academic', category: 'French', grade: 9 }
        ];
    }
}

// ============ AUTOCOMPLETE ============

function setupCourseCodeAutocomplete() {
    const input = document.getElementById('courseCodeInput');
    const dropdown = document.getElementById('courseCodeDropdown');
    let debounce = null;

    function getSelectedSubjectName() {
        const select = document.getElementById('categorySelect');
        const opt = select.options[select.selectedIndex];
        return opt && opt.value ? opt.textContent : '';
    }

    function getFilteredCodes() {
        const subjectName = getSelectedSubjectName();
        let codes = allCourseCodes;
        if (subjectName) {
            codes = codes.filter(c =>
                c.category && c.category.toLowerCase() === subjectName.toLowerCase()
            );
        }
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

                // Auto-select subject if not already selected
                const catSelect = document.getElementById('categorySelect');
                if (el.dataset.category && !catSelect.value) {
                    // Find the subject that matches this course code's category
                    const match = allSubjects.find(s =>
                        s.name.toLowerCase() === el.dataset.category.toLowerCase()
                    );
                    if (match) {
                        catSelect.value = match.id;
                    }
                }
            });
        });
    }

    input.addEventListener('focus', () => render(getFilteredCodes()));

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

        const subjectId = document.getElementById('categorySelect').value;
        const courseCode = document.getElementById('courseCodeInput').value.trim();
        const section = document.getElementById('sectionTag').value.trim();
        const userId = getCurrentUserId();

        if (!subjectId) { alert('Please select a subject.'); return; }
        if (!courseCode) { alert('Please enter a course code.'); return; }
        if (!userId) { alert('You must be logged in.'); window.location.href = 'Login.html'; return; }

        const btn = document.getElementById('submitBtn');
        btn.disabled = true;
        btn.innerHTML = 'Adding...';

        try {
            const result = await apiRequest('/user-courses', {
                method: 'POST',
                body: JSON.stringify({
                    userId: userId,
                    subjectId: subjectId,
                    courseCode: courseCode,
                    section: section || null
                })
            });

            if (result.success) {
                // Show banner and redirect
                const banner = document.getElementById('saveBanner');
                const label = section ? `${courseCode} — ${section}` : courseCode;
                document.getElementById('bannerText').textContent = `${label} added! Redirecting...`;
                banner.classList.add('show');

                setTimeout(() => {
                    window.location.href = 'User-Area.html';
                }, 1500);
            } else {
                throw new Error(result.error || 'Failed to add course');
            }

        } catch (err) {
            console.error('Failed to add course:', err);
            alert(err.message || 'Failed to add course. Please try again.');
            btn.disabled = false;
            btn.innerHTML = `
                <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add Course`;
        }
    });
}

// ============ INIT ============

Promise.all([loadSubjects(), loadCourseCodes()]).then(() => {
    setupCourseCodeAutocomplete();
    setupCategoryChange();
    setupFormSubmit();
});