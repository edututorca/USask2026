/**
 * ============================================================
 * AI Question Creator - Frontend
 * ============================================================
 * 
 * TWO WAYS TO USE:
 * 
 * 1. STANDALONE - Go directly to ai-question-creator.html
 *    → Pick subject, type a topic, set grade, generate
 * 
 * 2. FROM QUESTION BANK - Click "Generate with AI" from User-Area
 *    → URL params auto-fill the subject, topic, subtopic
 *    → Example: ai-question-creator.html?subject=English&topic=Romeo+and+Juliet&subtopic=Act+3&grade=10&subjectId=1
 * 
 * ============================================================
 */
(function () {

    // ── URL Params (auto-fill from Question Bank) ──────────
    const params = new URLSearchParams(location.search);
    const urlSubjectId = params.get('subjectId') || '';
    const urlSubject = params.get('subject') || '';
    const urlTopic = params.get('topic') || params.get('play') || '';
    const urlSubtopic = params.get('subtopic') || '';
    const urlSection = params.get('section') || '';
    const urlGrade = params.get('grade') || '';

    // ── Elements ───────────────────────────────────────────
    const subjectSelect = document.getElementById('subjectSelect');
    const topicInput = document.getElementById('topicInput');
    const topicSuggestions = document.getElementById('topicSuggestions');
    const gradeSelect = document.getElementById('gradeSelect');
    const subtopicInput = document.getElementById('subtopicInput');
    const customPromptEl = document.getElementById('customPrompt');
    const ctxEl = document.getElementById('aiContextInfo');

    const btnBack = document.getElementById('btnBack');
    const btnGenerate = document.getElementById('btnGenerate');
    const btnClear = document.getElementById('btnClear');
    const btnSaveSelected = document.getElementById('btnSaveSelected');

    const resultsList = document.getElementById('resultsList');
    const resultsMeta = document.getElementById('resultsMeta');
    const aiForm = document.getElementById('aiForm');

    let generated = [];
    let subjects = [];

    // ── Back button ────────────────────────────────────────
    btnBack.addEventListener('click', () => {
        // If we came from Question Bank, go back there
        if (document.referrer && document.referrer.includes('User-Area')) {
            window.history.back();
        } else {
            window.location.href = 'User-Area.html';
        }
    });

    // ── Load Subjects from API ─────────────────────────────
    async function loadSubjects() {
        try {
            const data = await apiRequest('/subjects');
            subjects = Array.isArray(data) ? data : (data.subjects || []);

            subjectSelect.innerHTML = '<option value="">-- Choose a subject --</option>';
            subjects.forEach(s => {
                const id = s.id || s.SubjectID;
                const name = s.name || s.SubjectName;
                const opt = document.createElement('option');
                opt.value = id;
                opt.textContent = name;

                // Auto-select if from URL params
                if (urlSubjectId && String(id) === String(urlSubjectId)) {
                    opt.selected = true;
                } else if (urlSubject && name.toLowerCase() === urlSubject.toLowerCase()) {
                    opt.selected = true;
                }

                subjectSelect.appendChild(opt);
            });

            // Load topic suggestions for the selected subject
            if (subjectSelect.value) {
                loadTopicSuggestions(subjectSelect.value);
            }
        } catch (err) {
            console.error('Failed to load subjects:', err);
            subjectSelect.innerHTML = '<option value="">Failed to load subjects</option>';
        }
    }

    // ── Load Topic Suggestions (from existing questions) ───
    async function loadTopicSuggestions(subjectId) {
        try {
            let url = '/topics';
            if (subjectId) url += `?subjectId=${subjectId}`;

            const data = await apiRequest(url);
            const topics = Array.isArray(data) ? data : [];

            // Populate the datalist for autocomplete suggestions
            topicSuggestions.innerHTML = '';
            topics.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t.name || t.topic || '';
                topicSuggestions.appendChild(opt);
            });
        } catch (err) {
            // Not critical — topics endpoint might not exist yet
            // Teacher can still type freely
            console.log('Topic suggestions not available:', err.message);
        }
    }

    // ── Update context breadcrumb ──────────────────────────
    function updateContext() {
        const subjectName = subjectSelect.options[subjectSelect.selectedIndex]?.text || '';
        const topic = topicInput.value.trim();
        const subtopic = subtopicInput.value.trim();
        const grade = gradeSelect.value;

        let parts = [];
        if (subjectName && subjectName !== '-- Choose a subject --') parts.push(subjectName);
        if (topic) parts.push(topic);
        if (subtopic) parts.push(subtopic);
        if (grade) parts.push(`Grade ${grade}`);

        if (parts.length > 0) {
            ctxEl.innerHTML = parts.join(' <span>→</span> ');
        } else {
            ctxEl.innerHTML = '<span>Select a subject and topic to get started</span>';
        }
    }

    // ── Event Listeners ────────────────────────────────────
    subjectSelect.addEventListener('change', () => {
        loadTopicSuggestions(subjectSelect.value);
        updateContext();
    });

    topicInput.addEventListener('input', updateContext);
    subtopicInput.addEventListener('input', updateContext);
    gradeSelect.addEventListener('change', updateContext);

    // Toggle quantity inputs based on checkbox
    aiForm.addEventListener('change', (e) => {
        if (e.target.name === 'types') {
            const checkbox = e.target;
            const row = checkbox.closest('.aiqb__type-row');
            const input = row.querySelector('.aiqb__count-input');
            if (input) {
                input.disabled = !checkbox.checked;
                if (!input.disabled) {
                    input.focus();
                } else {
                    input.value = '0';
                }
            }
        }
    });

    // ── Get selected question type config ──────────────────
    function getSelectedConfig() {
        const rows = Array.from(aiForm.querySelectorAll('.aiqb__type-row'));
        const config = [];

        rows.forEach(row => {
            const checkbox = row.querySelector('input[name="types"]');
            const countInput = row.querySelector('.aiqb__count-input');

            if (checkbox && checkbox.checked) {
                let count = parseInt(countInput.value, 10);
                if (!count || count < 1) return;
                config.push({ type: checkbox.value, count });
            }
        });
        return config;
    }

    function uid() {
        return Math.random().toString(36).slice(2, 10);
    }

    // ── Generate Questions (calls server API) ──────────────
    async function generateQuestions(config) {
        const subjectName = subjectSelect.options[subjectSelect.selectedIndex]?.text || '';
        const topic = topicInput.value.trim();
        const subtopic = subtopicInput.value.trim();
        const grade = gradeSelect.value;

        const requestBody = {
            topic: topic,
            subtopic: subtopic,
            section: '',
            subject: subjectName !== '-- Choose a subject --' ? subjectName : '',
            grade: grade,
            types: config,
            customPrompt: customPromptEl ? customPromptEl.value : ''
        };

        const response = await apiRequest('/ai/generate', {
            method: 'POST',
            body: JSON.stringify(requestBody)
        });

        if (!response.success || !response.questions) {
            throw new Error(response.error || 'No questions returned');
        }

        console.log(`[AI] ${response.mode === 'ai' ? 'AI' : 'Mock'} Generated: ${response.count} questions`);

        return {
            questions: response.questions.map(q => ({
                id: uid(),
                type: q.type,
                text: q.text,
                options: q.options || [],
                keep: false,
                createdAt: Date.now(),
                aiGenerated: response.mode === 'ai'
            })),
            mode: response.mode
        };
    }

    // ── Render ─────────────────────────────────────────────
    function render() {
        resultsList.innerHTML = '';

        if (!generated.length) {
            resultsMeta.textContent = 'Nothing generated yet.';
            btnSaveSelected.disabled = true;
            return;
        }

        const keptCount = generated.filter(x => x.keep).length;
        const isAI = generated[0]?.aiGenerated;
        const modeHtml = isAI
            ? '<span class="aiqb__mode-badge aiqb__mode-badge--ai">AI Generated</span>'
            : '<span class="aiqb__mode-badge aiqb__mode-badge--mock">Mock Mode</span>';

        resultsMeta.innerHTML = `${generated.length} generated ${modeHtml} &bull; ${keptCount} selected`;
        btnSaveSelected.disabled = keptCount === 0;

        generated.forEach((q) => {
            const card = document.createElement('div');
            card.className = 'aiqb__card';

            const optionsInfo = (q.type === 'MCQ')
                ? `${q.options.length} options`
                : (q.type === 'TF')
                    ? 'True/False'
                    : 'Free response';

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
                // VIEW MODE
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
                        ${q.aiGenerated ? '<span class="aiqb__chip aiqb__chip--ai">AI</span>' : ''}
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

    // ── Card action handlers ───────────────────────────────
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
            const card = btn.closest('.aiqb__card');
            const textInput = card.querySelector(`#edit-text-${id}`);
            if (textInput) item.text = textInput.value;

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

    // ── Generate Button ────────────────────────────────────
    btnGenerate.addEventListener('click', async () => {
        const config = getSelectedConfig();
        if (!config.length) {
            alert('Select at least one question type and set the count.');
            return;
        }

        if (!topicInput.value.trim()) {
            alert('Please enter a topic (e.g. "Romeo and Juliet").');
            return;
        }

        // Show loading state
        btnGenerate.disabled = true;
        btnGenerate.textContent = 'Generating...';
        resultsList.innerHTML = `
            <div class="aiqb__generating">
                <span class="spinner"></span>
                AI is generating your questions...
            </div>
        `;
        resultsMeta.textContent = '';

        try {
            const result = await generateQuestions(config);
            generated = result.questions;
            render();
        } catch (error) {
            console.error('Generation failed:', error);
            resultsList.innerHTML = '';
            resultsMeta.textContent = 'Generation failed. Check your connection and try again.';
            alert('Failed to generate questions. Make sure the server is running.');
        } finally {
            btnGenerate.disabled = false;
            btnGenerate.textContent = 'Generate Questions';
        }
    });

    // ── Clear Button ───────────────────────────────────────
    btnClear.addEventListener('click', () => {
        generated = [];
        render();
    });

    // ── Save Selected Button ───────────────────────────────
    btnSaveSelected.addEventListener('click', async () => {
        const kept = generated.filter(x => x.keep);
        if (!kept.length) {
            alert('Select at least one question to save.');
            return;
        }

        btnSaveSelected.disabled = true;
        btnSaveSelected.textContent = 'Saving...';

        let savedCount = 0;
        try {
            for (const q of kept) {
                const body = {
                    questionText: q.text,
                    questionType: q.type === 'TF' ? 'True/False' : (q.type === 'MCQ' ? 'Multiple Choice' : 'Short Answer'),
                    difficulty: 1,
                    subjectId: subjectSelect.value || null,
                    grade: gradeSelect.value || 10,
                    topic: topicInput.value.trim(),
                    userId: getCurrentUserId() || 1
                };

                // Add MCQ options
                if (q.type === 'MCQ' && q.options.length >= 4) {
                    body.optionA = q.options[0]?.text || '';
                    body.optionB = q.options[1]?.text || '';
                    body.optionC = q.options[2]?.text || '';
                    body.optionD = q.options[3]?.text || '';
                    const correct = q.options.find(o => o.correct);
                    body.correctAnswer = correct ? correct.text : body.optionA;
                } else if (q.type === 'TF') {
                    body.optionA = 'True';
                    body.optionB = 'False';
                    const correct = q.options.find(o => o.correct);
                    body.correctAnswer = correct ? correct.text : 'True';
                }

                await apiRequest('/questions', {
                    method: 'POST',
                    body: JSON.stringify(body)
                });
                savedCount++;
            }

            alert(`Saved ${savedCount} question(s) to the database!`);
            generated = generated.filter(x => !x.keep);
            render();

        } catch (e) {
            console.error('Save failed:', e);
            if (savedCount > 0) {
                alert(`Saved ${savedCount} question(s), but some failed.`);
            } else {
                alert('Failed to save questions. Make sure you are logged in.');
            }
        } finally {
            btnSaveSelected.disabled = false;
            btnSaveSelected.textContent = 'Save Selected';
        }
    });

    // ── Helpers ─────────────────────────────────────────────
    function escapeHtml(str) {
        return String(str)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    // ── Initialize ─────────────────────────────────────────

    // Auto-fill from URL params if coming from Question Bank
    if (urlTopic) topicInput.value = urlTopic;
    if (urlSubtopic && urlSection) {
        subtopicInput.value = `${urlSubtopic} ${urlSection}`.trim();
    } else if (urlSubtopic) {
        subtopicInput.value = urlSubtopic;
    }
    if (urlGrade) gradeSelect.value = urlGrade;

    // Load subjects (will also auto-select from URL params)
    loadSubjects().then(() => {
        updateContext();
    });

    render();

})();