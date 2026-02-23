/* ===================================================== */
/* ============= CREATE QUIZ PAGE JS =================== */
/* ===================================================== */

// Load user's courses into the dropdown
async function loadCourses() {
    try {
        const courses = await apiRequest(API_CONFIG.ENDPOINTS.COURSES);
        const select = document.getElementById('courseSelect');

        courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.CourseID;
            option.textContent = `${course.CourseName}${course.CourseCode ? ' (' + course.CourseCode + ')' : ''}`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading courses:', error);
        alert('Failed to load courses. Please refresh the page.');
    }
}

// Handle form submission
document.getElementById('createQuizForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        quizName: document.getElementById('quizName').value.trim(),
        courseId: document.getElementById('courseSelect').value,
        description: document.getElementById('quizDescription').value.trim()
    };

    try {
        const result = await apiRequest(API_CONFIG.ENDPOINTS.QUIZZES_CREATE, {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        // Show success message
        const successMsg = document.getElementById('successMessage');
        successMsg.classList.add('show');

        // Redirect to my-quiz page after 1.5 seconds
        setTimeout(() => {
            window.location.href = `my-quiz.html?id=${result.quizId}`;
        }, 1500);

    } catch (error) {
        console.error('Error creating quiz:', error);
        alert('Failed to create quiz. Please try again.');
    }
});

// Load courses on page load
loadCourses();
