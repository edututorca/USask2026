/* ===================================================== */
/* AI QUESTION CREATOR — Rebuilt with hierarchy dropdowns */
/* ===================================================== */
(function(){

    // URL params from Question Bank
    const params = new URLSearchParams(location.search);
    const urlSubjectId = params.get('subjectId') || '';
    const urlNodeId = params.get('nodeId') || '';
    const urlTopic = params.get('topic') || '';
    const urlGrade = params.get('grade') || '';

    // Elements
    const subjectSelect = document.getElementById('subjectSelect');
    const gradeSelect = document.getElementById('gradeSelect');
    const customPromptEl = document.getElementById('customPrompt');
    const ctxPath = document.getElementById('aiContextPath');
    const btnGenerate = document.getElementById('btnGenerate');
    const btnClear = document.getElementById('btnClear');
    const btnSaveSelected = document.getElementById('btnSaveSelected');
    const resultsList = document.getElementById('resultsList');
    const resultsMeta = document.getElementById('resultsMeta');
    const postSaveActions = document.getElementById('postSaveActions');
    const postSaveMsg = document.getElementById('postSaveMsg');

    let generated = [];
    let subjects = [];
    let savedQuestionIds = [];
    // Track hierarchy state: hierNodes[level] = { nodes, selectedId }
    let hierNodes = [{},{},{},{}];

    // ============ INIT ============

    async function init(){
        // Load subjects
        try {
            subjects = await apiRequest('/subjects');
            subjectSelect.innerHTML = '<option value="">Select a subject</option>';
            subjects.forEach(s => {
                subjectSelect.innerHTML += '<option value="'+s.id+'">'+esc(s.name)+'</option>';
            });
        } catch(e) {
            subjectSelect.innerHTML = '<option value="">Failed to load</option>';
        }

        // Pre-fill from URL params
        if(urlSubjectId) {
            subjectSelect.value = urlSubjectId;
            await loadHierLevel(0, null);

            // Try to walk down the hierarchy to urlNodeId
            if(urlNodeId) await preselectNodePath(parseInt(urlNodeId));
        }
        if(urlGrade) gradeSelect.value = urlGrade;

        // Wire type checkboxes
        document.querySelectorAll('input[name="types"]').forEach(cb => {
            const countInput = cb.closest('.ai-type-row').querySelector('.ai-count');
            cb.addEventListener('change', () => {
                countInput.disabled = !cb.checked;
                if(cb.checked && parseInt(countInput.value) < 1) countInput.value = 3;
                if(!cb.checked) countInput.value = 0;
                updateSaveBtn();
            });
        });

        updateContext();
    }

    // ============ HIERARCHY DROPDOWNS ============

    subjectSelect.addEventListener('change', () => {
        // Clear all hierarchy levels
        for(let i=0;i<4;i++) hideHierLevel(i);
        hierNodes = [{},{},{},{}];
        if(subjectSelect.value) loadHierLevel(0, null);
        updateContext();
    });

    async function loadHierLevel(level, parentId) {
        const select = document.getElementById('hierSelect'+level);
        const field = document.getElementById('hierField'+level);
        const label = document.getElementById('hierLabel'+level);

        if(!subjectSelect.value) return;

        try {
            let url = '/hierarchy/nodes?subjectId='+subjectSelect.value;
            if(parentId) url += '&parentId='+parentId;

            const nodes = await apiRequest(url);

            if(!nodes || nodes.length === 0) {
                hideHierLevel(level);
                return;
            }

            hierNodes[level] = { nodes: nodes, selectedId: null };

            // Set label from first node's label field
            label.textContent = nodes[0].label || ('Level '+(level+1));

            select.innerHTML = '<option value="">-- All '+esc(nodes[0].label || 'items')+' --</option>';
            nodes.forEach(n => {
                select.innerHTML += '<option value="'+n.id+'">'+esc(n.name)+'</option>';
            });

            field.classList.remove('hidden');

        } catch(e) {
            console.error('Failed to load hierarchy level '+level+':', e);
            hideHierLevel(level);
        }
    }

    function hideHierLevel(level) {
        document.getElementById('hierField'+level).classList.add('hidden');
        document.getElementById('hierSelect'+level).innerHTML = '<option value="">-- Select --</option>';
        hierNodes[level] = {};
    }

    window.onHierChange = function(level) {
        const select = document.getElementById('hierSelect'+level);
        const nodeId = select.value ? parseInt(select.value) : null;
        hierNodes[level].selectedId = nodeId;

        // Clear levels below
        for(let i = level+1; i < 4; i++) hideHierLevel(i);

        // Load next level if selected
        if(nodeId && level < 3) {
            loadHierLevel(level+1, nodeId);
        }

        updateContext();
    };

    // Walk the hierarchy tree to find the path to a specific node and pre-select dropdowns
    async function preselectNodePath(targetNodeId) {
        try {
            const node = await apiRequest('/hierarchy/nodes/'+targetNodeId);
            if(!node) return;

            // Build path from breadcrumb
            const path = node.breadcrumb || [];
            // path is like [{id:1,name:'Plays'},{id:7,name:'Romeo and Juliet'},{id:16,name:'Act 2'}]

            for(let i = 0; i < path.length && i < 4; i++) {
                const select = document.getElementById('hierSelect'+i);
                // Wait for options to be available
                if(select.querySelector('option[value="'+path[i].id+'"]')) {
                    select.value = path[i].id;
                    hierNodes[i].selectedId = path[i].id;
                    if(i < 3 && i < path.length - 1) {
                        await loadHierLevel(i+1, path[i].id);
                    }
                }
            }
            updateContext();
        } catch(e) {
            console.warn('Could not preselect node path:', e);
        }
    }

    // ============ CONTEXT BAR ============

    function updateContext() {
        let parts = [];
        const subOpt = subjectSelect.options[subjectSelect.selectedIndex];
        if(subOpt && subOpt.value) parts.push(subOpt.text);

        for(let i = 0; i < 4; i++) {
            const select = document.getElementById('hierSelect'+i);
            if(select && select.value) {
                const opt = select.options[select.selectedIndex];
                if(opt) parts.push(opt.text);
            }
        }

        if(parts.length > 0) {
            ctxPath.textContent = parts.join(' > ');
        } else {
            ctxPath.textContent = 'Select a subject and topic below';
        }
    }

    // ============ GET DEEPEST NODE ID ============

    function getDeepestNodeId() {
        for(let i = 3; i >= 0; i--) {
            if(hierNodes[i] && hierNodes[i].selectedId) return hierNodes[i].selectedId;
        }
        return null;
    }

    // Build topic string for AI prompt from hierarchy selections
    function getTopicString() {
        let parts = [];
        for(let i = 0; i < 4; i++) {
            const select = document.getElementById('hierSelect'+i);
            if(select && select.value) {
                const opt = select.options[select.selectedIndex];
                if(opt) parts.push(opt.text);
            }
        }
        return parts.join(' — ');
    }

    // ============ GENERATE ============

    btnGenerate.addEventListener('click', async () => {
        if(!subjectSelect.value) { alert('Please select a subject.'); return; }

        // Gather selected types and counts
        const typeEntries = [];
        document.querySelectorAll('input[name="types"]:checked').forEach(cb => {
            const count = parseInt(cb.closest('.ai-type-row').querySelector('.ai-count').value) || 0;
            if(count > 0) typeEntries.push({ type: cb.value, count: count });
        });

        if(typeEntries.length === 0) {
            alert('Please select at least one question type and set a count.');
            return;
        }

        const subjectName = subjectSelect.options[subjectSelect.selectedIndex].text;
        const topic = getTopicString();
        const grade = gradeSelect.value;
        const bloomsLevel = document.getElementById('bloomsSelect').value;
        const customPrompt = customPromptEl.value.trim();

        btnGenerate.disabled = true;
        btnGenerate.innerHTML = '<span class="ai-spinner"></span> Generating...';
        resultsList.innerHTML = '<div class="ai-generating"><span class="ai-spinner"></span> Generating questions with AI...</div>';
        resultsMeta.textContent = '';
        postSaveActions.classList.add('hidden');

        try {
            const response = await apiRequest('/ai/generate', {
                method: 'POST',
                body: JSON.stringify({
                    subject: subjectName,
                    topic: topic || subjectName,
                    subtopic: '',
                    grade: grade,
                    bloomsLevel: bloomsLevel,
                    types: typeEntries,
                    customPrompt: customPrompt
                })
            });

            generated = (response.questions || []).map((q,i) => ({
                ...q,
                keep: true,
                index: i
            }));

            render();
            resultsMeta.textContent = generated.length + ' question'+(generated.length!==1?'s':'')+' generated';

        } catch(e) {
            console.error('Generation failed:', e);
            resultsList.innerHTML = '<div class="ai-generating" style="color:#e53935;">Failed to generate questions. Please try again.</div>';
        } finally {
            btnGenerate.disabled = false;
            btnGenerate.innerHTML = '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 1L1 5l8 4 8-4-8-4z"/><path d="M1 13l8 4 8-4"/><path d="M1 9l8 4 8-4"/></svg> Generate Questions';
        }
    });

    // ============ RENDER RESULTS ============

    function render() {
        if(generated.length === 0) {
            resultsList.innerHTML = '';
            resultsMeta.textContent = 'Nothing generated yet.';
            updateSaveBtn();
            return;
        }

        resultsList.innerHTML = generated.map((q,i) => {
            const typeLabels = { MCQ:'Multiple Choice', TF:'True / False', SA:'Short Answer', LA:'Essay' };
            const typeLabel = typeLabels[q.type] || q.type;

            let optionsHtml = '';
            if(q.options && q.options.length > 0 && (q.type === 'MCQ' || q.type === 'TF')) {
                const letters = ['A','B','C','D','E','F'];
                optionsHtml = '<div class="ai-result-options">';
                q.options.forEach((opt,j) => {
                    const letter = q.type === 'TF' ? (j===0?'T':'F') : letters[j];
                    const correct = opt.correct ? ' correct' : '';
                    optionsHtml += '<div class="ai-result-option'+correct+'"><strong>'+letter+'</strong> '+esc(opt.text)+'</div>';
                });
                optionsHtml += '</div>';
            }

            return '<div class="ai-result-card '+(q.keep?'kept':'')+'" data-index="'+i+'">'+
                '<div class="ai-result-top">'+
                    '<div class="ai-result-text">'+esc(q.text)+'</div>'+
                    '<span class="ai-result-badge">'+esc(typeLabel)+'</span>'+
                '</div>'+
                optionsHtml+
                '<div class="ai-result-actions">'+
                    '<button class="ai-result-btn '+(q.keep?'discard':'keep')+'" onclick="toggleKeep('+i+')">'+
                        (q.keep?'Discard':'Keep')+
                    '</button>'+
                '</div>'+
            '</div>';
        }).join('');

        updateSaveBtn();
    }

    window.toggleKeep = function(index) {
        generated[index].keep = !generated[index].keep;
        render();
    };

    function updateSaveBtn() {
        const keptCount = generated.filter(x=>x.keep).length;
        btnSaveSelected.disabled = keptCount === 0;
        btnSaveSelected.textContent = keptCount > 0 ? 'Save '+keptCount+' Question'+(keptCount!==1?'s':'') : 'Save Selected';
    }

    // ============ CLEAR ============

    btnClear.addEventListener('click', () => {
        generated = [];
        render();
        resultsMeta.textContent = 'Nothing generated yet.';
        postSaveActions.classList.add('hidden');
    });

    // ============ SAVE ============

    btnSaveSelected.addEventListener('click', async () => {
        const kept = generated.filter(x => x.keep);
        if(!kept.length) { alert('Select at least one question to save.'); return; }

        btnSaveSelected.disabled = true;
        btnSaveSelected.textContent = 'Saving...';

        const typeMap = { MCQ:'multiple_choice', TF:'true_false', SA:'short_answer', LA:'essay' };
        const nodeId = getDeepestNodeId();
        savedQuestionIds = [];

        let savedCount = 0;
        try {
            for(const q of kept) {
                const dbType = typeMap[q.type] || 'short_answer';

                const body = {
                    questionText: q.text,
                    questionType: dbType,
                    difficulty: 'medium',
                    subjectId: subjectSelect.value || null,
                    grade: gradeSelect.value || 10,
                    topic: getTopicString(),
                    nodeId: nodeId,
                    userId: getCurrentUserId() || 1
                };

                // Options array for question_options table
                if(q.options && q.options.length > 0) {
                    body.options = q.options.map(o => ({ text: o.text, isCorrect: !!o.correct }));
                }

                // Inline fields for backward compatibility
                if(q.type === 'MCQ' && q.options && q.options.length >= 4) {
                    body.optionA = q.options[0]?.text || '';
                    body.optionB = q.options[1]?.text || '';
                    body.optionC = q.options[2]?.text || '';
                    body.optionD = q.options[3]?.text || '';
                    const correct = q.options.find(o => o.correct);
                    body.correctAnswer = correct ? correct.text : body.optionA;
                } else if(q.type === 'TF') {
                    body.optionA = 'True';
                    body.optionB = 'False';
                    const correct = q.options.find(o => o.correct);
                    body.correctAnswer = correct ? correct.text : 'True';
                }

                const result = await apiRequest('/questions', {
                    method: 'POST',
                    body: JSON.stringify(body)
                });
                if(result.id || result.insertId) {
                    savedQuestionIds.push(result.id || result.insertId);
                }
                savedCount++;
            }

            // Remove saved from list
            generated = generated.filter(x => !x.keep);
            render();

            // Show post-save actions
            postSaveMsg.textContent = 'Saved '+savedCount+' question'+(savedCount!==1?'s':'')+'!';
            postSaveActions.classList.remove('hidden');

            // Update View in Question Bank link with subject context
            const bankLink = document.getElementById('btnViewBank');
            if(bankLink && subjectSelect.value) {
                bankLink.href = 'User-Area.html';
            }

            showToast('Saved '+savedCount+' question'+(savedCount!==1?'s':'')+'!');

        } catch(e) {
            console.error('Save failed:', e);
            if(savedCount > 0) {
                alert('Saved '+savedCount+' question(s), but some failed.');
            } else {
                alert('Failed to save questions.');
            }
        } finally {
            btnSaveSelected.disabled = false;
            updateSaveBtn();
        }
    });

    // ============ QUIZ PICKER (for post-save) ============

    window.openSavedQuizPicker = async function() {
        if(savedQuestionIds.length === 0) { alert('No saved questions to add.'); return; }

        const overlay = document.getElementById('quizPickerOverlay');
        const list = document.getElementById('quizPickerList');
        const loading = document.getElementById('quizPickerLoading');
        const empty = document.getElementById('quizPickerEmpty');

        document.getElementById('quizPickerTitle').textContent = 'Add '+savedQuestionIds.length+' Question'+(savedQuestionIds.length!==1?'s':'')+' to Quiz';
        overlay.classList.remove('hidden');
        loading.classList.remove('hidden');
        list.innerHTML = '';
        empty.classList.add('hidden');

        try {
            const userId = getCurrentUserId() || 1;
            const quizzes = await apiRequest('/quizzes?userId='+userId);
            loading.classList.add('hidden');

            if(!quizzes || quizzes.length === 0) {
                empty.classList.remove('hidden');
                return;
            }

            list.innerHTML = quizzes.map(q =>
                '<div class="quiz-pick-item"><div class="quiz-pick-info"><h3>'+esc(q.title)+'</h3><span class="quiz-pick-meta">'+(q.question_count||0)+' questions</span></div><button class="quiz-pick-btn" onclick="addSavedToQuiz('+q.id+',this)">Add</button></div>'
            ).join('');

        } catch(e) {
            loading.classList.add('hidden');
            list.innerHTML = '<div class="modal-loading">Failed to load quizzes.</div>';
        }
    };

    window.addSavedToQuiz = async function(quizId, btn) {
        btn.disabled = true;
        btn.textContent = 'Adding...';
        let count = 0;
        try {
            for(const qId of savedQuestionIds) {
                await apiRequest('/quizzes/'+quizId+'/questions', {
                    method: 'POST',
                    body: JSON.stringify({ questionId: qId })
                });
                count++;
            }
            btn.textContent = 'Added!';
            btn.classList.add('added');
            showToast('Added '+count+' question'+(count!==1?'s':'')+' to quiz!');
        } catch(e) {
            btn.textContent = 'Failed';
            setTimeout(()=>{ btn.textContent='Add'; btn.disabled=false; }, 2000);
        }
    };

    window.closeQuizPicker = function(event) {
        if(event && event.target !== event.currentTarget) return;
        document.getElementById('quizPickerOverlay').classList.add('hidden');
    };

    window.showQuickCreate = function() {
        document.getElementById('quickCreateToggle').classList.add('hidden');
        document.getElementById('quickCreateForm').classList.remove('hidden');
        document.getElementById('quickQuizName').focus();
    };

    window.quickCreateQuiz = async function() {
        const name = document.getElementById('quickQuizName').value.trim();
        if(!name) { alert('Please enter a quiz name.'); return; }
        const btn = document.getElementById('quickCreateBtn');
        btn.disabled = true; btn.textContent = 'Creating...';
        try {
            const result = await apiRequest('/quizzes', {
                method: 'POST',
                body: JSON.stringify({
                    userId: getCurrentUserId()||1,
                    title: name,
                    subjectId: subjectSelect.value||null,
                    grade: null,
                    description: ''
                })
            });
            if(!result.success) throw new Error('Failed');
            // Add questions to new quiz
            let count = 0;
            for(const qId of savedQuestionIds) {
                await apiRequest('/quizzes/'+result.quizId+'/questions', {
                    method:'POST',
                    body: JSON.stringify({questionId:qId})
                });
                count++;
            }
            closeQuizPicker();
            showToast('Created "'+name+'" with '+count+' question'+(count!==1?'s':'')+'!');
        } catch(e) {
            alert('Failed to create quiz.');
        } finally {
            btn.disabled = false; btn.textContent = 'Create & Add';
        }
    };

    // ============ HELPERS ============

    function showToast(msg) {
        const toast = document.getElementById('successToast');
        document.getElementById('toastMessage').textContent = msg;
        toast.classList.remove('hidden');
        setTimeout(()=>toast.classList.add('hidden'), 3000);
    }

    function esc(str) {
        const d = document.createElement('div');
        d.textContent = str || '';
        return d.innerHTML;
    }

    // ============ KICK OFF ============

    init();

})();