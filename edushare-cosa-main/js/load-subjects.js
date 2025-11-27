/* ===================================================== */
/* ======== LOAD SUBJECTS (PRIMARY NAVIGATION) ========= */
/* ===================================================== */
/**
 * Loads subjects from the backend and populates the primary
 * navigation bar (#primaryNav) with .nav-link buttons.
 *
 * UPDATED: Now uses RESTful API endpoints
 */
(function () {

    /**
     * Main loader function - called on page load
     * Shows a message to select a course
     */
    async function loadSubjects(options = {}) {
        const nav = document.getElementById('primaryNav');
        if (!nav) return;

        // For now, just show empty state on initial load
        nav.innerHTML = '<div class="nav-empty" style="color: #999; padding: 20px; text-align: center;">👈 Select a course from the left sidebar</div>';
    }

    /**
     * Handle subject button click
     */
    function handleSubjectClick(e) {
        const btn = e.currentTarget;
        const subjectId = btn.dataset.subjectId;

        // Update active state
        document.querySelectorAll('#primaryNav .nav-link').forEach(b => {
            b.classList.remove('active');
        });
        btn.classList.add('active');

        // Save current subject to session
        try {
            sessionStorage.setItem('currentSubjectId', subjectId);
            sessionStorage.setItem('currentSubjectName', btn.dataset.subjectName);
        } catch {}

        // Show topics row and hide subsequent rows
        const topicsRow = document.getElementById('rowTopics');
        if (topicsRow) {
            topicsRow.classList.remove('hidden');
        }

        document.getElementById('rowSubtopics')?.classList.add('hidden');
        document.getElementById('rowSections')?.classList.add('hidden');
        document.getElementById('contentArea')?.classList.add('hidden');

        // Load topics for this subject
        if (window.loadTopicsForSubject) {
            window.loadTopicsForSubject(subjectId);
        }
    }

    // ----------------------------
    // Public helper for courses
    // ----------------------------
    /**
     * Called when the user clicks on a Course in "My Courses".
     * It reloads the subjects from the database, filtered by course.
     *
     * @param {string} category - e.g. "English", "Mathematics", "Computer Science"
     * @param {string} code     - e.g. "ENG 010", "MATH 101", "CS-PROG-101"
     */
    async function loadSubjectsForCourse(category, code) {
        console.log('Loading subjects for course:', category, code);
        
        const nav = document.getElementById('primaryNav');
        if (!nav) return;

        // Show loading message
        nav.innerHTML = '<div style="color: #999; padding: 20px; text-align: center;">Loading subjects...</div>';

        try {
            // Map course code to course_id
            const courseIdMap = {
                'ENG 010': 1,
                'ENG 101': 2,
                'ENG 102': 3,
                'MATH 101': 4,
                'MATH 102': 5,
                'CS-PROG-101': 6,
                'CS-PROG-102': 7
            };

            const courseId = courseIdMap[code];
            
            if (!courseId) {
                console.error('Unknown course code:', code);
                nav.innerHTML = '<div class="nav-error" style="color: #c33; padding: 20px;">Unknown course</div>';
                return;
            }

            // Call the RESTful API endpoint
            const url = `http://localhost:3000/api/courses/${courseId}/subjects`;
            console.log('Fetching from:', url);

            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const subjects = await response.json();
            console.log('✅ Received subjects:', subjects);

            if (subjects.length === 0) {
                nav.innerHTML = '<div class="nav-empty" style="color: #999; padding: 20px;">No subjects found for this course</div>';
                document.getElementById('rowTopics')?.classList.add('hidden');
                document.getElementById('rowSubtopics')?.classList.add('hidden');
                document.getElementById('rowSections')?.classList.add('hidden');
                document.getElementById('contentArea')?.classList.add('hidden');
                return;
            }

            // Build subject navigation buttons
            const html = subjects.map((subject, index) => {
                // API returns subject_name (snake_case), not SubjectName (PascalCase)
                const subjectName = subject.subject_name || 'Untitled';
                const subjectId = subject.subject_id;
                const activeClass = index === 0 ? ' active' : '';

                return `
                    <button 
                        class="nav-link${activeClass}" 
                        data-subject-id="${subjectId}"
                        data-subject-name="${escapeHtml(subjectName)}"
                        type="button">
                        ${escapeHtml(subjectName)}
                    </button>
                `;
            }).join('');

            nav.innerHTML = html;

            // Add click handlers to subject buttons
            nav.querySelectorAll('.nav-link').forEach(btn => {
                btn.addEventListener('click', handleSubjectClick);
            });

            // Auto-load topics for the first subject
            if (subjects.length > 0) {
                const firstSubject = subjects[0];
                const firstId = firstSubject.subject_id;

                // Save current subject to session
                try {
                    sessionStorage.setItem('currentSubjectId', firstId);
                    sessionStorage.setItem('currentSubjectName', firstSubject.subject_name || 'Untitled');
                } catch (e) {
                    console.warn('Could not save to sessionStorage:', e);
                }

                // Show topics row
                const topicsRow = document.getElementById('rowTopics');
                if (topicsRow) {
                    topicsRow.classList.remove('hidden');
                }

                // Load topics for the first subject
                if (window.loadTopicsForSubject) {
                    window.loadTopicsForSubject(firstId);
                } else {
                    console.warn('loadTopicsForSubject function not found');
                }
            }

        } catch (error) {
            console.error('❌ Failed to load subjects:', error);
            nav.innerHTML = `
                <div class="nav-error" style="color: #c33; padding: 20px; text-align: center;">
                    Failed to load subjects.<br>
                    <small>Make sure backend is running on port 3000</small>
                </div>
            `;
        }
    }

    // Helper function to escape HTML (if not already defined)
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Helper function for showing loading (if not already defined)
    function showLoading(element, message) {
        if (element) {
            element.innerHTML = `<div style="color: #999; padding: 20px; text-align: center;">${message}</div>`;
        }
    }

    // Load subjects when page loads (just shows "select a course" message)
    document.addEventListener('DOMContentLoaded', function () {
        loadSubjects();
    });

    // Expose functions globally so other scripts can call them
    window.loadSubjects = loadSubjects;
    window.loadSubjectsForCourse = loadSubjectsForCourse;
})();