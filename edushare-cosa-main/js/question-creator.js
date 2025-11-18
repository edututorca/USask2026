    (function () {
    // -------- Fixed return target (Cancel and Save go here)
    const BACK_URL = 'User-Area.html';

    // -------- Context (play/act/scene) - still shown for clarity
    const params = new URLSearchParams(location.search);
    const play  = params.get('play')  || 'Unknown Play';
    const act   = params.get('act')   || '1';
    const scene = params.get('scene') || '1';
    const STORAGE_KEY = `questions::${play}::A${act}::S${scene}`;

    const ctxEl = document.getElementById('contextInfo');
    ctxEl.textContent = `Play: ${play} • Act: ${act} • Scene: ${scene}`;

    // -------- Shared navigation (Cancel)
    const goBack = () => { window.location.href = BACK_URL; };
    document.getElementById('btnCancel').addEventListener('click', goBack);

    // -------- Elements
    const form        = document.getElementById('questionForm');
    const qText       = document.getElementById('qText');
    const qStandard   = document.getElementById('qStandard');
    const choicesList = document.getElementById('choicesList');
    const btnAdd      = document.getElementById('btnAddChoice');

    const mcqPanel = document.getElementById('mcqPanel');
    const tfPanel  = document.getElementById('tfPanel');
    const saPanel  = document.getElementById('saPanel');

    // -------- Answer-type toggling
    const currentType = () => (form.querySelector('input[name="qType"]:checked') || {}).value || 'MCQ';
    function toggleBlocks() {
    const t = currentType();
    mcqPanel.classList.toggle('hidden', t !== 'MCQ');
    tfPanel .classList.toggle('hidden', t !== 'TF');
    saPanel .classList.toggle('hidden', t !== 'SA');
}
    form.querySelectorAll('input[name="qType"]').forEach(r => r.addEventListener('change', toggleBlocks));
    toggleBlocks();

    // -------- Add one MCQ option row
    function addOptionRow(placeholderText) {
    const count = choicesList.children.length + 1;
    const row = document.createElement('div');
    row.className = 'qb__choice';
    row.innerHTML = `
        <input type="radio" name="correct" class="qb__correct" title="Correct?"/>
        <input type="text" class="qb__choice-text" placeholder="${placeholderText || ('Option ' + count)}"/>
        <button type="button" class="qb__remove" title="Remove">×</button>
      `;
    // Remove handler (keep at least one option)
    row.querySelector('.qb__remove').addEventListener('click', () => {
    if (choicesList.children.length > 1) row.remove();
});
    choicesList.appendChild(row);
}

    // Wire the first row's remove rule
    (function wireFirstRow() {
    const firstRow = choicesList.querySelector('.qb__choice');
    if (!firstRow) addOptionRow('Option 1');
    else {
    firstRow.querySelector('.qb__remove').addEventListener('click', () => {
    if (choicesList.children.length > 1) firstRow.remove();
});
}
})();

    // Add option button
    btnAdd.addEventListener('click', () => addOptionRow());

    // -------- Save Question
    form.addEventListener('submit', (e) => {
    e.preventDefault();

    const text = (qText.value || '').trim();
    if (!text) { alert('Please enter a question.'); return; }

    const type = currentType();
    const payload = {
    id: Math.random().toString(36).slice(2, 10),
    text,
    standard: qStandard.value || '',
    type,
    options: [],
    createdAt: Date.now()
};

    if (type === 'MCQ') {
    const rows = Array.from(choicesList.querySelectorAll('.qb__choice'));
    const options = rows.map(r => ({
    text: (r.querySelector('.qb__choice-text').value || '').trim(),
    correct: r.querySelector('.qb__correct').checked
})).filter(o => o.text.length);

    if (options.length < 2)  { alert('Add at least two options.'); return; }
    if (!options.some(o => o.correct)) { alert('Mark one option as correct.'); return; }

    payload.options = options;
} else if (type === 'TF') {
    const tfVal = (form.querySelector('input[name="tfCorrect"]:checked') || {}).value || 'True';
    payload.options = [
{ text: 'True',  correct: tfVal === 'True'  },
{ text: 'False', correct: tfVal === 'False' }
    ];
} // S/A stores no options

    // 1) Persist to localStorage under the scene key
    let all = [];
    try { all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch {}
    all.push(payload);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

    // 2) Also put a copy in sessionStorage so the list page can inject immediately
    sessionStorage.setItem('NEW_QUESTION', JSON.stringify({
    key: STORAGE_KEY, play, act, scene, item: payload
}));

    // 3) Navigate back to the list page
    goBack();


});
})();

