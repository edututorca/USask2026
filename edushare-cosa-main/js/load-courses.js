/* ===================================================== */
/* ========= LOAD USER'S COURSES (ROBUST) ============== */
/* ===================================================== */
(function () {
    const COLORS = ['bg-green', 'bg-blue', 'bg-purple', 'bg-orange', 'bg-red', 'bg-teal'];

    async function loadCourses() {
        console.log('[load-courses] Starting loadCourses...');
        const list = document.getElementById('courseList');
        if (!list) {
            console.error('[load-courses] #courseList element not found!');
            return;
        }

        let allCourses = [];

        // 1. LOAD FROM SESSION STORAGE (LOCAL ADDS)
        try {
            const stored = sessionStorage.getItem('myCourses');
            if (stored) {
                const localCourses = JSON.parse(stored);
                console.log('[load-courses] Found local courses in session:', localCourses);

                localCourses.forEach(lc => {
                    const code = lc.code || lc.courseCode || 'UNTITLED';
                    const name = lc.name || lc.courseName || lc.category || lc.fullPath || 'New Course';
                    const category = lc.category || lc.courseCategory || 'General';

                    const exists = allCourses.some(c => (c.code || c.courseCode || c.CourseCode) === code);
                    if (!exists) {
                        allCourses.push({ code, name, category, isLocal: true });
                    }
                });
            }
        } catch (e) {
            console.warn('[load-courses] Failed to load local courses:', e);
        }

        // INITIAL RENDER (DEMO + LOCAL)
        renderCourseList(allCourses, list);

        // 3. TRY API IN BACKGROUND
        const userId = getCurrentUserId();
        if (userId) {
            console.log('[load-courses] Attempting API load for user:', userId);
            try {
                const data = await apiRequest(`${API_CONFIG.ENDPOINTS.USER_COURSES}?userId=${userId}`);
                const apiCourses = data.courses || data || [];

                if (Array.isArray(apiCourses)) {
                    let changed = false;
                    apiCourses.forEach(ac => {
                        const code = ac.CourseCode || ac.courseCode || ac.code;
                        if (!code) return;

                        const exists = allCourses.some(c => (c.code || c.courseCode || c.CourseCode) === code);
                        if (!exists) {
                            allCourses.push({
                                code: code,
                                name: ac.CourseName || ac.courseName || ac.name || 'API Course',
                                category: ac.CourseCategory || ac.courseCategory || ac.category || 'General'
                            });
                            changed = true;
                        }
                    });
                    if (changed) {
                        console.log('[load-courses] API load successful, re-rendering list');
                        renderCourseList(allCourses, list);
                    }
                }
            } catch (e) {
                console.warn('[load-courses] API block failed (ignoring):', e);
            }
        } else {
            console.log('[load-courses] No userId found, skipping API load.');
        }
    }

    function renderCourseList(courses, container) {
        console.log('[load-courses] Rendering courses:', courses.length);

        container.innerHTML = '';
        if (courses.length === 0) {
            container.innerHTML = '<li style="color: #999; padding: 10px;">No courses found</li>';
            return;
        }

        courses.forEach((course, index) => {
            const color = COLORS[index % COLORS.length];
            const code = course.code || course.courseCode || course.CourseCode || '';
            const name = course.name || course.courseName || course.CourseName || 'Untitled';
            const cat = course.category || course.courseCategory || course.CourseCategory || '';

            const li = document.createElement('li');
            li.className = 'course-item';

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'course-btn';

            // Inline styles to ensure it looks good even if CSS classes are missing/changed
            btn.style.width = '100%';
            btn.style.textAlign = 'left';
            btn.style.display = 'flex';
            btn.style.alignItems = 'center';
            btn.style.gap = '10px';
            btn.style.padding = '8px 12px';
            btn.style.borderRadius = '8px';
            btn.style.background = 'transparent';
            btn.style.border = 'none';
            btn.style.color = '#fff';
            btn.style.cursor = 'pointer';
            btn.style.fontSize = '14px';
            btn.style.transition = 'background 0.2s';

            const dot = document.createElement('span');
            dot.className = `dot ${color}`;
            dot.style.flexShrink = '0';

            const txt = document.createElement('span');
            txt.textContent = code; // USER REQ: Only show the code
            txt.style.whiteSpace = 'nowrap';
            txt.style.overflow = 'hidden';
            txt.style.textOverflow = 'ellipsis';

            btn.appendChild(dot);
            btn.appendChild(txt);

            btn.addEventListener('click', () => {
                console.log('[load-courses] Course clicked:', code);
                document.querySelectorAll('.course-btn').forEach(b => {
                    b.classList.remove('active');
                    b.style.background = 'transparent';
                });
                btn.classList.add('active');
                btn.style.background = 'rgba(255, 255, 255, 0.1)';

                if (window.loadSubjectsForCourse) {
                    window.loadSubjectsForCourse(cat, code);
                } else {
                    console.error('[load-courses] window.loadSubjectsForCourse not found!');
                }
            });

            btn.onmouseover = () => { if (!btn.classList.contains('active')) btn.style.background = 'rgba(255,255,255,0.05)'; };
            btn.onmouseout = () => { if (!btn.classList.contains('active')) btn.style.background = 'transparent'; };

            li.appendChild(btn);
            container.appendChild(li);
        });
    }

    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadCourses);
    } else {
        loadCourses();
    }

    window.loadCourses = loadCourses;
})();