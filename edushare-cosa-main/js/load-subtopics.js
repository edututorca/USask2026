/* ===================================================== */
/* ========= LOAD SUBTOPICS (ROW 2 - WAS ACTS) ======== */
/* ===================================================== */
/**
 * Loads subtopics from SubTopic table filtered by selected Topic
 * Example: If "Romeo & Juliet" is selected, shows "Act 1", "Act 2", etc.
 */
(function () {
    async function loadSubtopicsForTopic(topicId) {
        const bar = document.getElementById('subtopicsBar');
        if (!bar) return;

        showLoading(bar, 'Loading subtopics...');

        try {
            // Fetch subtopics for this topic
            const data = await apiRequest(`${API_CONFIG.ENDPOINTS.SUBTOPICS}?topicId=${topicId}`);
            const subtopics = data.subtopics || data || [];

            if (subtopics.length === 0) {
                showEmpty(bar, 'No subtopics available');
                return;
            }

            // Build subtopic tabs
            const html = subtopics.map((subtopic, index) => {
                const subtopicName = subtopic.SubTopicName || subtopic.subTopicName || 'Untitled';
                const subtopicId = subtopic.SubTopicID || subtopic.subTopicID;
                
                // Third one active by default (to match your old Act 3 default)
                const activeClass = index === 2 ? ' active' : '';

                return `
                    <button 
                        class="tab tab--subtopic${activeClass}"
                        data-subtopic-id="${subtopicId}"
                        data-subtopic-name="${escapeHtml(subtopicName)}">
                        ${escapeHtml(subtopicName)}
                    </button>
                `;
            }).join('');

            bar.innerHTML = html;

            // Add click handlers
            bar.querySelectorAll('.tab--subtopic').forEach(btn => {
                btn.addEventListener('click', handleSubtopicClick);
            });

            // Auto-load sections for the active (3rd) subtopic, or first if less than 3
            const activeIndex = subtopics.length >= 3 ? 2 : 0;
            if (subtopics[activeIndex]) {
                const activeSubtopic = subtopics[activeIndex];
                loadSectionsForSubtopic(activeSubtopic.SubTopicID || activeSubtopic.subTopicID);
            }

        } catch (error) {
            console.error('Failed to load subtopics:', error);
            showError(bar, 'Failed to load subtopics');
        }
    }

    /**
     * Handle subtopic button click
     */
    function handleSubtopicClick(e) {
        const btn = e.currentTarget;
        const subtopicId = btn.dataset.subtopicId;

        // Update active state
        document.querySelectorAll('.tab--subtopic').forEach(b => {
            b.classList.remove('active');
        });
        btn.classList.add('active');

        // Save current subtopic to session
        try {
            sessionStorage.setItem('currentSubtopicId', subtopicId);
            sessionStorage.setItem('currentSubtopicName', btn.dataset.subtopicName);
        } catch {}

        // Show sections row
        const sectionsRow = document.getElementById('rowSections');
        if (sectionsRow) {
            sectionsRow.classList.remove('hidden');
        }

        // Hide content area
        document.getElementById('contentArea')?.classList.add('hidden');

        // Load sections for this subtopic
        if (window.loadSectionsForSubtopic) {
            window.loadSectionsForSubtopic(subtopicId);
        }
    }

    // Make functions available globally
    window.loadSubtopicsForTopic = loadSubtopicsForTopic;
})();