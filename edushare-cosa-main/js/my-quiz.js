/* ===================================================== */
/* ============= MY QUIZ (EDIT) PAGE JS ================ */
/* ===================================================== */

let quizId = null;
let quizData = null;
let quizQuestions = [];
let selectedQuestions = new Set();
let allBankQuestions = [];
let localIdCounter = 90000;

// Drag state
let draggedIndex = null;
let placeholder = null;

function getQuizIdFromURL() {
    return new URLSearchParams(window.location.search).get('id');
}

function formatQuestionType(type) {
    const types = { 'multiple_choice': 'Multiple Choice', 'true_false': 'True/False', 'short_answer': 'Short Answer', 'essay': 'Essay' };
    return types[type] || type;
}

// ============ LOAD QUIZ ============

async function loadQuizData() {
    quizId = getQuizIdFromURL();
    if (!quizId) {
        alert('No quiz ID provided');
        window.location.href = 'quiz-manager.html';
        return;
    }

    try {
        quizData = await apiRequest(`${API_CONFIG.ENDPOINTS.QUIZZES}/${quizId}`);
        quizQuestions = quizData.questions || [];
        renderQuizHeader();
        renderQuestions();
        updateFooter();
    } catch (error) {
        console.error('Error loading quiz:', error);
        alert('Failed to load quiz. Please try again.');
    }
}

// ============ RENDER HEADER ============

function renderQuizHeader() {
    document.getElementById('quizName').textContent = quizData.title;
    document.getElementById('quizMeta').innerHTML = `
        <span>
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            ${escapeHtml(quizData.subject_name || 'No subject')}
        </span>
        <span>
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
            ${quizQuestions.length} question${quizQuestions.length !== 1 ? 's' : ''}
        </span>
        <span>
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            ${calculateTotalPoints()} points
        </span>`;
}

function calculateTotalPoints() {
    return quizQuestions.reduce((sum, q) => sum + (q.point_value || 1), 0);
}

function updateSummary() {
    document.getElementById('questionCount').textContent =
        `${quizQuestions.length} question${quizQuestions.length !== 1 ? 's' : ''} \u2022 ${calculateTotalPoints()} points`;
    updateFooter();
}

function updateFooter() {
    const footer = document.getElementById('stickyFooter');
    if (footer) {
        document.getElementById('footerSummary').textContent =
            `${quizQuestions.length} question${quizQuestions.length !== 1 ? 's' : ''} \u2022 ${calculateTotalPoints()} points`;
    }
}

// ============ RENDER QUESTIONS ============

