/* ===================================================== */
/* ========= LOAD SUBTOPICS (ROW 2 - WAS ACTS) ======== */
/* ===================================================== */
/**
 * Loads subtopics from Subtopic table filtered by selected Topic
 * Example: If "Romeo & Juliet" is selected, shows "Act 1", "Act 2", etc.
 * 
 * UPDATED: Now uses RESTful API endpoints
 */
(function () {
    async function loadSubtopicsForTopic(topicId) {
        const bar = document.getElementById('subtopicsBar');
        if (!bar) return;

        bar.innerHTML = '<div style="color: #999; padding: 10px; text-align: center;">Loading subtopics...</div>';

        try {
            // NEW: Use RESTful endpoint
            const url = `http://localhost:3000/api/topics/${topicId}/subtopics`;
            console.log('📚 Fetching subtopics from:', url);

            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const subtopics = await response.json();
            console.log('✅ Received subtopics:', subtopics);

            if (subtopics.length === 0) {
                bar.innerHTML = '<div style="color: #999; padding: 10px; text-align: center;">No subtopics available</div>';
                return;
            }

            // Build subtopic tabs
            const html = subtopics.map((subtopic, index) => {
                // API returns subtopic_name (snake_case)
                const subtopicName = subtopic.subtopic_name || 'Untitled';
                const subtopicId = subtopic.subtopic_id;
                
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
                const activeSubtopicId = activeSubtopic.subtopic_id;
                
                // Show sections row
                const sectionsRow = document.getElementById('rowSections');
                if (sectionsRow) {
                    sectionsRow.classList.remove('hidden');
                }
                
                if (window.loadSectionsForSubtopic) {
                    window.loadSectionsForSubtopic(activeSubtopicId);
                }
            }

        } catch (error) {
            console.error('❌ Failed to load subtopics:', error);
            bar.innerHTML = `
                <div style="color: #c33; padding: 10px; text-align: center;">
                    Failed to load subtopics<br>
                    <small>Check console for details</small>
                </div>
            `;
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
        } catch (e) {
            console.warn('Could not save to sessionStorage:', e);
        }

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

    // Helper function to escape HTML (if not already defined)
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Make functions available globally
    window.loadSubtopicsForTopic = loadSubtopicsForTopic;
})();