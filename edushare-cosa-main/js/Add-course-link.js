// js/add-course-link.js
// Handle "Add Course" button from user-area.html

document.addEventListener('DOMContentLoaded', function () {
    // Get the Add Course button
    const btn = document.getElementById('btnAddCourse');
    if (!btn) {
        // Button not found on this page, nothing to do
        return;
    }

    // When user clicks on "+ Add Course"
    btn.addEventListener('click', function () {
        // Optional: clear any flag about AddCourse previously opened
        try {
            sessionStorage.removeItem('AddCourseOpen');
        } catch (e) {
            // Ignore storage errors
            console.warn('Could not access sessionStorage:', e);
        }

        // Redirect to the Add Course page
        window.location.href = 'Add-course.html';
    });
});
