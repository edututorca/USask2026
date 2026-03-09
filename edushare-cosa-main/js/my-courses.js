/* ===================================================== */
/* ============= MY COURSES PAGE JS ==================== */
/* ===================================================== */

let coursesData = [];
let quizzesData = [];

// Toggle course expansion
function toggleCourse(courseId) {
    const expandedDiv = document.getElementById(`course-expanded-${courseId}`);
    const icon = document.getElementById(`course-icon-${courseId}`);
    const header = document.getElementById(`course-header-${courseId}`);

    expandedDiv.classList.toggle('show');
    icon.classList.toggle('rotated');
    header.classList.toggle('expanded');
}

// Check URL for a specific course to auto-expand
function getTargetCourse() {
    const params = new URLSearchParams(window.location.search);
    return params.get('course');
}

// Load all data
async function loadCoursesData() {
    try {
        const [courses, quizzes] = await Promise.all([
            apiRequest(API_CONFIG.ENDPOINTS.COURSES),
            apiRequest(API_CONFIG.ENDPOINTS.QUIZZES)
        ]);

        coursesData = courses;
        quizzesData = quizzes;

        renderCourses();

        // Auto-expand if a course was specified in the URL
        const targetCourse = getTargetCourse();
        if (targetCourse) {
            const match = coursesData.find(c => c.CourseName === targetCourse);
            if (match) {
                toggleCourse(match.CourseID);
                // Scroll to it
                const header = document.getElementById(`course-header-${match.CourseID}`);
                if (header) header.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    } catch (error) {
        console.error('Error loading courses:', error);
        document.getElementById('coursesList').innerHTML = `
            <div class="empty-state">
                <h3>Could not load courses</h3>
                <p>Please check your server connection and try again.</p>
                <button class="add-course-btn" onclick="loadCoursesData()">Retry</button>
            </div>`;
    }
}

function renderCourses() {
    const container = document.getElementById('coursesList');

    if (coursesData.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
                <h3>No courses yet</h3>
                <p>Add your first course to get started!</p>
                <a href="Add-course.html" class="add-course-btn">
                    <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Add Course
                </a>
            </div>`;
        return;
    }

    container.innerHTML = coursesData.map(course => {
        const courseQuizzes = quizzesData.filter(q => q.subject_name === course.CourseName);
        const quizCount = courseQuizzes.length;
        const questionCount = courseQuizzes.reduce((sum, q) => sum + (q.question_count || 0), 0);

        return `
            <div class="course-row">
                <div class="course-header" id="course-header-${course.CourseID}" onclick="toggleCourse(${course.CourseID})">
                    <svg id="course-icon-${course.CourseID}" class="expand-icon" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"/>
                    </svg>
                    <div class="course-main-info">
                        <div class="course-name">
                            <h3>${escapeHtml(course.CourseName)}</h3>
                            <p>Grade 9-12</p>
                        </div>
                        <div class="course-stat"><strong>${quizCount}</strong> quiz${quizCount !== 1 ? 'zes' : ''}</div>
                        <div class="course-stat"><strong>${questionCount}</strong> question${questionCount !== 1 ? 's' : ''}</div>
                    </div>
                </div>

                <div class="course-expanded" id="course-expanded-${course.CourseID}">
                    ${quizCount > 0 ? `
                        <div class="course-quizzes">
                            <h4>Quizzes in ${escapeHtml(course.CourseName)}:</h4>
                            ${courseQuizzes.map(quiz => {
                                const statusLabel = quiz.is_public ? 'Published' : 'Draft';
                                const statusClass = quiz.is_public ? 'published' : 'draft';
                                return `
                                    <div class="quiz-row-item" onclick="window.location.href='my-quiz.html?id=${quiz.id}'">
                                        <div class="quiz-row-info">
                                            <div class="quiz-row-title">${escapeHtml(quiz.title)}</div>
                                            <div class="quiz-row-meta">
                                                <span>${quiz.question_count || 0} questions</span>
                                                <span>${quiz.total_points || 0} points</span>
                                                <span>${formatDate(quiz.created_at)}</span>
                                            </div>
                                        </div>
                                        <span class="status-badge status-${statusClass}">${statusLabel}</span>
                                    </div>`;
                            }).join('')}
                        </div>
                    ` : `
                        <div class="course-empty">
                            <p>No quizzes for this course yet.</p>
                            <a href="create-quiz.html" class="create-link">Create a quiz &rarr;</a>
                        </div>
                    `}

                    <div class="course-actions">
                        <a href="create-quiz.html" class="action-btn action-btn-primary">
                            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            Create Quiz
                        </a>
                        <a href="ai-question-creator.html" class="action-btn">
                            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
                            </svg>
                            AI Generate Questions
                        </a>
                    </div>
                </div>
            </div>`;
    }).join('');
}

loadCoursesData();