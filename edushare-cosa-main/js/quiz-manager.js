/* ===================================================== */
/* ============= QUIZ MANAGER PAGE JS ================== */
/* ===================================================== */

let currentShareLink = '';

function toggleQuiz(quizId) {
    const expandedDiv = document.getElementById(`expanded-${quizId}`);
    const icon = document.getElementById(`icon-${quizId}`);
    const header = document.getElementById(`header-${quizId}`);
    expandedDiv.classList.toggle('show');
    icon.classList.toggle('rotated');
    header.classList.toggle('expanded');
}

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
                            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Create New Quiz
                    </a>
                </div>`;
            return;
        }

        container.innerHTML = quizzes.map(quiz => generateQuizRow(quiz)).join('');
    } catch (error) {
        console.error('Error loading quizzes:', error);
        document.getElementById('quizList').innerHTML = `
            <div class="empty-state">
                <h3>Could not load quizzes</h3>
                <p>Please check your server connection and try again.</p>
                <button class="create-quiz-btn" onclick="loadQuizzes()">Retry</button>
            </div>`;
    }
}

function formatQuestionType(type) {
    const types = { 'multiple_choice': 'Multiple Choice', 'true_false': 'True/False', 'short_answer': 'Short Answer', 'essay': 'Essay' };
    return types[type] || type;
}

function calculateAvgDifficulty(questions) {
    if (!questions || questions.length === 0) return '\u2014';
    const diffMap = { 'easy': 1, 'medium': 2, 'hard': 3 };
    const sum = questions.reduce((acc, q) => acc + (diffMap[q.difficulty] || 2), 0);
    return (sum / questions.length).toFixed(1);
}

function generateQuizRow(quiz) {
    const statusLabel = quiz.is_public ? 'Published' : 'Draft';
    const statusClass = quiz.is_public ? 'published' : 'draft';

    const questionList = (quiz.questions || []).map((q, index) => `
        <div class="question-item">
            <div class="question-number">${index + 1}</div>
            <div class="question-content">
                <div class="question-text">${escapeHtml(q.question_text)}</div>
                <div class="question-meta">
                    <span><svg width="14" height="14" fill="currentColor"><circle cx="7" cy="7" r="7"/></svg> ${escapeHtml(formatQuestionType(q.question_type))}</span>
                    <span>Difficulty: ${escapeHtml(q.difficulty || 'medium')}</span>
                    <span>${q.point_value || 1} pt${(q.point_value || 1) !== 1 ? 's' : ''}</span>
                </div>
            </div>
        </div>
    `).join('');

    return `
        <div class="quiz-row">
            <div class="quiz-header" id="header-${quiz.id}" onclick="toggleQuiz(${quiz.id})">
                <svg id="icon-${quiz.id}" class="expand-icon" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"/>
                </svg>
                <div class="quiz-main-info">
                    <div class="quiz-name">
                        <h3>${escapeHtml(quiz.title)}</h3>
                        <p>${escapeHtml(quiz.subject_name || 'No subject')}</p>
                    </div>
                    <div class="quiz-stat"><strong>${quiz.question_count || 0}</strong> questions</div>
                    <div class="quiz-stat"><strong>${quiz.total_points || 0}</strong> points</div>
                    <div class="quiz-stat">${formatDate(quiz.created_at)}</div>
                    <span class="status-badge status-${statusClass}">${statusLabel}</span>
                </div>
            </div>
            
            <div class="quiz-expanded" id="expanded-${quiz.id}">
                <div class="quiz-description">
                    <p class="${!quiz.description ? 'empty-description' : ''}">${escapeHtml(quiz.description || 'No description provided')}</p>
                </div>
                
                <div class="quiz-actions">
                    <button class="action-btn action-btn-primary" onclick="window.location.href='my-quiz.html?id=${quiz.id}'">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                        View/Edit Questions
                    </button>
                    <button class="action-btn" onclick="duplicateQuiz(${quiz.id})">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        Duplicate
                    </button>
                    <button class="action-btn" onclick="shareQuiz(${quiz.id}, '${escapeHtml(quiz.title)}')">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                        Share
                    </button>
                    <button class="action-btn action-btn-danger" onclick="deleteQuiz(${quiz.id}, '${escapeHtml(quiz.title)}')">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        Delete
                    </button>
                </div>
                
                <div class="quiz-stats-grid">
                    <div class="stat-box"><div class="number">${quiz.question_count || 0}</div><div class="label">Questions</div></div>
                    <div class="stat-box"><div class="number">${quiz.total_points || 0}</div><div class="label">Total Points</div></div>
                    <div class="stat-box"><div class="number">${calculateAvgDifficulty(quiz.questions)}</div><div class="label">Avg. Difficulty</div></div>
                    <div class="stat-box"><div class="number">${statusLabel}</div><div class="label">Status</div></div>
                </div>
                
                ${(quiz.question_count || 0) > 0 ? `
                    <div class="quiz-questions-list">
                        <h4>Questions in this quiz:</h4>
                        ${questionList}
                    </div>
                ` : '<p style="color: #6073a0; text-align: center; margin-top: 20px;">No questions added yet. Click "View/Edit Questions" to add some!</p>'}
            </div>
        </div>`;
}

async function duplicateQuiz(quizId) {
    if (confirm('Create a copy of this quiz?')) {
        try {
            await apiRequest(`${API_CONFIG.ENDPOINTS.QUIZZES}/${quizId}/duplicate`, { method: 'POST' });
            alert('Quiz duplicated successfully!');
            loadQuizzes();
        } catch (error) { console.error('Error:', error); alert('Failed to duplicate quiz.'); }
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

function closeShareModal() { document.getElementById('shareModal').classList.remove('show'); }

async function deleteQuiz(quizId, quizName) {
    if (confirm(`Are you sure you want to delete "${quizName}"? This action cannot be undone.`)) {
        try {
            await apiRequest(`${API_CONFIG.ENDPOINTS.QUIZZES}/${quizId}`, { method: 'DELETE' });
            alert('Quiz deleted successfully!');
            loadQuizzes();
        } catch (error) { console.error('Error:', error); alert('Failed to delete quiz.'); }
    }
}

loadQuizzes();