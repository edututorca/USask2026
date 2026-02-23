/* ===================================================== */
/* ============= BROWSE QUIZZES PAGE JS ================ */
/* ===================================================== */

let allQuizzes = [];
let userRatings = {};
let currentReportQuizId = null;

// Load community quizzes
async function loadQuizzes() {
    try {
        const [quizzes, ratings, subjects] = await Promise.all([
            apiRequest(API_CONFIG.ENDPOINTS.QUIZZES_COMMUNITY),
            apiRequest(API_CONFIG.ENDPOINTS.QUIZZES_MY_RATINGS),
            apiRequest(API_CONFIG.ENDPOINTS.SUBJECTS)
        ]);

        allQuizzes = quizzes;
        userRatings = ratings;

        // Populate subject filter
        const subjectFilter = document.getElementById('subjectFilter');
        subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.SubjectID;
            option.textContent = subject.SubjectName;
            subjectFilter.appendChild(option);
        });

        renderQuizzes(allQuizzes);
    } catch (error) {
        console.error('Error loading quizzes:', error);
        alert('Failed to load quizzes. Please refresh the page.');
    }
}

// Render quizzes
function renderQuizzes(quizzes) {
    const container = document.getElementById('quizzesGrid');

    if (quizzes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                </svg>
                <h3>No quizzes found</h3>
                <p>Try adjusting your filters or be the first to share a quiz!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = quizzes.map(quiz => `
        <div class="quiz-card">
            <div class="quiz-card-header">
                <h3 class="quiz-card-title">${escapeHtml(quiz.QuizName)}</h3>
                <div class="quiz-card-meta">
                    <span>
                        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                        </svg>
                        ${escapeHtml(quiz.SubjectName || 'General')}
                    </span>
                    <span>
                        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        ${formatDate(quiz.CreatedAt)}
                    </span>
                </div>
            </div>
            
            <div class="quiz-card-body">
                <p class="quiz-description">${escapeHtml(quiz.QuizDescription || 'No description provided.')}</p>
                
                <div class="quiz-stats">
                    <div class="stat-item">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 16v-4M12 8h.01"/>
                        </svg>
                        <strong>${quiz.QuestionCount || 0}</strong> questions
                    </div>
                    <div class="stat-item">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                        <strong>${quiz.CopyCount || 0}</strong> copies
                    </div>
                </div>

                <div class="rating-container">
                    <div class="stars" data-quiz-id="${quiz.QuizID}">
                        ${generateStars(quiz.QuizID, quiz.AvgRating || 0, userRatings[quiz.QuizID])}
                    </div>
                    <span class="rating-text">${(quiz.AvgRating || 0).toFixed(1)} (${quiz.RatingCount || 0} ratings)</span>
                </div>
            </div>

            <div class="quiz-card-actions">
                <button class="action-btn btn-primary" onclick="copyQuiz(${quiz.QuizID}, '${escapeHtml(quiz.QuizName)}')">
                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                    Copy to My Quizzes
                </button>
                <button class="action-btn btn-secondary" onclick="openReportModal(${quiz.QuizID})">
                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');

    attachStarHandlers();
}

// Generate star HTML
function generateStars(quizId, avgRating, userRating) {
    let stars = '';
    const rating = userRating || Math.round(avgRating);

    for (let i = 1; i <= 5; i++) {
        const filled = i <= rating ? 'filled' : '';
        stars += `
            <svg class="star ${filled}" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" data-rating="${i}">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
        `;
    }
    return stars;
}

// Attach star click handlers
function attachStarHandlers() {
    document.querySelectorAll('.stars').forEach(container => {
        const quizId = parseInt(container.dataset.quizId);
        const stars = container.querySelectorAll('.star');

        stars.forEach(star => {
            star.addEventListener('click', () => {
                const rating = parseInt(star.dataset.rating);
                rateQuiz(quizId, rating);
            });
        });
    });
}

// Rate quiz
async function rateQuiz(quizId, rating) {
    try {
        await apiRequest(`${API_CONFIG.ENDPOINTS.QUIZZES}/${quizId}/rate`, {
            method: 'POST',
            body: JSON.stringify({ rating })
        });

        userRatings[quizId] = rating;
        await loadQuizzes();
    } catch (error) {
        console.error('Error rating quiz:', error);
        alert('Failed to submit rating. Please try again.');
    }
}

// Copy quiz
async function copyQuiz(quizId, quizName) {
    if (!confirm(`Copy "${quizName}" to your quizzes?`)) return;

    try {
        await apiRequest(`${API_CONFIG.ENDPOINTS.QUIZZES}/${quizId}/copy`, { method: 'POST' });

        const toast = document.getElementById('successToast');
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);

        await loadQuizzes();
    } catch (error) {
        console.error('Error copying quiz:', error);
        alert('Failed to copy quiz. Please try again.');
    }
}

// Report functions
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
        alert('Failed to submit report. Please try again.');
    }
});

// Filter quizzes
function filterQuizzes() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const subjectFilter = document.getElementById('subjectFilter').value;
    const gradeFilter = document.getElementById('gradeFilter').value;
    const sortFilter = document.getElementById('sortFilter').value;

    let filtered = allQuizzes.filter(quiz => {
        const matchesSearch = quiz.QuizName.toLowerCase().includes(searchTerm) ||
                            (quiz.QuizDescription || '').toLowerCase().includes(searchTerm);
        const matchesSubject = !subjectFilter || quiz.SubjectID == subjectFilter;
        const matchesGrade = !gradeFilter || quiz.Grade == gradeFilter;

        return matchesSearch && matchesSubject && matchesGrade;
    });

    // Sort
    if (sortFilter === 'rating') {
        filtered.sort((a, b) => (b.AvgRating || 0) - (a.AvgRating || 0));
    } else if (sortFilter === 'popular') {
        filtered.sort((a, b) => (b.CopyCount || 0) - (a.CopyCount || 0));
    } else {
        filtered.sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));
    }

    renderQuizzes(filtered);
}

// Load quizzes on page load
loadQuizzes();
