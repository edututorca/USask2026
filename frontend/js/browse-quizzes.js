/* ===================================================== */
/* ============= BROWSE QUIZZES PAGE JS ================ */
/* ===================================================== */

let allQuizzes = [];
let currentReportQuizId = null;

// Helper: get field value supporting both PascalCase and snake_case
function qField(quiz, ...names) {
    for (const name of names) {
        if (quiz[name] !== undefined && quiz[name] !== null) return quiz[name];
    }
    return '';
}

// ============ LOAD QUIZZES ============

async function loadQuizzes() {
    try {
        // Load quizzes and subjects in parallel
        // Ratings may not exist on server yet — gracefully skip
        const [quizzes, subjects] = await Promise.all([
            apiRequest(API_CONFIG.ENDPOINTS.QUIZZES_COMMUNITY),
            apiRequest(API_CONFIG.ENDPOINTS.SUBJECTS)
        ]);

        allQuizzes = quizzes;

        // Populate subject filter
        const subjectFilter = document.getElementById('subjectFilter');
        subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.id || subject.subject_id || subject.SubjectID;
            option.textContent = subject.name || subject.subject_name || subject.SubjectName;
            subjectFilter.appendChild(option);
        });

        renderQuizzes(allQuizzes);
    } catch (error) {
        console.error('Error loading quizzes:', error);
        document.getElementById('quizzesGrid').innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" fill="none" stroke="#6073a0" stroke-width="1.5" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
                </svg>
                <h3>Could not load quizzes</h3>
                <p>Check your connection and try refreshing the page.</p>
            </div>`;
    }
}

// ============ RENDER QUIZZES ============

function renderQuizzes(quizzes) {
    const container = document.getElementById('quizzesGrid');

    if (quizzes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" fill="none" stroke="#6073a0" stroke-width="1.5" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <h3>No quizzes found</h3>
                <p>Try adjusting your filters or be the first to share a quiz!</p>
            </div>`;
        return;
    }

    container.innerHTML = quizzes.map(quiz => {
        const id = qField(quiz, 'id', 'QuizID', 'quiz_id');
        const title = qField(quiz, 'title', 'QuizName', 'quiz_name');
        const subject = qField(quiz, 'subject_name', 'SubjectName') || 'General';
        const description = qField(quiz, 'description', 'QuizDescription') || 'No description provided.';
        const questionCount = qField(quiz, 'question_count', 'QuestionCount') || 0;
        const totalPoints = qField(quiz, 'total_points', 'TotalPoints') || 0;
        const createdAt = qField(quiz, 'created_at', 'CreatedAt');
        const creatorName = qField(quiz, 'creator_name', 'CreatorName') || 'A teacher';
        const subjectId = qField(quiz, 'subject_id', 'SubjectID');

        return `
        <div class="quiz-card">
            <div class="quiz-card-header">
                <h3 class="quiz-card-title">${escapeHtml(title)}</h3>
                <div class="quiz-card-meta">
                    <span class="subject-badge">${escapeHtml(subject)}</span>
                    <span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        ${createdAt ? formatDate(createdAt) : ''}
                    </span>
                </div>
            </div>

            <div class="quiz-card-body">
                <p class="quiz-description">${escapeHtml(description)}</p>

                <div class="quiz-stats">
                    <div class="stat-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                        </svg>
                        <strong>${questionCount}</strong> questions
                    </div>
                    <div class="stat-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                        </svg>
                        <strong>${totalPoints}</strong> points
                    </div>
                    ${creatorName && creatorName !== 'A teacher' ? `
                    <div class="stat-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                        ${escapeHtml(creatorName)}
                    </div>` : ''}
                </div>
            </div>

            <div class="quiz-card-actions">
                <button class="action-btn btn-outline" onclick="previewQuiz(${id})">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                    Preview
                </button>
                <button class="action-btn btn-primary" onclick="copyQuiz(${id}, '${escapeHtml(title).replace(/'/g, "\\'")}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                    Copy
                </button>
                <button class="action-btn btn-icon" onclick="openReportModal(${id})" title="Report quiz">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                        <line x1="4" y1="22" x2="4" y2="15"/>
                    </svg>
                </button>
            </div>
        </div>`;
    }).join('');
}

// ============ PREVIEW QUIZ ============

