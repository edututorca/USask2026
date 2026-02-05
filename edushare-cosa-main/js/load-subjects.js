/* ===================================================== */
/* ======== LOAD SUBJECTS (PRIMARY NAVIGATION) ========= */
/* ===================================================== */
(function () {
    /**
     * Main loader function.
     * @param {Object} [options]
     * @param {string} [options.courseCategory] - e.g. "English"
     * @param {string} [options.courseCode]     - e.g. "ENG 010"
     * @param {string} [options.initialSubjectId] - Subject ID to auto-select
     */
    async function loadSubjects(options = {}) {
        console.log('[load-subjects] loadSubjects called with options:', options);
        const userId = getCurrentUserId();
        const nav = document.getElementById('primaryNav');
        if (!nav) return;

        showLoading(nav, 'Loading categories...');

        // DEFINITIVE MANUAL: Hide all subsequent rows
        document.getElementById('rowTopics')?.classList.add('hidden');
        document.getElementById('rowSubtopics')?.classList.add('hidden');
        document.getElementById('rowSections')?.classList.add('hidden');
        document.getElementById('contentArea')?.classList.add('hidden');

        let subjects = [];

        // 1. Try to fetch from API
        try {
            let url = API_CONFIG.ENDPOINTS.SUBJECTS;
            const queryParams = [];
            if (userId) queryParams.push(`userId=${encodeURIComponent(userId)}`);
            if (options.courseCategory) queryParams.push(`courseCategory=${encodeURIComponent(options.courseCategory)}`);
            if (options.courseCode) queryParams.push(`courseCode=${encodeURIComponent(options.courseCode)}`);

            if (queryParams.length > 0) {
                url += `?${queryParams.join('&')}`;
            }

            console.log('[load-subjects] Requesting URL:', url);
            const data = await apiRequest(url);
            console.log('[load-subjects] Data received:', data);

            subjects = data.subjects || data || [];
            console.log('[load-subjects] Final subjects array:', subjects);
        } catch (error) {
            console.error('[load-subjects] API fetch error:', error);
        }

        // 3. Handle Empty State
        if (subjects.length === 0) {
            nav.innerHTML = '<div class="nav-empty" style="color: #999;">No subjects found</div>';
            document.getElementById('rowTopics')?.classList.add('hidden');
            document.getElementById('rowSubtopics')?.classList.add('hidden');
            document.getElementById('rowSections')?.classList.add('hidden');
            document.getElementById('contentArea')?.classList.add('hidden');
            return;
        }

        // 4. Render subject navigation buttons
        nav.innerHTML = subjects.map((subject, index) => {
            const subjectName = subject.SubjectName || subject.subjectName || 'Untitled';
            const subjectId = subject.SubjectID || subject.subjectID;

            return `
                <button 
                    class="nav-link" 
                    data-subject-id="${subjectId}"
                    data-subject-name="${escapeHtml(subjectName)}"
                    type="button">
                    ${escapeHtml(subjectName)}
                </button>
            `;
        }).join('');

        // 5. Add click handlers
        nav.querySelectorAll('.nav-link').forEach(btn => {
            btn.addEventListener('click', handleSubjectClick);
        });

        // Auto-select initial subject if provided
        if (options.initialSubjectId) {
            const initialBtn = nav.querySelector(`.nav-link[data-subject-id="${options.initialSubjectId}"]`);
            if (initialBtn) {
                console.log('[load-subjects] Auto-selecting subject:', options.initialSubjectId);
                // We need to pass the initialTopicId etc. down. 
                // Let's store them temporarily or pass them to handleSubjectClick.
                initialBtn.dataset.initialTopicId = options.initialTopicId || '';
                initialBtn.dataset.initialSubtopicId = options.initialSubtopicId || '';
                initialBtn.dataset.initialSectionId = options.initialSectionId || '';
                initialBtn.dataset.newQuestionIds = options.newQuestionIds || '';
                initialBtn.click();
            }
        }
    }

    /**
     * Handle subject button click
     */
    function handleSubjectClick(e) {
        const btn = e.currentTarget;
        const subjectId = btn.dataset.subjectId;
        const subjectName = btn.dataset.subjectName;

        document.querySelectorAll('#primaryNav .nav-link').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        sessionStorage.setItem('currentSubjectId', subjectId);
        sessionStorage.setItem('currentSubjectName', subjectName);

        document.getElementById('rowTopics')?.classList.remove('hidden');

        // Ensure everything else is hidden
        document.getElementById('rowSubtopics')?.classList.add('hidden');
        document.getElementById('rowSections')?.classList.add('hidden');
        document.getElementById('contentArea')?.classList.add('hidden');

        // Clear children innerHTML to be sure
        document.getElementById('subtopicsBar').innerHTML = '';
        document.getElementById('sectionsBar').innerHTML = '';
        document.getElementById('questionsList').innerHTML = '';

        if (window.loadTopicsForSubject) {
            window.loadTopicsForSubject(subjectId, {
                initialTopicId: btn.dataset.initialTopicId,
                initialSubtopicId: btn.dataset.initialSubtopicId,
                initialSectionId: btn.dataset.initialSectionId,
                newQuestionIds: btn.dataset.newQuestionIds
            });
        }
    }

    /**
     * Public helper for courses
     */
    function loadSubjectsForCourse(category, code, autoNavOptions = {}) {
        console.log('[load-subjects] loadSubjectsForCourse called:', category, code, autoNavOptions);
        console.log('[MANUAL] Course clicked, resetting flow:', category, code);

        // 1. Clear any saved act/scene context to prevent auto-highlights
        if (!autoNavOptions.initialSubjectId) {
            sessionStorage.removeItem('ctx:last');
            sessionStorage.removeItem('currentSubjectId');
            sessionStorage.removeItem('currentTopicId');
            sessionStorage.removeItem('currentSectionId');
        }

        // 2. Hide all rows before we even start
        document.querySelectorAll('.row').forEach(r => r.classList.add('hidden'));
        document.getElementById('contentArea')?.classList.add('hidden');

        loadSubjects({
            courseCategory: category,
            courseCode: code,
            ...autoNavOptions
        });
    }

    // Initial load (removed - subjects should only load after course selection)
    // document.addEventListener('DOMContentLoaded', loadSubjects);

    // Expose functions globally
    window.loadSubjects = loadSubjects;
    window.loadSubjectsForCourse = loadSubjectsForCourse;
})();