function renderQuestions() {
    const container = document.getElementById('questionsList');
    document.getElementById('questionCount').textContent =
        `${quizQuestions.length} question${quizQuestions.length !== 1 ? 's' : ''} \u2022 ${calculateTotalPoints()} points`;

    if (quizQuestions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" fill="none" stroke="currentColor" stroke-width="2"><circle cx="32" cy="32" r="28"/><path d="M32 44v-8M32 28h.05"/></svg>
                <h3>No questions yet</h3>
                <p>Click "Add Questions" to get started!</p>
            </div>`;
        return;
    }

    container.innerHTML = quizQuestions.map((q, index) => {
        const needsLines = (q.question_type === 'short_answer' || q.question_type === 'essay');
        return `
        <div class="question-item" draggable="true" data-index="${index}">
            <div class="drag-handle" title="Drag to reorder">
                <svg width="16" height="20" viewBox="0 0 16 20" fill="#9aa5c4">
                    <circle cx="4" cy="4" r="2"/><circle cx="4" cy="10" r="2"/><circle cx="4" cy="16" r="2"/>
                    <circle cx="12" cy="4" r="2"/><circle cx="12" cy="10" r="2"/><circle cx="12" cy="16" r="2"/>
                </svg>
            </div>
            <div class="question-number">${index + 1}</div>
            <div class="question-content">
                <div class="question-text">${escapeHtml(q.question_text)}</div>
                <div class="question-details">
                    <span class="question-meta-item">
                        <svg width="12" height="12" fill="#6073a0"><circle cx="6" cy="6" r="6"/></svg>
                        ${escapeHtml(formatQuestionType(q.question_type))}
                    </span>
                    <span class="question-meta-item">Difficulty: ${escapeHtml(q.difficulty || 'medium')}</span>
                </div>
            </div>
            <div class="question-right-controls">
                ${needsLines ? `
                <div class="inline-control" title="Number of blank lines for student answers on the printed quiz">
                    <input type="number" class="num-input" value="${q.answer_space_lines || 5}" min="1" max="30"
                           onchange="updateLines(${q.id}, this.value)" onclick="event.stopPropagation()">
                    <span class="control-label">lines
                        <svg class="info-tip" width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="#9aa5c4" stroke-width="2"><circle cx="7" cy="7" r="6"/><path d="M7 9.5v-2M7 5.5h.01"/></svg>
                    </span>
                </div>
                ` : '<div class="inline-control placeholder-col"></div>'}
                <div class="inline-control" title="Point value for this question">
                    <input type="number" class="num-input" value="${q.point_value || 1}" min="1" max="100"
                           onchange="updatePoints(${q.id}, this.value)" onclick="event.stopPropagation()">
                    <span class="control-label">pts</span>
                </div>
                <button class="icon-btn" onclick="openEditModal(${q.id})" title="Edit question">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#6073a0" stroke-width="1.5">
                        <path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z"/>
                    </svg>
                </button>
                <button class="icon-btn icon-btn-danger" onclick="removeQuestion(${index})" title="Remove from quiz">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#6073a0" stroke-width="1.5">
                        <path d="M2 4h12M5 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1M6 7v5M10 7v5"/>
                        <path d="M3 4l1 9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-9"/>
                    </svg>
                </button>
            </div>
        </div>`;
    }).join('');

    setupDragAndDrop();
    updateFooter();
}

// ============ TRELLO-STYLE DRAG AND DROP ============

function setupDragAndDrop() {
    const container = document.getElementById('questionsList');
    const items = container.querySelectorAll('.question-item');

    items.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
    });

    container.addEventListener('dragover', handleContainerDragOver);
    container.addEventListener('drop', handleContainerDrop);

    // Auto-scroll while dragging
    let scrollInterval = null;
    document.addEventListener('dragover', (e) => {
        const threshold = 80;
        const speed = 10;
        if (e.clientY < threshold) {
            if (!scrollInterval) scrollInterval = setInterval(() => window.scrollBy(0, -speed), 16);
        } else if (e.clientY > window.innerHeight - threshold) {
            if (!scrollInterval) scrollInterval = setInterval(() => window.scrollBy(0, speed), 16);
        } else {
            if (scrollInterval) { clearInterval(scrollInterval); scrollInterval = null; }
        }
    });
    document.addEventListener('dragend', () => {
        if (scrollInterval) { clearInterval(scrollInterval); scrollInterval = null; }
    });
}

function handleDragStart(e) {
    draggedIndex = parseInt(this.dataset.index);
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';

    placeholder = document.createElement('div');
    placeholder.className = 'drag-placeholder';
    placeholder.style.height = this.offsetHeight + 'px';
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    draggedIndex = null;
    if (placeholder && placeholder.parentNode) {
        placeholder.parentNode.removeChild(placeholder);
    }
    placeholder = null;
}

function handleContainerDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const container = document.getElementById('questionsList');
    const items = [...container.querySelectorAll('.question-item:not(.dragging)')];

    let afterElement = null;
    for (const item of items) {
        const box = item.getBoundingClientRect();
        const midY = box.top + box.height / 2;
        if (e.clientY < midY) {
            afterElement = item;
            break;
        }
    }

    if (placeholder) {
        if (afterElement) {
            container.insertBefore(placeholder, afterElement);
        } else {
            container.appendChild(placeholder);
        }
    }
}

function handleContainerDrop(e) {
    e.preventDefault();
    if (draggedIndex === null) return;

    const container = document.getElementById('questionsList');

    if (placeholder && placeholder.parentNode) {
        const siblings = [...container.children];
        const placeholderPos = siblings.indexOf(placeholder);
        let count = 0;
        for (let i = 0; i < placeholderPos; i++) {
            if (siblings[i].classList && siblings[i].classList.contains('question-item') && !siblings[i].classList.contains('dragging')) {
                count++;
            }
        }
        let toIndex = count;
        if (draggedIndex < count) toIndex--;

        if (draggedIndex !== toIndex && toIndex >= 0) {
            const item = quizQuestions.splice(draggedIndex, 1)[0];
            quizQuestions.splice(toIndex, 0, item);
        }
    }

    renderQuestions();
    renderQuizHeader();
}

// ============ QUESTION CONTROLS ============

function updatePoints(questionId, points) {
    const val = Math.max(1, parseInt(points) || 1);
    const q = quizQuestions.find(q => q.id === questionId);
    if (q) { q.point_value = val; renderQuizHeader(); updateSummary(); }
}

function updateLines(questionId, lines) {
    const val = Math.max(1, parseInt(lines) || 5);
    const q = quizQuestions.find(q => q.id === questionId);
    if (q) q.answer_space_lines = val;
}

function removeQuestion(index) {
    if (confirm('Remove this question from the quiz?')) {
        quizQuestions.splice(index, 1);
        renderQuestions();
        renderQuizHeader();
    }
}

// ============ EDIT / CREATE QUESTION MODAL ============

function openEditModal(questionId) {
    const q = quizQuestions.find(q => q.id === questionId);
    if (!q) return;
    populateEditModal(q);
    document.getElementById('editModalTitle').textContent = 'Edit Question';
    document.getElementById('editQuestionModal').classList.add('show');
}

function openCreateModal() {
    const blank = { id: null, question_text: '', question_type: 'multiple_choice', difficulty: 'medium', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: '' };
    populateEditModal(blank);
    document.getElementById('editModalTitle').textContent = 'Create New Question';
    document.getElementById('editQuestionModal').classList.add('show');
}

function populateEditModal(q) {
    document.getElementById('editQuestionId').value = q.id || '';
    document.getElementById('editQuestionText').value = q.question_text || '';
    document.getElementById('editQuestionType').value = q.question_type || 'multiple_choice';
    document.getElementById('editDifficulty').value = q.difficulty || 'medium';
    document.getElementById('editOptionA').value = q.option_a || '';
    document.getElementById('editOptionB').value = q.option_b || '';
    document.getElementById('editOptionC').value = q.option_c || '';
    document.getElementById('editOptionD').value = q.option_d || '';
    document.getElementById('editCorrectAnswer').value = q.correct_answer || '';
    toggleEditOptions();
}

function toggleEditOptions() {
    const type = document.getElementById('editQuestionType').value;
    const container = document.getElementById('editOptionsContainer');
    container.style.display = (type === 'multiple_choice') ? 'block' : 'none';
}

async function saveEditedQuestion() {
    const qId = document.getElementById('editQuestionId').value;
    const questionData = {
        question_text: document.getElementById('editQuestionText').value,
        question_type: document.getElementById('editQuestionType').value,
        difficulty: document.getElementById('editDifficulty').value,
        option_a: document.getElementById('editOptionA').value,
        option_b: document.getElementById('editOptionB').value,
        option_c: document.getElementById('editOptionC').value,
        option_d: document.getElementById('editOptionD').value,
        correct_answer: document.getElementById('editCorrectAnswer').value
    };

    if (!questionData.question_text.trim()) {
        alert('Please enter question text.');
        return;
    }

    if (qId) {
        // Editing existing question
        const q = quizQuestions.find(q => q.id === parseInt(qId));
        if (q) Object.assign(q, questionData);
    } else {
        // Creating new question — try server first, fall back to local
        let newId = null;
        try {
            const saved = await apiRequest(API_CONFIG.ENDPOINTS.QUESTIONS, {
                method: 'POST',
                body: JSON.stringify({
                    ...questionData,
                    subject_id: quizData.subject_id || null
                })
            });
            newId = saved.id || saved.insertId || saved.questionId;
        } catch (error) {
            // Server endpoint not ready yet — use local temp ID
            console.warn('Server save not available, using local ID:', error.message);
            localIdCounter++;
            newId = localIdCounter;
        }

        quizQuestions.push({
            ...questionData,
            id: newId,
            point_value: 1,
            answer_space_lines: 5
        });
    }

    closeEditModal();
    renderQuestions();
    renderQuizHeader();
    showSaveBanner();
}

function closeEditModal() {
    document.getElementById('editQuestionModal').classList.remove('show');
}

// ============ ADD QUESTIONS MODAL ============

async function openAddQuestionsModal() {
    selectedQuestions.clear();
    document.getElementById('questionSearchInput').value = '';

    try {
        let url = API_CONFIG.ENDPOINTS.QUESTIONS;
        if (quizData.subject_id) {
            url += `?subjectId=${quizData.subject_id}`;
        }
        allBankQuestions = await apiRequest(url);

        const existingIds = new Set(quizQuestions.map(q => q.id));
        allBankQuestions = allBankQuestions.filter(q => !existingIds.has(q.id));

        renderQuestionBank(allBankQuestions);
    } catch (error) {
        console.warn('Could not load question bank:', error.message);
        allBankQuestions = [];
        renderQuestionBank([]);
    }
    document.getElementById('addQuestionsModal').classList.add('show');
}

function filterQuestionBank() {
    const search = document.getElementById('questionSearchInput').value.toLowerCase().trim();
    if (!search) { renderQuestionBank(allBankQuestions); return; }
    const filtered = allBankQuestions.filter(q =>
        (q.question_text && q.question_text.toLowerCase().includes(search)) ||
        (q.topic && q.topic.toLowerCase().includes(search)) ||
        (q.question_type && q.question_type.toLowerCase().includes(search))
    );
    renderQuestionBank(filtered);
}

function renderQuestionBank(questions) {
    const container = document.getElementById('questionBankList');

    if (questions.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6073a0; padding: 20px;">No questions available. Try a different search or create a new question below.</p>';
        return;
    }

    container.innerHTML = questions.map(q => `
        <div class="question-bank-item ${selectedQuestions.has(q.id) ? 'selected' : ''}" onclick="toggleQuestionSelection(${q.id}, this)">
            <input type="checkbox" class="question-checkbox" ${selectedQuestions.has(q.id) ? 'checked' : ''}>
            <div style="flex: 1;">
                <div style="color: #1f2f57; font-weight: 500; margin-bottom: 6px;">${escapeHtml(q.question_text)}</div>
                <div style="color: #6073a0; font-size: 0.85rem;">
                    ${escapeHtml(formatQuestionType(q.question_type))}
                    &bull; Difficulty: ${escapeHtml(q.difficulty || 'medium')}
                    ${q.topic ? '&bull; Topic: ' + escapeHtml(q.topic) : ''}
                </div>
            </div>
        </div>
    `).join('');
}

function toggleQuestionSelection(questionId, element) {
    const cb = element.querySelector('.question-checkbox');
    cb.checked = !cb.checked;
    if (cb.checked) { selectedQuestions.add(questionId); element.classList.add('selected'); }
    else { selectedQuestions.delete(questionId); element.classList.remove('selected'); }
}

async function addSelectedQuestions() {
    if (selectedQuestions.size === 0) { alert('Please select at least one question.'); return; }

    selectedQuestions.forEach(qId => {
        const question = allBankQuestions.find(q => q.id === qId);
        if (question) quizQuestions.push({ ...question, point_value: 1, answer_space_lines: 5 });
    });

    renderQuestions();
    renderQuizHeader();
    closeAddQuestionsModal();
}

function closeAddQuestionsModal() {
    document.getElementById('addQuestionsModal').classList.remove('show');
}

// ============ PRINT PREVIEW ============

function openPrintPreview(type) {
    const content = document.getElementById('printPreviewContent');
    document.getElementById('printPreviewTitle').textContent = type === 'answer-key' ? 'Print Preview - Answer Key' : 'Print Preview - Student Version';
    content.innerHTML = `
        <div class="print-preview-header">
            <h2>${escapeHtml(quizData.title)}</h2>
            <p>${escapeHtml(quizData.subject_name || '')} &bull; Total Points: ${calculateTotalPoints()}</p>
            <p style="margin-top: 8px;">Name: ___________________ Date: ___________</p>
        </div>
        ${quizQuestions.map((q, i) => generatePrintQuestion(q, i + 1, type)).join('')}`;
    document.getElementById('printPreviewModal').classList.add('show');
}

function generatePrintQuestion(q, number, type) {
    const showAnswers = type === 'answer-key';
    let content = `<div class="print-question">
        <div class="print-question-header"><strong>Question ${number}</strong><span>${q.point_value || 1} point${(q.point_value || 1) !== 1 ? 's' : ''}</span></div>
        <div class="print-question-text">${escapeHtml(q.question_text)}</div>`;

    if (q.question_type === 'multiple_choice') {
        content += '<div class="print-options">';
        [{l:'A',t:q.option_a},{l:'B',t:q.option_b},{l:'C',t:q.option_c},{l:'D',t:q.option_d}].filter(o=>o.t).forEach(o => {
            const isCorrect = showAnswers && o.t === q.correct_answer;
            content += `<div class="print-option ${isCorrect ? 'correct' : ''}">${o.l}) ${escapeHtml(o.t)}${isCorrect ? ' \u2713' : ''}</div>`;
        });
        content += '</div>';
    } else if (q.question_type === 'true_false') {
        content += '<div class="print-options">';
        content += `<div class="print-option ${showAnswers && q.correct_answer === 'True' ? 'correct' : ''}">True ${showAnswers && q.correct_answer === 'True' ? '\u2713' : ''}</div>`;
        content += `<div class="print-option ${showAnswers && q.correct_answer === 'False' ? 'correct' : ''}">False ${showAnswers && q.correct_answer === 'False' ? '\u2713' : ''}</div>`;
        content += '</div>';
    } else {
        if (showAnswers && q.correct_answer) {
            content += `<div class="print-option correct"><strong>Answer:</strong> ${escapeHtml(q.correct_answer)}</div>`;
        } else {
            for (let i = 0; i < (q.answer_space_lines || 5); i++) content += '<div class="answer-space">&nbsp;</div>';
        }
    }
    return content + '</div>';
}

function closePrintPreview() { document.getElementById('printPreviewModal').classList.remove('show'); }

// ============ SAVE QUIZ ============

async function saveQuiz() {
    try {
        await apiRequest(`${API_CONFIG.ENDPOINTS.QUIZZES}/${quizId}`, {
            method: 'PUT',
            body: JSON.stringify({
                questions: quizQuestions.map((q, index) => ({
                    id: q.id,
                    question_order: index + 1,
                    point_value: q.point_value || 1,
                    answer_space_lines: q.answer_space_lines || 5
                }))
            })
        });
        showSaveBanner();
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to save quiz.');
    }
}

// ============ SAVE BANNER ============

function showSaveBanner() {
    const banner = document.getElementById('saveBanner');
    banner.classList.add('show');
    setTimeout(() => banner.classList.remove('show'), 2500);
}

// ============ INIT ============

loadQuizData();