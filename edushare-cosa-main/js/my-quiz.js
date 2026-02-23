/* ===================================================== */
/* ============= MY QUIZ (EDIT) PAGE JS ================ */
/* ===================================================== */

let quizId = null;
let quizData = null;
let quizQuestions = [];
let selectedQuestions = new Set();
let draggedElement = null;

// Get quiz ID from URL
function getQuizIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Load quiz data
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
    } catch (error) {
        console.error('Error loading quiz:', error);
        alert('Failed to load quiz. Please try again.');
    }
}

// Render quiz header
function renderQuizHeader() {
    document.getElementById('quizName').textContent = quizData.QuizName;
    document.getElementById('quizMeta').innerHTML = `
        <span>
            <svg width="16" height="16" fill="currentColor">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            ${escapeHtml(quizData.CourseName || 'No course')}
        </span>
        <span>
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4M12 8h.01"/>
            </svg>
            ${quizQuestions.length} question${quizQuestions.length !== 1 ? 's' : ''}
        </span>
        <span>
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            ${calculateTotalPoints()} points
        </span>
    `;
}

// Render questions list
function renderQuestions() {
    const container = document.getElementById('questionsList');
    document.getElementById('questionCount').textContent =
        `${quizQuestions.length} question${quizQuestions.length !== 1 ? 's' : ''}`;

    if (quizQuestions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 16v-4M12 8h.01"/>
                </svg>
                <h3>No questions yet</h3>
                <p>Click "Add Questions" to get started!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = quizQuestions.map((q, index) => `
        <div class="question-item" draggable="true" data-index="${index}">
            <div class="drag-handle" title="Drag to reorder">
                <svg width="20" height="20" fill="currentColor">
                    <circle cx="6" cy="4" r="2"/><circle cx="6" cy="10" r="2"/><circle cx="6" cy="16" r="2"/>
                    <circle cx="14" cy="4" r="2"/><circle cx="14" cy="10" r="2"/><circle cx="14" cy="16" r="2"/>
                </svg>
            </div>
            <div class="question-number">${index + 1}</div>
            <div class="question-content">
                <div class="question-text">${escapeHtml(q.QuestionText)}</div>
                <div class="question-details">
                    <span class="question-meta-item">
                        <svg width="14" height="14" fill="currentColor"><circle cx="7" cy="7" r="7"/></svg>
                        ${escapeHtml(q.QuestionType)}
                    </span>
                    <span class="question-meta-item">Difficulty: ${q.Difficulty}/5</span>
                    <div class="question-controls">
                        <select class="points-selector" data-question-id="${q.QuestionID}" onchange="updatePoints(${q.QuestionID}, this.value)">
                            ${[1, 2, 3, 4, 5, 10].map(p =>
                                `<option value="${p}" ${p === (q.PointValue || 1) ? 'selected' : ''}>${p} pt${p !== 1 ? 's' : ''}</option>`
                            ).join('')}
                        </select>
                        ${(q.QuestionType === 'Short Answer') ? `
                            <select class="lines-selector" data-question-id="${q.QuestionID}" onchange="updateLines(${q.QuestionID}, this.value)">
                                <option value="3" ${(q.AnswerSpaceLines || 5) === 3 ? 'selected' : ''}>3 lines</option>
                                <option value="5" ${(q.AnswerSpaceLines || 5) === 5 ? 'selected' : ''}>5 lines</option>
                                <option value="10" ${(q.AnswerSpaceLines || 5) === 10 ? 'selected' : ''}>10 lines</option>
                                <option value="15" ${(q.AnswerSpaceLines || 5) === 15 ? 'selected' : ''}>15 lines</option>
                                <option value="20" ${(q.AnswerSpaceLines || 5) === 20 ? 'selected' : ''}>20 lines</option>
                            </select>
                        ` : ''}
                    </div>
                </div>
            </div>
            <div class="question-actions">
                <button class="icon-btn" onclick="editQuestion(${q.QuestionID})" title="Edit">
                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                    </svg>
                </button>
                <button class="icon-btn icon-btn-danger" onclick="removeQuestion(${index})" title="Remove">
                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');

    setupDragAndDrop();
}

// Drag and drop functionality
function setupDragAndDrop() {
    const items = document.querySelectorAll('.question-item');
    items.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragend', handleDragEnd);
    });
}

function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragOver(e) {
    if (e.preventDefault) e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (this !== draggedElement) this.classList.add('drag-over');
    return false;
}

function handleDrop(e) {
    if (e.stopPropagation) e.stopPropagation();
    if (draggedElement !== this) {
        const fromIndex = parseInt(draggedElement.dataset.index);
        const toIndex = parseInt(this.dataset.index);
        const item = quizQuestions.splice(fromIndex, 1)[0];
        quizQuestions.splice(toIndex, 0, item);
        renderQuestions();
    }
    this.classList.remove('drag-over');
    return false;
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    document.querySelectorAll('.question-item').forEach(item => {
        item.classList.remove('drag-over');
    });
}

// Question management functions
function updatePoints(questionId, points) {
    const question = quizQuestions.find(q => q.QuestionID === questionId);
    if (question) {
        question.PointValue = parseInt(points);
        renderQuizHeader();
    }
}

function updateLines(questionId, lines) {
    const question = quizQuestions.find(q => q.QuestionID === questionId);
    if (question) {
        question.AnswerSpaceLines = parseInt(lines);
    }
}

function editQuestion(questionId) {
    window.location.href = `question-creator.html?edit=${questionId}`;
}

function removeQuestion(index) {
    if (confirm('Remove this question from the quiz?')) {
        quizQuestions.splice(index, 1);
        renderQuestions();
        renderQuizHeader();
    }
}

function calculateTotalPoints() {
    return quizQuestions.reduce((sum, q) => sum + (q.PointValue || 1), 0);
}

// Add questions modal
async function openAddQuestionsModal() {
    selectedQuestions.clear();

    try {
        const allQuestions = await apiRequest(API_CONFIG.ENDPOINTS.QUESTIONS);
        const existingIds = new Set(quizQuestions.map(q => q.QuestionID));
        const availableQuestions = allQuestions.filter(q => !existingIds.has(q.QuestionID));

        const container = document.getElementById('questionBankList');

        if (availableQuestions.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #6073a0;">All available questions are already in this quiz!</p>';
        } else {
            container.innerHTML = availableQuestions.map(q => `
                <div class="question-bank-item" onclick="toggleQuestionSelection(${q.QuestionID}, this)">
                    <input type="checkbox" class="question-checkbox" data-question-id="${q.QuestionID}">
                    <div style="flex: 1;">
                        <div style="color: #1f2f57; font-weight: 500; margin-bottom: 6px;">${escapeHtml(q.QuestionText)}</div>
                        <div style="color: #6073a0; font-size: 0.85rem;">${escapeHtml(q.QuestionType)} &bull; Difficulty: ${q.Difficulty}/5</div>
                    </div>
                </div>
            `).join('');
        }

        document.getElementById('addQuestionsModal').classList.add('show');
    } catch (error) {
        console.error('Error loading questions:', error);
        alert('Failed to load questions.');
    }
}

function toggleQuestionSelection(questionId, element) {
    const checkbox = element.querySelector('.question-checkbox');
    checkbox.checked = !checkbox.checked;

    if (checkbox.checked) {
        selectedQuestions.add(questionId);
        element.classList.add('selected');
    } else {
        selectedQuestions.delete(questionId);
        element.classList.remove('selected');
    }
}

async function addSelectedQuestions() {
    if (selectedQuestions.size === 0) {
        alert('Please select at least one question.');
        return;
    }

    try {
        const allQuestions = await apiRequest(API_CONFIG.ENDPOINTS.QUESTIONS);

        selectedQuestions.forEach(qId => {
            const question = allQuestions.find(q => q.QuestionID === qId);
            if (question) {
                quizQuestions.push({
                    ...question,
                    PointValue: 1,
                    AnswerSpaceLines: 5
                });
            }
        });

        renderQuestions();
        renderQuizHeader();
        closeAddQuestionsModal();
    } catch (error) {
        console.error('Error adding questions:', error);
        alert('Failed to add questions.');
    }
}

function closeAddQuestionsModal() {
    document.getElementById('addQuestionsModal').classList.remove('show');
}

// Print preview functions
function openPrintPreview(type) {
    const modal = document.getElementById('printPreviewModal');
    const content = document.getElementById('printPreviewContent');
    const title = document.getElementById('printPreviewTitle');

    title.textContent = type === 'answer-key' ? 'Print Preview - Answer Key' : 'Print Preview - Student Version';

    content.innerHTML = `
        <div class="print-preview-header">
            <h2>${escapeHtml(quizData.QuizName)}</h2>
            <p>${escapeHtml(quizData.CourseName || '')} &bull; Total Points: ${calculateTotalPoints()}</p>
            <p style="margin-top: 8px;">Name: ___________________ Date: ___________</p>
        </div>
        ${quizQuestions.map((q, index) => generatePrintQuestion(q, index + 1, type)).join('')}
    `;

    modal.classList.add('show');
}

function generatePrintQuestion(q, number, type) {
    const showAnswers = type === 'answer-key';
    let content = `
        <div class="print-question">
            <div class="print-question-header">
                <strong>Question ${number}</strong>
                <span>${q.PointValue || 1} point${(q.PointValue || 1) !== 1 ? 's' : ''}</span>
            </div>
            <div class="print-question-text">${escapeHtml(q.QuestionText)}</div>
    `;

    if (q.QuestionType === 'Multiple Choice' && q.options) {
        content += '<div class="print-options">';
        q.options.forEach((opt, i) => {
            const letter = String.fromCharCode(65 + i);
            const isCorrect = showAnswers && opt.IsCorrect;
            content += `<div class="print-option ${isCorrect ? 'correct' : ''}">${letter}) ${escapeHtml(opt.OptionText)}${isCorrect ? ' \u2713' : ''}</div>`;
        });
        content += '</div>';
    } else if (q.QuestionType === 'True/False') {
        content += '<div class="print-options">';
        content += `<div class="print-option ${showAnswers && q.CorrectAnswer === 'True' ? 'correct' : ''}">True ${showAnswers && q.CorrectAnswer === 'True' ? '\u2713' : ''}</div>`;
        content += `<div class="print-option ${showAnswers && q.CorrectAnswer === 'False' ? 'correct' : ''}">False ${showAnswers && q.CorrectAnswer === 'False' ? '\u2713' : ''}</div>`;
        content += '</div>';
    } else if (q.QuestionType === 'Short Answer') {
        const lines = q.AnswerSpaceLines || 5;
        for (let i = 0; i < lines; i++) {
            content += '<div class="answer-space">&nbsp;</div>';
        }
    }

    content += '</div>';
    return content;
}

function closePrintPreview() {
    document.getElementById('printPreviewModal').classList.remove('show');
}

// Save quiz
async function saveQuiz() {
    try {
        await apiRequest(`${API_CONFIG.ENDPOINTS.QUIZZES}/${quizId}`, {
            method: 'PUT',
            body: JSON.stringify({
                questions: quizQuestions.map((q, index) => ({
                    QuestionID: q.QuestionID,
                    OrderNumber: index + 1,
                    PointValue: q.PointValue || 1,
                    AnswerSpaceLines: q.AnswerSpaceLines || 5
                }))
            })
        });

        alert('Quiz saved successfully!');
    } catch (error) {
        console.error('Error saving quiz:', error);
        alert('Failed to save quiz. Please try again.');
    }
}

// Load quiz on page load
loadQuizData();
