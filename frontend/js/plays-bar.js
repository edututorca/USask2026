/* ===================================================== */
/* ============== RENDER PLAYS BAR (DYNAMIC) =========== */
/* ===================================================== */
/**
 * Renders the Plays bar in #playsBar.
 * Default plays + any custom plays from localStorage, then the ＋ link.
 * Restores the last selected Play from sessionStorage ('ctx:last'), if available.
 * Adds compact layout when many tabs exist.
 */
(function () {
    const DEFAULT_PLAYS = [
        'Romeo & Juliet',
        'Julius Caesar',
        'Macbeth',
        'The Crucible'
    ];

    function getCustomPlays() {
        try { return JSON.parse(localStorage.getItem('customPlays') || '[]'); }
        catch { return []; }
    }

    function makePlayTab(label, isActive = false) {
        const btn = document.createElement('button');
        btn.className = 'tab tab--play' + (isActive ? ' active' : '');
        btn.textContent = label;
        return btn;
    }

    function makeAddLink() {
        const a = document.createElement('a');
        a.className = 'tab tab--add';
        a.title = 'Add';
        a.textContent = '＋';

        const url = new URL('add-play.html', window.location.href);
        url.searchParams.set('from', window.location.href);
        a.href = url.toString();

        sessionStorage.setItem('lastPage', window.location.href);
        return a;
    }

    function applyCompaction(barEl) {
        const count = barEl.querySelectorAll('.tab--play').length;
        if (count >= 6) barEl.classList.add('compact');
        else barEl.classList.remove('compact');
    }

    function renderPlays() {
        const bar = document.getElementById('playsBar');
        if (!bar) return;
        bar.innerHTML = '';

        // Read last context (if any) to know which Play to activate
        let last = null;
        try { last = JSON.parse(sessionStorage.getItem('ctx:last') || 'null'); } catch {}

        // Track if we found a matching Play to activate
        let activated = false;

        // Render default plays
        DEFAULT_PLAYS.forEach((title, idx) => {
            const isActive = last ? (title === last.play) : (idx === 0);
            if (isActive) activated = true;
            bar.appendChild(makePlayTab(title, isActive));
        });

        // Render custom plays (may also be the last selected Play)
        const customs = getCustomPlays();
        customs.forEach(p => {
            if (!p || !p.title) return;
            const isActive = last ? (p.title === last.play) : false;
            if (isActive) activated = true;
            bar.appendChild(makePlayTab(p.title, isActive));
        });

        // If nothing matched 'last.play', ensure at least the very first tab is active
        if (!activated) {
            const first = bar.querySelector('.tab--play');
            if (first) first.classList.add('active');
        }

        bar.appendChild(makeAddLink());
        applyCompaction(bar);
    }

    document.addEventListener('DOMContentLoaded', renderPlays);
})();
