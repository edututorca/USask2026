(function () {
    const BACK_URL = 'User-Area.html';

    // Read context from URL
    const params = new URLSearchParams(location.search);
    const play = params.get('play') || 'Unknown Play';
    const actFromUrl = params.get('act') || '1';
    const sceneFromUrl = params.get('scene') || '1';

    // Hierarchy IDs for return trip
    const subjectId = params.get('subjectId') || '';
    const topicId = params.get('topicId') || '';
    const subtopicId = params.get('subtopicId') || '';
    const sectionId = params.get('sectionId') || '';
    const courseCode = params.get('courseCode') || '';
    const courseCategory = params.get('courseCategory') || '';
    let newQuestionIds = [];

    function getReturnUrl() {
        const url = new URL(BACK_URL, window.location.href);
        if (subjectId) url.searchParams.set('subjectId', subjectId);
        if (topicId) url.searchParams.set('topicId', topicId);
        if (subtopicId) url.searchParams.set('subtopicId', subtopicId);
        if (sectionId) url.searchParams.set('sectionId', sectionId);
        if (courseCode) url.searchParams.set('courseCode', courseCode);
        if (courseCategory) url.searchParams.set('courseCategory', courseCategory);
        if (newQuestionIds.length > 0) url.searchParams.set('newQuestionIds', newQuestionIds.join(','));

        // Also keep the play/act/scene for legacy or reference
        url.searchParams.set('play', play);
        url.searchParams.set('act', actSelect.value);
        url.searchParams.set('scene', sceneSelect.value);

        console.log('[ai-question-creator] Generated return URL:', url.toString());
        return url.toString();
    }

    // Elements
    const ctxEl = document.getElementById('aiContextInfo');
    const btnBack = document.getElementById('btnBack');
    const actSelect = document.getElementById('actSelect');
    const sceneSelect = document.getElementById('sceneSelect');
    const qCount = document.getElementById('qCount');

    const btnGenerate = document.getElementById('btnGenerate');
    const btnClear = document.getElementById('btnClear');
    const btnSaveSelected = document.getElementById('btnSaveSelected');

    const resultsList = document.getElementById('resultsList');
    const resultsMeta = document.getElementById('resultsMeta');
    const aiForm = document.getElementById('aiForm');

    // Init UI with URL context
    ctxEl.textContent = `Play: ${play}`;
    actSelect.value = actFromUrl;
    sceneSelect.value = sceneFromUrl;

    btnBack.addEventListener('click', () => {
        window.location.href = getReturnUrl();
    });

    // Toggle quantity inputs based on checkbox
    aiForm.addEventListener('change', (e) => {
        if (e.target.name === 'types') {
            const checkbox = e.target;
            const row = checkbox.closest('.aiqb__type-row');
            const input = row.querySelector('.aiqb__count-input');
            if (input) {
                input.disabled = !checkbox.checked;
                if (!input.disabled) {
                    input.focus(); // Optional: focus when enabled
                } else {
                    input.value = '0'; // Reset to 0 when disabled
                }
            }
        }
    });

    // Generated items (in memory)
    let generated = [];
    let questionBank = null;

    async function fetchBank() {
        try {
            btnGenerate.disabled = true;
            btnGenerate.textContent = 'Loading Bank...';
            questionBank = await apiRequest('/questions/mock');
            console.log('AI Question Bank loaded:', questionBank);
            btnGenerate.disabled = false;
            btnGenerate.textContent = 'Generate Questions';
        } catch (e) {
            console.error('Failed to load AI bank:', e);
            btnGenerate.textContent = 'Bank Load Failed';
        }
    }
    fetchBank();

    function getSelectedConfig() {
        const rows = Array.from(aiForm.querySelectorAll('.aiqb__type-row'));
        const config = [];

        rows.forEach(row => {
            const checkbox = row.querySelector('input[name="types"]');
            const countInput = row.querySelector('.aiqb__count-input');

            if (checkbox && checkbox.checked) {
                let count = parseInt(countInput.value, 10);
                if (!count || count < 1) return; // Skip if count is 0 or invalid
                config.push({ type: checkbox.value, count });
            }
        });
        return config;
    }

    function uid() {
        return Math.random().toString(36).slice(2, 10);
    }

    // MOCK generator (now uses fetched bank)
    function mockGenerate(config, act, scene) {
        if (!questionBank) {
            alert('Question bank is still loading. Please wait a moment.');
            return [];
        }

        const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
        const out = [];

        config.forEach(item => {
            const { type, count } = item;

            for (let i = 0; i < count; i++) {
                if (type === 'MCQ') {
                    const qData = pick(questionBank.MCQ);
                    out.push({
                        id: uid(),
                        type,
                        text: qData.text,
                        options: qData.options,
                        act, scene,
                        keep: false,
                        createdAt: Date.now()
                    });
                } else if (type === 'TF') {
                    const qText = pick(questionBank.TF);
                    out.push({
                        id: uid(),
                        type,
                        text: qText,
                        options: [
                            { text: "True", correct: true },
                            { text: "False", correct: false }
                        ],
                        act, scene,
                        keep: false,
                        createdAt: Date.now()
                    });
                } else {
                    const typeKey = type === 'LA' ? 'LA' : 'SA';
                    const qText = pick(questionBank[typeKey] || ["Write a question about this scene."]);
                    out.push({
                        id: uid(),
                        type,
                        text: qText,
                        options: [],
                        act, scene,
                        keep: false,
                        createdAt: Date.now()
                    });
                }
            }
        });
        return out;
    }

    function render() {
        resultsList.innerHTML = '';

        if (!generated.length) {
            resultsMeta.textContent = 'Nothing generated yet.';
            btnSaveSelected.disabled = true;
            return;
        }

        const keptCount = generated.filter(x => x.keep).length;
        resultsMeta.textContent = `${generated.length} generated • ${keptCount} selected`;
        btnSaveSelected.disabled = keptCount === 0;

        generated.forEach((q) => {
            const card = document.createElement('div');
            card.className = 'aiqb__card';

            const optionsInfo = (q.type === 'MCQ')
                ? `${q.options.length} options`
                : (q.type === 'TF')
                    ? 'True/False'
                    : 'Free response';

            card.innerHTML = ''; // Clear for logic

            if (q.editing) {
                // EDIT MODE
                let optionsHtml = '';
                if (q.type === 'MCQ' || q.type === 'TF') {
                    optionsHtml = `<div class="aiqb__edit-options">`;
                    q.options.forEach((opt, idx) => {
                        const correctCheck = opt.correct ? 'checked' : '';
                        optionsHtml += `
                            <div class="aiqb__edit-option-row">
                                <input type="radio" name="correct-${q.id}" ${correctCheck} class="aiqb__radio-correct" data-idx="${idx}" title="Mark as correct">
                                <input type="text" class="aiqb__input aiqb__input--sm" value="${escapeHtml(opt.text)}" data-idx="${idx}" placeholder="Option text">
                            </div>
                        `;
                    });
                    optionsHtml += `</div>`;
                }

                card.innerHTML = `
                    <div class="aiqb__edit-box">
                        <div class="aiqb__field">
                            <label class="aiqb__label-sm">Question Text</label>
                            <input type="text" class="aiqb__input" id="edit-text-${q.id}" value="${escapeHtml(q.text)}">
                        </div>
                        ${optionsHtml}
                        <div class="aiqb__edit-actions">
                            <button type="button" class="aiqb__btn-save" data-action="save" data-id="${q.id}">Save</button>
                            <button type="button" class="aiqb__btn-cancel" data-action="cancel" data-id="${q.id}">Cancel</button>
                        </div>
                    </div>
                `;

            } else {
                // VIEW MODE (Current)
                // Build tooltip content if MCQ/TF
                let tooltipHtml = '';
                if (q.options && q.options.length > 0) {
                    const listItems = q.options.map(opt => {
                        const style = opt.correct ? 'color:#15803d; font-weight:800;' : 'color:#475569;';
                        const icon = opt.correct ? '✅ ' : '• ';
                        return `<li style="${style}">${icon}${escapeHtml(opt.text)}</li>`;
                    }).join('');
                    tooltipHtml = `<div class="aiqb__tooltip"><ul>${listItems}</ul></div>`;
                }

                card.innerHTML = `
                    <div class="aiqb__card-row">
                      <div class="aiqb__card-left">
                        <span class="aiqb__chip aiqb__chip--type">${q.type}</span>
                        <span class="aiqb__qtext-inline">${escapeHtml(q.text)}</span>
                      </div>

                      <div class="aiqb__card-right">
                        <div class="aiqb__meta-wrapper">
                            <span class="aiqb__meta-inline">${optionsInfo}</span>
                            ${tooltipHtml}
                        </div>
                        
                        <div class="aiqb__actions-inline">
                            <label class="aiqb__keep" title="Keep this question (it will be saved)">
                            <input type="checkbox" ${q.keep ? 'checked' : ''} data-action="keep" data-id="${q.id}"/>
                            Keep
                            </label>
                            <button type="button" class="aiqb__edit" data-action="edit" data-id="${q.id}" title="Edit this question">
                            Edit
                            </button>
                            <button type="button" class="aiqb__delete" data-action="delete" data-id="${q.id}" title="Remove this question">
                            Delete
                            </button>
                        </div>
                      </div>
                    </div>
                  `;
            }

            resultsList.appendChild(card);
        });
    }

    resultsList.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;

        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');
        const item = generated.find(x => x.id === id);

        if (!item) return;

        if (action === 'delete') {
            generated = generated.filter(x => x.id !== id);
            render();
        } else if (action === 'edit') {
            item.editing = true;
            render();
        } else if (action === 'cancel') {
            item.editing = false;
            render();
        } else if (action === 'save') {
            // Save logic
            const card = btn.closest('.aiqb__card');
            const textInput = card.querySelector(`#edit-text-${id}`);
            if (textInput) item.text = textInput.value;

            // Save options if they exist
            const optionRows = card.querySelectorAll('.aiqb__edit-option-row');
            if (optionRows.length > 0 && item.options) {
                optionRows.forEach((row, idx) => {
                    const txt = row.querySelector('input[type="text"]').value;
                    const isCorrect = row.querySelector('input[type="radio"]').checked;
                    if (item.options[idx]) {
                        item.options[idx].text = txt;
                        item.options[idx].correct = isCorrect;
                    }
                });
            }

            item.editing = false;
            render();
        }
    });

    resultsList.addEventListener('change', (e) => {
        const el = e.target;
        if (!el.matches('input[data-action="keep"]')) return;

        const id = el.getAttribute('data-id');
        const item = generated.find(x => x.id === id);
        if (item) item.keep = el.checked;
        render();
    });

    btnGenerate.addEventListener('click', () => {
        const config = getSelectedConfig();
        if (!config.length) { alert('Select at least one question type.'); return; }

        const act = actSelect.value;
        const scene = sceneSelect.value;

        // Generate (mock for now)
        generated = mockGenerate(config, act, scene);
        render();
    });

    btnClear.addEventListener('click', () => {
        generated = [];
        render();
    });

    btnSaveSelected.addEventListener('click', async () => {
        const kept = generated.filter(x => x.keep);
        if (!kept.length) { alert('Select at least one question to save.'); return; }

        const act = actSelect.value;
        const scene = sceneSelect.value;
        const sectionId = sessionStorage.getItem('currentSectionId');

        btnSaveSelected.disabled = true;
        btnSaveSelected.textContent = 'Saving...';

        try {
            // Save each question to the database
            for (const q of kept) {
                const res = await apiRequest(API_CONFIG.ENDPOINTS.QUESTIONS, {
                    method: 'POST',
                    body: JSON.stringify({
                        text: q.text,
                        type: q.type === 'TF' ? 'True/False' : (q.type === 'MCQ' ? 'Multiple Choice' : 'Short Answer'),
                        sectionId: sectionId,
                        difficulty: 1,
                        options: q.options
                    })
                });
                if (res && res.questionId) {
                    newQuestionIds.push(res.questionId);
                }
            }

            alert(`Saved ${kept.length} question(s) to database.`);
            window.location.href = getReturnUrl();
        } catch (e) {
            alert('Failed to save some questions.');
            console.error(e);
        } finally {
            btnSaveSelected.disabled = false;
            btnSaveSelected.textContent = 'Save Selected';
        }
    });

    // Helpers
    function escapeHtml(str) {
        return String(str)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    // Initial render
    render();
})();
