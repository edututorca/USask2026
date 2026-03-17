/* ===================================================== */
/* ============= DASHBOARD PAGE JS ===================== */
/* ===================================================== */

const dashUserId = getCurrentUserId() || 1;

async function loadDashboardData() {
    try {
        const stats = await apiRequest(`${API_CONFIG.ENDPOINTS.DASHBOARD_STATS}?userId=${dashUserId}`);

        document.getElementById('totalCourses').textContent = stats.totalCourses || 0;
        document.getElementById('totalQuizzes').textContent = stats.totalQuizzes || 0;
        document.getElementById('totalQuestions').textContent = stats.totalQuestions || 0;
        document.getElementById('userName').textContent = stats.firstName || 'Teacher';

        loadActiveClasses();
        loadRecentQuizzes();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

async function loadActiveClasses() {
    try {
        const courses = await apiRequest(`/user-courses?userId=${dashUserId}`);
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
                </div>`;
            return;
        }

        container.innerHTML = courses.slice(0, 5).map(course => {
            const label = course.section ? `${course.course_code} — ${course.section}` : course.course_code;
            return `
            <div class="class-item" onclick="window.location.href='User-Area.html'">
                <div class="class-info">
                    <h3>${escapeHtml(label)}</h3>
                    <p>${escapeHtml(course.subject_name)}</p>
                </div>
            </div>`;
        }).join('');
    } catch (error) {
        console.error('Error loading active classes:', error);
    }
}

async function loadRecentQuizzes() {
    try {
        const quizzes = await apiRequest(`${API_CONFIG.ENDPOINTS.QUIZZES_RECENT}?userId=${dashUserId}&limit=5`);
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
                </div>`;
            return;
        }

        container.innerHTML = quizzes.map(quiz => {
            const statusLabel = quiz.is_public ? 'Published' : 'Draft';
            const statusClass = quiz.is_public ? 'published' : 'draft';
            return `
                <div class="quiz-item" onclick="window.location.href='my-quiz.html?id=${quiz.id}'">
                    <div class="quiz-info">
                        <h3>${escapeHtml(quiz.title)}</h3>
                        <div class="quiz-meta">
                            <span>
                                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                ${formatDate(quiz.created_at)}
                            </span>
                            <span>
                                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                                ${quiz.question_count || 0} questions
                            </span>
                        </div>
                    </div>
                    <span class="status-badge status-${statusClass}">${statusLabel}</span>
                </div>`;
        }).join('');
    } catch (error) {
        console.error('Error loading recent quizzes:', error);
    }
}

async function loadArchivedClasses() {
    document.getElementById('archivedClassesList').innerHTML = `
        <div class="empty-state"><p>No archived classes</p></div>`;
}

loadDashboardData();