/* ===================================================== */
/* ================= SEARCH / FILTER ==================== */
/* ===================================================== */
(function () {
    // --- Elements
    const input = document.getElementById('searchInput');
    const btn   = document.getElementById('btnSearch');
    const list  = document.querySelector('.q-list');
    if (!input || !btn || !list) return;

    // --- Helpers
    const norm = (s) => (s || '')
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // remove accents

    function filterQuestions(q) {
        const needle = norm(q);
        const rows = list.querySelectorAll('.q-row');

        rows.forEach(row => {
            // Search in the visible title text + quick tags (e.g., M/C, S/A, T/F)
            const title = row.querySelector('.q-title')?.textContent || '';
            const tags  = Array.from(row.querySelectorAll('.q-side .points'))
                .map(el => el.textContent).join(' ');
            const hay = norm(title + ' ' + tags);

            const show = !needle || hay.includes(needle);
            row.style.display = show ? '' : 'none';
        });

        // Persist current query so it sticks on reload
        try { sessionStorage.setItem('search:q', q); } catch {}
    }

    // --- Debounce for "type to filter"
    let t = null;
    function debouncedFilter() {
        clearTimeout(t);
        t = setTimeout(() => filterQuestions(input.value.trim()), 120);
    }

    // --- Wire events
    input.addEventListener('input', debouncedFilter);

    // Enter to search; Esc to clear
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            filterQuestions(input.value.trim());
        } else if (e.key === 'Escape') {
            input.value = '';
            filterQuestions('');
        }
    });

    // Magnifier click → apply current text
    btn.addEventListener('click', () => filterQuestions(input.value.trim()));

    // Restore previous search (if any)
    try {
        const saved = sessionStorage.getItem('search:q') || '';
        if (saved) {
            input.value = saved;
            filterQuestions(saved);
        }
    } catch {}

    // Re-apply filter whenever questions are added/removed dynamically
    const mo = new MutationObserver(() => {
        filterQuestions(input.value.trim());
    });
    mo.observe(list, { childList: true, subtree: false });
})();
