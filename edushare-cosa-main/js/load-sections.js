/* ===================================================== */
/* ======== LOAD SECTIONS (ROW 3 - WAS SCENES) ======== */
/* ===================================================== */
/**
 * Loads sections from Section table filtered by selected Subtopic
 * Example: If "Act 3" is selected, shows "Scene 1", "Scene 2", etc.
 * 
 * NEW FILE: Uses RESTful API endpoints
 */
(function () {
    async function loadSectionsForSubtopic(subtopicId) {
        const bar = document.getElementById('sectionsBar');
        if (!bar) return;

        bar.innerHTML = '<div style="color: #999; padding: 10px; text-align: center;">Loading sections...</div>';

        try {
            // Use RESTful endpoint
            const url = `http://localhost:3000/api/subtopics/${subtopicId}/sections`;
            console.log('📚 Fetching sections from:', url);

            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const sections = await response.json();
            console.log('✅ Received sections:', sections);

            if (sections.length === 0) {
                bar.innerHTML = '<div style="color: #999; padding: 10px; text-align: center;">No sections available</div>';
                return;
            }

            // Build section tabs
            const html = sections.map((section, index) => {
                // API returns section_name (snake_case)
                const sectionName = section.section_name || 'Untitled';
                const sectionId = section.section_id;
                
                // Fourth one active by default (to match your old Scene 4 default)
                const activeClass = index === 3 ? ' active' : '';

                return `
                    <button 
                        class="tab tab--section${activeClass}"
                        data-section-id="${sectionId}"
                        data-section-name="${escapeHtml(sectionName)}">
                        ${escapeHtml(sectionName)}
                    </button>
                `;
            }).join('');

            bar.innerHTML = html;

            // Add click handlers
            bar.querySelectorAll('.tab--section').forEach(btn => {
                btn.addEventListener('click', handleSectionClick);
            });

            // Auto-load questions for the active (4th) section, or first if less than 4
            const activeIndex = sections.length >= 4 ? 3 : 0;
            if (sections[activeIndex]) {
                const activeSection = sections[activeIndex];
                const activeSectionId = activeSection.section_id;
                
                // Show content area
                const contentArea = document.getElementById('contentArea');
                if (contentArea) {
                    contentArea.classList.remove('hidden');
                }
                
                // Load questions for this section
                if (window.loadQuestionsForSection) {
                    window.loadQuestionsForSection(activeSectionId);
                }
            }

        } catch (error) {
            console.error('❌ Failed to load sections:', error);
            bar.innerHTML = `
                <div style="color: #c33; padding: 10px; text-align: center;">
                    Failed to load sections<br>
                    <small>Check console for details</small>
                </div>
            `;
        }
    }

    /**
     * Handle section button click
     */
    function handleSectionClick(e) {
        const btn = e.currentTarget;
        const sectionId = btn.dataset.sectionId;

        // Update active state
        document.querySelectorAll('.tab--section').forEach(b => {
            b.classList.remove('active');
        });
        btn.classList.add('active');

        // Save current section to session
        try {
            sessionStorage.setItem('currentSectionId', sectionId);
            sessionStorage.setItem('currentSectionName', btn.dataset.sectionName);
        } catch (e) {
            console.warn('Could not save to sessionStorage:', e);
        }

        // Show content area
        const contentArea = document.getElementById('contentArea');
        if (contentArea) {
            contentArea.classList.remove('hidden');
        }

        // Load questions for this section
        if (window.loadQuestionsForSection) {
            window.loadQuestionsForSection(sectionId);
        } else {
            console.warn('loadQuestionsForSection function not found');
        }
    }

    // Helper function to escape HTML (if not already defined)
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Make functions available globally
    window.loadSectionsForSubtopic = loadSectionsForSubtopic;
})();