/* ===================================================== */
/* ========= LOAD SUBTOPICS (ACTS / CHAPTERS) ========= */
/* ===================================================== */
(function () {
    async function loadSubtopicsForTopic(topicId, autoNavOptions = {}) {
        console.log('[load-subtopics] loadSubtopicsForTopic called:', topicId, autoNavOptions);
        const bar = document.getElementById('subtopicsBar');
        if (!bar) return;

        showLoading(bar, 'Loading levels...');

        // DEFINITIVE MANUAL: Hide all subsequent rows
        document.getElementById('rowSections')?.classList.add('hidden');
        document.getElementById('contentArea')?.classList.add('hidden');

        let subtopics = [];

        // 1. Try to fetch from API
        try {
            const data = await apiRequest(`${API_CONFIG.ENDPOINTS.SUBTOPICS}?topicId=${topicId}`);
            subtopics = data.subtopics || data || [];
        } catch (error) {
            console.warn('API subtopics load failed');
        }

        // 3. Handle Empty State
        if (subtopics.length === 0) {
            bar.innerHTML = '<div class="nav-empty" style="color: #999;">No levels available</div>';
            return;
        }

        // 4. Build subtopic tabs
        bar.innerHTML = subtopics.map((sub, index) => {
            const name = sub.SubTopicName || sub.subTopicName || 'Untitled';
            const id = sub.SubTopicID || sub.subTopicID;

            return `
                <button 
                    class="tab tab--subtopic"
                    data-subtopic-id="${id}"
                    data-subtopic-name="${escapeHtml(name)}">
                    ${escapeHtml(name)}
                </button>
            `;
        }).join('');

        // 5. Add click handlers
        bar.querySelectorAll('.tab--subtopic').forEach(btn => {
            btn.addEventListener('click', handleSubtopicClick);
        });

        // Auto-select initial subtopic
        if (autoNavOptions.initialSubtopicId) {
            const initialBtn = bar.querySelector(`.tab--subtopic[data-subtopic-id="${autoNavOptions.initialSubtopicId}"]`);
            if (initialBtn) {
                console.log('[load-subtopics] Auto-selecting subtopic:', autoNavOptions.initialSubtopicId);
                initialBtn.dataset.initialSectionId = autoNavOptions.initialSectionId || '';
                initialBtn.dataset.newQuestionIds = autoNavOptions.newQuestionIds || '';
                initialBtn.click();
            }
        }
    }

    function handleSubtopicClick(e) {
        const btn = e.currentTarget;
        const id = btn.dataset.subtopicId;
        const name = btn.dataset.subtopicName;

        document.querySelectorAll('.tab--subtopic').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        sessionStorage.setItem('currentSubtopicId', id);
        sessionStorage.setItem('currentSubtopicName', name);

        document.getElementById('rowSections')?.classList.remove('hidden');

        // Ensure everything else is hidden
        document.getElementById('contentArea')?.classList.add('hidden');

        // Clear children
        document.getElementById('questionsList').innerHTML = '';

        if (window.loadSectionsForSubtopic) {
            window.loadSectionsForSubtopic(id, {
                initialSectionId: btn.dataset.initialSectionId,
                newQuestionIds: btn.dataset.newQuestionIds
            });
        }
    }

    window.loadSubtopicsForTopic = loadSubtopicsForTopic;
})();