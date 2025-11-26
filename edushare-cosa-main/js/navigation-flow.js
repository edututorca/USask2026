/* ===================================================== */
/* ============= NAVIGATION FLOW CONTROLLER =========== */
/* ===================================================== */
/**
 * Manages the progressive disclosure navigation:
 * Subject → Topic → SubTopic → Section → Questions
 * 
 * This replaces the old plays-flow.js
 */
(function () {
    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', initNavigationFlow);

    function initNavigationFlow() {
        // Initial state: all rows hidden except subjects (which auto-loads)
        hideRow('rowTopics');
        hideRow('rowSubtopics');
        hideRow('rowSections');
        hideRow('contentArea');

        // The flow is now handled by individual loader scripts:
        // 1. load-subjects.js shows subjects, user clicks one
        // 2. load-topics.js shows topics for that subject
        // 3. load-subtopics.js shows subtopics for that topic
        // 4. load-sections.js shows sections for that subtopic
        // 5. load-questions.js shows questions for that section
        
        // Each loader handles showing its own row and calling the next loader
    }

    function hideRow(id) {
        const row = document.getElementById(id);
        if (row) row.classList.add('hidden');
    }

    function showRow(id) {
        const row = document.getElementById(id);
        if (row) row.classList.remove('hidden');
    }

    // Make utility functions available globally
    window.hideRow = hideRow;
    window.showRow = showRow;
})();