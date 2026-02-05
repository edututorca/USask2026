/* ===================================================== */
/* ========= LOAD SECTIONS (SCENES / LESSONS) ========= */
/* ===================================================== */
(function () {
    async function loadSectionsForSubtopic(subtopicId, autoNavOptions = {}) {
        console.log('[load-sections] loadSectionsForSubtopic called:', subtopicId, autoNavOptions);
        const bar = document.getElementById('sectionsBar');
        if (!bar) return;

        showLoading(bar, 'Loading scenes...');

        // DEFINITIVE MANUAL: Hide content area until scene is clicked
        document.getElementById('contentArea')?.classList.add('hidden');

        let sections = [];
        // 1. Try to fetch from API
        try {
            const data = await apiRequest(`${API_CONFIG.ENDPOINTS.SECTIONS}?subtopicId=${subtopicId}`);
            sections = data.sections || data || [];
        } catch (error) {
            console.error('[load-sections] API error:', error);
        }

        // 3. Handle Empty State
        if (sections.length === 0) {
            bar.innerHTML = '<div class="nav-empty" style="color: #999;">No scenes available</div>';
            return;
        }

        // 4. Build section tabs
        bar.innerHTML = sections.map((sec, index) => {
            const name = sec.SectionName || sec.sectionName || 'Untitled';
            const id = sec.sectionId || sec.SectionID;

            return `
                <button 
                    class="tab tab--section"
                    data-section-id="${id}"
                    data-section-name="${escapeHtml(name)}">
                    ${escapeHtml(name)}
                </button>
            `;
        }).join('');

        // 5. Add click handlers
        bar.querySelectorAll('.tab--section').forEach(btn => {
            btn.addEventListener('click', handleSectionClick);
        });

        // Auto-select initial section
        if (autoNavOptions.initialSectionId) {
            const initialBtn = bar.querySelector(`.tab--section[data-section-id="${autoNavOptions.initialSectionId}"]`);
            if (initialBtn) {
                console.log('[load-sections] Auto-selecting section:', autoNavOptions.initialSectionId);
                initialBtn.dataset.newQuestionIds = autoNavOptions.newQuestionIds || '';
                initialBtn.click();
            }
        }

    }

    function handleSectionClick(e) {
        const btn = e.currentTarget;
        const id = btn.dataset.sectionId;
        const name = btn.dataset.sectionName;

        document.querySelectorAll('.tab--section').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        sessionStorage.setItem('currentSectionId', id);
        sessionStorage.setItem('currentSectionName', name);

        document.getElementById('contentArea')?.classList.remove('hidden');

        if (window.loadQuestionsForSection) {
            window.loadQuestionsForSection(id, btn.dataset.newQuestionIds);
        }
    }

    window.loadSectionsForSubtopic = loadSectionsForSubtopic;
})();
