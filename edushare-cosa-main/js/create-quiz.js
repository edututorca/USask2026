/* ===================================================== */
/* ============= CREATE QUIZ PAGE JS =================== */
/* ===================================================== */

// Load subjects into the dropdown
async function loadSubjects() {
    try {
        const subjects = await apiRequest(API_CONFIG.ENDPOINTS.SUBJECTS);
        const select = document.getElementById('subjectSelect');

        subjects.forEach(subject => {
            const option = document.createElement('option');
            // Handle both column naming conventions
            option.value = subject.subject_id || subject.SubjectID;
            option.textContent = subject.subject_name || subject.SubjectName;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading subjects:', error);
        // Don't block the form — user can still type quiz name and create
        const select = document.getElementById('subjectSelect');
        select.innerHTML = '<option value="">Could not load subjects</option>';
    }
}

// Handle form submission
document.getElementById('createQuizForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating...';

    const formData = {
        title: document.getElementById('quizName').value.trim(),
        subject_id: document.getElementById('subjectSelect').value || null,
        description: document.getElementById('quizDescription').value.trim(),
        is_public: document.getElementById('isPublic').checked ? 1 : 0
    };

    if (!formData.title) {
        alert('Please enter a quiz name.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Quiz';
        return;
    }

    try {
        const result = await apiRequest(API_CONFIG.ENDPOINTS.QUIZZES_CREATE, {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        // Show success banner
        const banner = document.getElementById('successBanner');
        banner.classList.add('show');

        // Get the new quiz ID from response
        const newQuizId = result.quizId || result.id || result.insertId;

        // Redirect to edit page after 1.5 seconds
        setTimeout(() => {
            if (newQuizId) {
                window.location.href = `my-quiz.html?id=${newQuizId}`;
            } else {
                window.location.href = 'quiz-manager.html';
            }
        }, 1500);

    } catch (error) {
        console.error('Error creating quiz:', error);
        alert('Failed to create quiz. Please try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Quiz';
    }
});

// Pre-select subject if coming from My Courses page
function checkURLParams() {
    const params = new URLSearchParams(window.location.search);
    const subjectId = params.get('subject');
    if (subjectId) {
        // Wait for subjects to load, then select
        const interval = setInterval(() => {
            const select = document.getElementById('subjectSelect');
            if (select.options.length > 1) {
                select.value = subjectId;
                clearInterval(interval);
            }
        }, 100);
        // Stop trying after 3 seconds
        setTimeout(() => clearInterval(interval), 3000);
    }
}

// Init
loadSubjects();
checkURLParams();