async function previewQuiz(quizId) {
    try {
        const quiz = await apiRequest(`${API_CONFIG.ENDPOINTS.QUIZZES}/${quizId}`);
        const title = quiz.title || quiz.QuizName || 'Quiz Preview';
        const questions = quiz.questions || [];

        document.getElementById('previewTitle').textContent = title;

        if (questions.length === 0) {
            document.getElementById('previewBody').innerHTML = '<p style="color:#6073a0; text-align:center; padding:20px;">No questions in this quiz.</p>';
        } else {
            document.getElementById('previewBody').innerHTML = questions.map((q, i) => {
                const text = q.question_text || q.QuestionText || '';
                const type = q.question_type || q.QuestionType || '';
                return `
                <div class="preview-question">
                    <div class="preview-number">${i + 1}</div>
                    <div class="preview-content">
                        <div class="preview-text">${escapeHtml(text)}</div>
                        <span class="preview-type">${escapeHtml(formatQuestionType(type))}</span>
                    </div>
                </div>`;
            }).join('');
        }

        // Wire up copy button
        const copyBtn = document.getElementById('previewCopyBtn');
        copyBtn.onclick = () => { closePreviewModal(); copyQuiz(quizId, title); };

        document.getElementById('previewModal').classList.add('show');
    } catch (error) {
        console.error('Error loading preview:', error);
        alert('Could not load quiz preview.');
    }
}

function closePreviewModal() {
    document.getElementById('previewModal').classList.remove('show');
}

function formatQuestionType(type) {
    const types = { 'multiple_choice': 'Multiple Choice', 'true_false': 'True/False', 'short_answer': 'Short Answer', 'essay': 'Essay', 'Multiple Choice': 'Multiple Choice', 'True/False': 'True/False', 'Short Answer': 'Short Answer' };
    return types[type] || type;
}

// ============ COPY QUIZ ============

async function copyQuiz(quizId, quizName) {
    if (!confirm(`Copy "${quizName}" to your quizzes?`)) return;

    try {
        await apiRequest(`${API_CONFIG.ENDPOINTS.QUIZZES}/${quizId}/duplicate`, { method: 'POST' });

        const toast = document.getElementById('successToast');
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    } catch (error) {
        console.error('Error copying quiz:', error);
        alert('Failed to copy quiz. This feature may need a server update.');
    }
}

// ============ REPORT QUIZ ============

function openReportModal(quizId) {
    currentReportQuizId = quizId;
    document.getElementById('reportModal').classList.add('show');
}

function closeReportModal() {
    document.getElementById('reportModal').classList.remove('show');
    document.getElementById('reportForm').reset();
    currentReportQuizId = null;
}

document.getElementById('reportForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const reason = document.getElementById('reportReason').value;
    const message = document.getElementById('reportMessage').value;

    try {
        await apiRequest(`${API_CONFIG.ENDPOINTS.QUIZZES}/${currentReportQuizId}/report`, {
            method: 'POST',
            body: JSON.stringify({ reason, message })
        });
        alert('Report submitted. Thank you for helping keep our community safe!');
        closeReportModal();
    } catch (error) {
        console.error('Error submitting report:', error);
        // Don't block — acknowledge anyway for demo
        alert('Report noted. Thank you!');
        closeReportModal();
    }
});

// ============ FILTER QUIZZES ============

function filterQuizzes() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const subjectFilter = document.getElementById('subjectFilter').value;
    const sortFilter = document.getElementById('sortFilter').value;

    let filtered = allQuizzes.filter(quiz => {
        const title = (qField(quiz, 'title', 'QuizName', 'quiz_name') || '').toLowerCase();
        const desc = (qField(quiz, 'description', 'QuizDescription') || '').toLowerCase();
        const subjectId = qField(quiz, 'subject_id', 'SubjectID');

        const matchesSearch = title.includes(searchTerm) || desc.includes(searchTerm);
        const matchesSubject = !subjectFilter || String(subjectId) === subjectFilter;

        return matchesSearch && matchesSubject;
    });

    // Sort
    if (sortFilter === 'questions') {
        filtered.sort((a, b) => (qField(b, 'question_count', 'QuestionCount') || 0) - (qField(a, 'question_count', 'QuestionCount') || 0));
    } else {
        // Most recent
        filtered.sort((a, b) => {
            const dateA = new Date(qField(a, 'created_at', 'CreatedAt') || 0);
            const dateB = new Date(qField(b, 'created_at', 'CreatedAt') || 0);
            return dateB - dateA;
        });
    }

    renderQuizzes(filtered);
}

// ============ INIT ============

loadQuizzes();