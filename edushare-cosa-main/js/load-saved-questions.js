/* ===================================================== */
/* === LOAD ALL SAVED QUESTIONS FOR ACTIVE CONTEXT ==== */
/* ===================================================== */
(function () {
    // Helper to read the active tab texts
    const getActiveText = (selector) => {
        const el = document.querySelector(selector + '.active');
        return el ? el.textContent.trim() : '';
    };

    // Current Play/Act/Scene from active tabs
    function getContext() {
        const play  = getActiveText('.tab--play') || 'Unknown Play';
        const act   = (getActiveText('.tab--act')   || '').replace(/[^0-9]/g,'') || '1';
        const scene = (getActiveText('.tab--scene') || '').replace(/[^0-9]/g,'') || '1';
        return { play, act, scene };
    }

    // Build the LS key for the current context
    const keyFor = ({play, act, scene}) => `questions::${play}::A${act}::S${scene}`;

    // Ensure we have a dedicated container at the top of .q-list
    function ensureDynamicBucket(list) {
        let bucket = list.querySelector('#savedDynamic');
        if (!bucket) {
            bucket = document.createElement('div');
            bucket.id = 'savedDynamic';
            // Insert at the top so saved items appear above the sample questions
            list.prepend(bucket);
        }
        return bucket;
    }

    // Render all saved questions for current context into #savedDynamic
    function renderSavedQuestions() {
        const list = document.querySelector('.q-list');
        if (!list) return;

        const bucket = ensureDynamicBucket(list);
        const { play, act, scene } = getContext();
        const key = keyFor({ play, act, scene });

        let items = [];
        try { items = JSON.parse(localStorage.getItem(key) || '[]'); } catch {}
        // Sort newest first
        items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        // Track existing IDs in the bucket to avoid duplicates
        const existingIds = new Set(
            Array.from(bucket.querySelectorAll('[data-qid]')).map(el => el.getAttribute('data-qid'))
        );

        items.forEach(q => {
            if (!q || !q.id || existingIds.has(q.id)) return;

            const typeLabel = q.type === 'MCQ' ? 'M/C' : (q.type === 'TF' ? 'T/F' : 'S/A');
            const row = document.createElement('article');
            row.className = 'q-row';
            row.setAttribute('data-qid', q.id);
            row.innerHTML = `
        <label class="q-checkbox"><input type="checkbox"/><span class="box"></span></label>
        <div class="q-main">
          <div class="q-title">${(q.text || '').replace(/</g,'&lt;')}</div>
        </div>
        <div class="q-side">
          <div class="points">${typeLabel}</div>
          <div class="points">1 point</div>
          <div class="progress"><span class="pval">saved</span></div>
          <div class="icons">
            <button class="i check" title="Include">✓</button>
            <button class="i cross" title="Exclude">✕</button>
            <button class="i star"  title="Favorite">🏳️</button>
          </div>
          <button class="ai">AI ?</button>
        </div>
      `;
            bucket.appendChild(row);
        });
    }

    // Initial load
    document.addEventListener('DOMContentLoaded', renderSavedQuestions);

    // Re-render when user clicks any of the Play/Act/Scene rows (after .active toggles)
    ['rowPlays', 'rowActs', 'rowScenes'].forEach(id => {
        const row = document.getElementById(id);
        if (!row) return;
        row.addEventListener('click', (e) => {
            if (!e.target.closest('.tab')) return;
            setTimeout(renderSavedQuestions, 0);
        });
    });
})();
