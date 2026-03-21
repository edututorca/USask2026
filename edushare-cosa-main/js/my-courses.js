/* ===================================================== */
/* ============= MY COURSES PAGE JS ==================== */
/* ===================================================== */

const userId = getCurrentUserId() || 1;

async function loadCoursesData() {
    try {
        const [courses, quizzes] = await Promise.all([
            apiRequest('/user-courses?userId=' + userId),
            apiRequest('/quizzes?userId=' + userId)
        ]);

        renderCourses(courses, quizzes);

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

function renderCourses(courses, quizzes) {
    const container = document.getElementById('coursesList');

    if (!courses || courses.length === 0) {
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

    // Group courses by subject
    const grouped = {};
    courses.forEach(c => {
        const subName = c.subject_name;
        if (!grouped[subName]) {
            grouped[subName] = {
                subjectId: c.subject_id,
                courses: []
            };
        }
        grouped[subName].courses.push(c);
    });

    let html = '';

    for (const [subjectName, data] of Object.entries(grouped)) {
        const subjectId = data.subjectId;
        const subjectCourses = data.courses;

        // Count quizzes for this subject
        const subjectQuizzes = quizzes.filter(q => q.subject_id === subjectId || q.subject_name === subjectName);
        const quizCount = subjectQuizzes.length;

        const subKey = subjectName.toLowerCase().replace(/\s+/g, '-');

        html += `
        <div class="course-row">
            <div class="course-header" id="course-header-${subKey}" onclick="toggleSubject('${subKey}')">
                <svg id="course-icon-${subKey}" class="expand-icon" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"/>
                </svg>
                <div class="course-main-info">
                    <div class="course-name">
                        <h3>${escapeHtml(subjectName)}</h3>
                        <p>${subjectCourses.length} course${subjectCourses.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div class="course-stat"><strong>${quizCount}</strong> quiz${quizCount !== 1 ? 'zes' : ''}</div>
                </div>
            </div>

            <div class="course-expanded" id="course-expanded-${subKey}">
                <!-- Course codes under this subject -->
                <div class="course-codes-list">
                    ${subjectCourses.map(c => {
                        const label = c.section ? c.course_code + ' — ' + c.section : c.course_code;
                        return `
                        <div class="course-code-item">
                            <div class="course-code-info">
                                <span class="course-code-label">${escapeHtml(label)}</span>
                                ${c.nickname ? '<span class="course-code-nickname">' + escapeHtml(c.nickname) + '</span>' : ''}
                            </div>
                            <button class="course-code-remove" onclick="removeCourse(${c.id}, this)" title="Remove course">&times;</button>
                        </div>`;
                    }).join('')}
                </div>

                <!-- Quizzes for this subject -->
                ${quizCount > 0 ? `
                    <div class="course-quizzes">
                        <h4>Quizzes</h4>
                        ${subjectQuizzes.map(quiz => {
                            const statusLabel = quiz.is_public ? 'Published' : 'Draft';
                            const statusClass = quiz.is_public ? 'published' : 'draft';
                            return `
                            <div class="quiz-row-item" onclick="window.location.href='my-quiz.html?id=${quiz.id}'">
                                <div class="quiz-row-info">
                                    <div class="quiz-row-title">${escapeHtml(quiz.title)}</div>
                                    <div class="quiz-row-meta">
                                        <span>${quiz.question_count || 0} questions</span>
                                        <span>${formatDate(quiz.created_at)}</span>
                                    </div>
                                </div>
                                <span class="status-badge status-${statusClass}">${statusLabel}</span>
                            </div>`;
                        }).join('')}
                    </div>
                ` : `
                    <div class="course-empty">
                        <p>No quizzes for this subject yet.</p>
                    </div>
                `}

                <!-- Actions -->
                <div class="course-actions">
                    <a href="create-quiz.html?subject=${subjectId}" class="action-btn action-btn-primary">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Create Quiz
                    </a>
                    <a href="User-Area.html" class="action-btn">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="8" cy="8" r="6"/><path d="M8 12v-4M8 6h.01"/>
                        </svg>
                        Question Bank
                    </a>
                </div>
            </div>
        </div>`;
    }

    container.innerHTML = html;

    // Auto-expand if URL param provided
    const params = new URLSearchParams(window.location.search);
    const targetCourse = params.get('course');
    if (targetCourse) {
        const key = targetCourse.toLowerCase().replace(/\s+/g, '-');
        const el = document.getElementById('course-expanded-' + key);
        if (el) {
            toggleSubject(key);
            document.getElementById('course-header-' + key).scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}

function toggleSubject(subKey) {
    const expandedDiv = document.getElementById('course-expanded-' + subKey);
    const icon = document.getElementById('course-icon-' + subKey);
    const header = document.getElementById('course-header-' + subKey);

    expandedDiv.classList.toggle('show');
    icon.classList.toggle('rotated');
    header.classList.toggle('expanded');
}

async function removeCourse(courseId, btn) {
    if (!confirm('Remove this course? Your questions and quizzes won\'t be affected.')) return;

    btn.disabled = true;
    try {
        await apiRequest('/user-courses/' + courseId, { method: 'DELETE' });
        // Reload the page data
        loadCoursesData();
    } catch (err) {
        console.error('Failed to remove course:', err);
        alert('Failed to remove course.');
        btn.disabled = false;
    }
}

loadCoursesData();