/* ===================================================== */
/* ========= LOAD USER'S COURSES FROM DATABASE ======== */
/* ===================================================== */
/**
 * Loads courses from Course table via UserCourse junction table
 * Shows only courses the logged-in teacher has selected
 */
(function () {
    // Color palette for course dots
    const COLORS = ['bg-green', 'bg-blue', 'bg-purple', 'bg-orange', 'bg-red', 'bg-teal'];

    async function loadCourses() {
        const userId = getCurrentUserId();
        if (!userId) {
            console.warn('No user ID found');
            return;
        }

        const list = document.getElementById('courseList');
        if (!list) return;

        showLoading(list, 'Loading courses...');

        try {
            // Fetch user's courses
            const data = await apiRequest(`${API_CONFIG.ENDPOINTS.USER_COURSES}?userId=${userId}`);
            const courses = data.courses || data || [];

            if (courses.length === 0) {
                list.innerHTML = '<li style="color: #999;">No courses added yet</li>';
                return;
            }

            // Build course list HTML
            const html = courses.map((course, index) => {
                const color = COLORS[index % COLORS.length];
                const courseName = course.CourseName || course.courseName || 'Untitled Course';
                
                // Truncate long course names
                const displayName = courseName.length > 25 
                    ? courseName.substring(0, 22) + '...' 
                    : courseName;

                return `
                    <li>
                        <span class="dot ${color}"></span>
                        ${escapeHtml(displayName)}
                    </li>
                `;
            }).join('');

            list.innerHTML = html;

        } catch (error) {
            console.error('Failed to load courses:', error);
            list.innerHTML = '<li style="color: #c33;">Failed to load courses</li>';
        }
    }

    // Load courses when page loads
    document.addEventListener('DOMContentLoaded', loadCourses);
    
    // Make function available globally
    window.loadCourses = loadCourses;
})();