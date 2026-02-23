/* ===================================================== */
/* ============= DASHBOARD PAGE JS ===================== */
/* ===================================================== */

// Load dashboard data
async function loadDashboardData() {
    try {
        const stats = await apiRequest(API_CONFIG.ENDPOINTS.DASHBOARD_STATS);

        document.getElementById('totalCourses').textContent = stats.totalCourses || 0;
        document.getElementById('totalQuizzes').textContent = stats.totalQuizzes || 0;
        document.getElementById('totalQuestions').textContent = stats.totalQuestions || 0;
        document.getElementById('experiencePoints').textContent = stats.experiencePoints || 0;
        document.getElementById('userName').textContent = stats.firstName || 'Teacher';

        // Load active classes
        loadActiveClasses();

        // Load recent quizzes
        loadRecentQuizzes();

    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Load active classes
async function loadActiveClasses() {
    try {
        const courses = await apiRequest(API_CONFIG.ENDPOINTS.COURSES + '?status=active');
        const container = document.getElementById('activeClassesList');

        if (courses.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                    </svg>
                    <p>No active classes yet</p>
                    <a href="Add-course.html" class="btn">Add Your First Course</a>
                </div>
            `;
            return;
        }

        container.innerHTML = courses.slice(0, 5).map(course => `
            <div class="class-item" onclick="window.location.href='User-Area.html?course=${course.CourseID}'">
                <div class="class-info">
                    <h3>${escapeHtml(course.CourseName)}</h3>
                    <p>${escapeHtml(course.CourseCode || 'No code')} &bull; ${escapeHtml(course.SubjectName || 'General')}</p>
                </div>
                <div class="class-actions">
                    <button class="icon-btn" onclick="event.stopPropagation(); editCourse(${course.CourseID})" title="Edit">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                        </svg>
                    </button>
                    <button class="icon-btn" onclick="event.stopPropagation(); archiveCourse(${course.CourseID})" title="Archive">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4"/>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading active classes:', error);
    }
}

// Load recent quizzes
async function loadRecentQuizzes() {
    try {
        const quizzes = await apiRequest(API_CONFIG.ENDPOINTS.QUIZZES_RECENT + '?limit=5');
        const container = document.getElementById('recentQuizzesList');

        if (quizzes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <p>No quizzes created yet</p>
                    <a href="create-quiz.html" class="btn">Create Your First Quiz</a>
                </div>
            `;
            return;
        }

        container.innerHTML = quizzes.map(quiz => `
            <div class="quiz-item" onclick="window.location.href='my-quiz.html?id=${quiz.QuizID}'">
                <div class="quiz-info">
                    <h3>${escapeHtml(quiz.QuizName)}</h3>
                    <div class="quiz-meta">
                        <span>
                            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12 6 12 12 16 14"/>
                            </svg>
                            ${formatDate(quiz.UpdatedAt)}
                        </span>
                        <span>
                            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M12 16v-4M12 8h.01"/>
                            </svg>
                            ${quiz.QuestionCount || 0} questions
                        </span>
                    </div>
                </div>
                <span class="status-badge status-${quiz.Status.toLowerCase()}">${escapeHtml(quiz.Status)}</span>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading recent quizzes:', error);
    }
}

// Load archived classes
async function loadArchivedClasses() {
    try {
        const courses = await apiRequest(API_CONFIG.ENDPOINTS.COURSES + '?status=archived');
        const container = document.getElementById('archivedClassesList');

        if (courses.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No archived classes</p>
                </div>
            `;
            return;
        }

        container.innerHTML = courses.map(course => `
            <div class="class-item">
                <div class="class-info">
                    <h3>${escapeHtml(course.CourseName)}</h3>
                    <p>${escapeHtml(course.CourseCode || 'No code')} &bull; Archived ${formatDate(course.ArchivedAt)}</p>
                </div>
                <div class="class-actions">
                    <button class="icon-btn" onclick="restoreCourse(${course.CourseID})" title="Restore">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="1 4 1 10 7 10"/>
                            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading archived classes:', error);
    }
}

// Course action functions
function editCourse(courseId) {
    // TODO: Implement edit course functionality
    console.log('Edit course:', courseId);
}

function archiveCourse(courseId) {
    if (confirm('Archive this course? You can restore it later.')) {
        // TODO: Implement archive functionality
        console.log('Archive course:', courseId);
    }
}

function restoreCourse(courseId) {
    // TODO: Implement restore functionality
    console.log('Restore course:', courseId);
}

// Load data on page load
loadDashboardData();
