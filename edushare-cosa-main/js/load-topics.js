/* ===================================================== */
/* ============ LOAD TOPICS (ROW 1 - WAS PLAYS) ======= */
/* ===================================================== */
/**
 * Loads topics from Topic table filtered by selected Subject
 * Example: If "Plays" is selected, shows "Romeo & Juliet", "Macbeth", etc.
 */
(function () {
    async function loadTopicsForSubject(subjectId) {
        const bar = document.getElementById('topicsBar');
        if (!bar) return;

        showLoading(bar, 'Loading topics...');

        try {
            // Fetch topics for this subject
            const data = await apiRequest(`${API_CONFIG.ENDPOINTS.TOPICS}?subjectId=${subjectId}`);
            const topics = data.topics || data || [];

            if (topics.length === 0) {
                showEmpty(bar, 'No topics available');
                return;
            }

            // Build topic tabs
            const html = topics.map((topic, index) => {
                const topicName = topic.TopicName || topic.topicName || 'Untitled';
                const topicId = topic.TopicID || topic.topicID;
                
                // First topic is active by default
                const activeClass = index === 0 ? ' active' : '';

                return `
                    <button 
                        class="tab tab--topic${activeClass}"
                        data-topic-id="${topicId}"
                        data-topic-name="${escapeHtml(topicName)}">
                        ${escapeHtml(topicName)}
                    </button>
                `;
            }).join('');

            // Add "+" button to add new topics
            bar.innerHTML = html + `
                <button class="tab tab--add" title="Add Topic">＋</button>
            `;

            // Add click handlers
            bar.querySelectorAll('.tab--topic').forEach(btn => {
                btn.addEventListener('click', handleTopicClick);
            });

            // Auto-load subtopics for first topic
            if (topics.length > 0) {
                const firstTopic = topics[0];
                loadSubtopicsForTopic(firstTopic.TopicID || firstTopic.topicID);
            }

        } catch (error) {
            console.error('Failed to load topics:', error);
            showError(bar, 'Failed to load topics');
        }
    }

    /**
     * Handle topic button click
     */
    function handleTopicClick(e) {
        const btn = e.currentTarget;
        const topicId = btn.dataset.topicId;

        // Update active state
        document.querySelectorAll('.tab--topic').forEach(b => {
            b.classList.remove('active');
        });
        btn.classList.add('active');

        // Save current topic to session
        try {
            sessionStorage.setItem('currentTopicId', topicId);
            sessionStorage.setItem('currentTopicName', btn.dataset.topicName);
        } catch {}

        // Show subtopics row
        const subtopicsRow = document.getElementById('rowSubtopics');
        if (subtopicsRow) {
            subtopicsRow.classList.remove('hidden');
        }

        // Hide subsequent rows
        document.getElementById('rowSections')?.classList.add('hidden');
        document.getElementById('contentArea')?.classList.add('hidden');

        // Load subtopics for this topic
        if (window.loadSubtopicsForTopic) {
            window.loadSubtopicsForTopic(topicId);
        }
    }

    // Make functions available globally
    window.loadTopicsForSubject = loadTopicsForSubject;
})();