/* ===================================================== */
/* == INJECT THE QUESTION SAVED ON THE CREATOR PAGE ==== */
/* ===================================================== */
/**
 * If the Question Creator just saved a question, it places a copy in
 * sessionStorage under "NEW_QUESTION". Read it, check context, and prepend
 * the new item to the current list immediately (no page refresh required).
 */
(function () {
    const raw = sessionStorage.getItem('NEW_QUESTION');
    if (!raw) return;

    let payload;
    try { payload = JSON.parse(raw); } catch { payload = null; }
    if (!payload || !payload.item) { sessionStorage.removeItem('NEW_QUESTION'); return; }

    // Read active tab context to ensure we only inject when tabs match
    const activeText = sel => (document.querySelector(sel + '.active') || {}).textContent || '';
    const actNum   = (activeText('.tab--act')   || '').replace(/[^0-9]/g,'') || '1';
    const sceneNum = (activeText('.tab--scene') || '').replace(/[^0-9]/g,'') || '1';
    const playName = (activeText('.tab--play') || '').trim();

    const sameCtx =
        (!playName || playName === payload.play) &&
        actNum   === String(payload.act) &&
        sceneNum === String(payload.scene);

    if (!sameCtx) { sessionStorage.removeItem('NEW_QUESTION'); return; }

    const list = document.querySelector('.q-list');
    if (!list) { sessionStorage.removeItem('NEW_QUESTION'); return; }

    // Build a lightweight row visually consistent with the list
    const el = document.createElement('article');
    el.className = 'q-row';
    const typeLabel = payload.item.type === 'MCQ' ? 'M/C' : (payload.item.type === 'TF' ? 'T/F' : 'S/A');
    el.innerHTML = `
    <label class="q-checkbox"><input type="checkbox"/><span class="box"></span></label>
    <div class="q-main">
      <div class="q-title">${(payload.item.text || '').replace(/</g,'&lt;')}</div>
    </div>
    <div class="q-side">
      <div class="points">${typeLabel}</div>
      <div class="points">1 point</div>
      <div class="progress"><span class="pval">new</span></div>
      <div class="icons">
        <button class="i check" title="Include">✓</button>
        <button class="i cross" title="Exclude">✕</button>
        <button class="i star"  title="Favorite">🏳️</button>
      </div>
      <button class="ai">AI ?</button>
    </div>
  `;
    list.prepend(el);

    // Clear so we don't duplicate on refresh
    sessionStorage.removeItem('NEW_QUESTION');
})();
