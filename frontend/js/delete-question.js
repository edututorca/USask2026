/* ===================================================== */
/* ============== DELETE (X) QUESTION HANDLER =========== */
/* ===================================================== */
/**
 * Soft-delete (hide) handler.
 * Adds the question ID to localStorage['hiddenQuestionIds'] so it won't be rendered,
 * but remains in the database.
 */
(function () {
    const list = document.getElementById('questionsList');
    if (!list) return;

    list.addEventListener('click', (e) => {
        const btn = e.target.closest('.i.cross');         // handle the X button
        if (!btn) return;

        const row = btn.closest('.q-row');
        if (!row) return;

        const qid = row.dataset.questionId;
        if (!qid) return;

        // Ask for confirmation
        if (!confirm('Hide this question? It will remain in the database but won\'t be shown here.')) return;

        // Add to hidden list in localStorage
        let hiddenIds = [];
        try {
            hiddenIds = JSON.parse(localStorage.getItem('hiddenQuestionIds') || '[]');
        } catch (err) {
            console.warn('Failed to parse hiddenIds:', err);
        }

        if (!hiddenIds.includes(String(qid))) {
            hiddenIds.push(String(qid));
            localStorage.setItem('hiddenQuestionIds', JSON.stringify(hiddenIds));
        }

        // Remove from DOM immediately
        row.remove();
    });
})();
