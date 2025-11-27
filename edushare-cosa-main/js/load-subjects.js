/* ===================================================== */
/* ======== LOAD SUBJECTS (PRIMARY NAVIGATION) ========= */
/* ===================================================== */
/**
 * Loads subjects from the backend and populates the primary
 * navigation bar (#primaryNav) with .nav-link buttons.
 *
 * Now it supports optional filters:
 *  - courseCategory (e.g. "English", "Mathematics", "Computer Science")
 *  - courseCode     (e.g. "ENG 010", "MATH 101", "CS-PROG-101")
 *
 * This allows us to:
 *  - On first load: load all subjects for the user
 *  - After clicking a course: load only the subjects related to that course
 */
(function () {

    /**
     * Main loader function.
     * @param {Object} [options]
     * @param {string} [options.courseCategory] - e.g. "English"
     * @param {string} [options.courseCode]     - e.g. "ENG 010"
     */
    async function loadSubjects(options = {}) {
        const userId = getCurrentUserId();
        if (!userId) {
            console.warn('No user ID found');
            return;
        }

        const nav = document.getElementById('primaryNav');
        if (!nav) return;

        showLoading(nav, 'Loading subjects...');

        try {
            // Build query string
            let url = `${API_CONFIG.ENDPOINTS.SUBJECTS}?userId=${encodeURIComponent(userId)}`;

            // Optional filters: courseCategory / courseCode
            if (options.courseCategory) {
                url += `&courseCategory=${encodeURIComponent(options.courseCategory)}`;
            }
            if (options.courseCode) {
                url += `&courseCode=${encodeURIComponent(options.courseCode)}`;
            }

            // Fetch subjects for this user (and optional course)
            const data = await apiRequest(url);
            const subjects = data.subjects || data || [];

            if (subjects.length === 0) {
                nav.innerHTML = '<div class="nav-empty" style="color: #999;">No subjects found for this selection</div>';
                // Also hide the rows, since there is nothing to explore
                document.getElementById('rowTopics')?.classList.add('hidden');
                document.getElementById('rowSubtopics')?.classList.add('hidden');
                document.getElementById('rowSections')?.classList.add('hidden');
                document.getElementById('contentArea')?.classList.add('hidden');
                return;
            }

            // Build subject navigation buttons
            const html = subjects.map((subject, index) => {
                const subjectName = subject.SubjectName || subject.subjectName || 'Untitled';
                const subjectId = subject.SubjectID || subject.subjectID;

                // First subject is active by default
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

            // Auto-load topics for the first (active) subject
            if (subjects.length > 0) {
                const firstSubject = subjects[0];
                const firstId = firstSubject.SubjectID || firstSubject.subjectID;

                // Save current subject to session
                try {
                    sessionStorage.setItem('currentSubjectId', firstId);
                    sessionStorage.setItem(
                        'currentSubjectName',
                        firstSubject.SubjectName || firstSubject.subjectName || 'Untitled'
                    );
                } catch {}

                // Show topics row
                const topicsRow = document.getElementById('rowTopics');
                if (topicsRow) {
                    topicsRow.classList.remove('hidden');
                }

                // Load topics for the first subject
                if (window.loadTopicsForSubject) {
                    window.loadTopicsForSubject(firstId);
                }
            }

        } catch (error) {
            console.error('Failed to load subjects:', error);
            nav.innerHTML = '<div class="nav-error" style="color: #c33;">Failed to load subjects</div>';
        }
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
    function loadSubjectsForCourse(category, code) {
        console.log('Loading subjects for course:', category, code);
        loadSubjects({
            courseCategory: category,
            courseCode: code
        });
    }

    // Load subjects when page loads (generic: all subjects for this user)
    document.addEventListener('DOMContentLoaded', function () {
        loadSubjects();
    });

    // Expose functions globally so other scripts (like add-course-return.js) can call them
    window.loadSubjects = loadSubjects;
    window.loadSubjectsForCourse = loadSubjectsForCourse;
})();
