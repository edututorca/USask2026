/* ===================================================== */
/* ======== LOAD SUBJECTS (PRIMARY NAVIGATION) ======== */
/* ===================================================== */
/**
 * Loads subjects from Subject table that the user has chosen
 * Populates the primary navigation bar (Plays, Novel, Grammar, etc.)
 */
(function () {
    async function loadSubjects() {
        const userId = getCurrentUserId();
        if (!userId) {
            console.warn('No user ID found');
            return;
        }

        const nav = document.getElementById('primaryNav');
        if (!nav) return;

        showLoading(nav, 'Loading subjects...');

        try {
            // Fetch subjects for this user
            const data = await apiRequest(`${API_CONFIG.ENDPOINTS.SUBJECTS}?userId=${userId}`);
            const subjects = data.subjects || data || [];

            if (subjects.length === 0) {
                nav.innerHTML = '<div class="nav-empty" style="color: #999;">No subjects selected</div>';
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
                loadTopicsForSubject(firstSubject.SubjectID || firstSubject.subjectID);
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

        // Show topics row and load topics for this subject
        const topicsRow = document.getElementById('rowTopics');
        if (topicsRow) {
            topicsRow.classList.remove('hidden');
        }

        // Hide subsequent rows
        document.getElementById('rowSubtopics')?.classList.add('hidden');
        document.getElementById('rowSections')?.classList.add('hidden');
        document.getElementById('contentArea')?.classList.add('hidden');

        // Load topics for this subject
        if (window.loadTopicsForSubject) {
            window.loadTopicsForSubject(subjectId);
        }
    }

    // Load subjects when page loads
    document.addEventListener('DOMContentLoaded', loadSubjects);
    
    // Make function available globally
    window.loadSubjects = loadSubjects;
})();