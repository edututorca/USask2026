(function () {
    const BACK_URL = 'User-Area.html';

    // Read context from URL
    const params = new URLSearchParams(location.search);
    const play = params.get('play') || 'Unknown Play';
    const actFromUrl = params.get('act') || '1';
    const sceneFromUrl = params.get('scene') || '1';

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
        window.location.href = `${BACK_URL}?play=${encodeURIComponent(play)}&act=${encodeURIComponent(actSelect.value)}&scene=${encodeURIComponent(sceneSelect.value)}`;
    });

    // Generated items (in memory)
    let generated = [];

    function selectedTypes() {
        return Array.from(aiForm.querySelectorAll('input[name="types"]:checked')).map(x => x.value);
    }

    function storageKeyFor(act, scene) {
        return `questions::${play}::A${act}::S${scene}`;
    }

    function uid() {
        return Math.random().toString(36).slice(2, 10);
    }

    // MOCK generator (replace later with real AI)
    function mockGenerate(types, count, act, scene) {
        const bank = {
            MCQ: [
                "What does the character reveal about their motivation in this scene?",
                "Which line best shows a conflict between two characters?",
                "What is the main purpose of this dialogue?"
            ],
            TF: [
                "This scene introduces a new conflict.",
                "A character changes their mind during this scene.",
                "The tone of the scene is mostly humorous."
            ],
            SA: [
                "Explain the mood of this scene in one or two sentences.",
                "Describe a key decision made by a character here.",
                "What is one theme that appears in this scene?"
            ],
            LA: [
                "Analyze how the dialogue builds tension in this scene. Provide evidence.",
                "Discuss how this scene contributes to the overall plot development.",
                "Explain how a character’s actions here reflect their personality and goals."
            ]
        };

        const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
        const out = [];

        for (let i = 0; i < count; i++) {
            const type = types[i % types.length];
            const qText = pick(bank[type] || ["Write a question about this scene."]);

            if (type === 'MCQ') {
                out.push({
                    id: uid(),
                    type,
                    text: qText,
                    options: [
                        { text: "It develops the main conflict.", correct: true },
                        { text: "It describes the setting only.", correct: false },
                        { text: "It introduces a new character.", correct: false },
                        { text: "It resolves the story completely.", correct: false }
                    ],
                    act, scene,
                    keep: true,
                    createdAt: Date.now()
                });
            } else if (type === 'TF') {
                out.push({
                    id: uid(),
                    type,
                    text: qText,
                    options: [
                        { text: "True", correct: true },
                        { text: "False", correct: false }
                    ],
                    act, scene,
                    keep: true,
                    createdAt: Date.now()
                });
            } else {
                // SA/LA no options
                out.push({
                    id: uid(),
                    type,
                    text: qText,
                    options: [],
                    act, scene,
                    keep: true,
                    createdAt: Date.now()
                });
            }
        }
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

            card.innerHTML = `
        <div class="aiqb__card-top">
          <div>
            <span class="aiqb__chip">${q.type}</span>
            <span class="aiqb__chip">Act ${q.act}</span>
            <span class="aiqb__chip">Scene ${q.scene}</span>
            <p class="aiqb__qtext">${escapeHtml(q.text)}</p>
            <div class="aiqb__meta">${optionsInfo}</div>
          </div>

          <div class="aiqb__card-actions">
            <label class="aiqb__keep" title="Keep this question (it will be saved)">
              <input type="checkbox" ${q.keep ? 'checked' : ''} data-action="keep" data-id="${q.id}"/>
              Keep
            </label>
            <button type="button" class="aiqb__delete" data-action="delete" data-id="${q.id}" title="Remove this question">
              Delete
            </button>
          </div>
        </div>
      `;

            resultsList.appendChild(card);
        });
    }

    resultsList.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;

        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');

        if (action === 'delete') {
            generated = generated.filter(x => x.id !== id);
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
        const types = selectedTypes();
        if (!types.length) { alert('Select at least one question type.'); return; }

        const count = parseInt(qCount.value, 10);
        if (!count || count < 1) { alert('Enter a valid number of questions.'); return; }
        if (count > 20) { alert('Max 20 questions for now.'); return; }

        const act = actSelect.value;
        const scene = sceneSelect.value;

        // Generate (mock for now)
        generated = mockGenerate(types, count, act, scene);
        render();
    });

    btnClear.addEventListener('click', () => {
        generated = [];
        render();
    });

    btnSaveSelected.addEventListener('click', () => {
        const kept = generated.filter(x => x.keep);
        if (!kept.length) { alert('Select at least one question to save.'); return; }

        const act = actSelect.value;
        const scene = sceneSelect.value;
        const STORAGE_KEY = storageKeyFor(act, scene);

        // Load existing
        let all = [];
        try { all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch {}

        // Convert to your existing question format
        const toSave = kept.map(q => ({
            id: uid(),
            text: q.text,
            standard: '',
            type: q.type === 'TF' ? 'TF' : (q.type === 'MCQ' ? 'MCQ' : (q.type === 'LA' ? 'LA' : 'SA')),
            options: q.options || [],
            createdAt: Date.now()
        }));

        all.push(...toSave);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

        // Optional: sessionStorage injection (if your list page uses it)
        sessionStorage.setItem('NEW_QUESTION', JSON.stringify({
            key: STORAGE_KEY, play, act, scene, items: toSave
        }));

        alert(`Saved ${toSave.length} question(s).`);

        // Navigate back
        window.location.href = `${BACK_URL}?play=${encodeURIComponent(play)}&act=${encodeURIComponent(act)}&scene=${encodeURIComponent(scene)}`;
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
