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