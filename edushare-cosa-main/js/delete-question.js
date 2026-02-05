/* ===================================================== */
/* ============== DELETE (X) QUESTION HANDLER =========== */
/* ===================================================== */
(function () {
    const list = document.querySelector('.q-list');
    if (!list) return;

    // Helpers to read the current Play/Act/Scene from active tabs
    const getActiveText = sel => (document.querySelector(sel + '.active')?.textContent.trim()) || '';
    function getContext() {
        const play  = getActiveText('.tab--play') || 'Unknown Play';
        const act   = (getActiveText('.tab--act')   || '1').replace(/[^0-9]/g,'') || '1';
        const scene = (getActiveText('.tab--scene') || '1').replace(/[^0-9]/g,'') || '1';
        return { play, act, scene };
    }

    // Clicks inside the question list
    list.addEventListener('click', (e) => {
        const btn = e.target.closest('.i.cross');         // only handle the X button
        if (!btn) return;

        const row = btn.closest('.q-row');
        if (!row) return;

        // Ask for confirmation
        if (!confirm('Delete this question?')) return;

        // Remove from localStorage if it exists there
        const { play, act, scene } = getContext();
        const key = `questions::${play}::A${act}::S${scene}`;

        let items = [];
        try { items = JSON.parse(localStorage.getItem(key) || '[]'); } catch {}

        const qid = row.dataset.qid;                      // present for items added from our creator
        const titleEl = row.querySelector('.q-title');
        if (qid) {
            items = items.filter(q => q.id !== qid);
        } else if (titleEl) {
            // Fallback: match by text (useful for hard-coded seed items)
            const txt = titleEl.textContent.trim();
            const i = items.findIndex(q => (q.text || '').trim() === txt);
            if (i > -1) items.splice(i, 1);
        }
        localStorage.setItem(key, JSON.stringify(items));

        // Remove from DOM
        row.remove();
    });
})();
