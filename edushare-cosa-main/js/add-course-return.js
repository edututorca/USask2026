// js/add-course-return.js
// Read all courses stored in sessionStorage ("myCourses")
// and show them under "My Courses" as clickable buttons.
// When a course is clicked, set it as active and load subjects
// for that course from the database.

document.addEventListener('DOMContentLoaded', function () {
    let stored = null;

    try {
        stored = sessionStorage.getItem('myCourses');
    } catch (err) {
        console.warn('Could not read myCourses from sessionStorage:', err);
        return;
    }

    if (!stored) {
        // No courses stored
        return;
    }

    let courses = [];
    try {
        courses = JSON.parse(stored);
    } catch (err) {
        console.warn('Could not parse myCourses JSON:', err);
        return;
    }

    const courseList = document.getElementById('courseList');
    if (!courseList) {
        return;
    }

    // If the list only has "Loading courses..." text, clear it
    if (
        courseList.children.length === 1 &&
        courseList.children[0].textContent.toLowerCase().includes('loading')
    ) {
        courseList.innerHTML = '';
    }

    // Render each course as a clickable button
    courses.forEach(course => {
        const li = document.createElement('li');
        li.className = 'course-item';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'course-btn';
        // Example text: "English – ENG 010"
        btn.textContent = `${course.category} – ${course.code}`;

        // Data attributes for future use (category and code)
        btn.dataset.courseCategory = course.category;
        btn.dataset.courseCode = course.code;

        // When user clicks on a course in "My Courses"
        btn.addEventListener('click', function () {
            const category = this.dataset.courseCategory; // e.g. "English"
            const code = this.dataset.courseCode;         // e.g. "ENG 010"

            console.log('Course clicked:', category, code);

            // 1) Save the active course so other scripts (API calls) can read it
            try {
                sessionStorage.setItem(
                    'activeCourse',
                    JSON.stringify({ category, code })
                );
            } catch (err) {
                console.warn('Could not save activeCourse:', err);
            }

            // 2) Visually mark this course as active and remove from others
            const allCourseButtons = document.querySelectorAll('.course-btn');
            allCourseButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // 3) Ask the subjects loader to reload subjects for this course
            //    This will work for English, Math, Computer, etc.,
            //    as long as the backend supports these filters.
            if (window.loadSubjectsForCourse) {
                window.loadSubjectsForCourse(category, code);
            } else if (window.loadSubjects) {
                // Fallback: reload generic subjects if the specific function
                // is not defined (defensive programming)
                window.loadSubjects();
            } else {
                console.warn('No subject loader function found (loadSubjectsForCourse or loadSubjects).');
            }
        });

        li.appendChild(btn);
        courseList.appendChild(li);
    });

    // We KEEP myCourses in sessionStorage so they show up on next visits
});
