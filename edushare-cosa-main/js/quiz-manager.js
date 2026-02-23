/* ===================================================== */
/* ============= QUIZ MANAGER PAGE JS ================== */
/* ===================================================== */

let currentShareLink = '';

// Toggle quiz expansion
function toggleQuiz(quizId) {
    const expandedDiv = document.getElementById(`expanded-${quizId}`);
    const icon = document.getElementById(`icon-${quizId}`);
    const header = document.getElementById(`header-${quizId}`);

    expandedDiv.classList.toggle('show');
    icon.classList.toggle('rotated');
    header.classList.toggle('expanded');
}

// Load quizzes
async function loadQuizzes() {
    try {
        const quizzes = await apiRequest(API_CONFIG.ENDPOINTS.QUIZZES);
        const container = document.getElementById('quizList');

        if (quizzes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg width="64" height="64" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="9" y1="15" x2="15" y2="15"/>
                    </svg>
                    <h3>No quizzes yet</h3>
                    <p>Create your first quiz to get started!</p>
                    <a href="create-quiz.html" class="create-quiz-btn">
                        <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"/>
                            <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Create New Quiz
                    </a>
                </div>
            `;
            return;
        }

        container.innerHTML = quizzes.map(quiz => generateQuizRow(quiz)).join('');
    } catch (error) {
        console.error('Error loading quizzes:', error);
        alert('Failed to load quizzes. Please refresh the page.');
    }
}

// Generate quiz row HTML
function generateQuizRow(quiz) {
    const questionList = (quiz.questions || []).map((q, index) => `
        <div class="question-item">
            <div class="question-number">${index + 1}</div>
            <div class="question-content">
                <div class="question-text">${escapeHtml(q.QuestionText)}</div>
                <div class="question-meta">
                    <span>
                        <svg width="14" height="14" fill="currentColor">
                            <circle cx="7" cy="7" r="7"/>
                        </svg>
                        ${escapeHtml(q.QuestionType)}
                    </span>
                    <span>Difficulty: ${q.Difficulty}/5</span>
                    <span>${q.PointValue} pt${q.PointValue !== 1 ? 's' : ''}</span>
                </div>
            </div>
        </div>
    `).join('');

    return `
        <div class="quiz-row">
            <div class="quiz-header" id="header-${quiz.QuizID}" onclick="toggleQuiz(${quiz.QuizID})">
                <svg id="icon-${quiz.QuizID}" class="expand-icon" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"/>
                </svg>
                <div class="quiz-main-info">
                    <div class="quiz-name">
                        <h3>${escapeHtml(quiz.QuizName)}</h3>
                        <p>${escapeHtml(quiz.CourseName || 'No course')}</p>
                    </div>
                    <div class="quiz-stat">
                        <strong>${quiz.QuestionCount || 0}</strong> questions
                    </div>
                    <div class="quiz-stat">
                        <strong>${quiz.TotalPoints || 0}</strong> points
                    </div>
                    <div class="quiz-stat">
                        ${formatDate(quiz.UpdatedAt)}
                    </div>
                    <span class="status-badge status-${quiz.Status.toLowerCase()}">${escapeHtml(quiz.Status)}</span>
                </div>
            </div>
            
            <div class="quiz-expanded" id="expanded-${quiz.QuizID}">
                <div class="quiz-description">
                    <p class="${!quiz.QuizDescription ? 'empty-description' : ''}">
                        ${escapeHtml(quiz.QuizDescription || 'No description provided')}
                    </p>
                </div>
                
                <div class="quiz-actions">
                    <button class="action-btn action-btn-primary" onclick="window.location.href='my-quiz.html?id=${quiz.QuizID}'">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                        </svg>
                        View/Edit Questions
                    </button>
                    <button class="action-btn" onclick="duplicateQuiz(${quiz.QuizID})">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                        Duplicate
                    </button>
                    <button class="action-btn" onclick="shareQuiz(${quiz.QuizID}, '${escapeHtml(quiz.QuizName)}')">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                        </svg>
                        Share
                    </button>
                    <button class="action-btn" onclick="printPreview(${quiz.QuizID}, 'student')">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="6 9 6 2 18 2 18 9"/>
                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                            <rect x="6" y="14" width="12" height="8"/>
                        </svg>
                        Print Quiz
                    </button>
                    <button class="action-btn" onclick="printPreview(${quiz.QuizID}, 'answer-key')">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                            <polyline points="10 9 9 9 8 9"/>
                        </svg>
                        Print Answer Key
                    </button>
                    <button class="action-btn" onclick="exportQuiz(${quiz.QuizID})">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        Export
                    </button>
                    <button class="action-btn action-btn-danger" onclick="deleteQuiz(${quiz.QuizID}, '${escapeHtml(quiz.QuizName)}')">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                        Delete
                    </button>
                </div>
                
                <div class="quiz-stats-grid">
                    <div class="stat-box">
                        <div class="number">${quiz.QuestionCount || 0}</div>
                        <div class="label">Questions</div>
                    </div>
                    <div class="stat-box">
                        <div class="number">${quiz.TotalPoints || 0}</div>
                        <div class="label">Total Points</div>
                    </div>
                    <div class="stat-box">
                        <div class="number">${calculateAvgDifficulty(quiz.questions)}</div>
                        <div class="label">Avg. Difficulty</div>
                    </div>
                    <div class="stat-box">
                        <div class="number">${escapeHtml(quiz.Status)}</div>
                        <div class="label">Status</div>
                    </div>
                </div>
                
                ${quiz.QuestionCount > 0 ? `
                    <div class="quiz-questions-list">
                        <h4>Questions in this quiz:</h4>
                        ${questionList}
                    </div>
                ` : '<p style="color: #6073a0; text-align: center; margin-top: 20px;">No questions added yet. Click "View/Edit Questions" to add some!</p>'}
            </div>
        </div>
    `;
}

// Helper
function calculateAvgDifficulty(questions) {
    if (!questions || questions.length === 0) return '\u2014';
    const sum = questions.reduce((acc, q) => acc + (q.Difficulty || 0), 0);
    return (sum / questions.length).toFixed(1);
}

// Action functions
async function duplicateQuiz(quizId) {
    if (confirm('Create a copy of this quiz?')) {
        try {
            await apiRequest(`${API_CONFIG.ENDPOINTS.QUIZZES}/${quizId}/duplicate`, { method: 'POST' });
            alert('Quiz duplicated successfully!');
            loadQuizzes();
        } catch (error) {
            console.error('Error duplicating quiz:', error);
            alert('Failed to duplicate quiz.');
        }
    }
}

function shareQuiz(quizId, quizName) {
    currentShareLink = `${window.location.origin}/browse-quizzes.html?quiz=${quizId}`;
    document.getElementById('shareLinkInput').value = currentShareLink;
    document.getElementById('shareModal').classList.add('show');
}

function copyShareLink() {
    const input = document.getElementById('shareLinkInput');
    input.select();
    document.execCommand('copy');
    alert('Link copied to clipboard!');
}

function closeShareModal() {
    document.getElementById('shareModal').classList.remove('show');
}

function printPreview(quizId, type) {
    window.open(`print-quiz.html?id=${quizId}&type=${type}`, '_blank');
}

function exportQuiz(quizId) {
    window.location.href = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.QUIZZES}/${quizId}/export`;
}

async function deleteQuiz(quizId, quizName) {
    if (confirm(`Are you sure you want to delete "${quizName}"? This action cannot be undone.`)) {
        try {
            await apiRequest(`${API_CONFIG.ENDPOINTS.QUIZZES}/${quizId}`, { method: 'DELETE' });
            alert('Quiz deleted successfully!');
            loadQuizzes();
        } catch (error) {
            console.error('Error deleting quiz:', error);
            alert('Failed to delete quiz.');
        }
    }
}

// Load quizzes on page load
loadQuizzes();
