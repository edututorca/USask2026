/* ===================================================== */
/* ============ LOAD TOPICS (PLAYS / NOVELS) ========== */
/* ===================================================== */
(function () {
    async function loadTopicsForSubject(subjectId) {
        const bar = document.getElementById('topicsBar');
        if (!bar) return;

        showLoading(bar, 'Loading topics...');

        // DEFINITIVE MANUAL: Hide all subsequent rows
        document.getElementById('rowSubtopics')?.classList.add('hidden');
        document.getElementById('rowSections')?.classList.add('hidden');
        document.getElementById('contentArea')?.classList.add('hidden');

        let topics = [];

        // 1. Try to fetch from API
        try {
            const data = await apiRequest(`${API_CONFIG.ENDPOINTS.TOPICS}?subjectId=${subjectId}`);
            topics = data.topics || data || [];
        } catch (error) {
            console.warn('API topics load failed');
        }

        // 3. Handle Empty State
        if (topics.length === 0) {
            bar.innerHTML = '<div class="nav-empty" style="color: #999;">No topics available</div>';
            return;
        }

        // 4. Build topic tabs
        bar.innerHTML = topics.map((topic, index) => {
            const topicName = topic.TopicName || topic.topicName || 'Untitled';
            const topicId = topic.TopicID || topic.topicID;

            return `
                <button 
                    class="tab tab--topic"
                    data-topic-id="${topicId}"
                    data-topic-name="${escapeHtml(topicName)}">
                    ${escapeHtml(topicName)}
                </button>
            `;
        }).join('') + `
            <button class="tab tab--add" title="Add Topic">＋</button>
        `;

        // 5. Add click handlers
        bar.querySelectorAll('.tab--topic').forEach(btn => {
            btn.addEventListener('click', handleTopicClick);
        });
    }

    function handleTopicClick(e) {
        const btn = e.currentTarget;
        const topicId = btn.dataset.topicId;
        const topicName = btn.dataset.topicName;

        document.querySelectorAll('.tab--topic').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        sessionStorage.setItem('currentTopicId', topicId);
        sessionStorage.setItem('currentTopicName', topicName);

        document.getElementById('rowSubtopics')?.classList.remove('hidden');

        // Ensure everything else is hidden
        document.getElementById('rowSections')?.classList.add('hidden');
        document.getElementById('contentArea')?.classList.add('hidden');

        // Clear children
        document.getElementById('sectionsBar').innerHTML = '';
        document.getElementById('questionsList').innerHTML = '';

        if (window.loadSubtopicsForTopic) {
            window.loadSubtopicsForTopic(topicId);
        }
    }

    window.loadTopicsForSubject = loadTopicsForSubject;
})();