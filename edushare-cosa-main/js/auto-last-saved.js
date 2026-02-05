/* ===================================================== */
/* ====== AUTO-LOAD NEWLY SAVED QUESTIONS (from LS) ===== */
/* ===================================================== */
(function () {
    // If a new question was just saved on question-creator.html
    const last = sessionStorage.getItem('qc:lastSaved');
    if (!last) return;

    const { play, act, scene } = JSON.parse(last);
    const STORAGE_KEY = `questions::${play}::A${act}::S${scene}`;

    try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        if (!data.length) return;
        const latest = data[data.length - 1]; // last is the one we just saved

        const list = document.querySelector('.q-list');
        if (!list) return;

        const row = document.createElement('article');
        row.className = 'q-row';
        // IMPORTANT: persist the id so the delete handler can remove from LS
        row.dataset.qid = latest.id;

        row.innerHTML = `
        <label class="q-checkbox"><input type="checkbox"/><span class="box"></span></label>
        <div class="q-main">
          <div class="q-title">${latest.text}</div>
        </div>
        <div class="q-side">
          <div class="points">${latest.type}</div>
          <div class="points">1 point</div>
          <div class="progress">
            <span class="bar" style="width:50%"></span>
            <span class="pval">saved</span>
          </div>
          <div class="icons">
            <button class="i check" title="Include">✓</button>
            <button class="i cross" title="Delete">✕</button>
            <button class="i star"  title="Favorite">🏳️</button>
          </div>
          <button class="ai">AI ?</button>
        </div>
      `;

        // Put it at the top of the list
        list.insertBefore(row, list.firstChild);

        // Clear the marker so it won't repeat
        sessionStorage.removeItem('qc:lastSaved');
    } catch (err) {
        console.error('Failed to load new question:', err);
    }
})();
