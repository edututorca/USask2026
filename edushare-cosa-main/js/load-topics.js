/* ===================================================== */
/* ============ LOAD TOPICS (ROW 1 - WAS PLAYS) ======= */
/* ===================================================== */
/**
 * Loads topics from Topic table filtered by selected Subject
 * Example: If "Plays" is selected, shows "Romeo & Juliet", "Macbeth", etc.
 * 
 * UPDATED: Now uses RESTful API endpoints
 */
(function () {
    async function loadTopicsForSubject(subjectId) {
        const bar = document.getElementById('topicsBar');
        if (!bar) return;

        bar.innerHTML = '<div style="color: #999; padding: 10px; text-align: center;">Loading topics...</div>';

        try {
            // NEW: Use RESTful endpoint
            const url = `http://localhost:3000/api/subjects/${subjectId}/topics`;
            console.log('📚 Fetching topics from:', url);

            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const topics = await response.json();
            console.log('✅ Received topics:', topics);

            if (topics.length === 0) {
                bar.innerHTML = '<div style="color: #999; padding: 10px; text-align: center;">No topics available</div>';
                return;
            }

            // Build topic tabs
            const html = topics.map((topic, index) => {
                // API returns topic_name (snake_case)
                const topicName = topic.topic_name || 'Untitled';
                const topicId = topic.topic_id;
                
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
                const firstTopicId = firstTopic.topic_id;
                
                // Show subtopics row
                const subtopicsRow = document.getElementById('rowSubtopics');
                if (subtopicsRow) {
                    subtopicsRow.classList.remove('hidden');
                }
                
                if (window.loadSubtopicsForTopic) {
                    window.loadSubtopicsForTopic(firstTopicId);
                }
            }

        } catch (error) {
            console.error('❌ Failed to load topics:', error);
            bar.innerHTML = `
                <div style="color: #c33; padding: 10px; text-align: center;">
                    Failed to load topics<br>
                    <small>Check console for details</small>
                </div>
            `;
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
        } catch (e) {
            console.warn('Could not save to sessionStorage:', e);
        }

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

    // Helper function to escape HTML (if not already defined)
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Make functions available globally
    window.loadTopicsForSubject = loadTopicsForSubject;
})();