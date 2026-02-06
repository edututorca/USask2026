// Course data structure containing all available options
const courseData = {
    english: [
        { code: 'ENG 010', name: 'English Fundamentals' },
        { code: 'ENG 101', name: 'English I (Grade 9)' },
        { code: 'ENG 102', name: 'English II (Grade 10)' },
        { code: 'ENG 201', name: 'English III (Grade 11)' },
        { code: 'ENG 202', name: 'English IV (Grade 12)' },
        { code: 'ENG 110', name: 'Creative Writing' },
        { code: 'ENG 120', name: 'Literature & Composition' },
        { code: 'ENG 130', name: 'English for Academic Purposes' },
        { code: 'ENG 140', name: 'Business English' }
    ],
    math: [
        { code: 'MATH 010', name: 'Basic Mathematics' },
        { code: 'MATH 101', name: 'Algebra I (Grade 9)' },
        { code: 'MATH 102', name: 'Geometry (Grade 10)' },
        { code: 'MATH 201', name: 'Algebra II (Grade 11)' },
        { code: 'MATH 202', name: 'Pre-Calculus (Grade 12)' },
        { code: 'MATH 301', name: 'Calculus I' },
        { code: 'MATH 302', name: 'Calculus II' },
        { code: 'MATH 110', name: 'Statistics & Probability' },
        { code: 'MATH 120', name: 'Trigonometry' },
        { code: 'MATH 150', name: 'Applied Mathematics' }
    ],
    computer: {
        programming: [
            { code: 'CS-PROG-101', name: 'Java Programming' },
            { code: 'CS-PROG-102', name: 'Python Programming' },
            { code: 'CS-PROG-103', name: 'C++ Programming' },
            { code: 'CS-PROG-104', name: 'C# Programming' },
            { code: 'CS-PROG-105', name: 'JavaScript' },
            { code: 'CS-PROG-106', name: 'HTML & CSS' },
            { code: 'CS-PROG-107', name: 'PHP Programming' },
            { code: 'CS-PROG-108', name: 'Ruby Programming' }
        ],
        networking: [
            { code: 'CS-NET-101', name: 'Network Fundamentals' },
            { code: 'CS-NET-102', name: 'Network Security' },
            { code: 'CS-NET-103', name: 'Cisco CCNA' },
            { code: 'CS-NET-104', name: 'Network Administration' },
            { code: 'CS-NET-105', name: 'Wireless Networks' },
            { code: 'CS-NET-106', name: 'Cloud Networking' }
        ],
        database: [
            { code: 'CS-DB-101', name: 'SQL Fundamentals' },
            { code: 'CS-DB-102', name: 'MySQL Database' },
            { code: 'CS-DB-103', name: 'PostgreSQL' },
            { code: 'CS-DB-104', name: 'MongoDB (NoSQL)' },
            { code: 'CS-DB-105', name: 'Database Design' },
            { code: 'CS-DB-106', name: 'Database Administration' }
        ],
        web: [
            { code: 'CS-WEB-101', name: 'Web Development Fundamentals' },
            { code: 'CS-WEB-102', name: 'Frontend Development' },
            { code: 'CS-WEB-103', name: 'Backend Development' },
            { code: 'CS-WEB-104', name: 'Full Stack Development' },
            { code: 'CS-WEB-105', name: 'React.js' },
            { code: 'CS-WEB-106', name: 'Node.js' }
        ],
        security: [
            { code: 'CS-SEC-101', name: 'Cybersecurity Fundamentals' },
            { code: 'CS-SEC-102', name: 'Ethical Hacking' },
            { code: 'CS-SEC-103', name: 'Penetration Testing' },
            { code: 'CS-SEC-104', name: 'Security Architecture' },
            { code: 'CS-SEC-105', name: 'Cryptography' }
        ]
    }
};

// Get references to DOM elements
const mainCategory = document.getElementById('mainCategory');
const subCategory1 = document.getElementById('subCategory1');
const subCategory2 = document.getElementById('subCategory2');
const subCategory1Group = document.getElementById('subCategory1Group');
const subCategory2Group = document.getElementById('subCategory2Group');
const subCategory1Label = document.getElementById('subCategory1Label');
const selectionPath = document.getElementById('selectionPath');
const breadcrumb = document.getElementById('breadcrumb');
const submitBtn = document.getElementById('submitBtn');
const courseForm = document.getElementById('courseForm');

// Object to store the current selected path (main, sub1, sub2)
let selectedPath = {};

// Handle change on main category select
mainCategory.addEventListener('change', function () {
    const category = this.value;

    // Save selected main category text (e.g., "English", "Mathematics")
    selectedPath = { main: this.options[this.selectedIndex].text };

    // Reset subcategory groups and options
    subCategory1Group.classList.add('hidden');
    subCategory2Group.classList.add('hidden');
    subCategory1.innerHTML = '<option value="">-- Select --</option>';
    subCategory2.innerHTML = '<option value="">-- Select --</option>';
    submitBtn.disabled = true;

    // If English or Math, show list of course codes directly
    if (category === 'english' || category === 'math') {
        subCategory1Label.textContent = 'Select Course Code';
        courseData[category].forEach(course => {
            const option = document.createElement('option');
            option.value = course.code;
            option.textContent = `${course.code} - ${course.name}`;
            subCategory1.appendChild(option);
        });
        subCategory1Group.classList.remove('hidden');
    }
    // If Computer Science, first show specializations (programming, networking, etc.)
    else if (category === 'computer') {
        subCategory1Label.textContent = 'Select Specialization';
        const specializations = [
            { value: 'programming', text: 'Programming' },
            { value: 'networking', text: 'Networking' },
            { value: 'database', text: 'Database Management' },
            { value: 'web', text: 'Web Development' },
            { value: 'security', text: 'Cybersecurity' }
        ];
        specializations.forEach(spec => {
            const option = document.createElement('option');
            option.value = spec.value;
            option.textContent = spec.text;
            subCategory1.appendChild(option);
        });
        subCategory1Group.classList.remove('hidden');
    }

    // Update the visual breadcrumb path
    updateBreadcrumb();
});

// Handle change on subCategory1 select
subCategory1.addEventListener('change', function () {
    const mainCat = mainCategory.value;
    const subCat = this.value;

    // Hide second subcategory and reset its options
    subCategory2Group.classList.add('hidden');
    subCategory2.innerHTML = '<option value="">-- Select --</option>';

    // For English and Math, this select contains the final course code
    if (mainCat === 'english' || mainCat === 'math') {
        selectedPath.sub1 = this.options[this.selectedIndex].text;
        submitBtn.disabled = false;
    }
    // For Computer Science, this select contains specializations
    else if (mainCat === 'computer' && subCat) {
        selectedPath.sub1 = this.options[this.selectedIndex].text;

        // Populate second subcategory with courses for the chosen specialization
        courseData.computer[subCat].forEach(course => {
            const option = document.createElement('option');
            option.value = course.code;
            option.textContent = `${course.code} - ${course.name}`;
            subCategory2.appendChild(option);
        });

        subCategory2Group.classList.remove('hidden');
        submitBtn.disabled = true;
    }

    // Update the visual breadcrumb path
    updateBreadcrumb();
});

// Handle change on subCategory2 select (only used for Computer Science)
subCategory2.addEventListener('change', function () {
    if (this.value) {
        // Save the full course code and name chosen
        selectedPath.sub2 = this.options[this.selectedIndex].text;
        submitBtn.disabled = false;
    } else {
        // If user clears the selection, remove it from the path and disable submit
        delete selectedPath.sub2;
        submitBtn.disabled = true;
    }

    // Update the visual breadcrumb path
    updateBreadcrumb();
});

// Function to update the breadcrumb UI showing current selection
function updateBreadcrumb() {
    // Clear previous breadcrumb items
    breadcrumb.innerHTML = '';

    // If there is no selection at all, hide the selection path box
    if (Object.keys(selectedPath).length === 0) {
        selectionPath.classList.remove('show');
        return;
    }

    // Show the selection path box
    selectionPath.classList.add('show');

    // Build an array from the selected path in correct order
    const items = [];
    if (selectedPath.main) items.push(selectedPath.main);
    if (selectedPath.sub1) items.push(selectedPath.sub1);
    if (selectedPath.sub2) items.push(selectedPath.sub2);

    // Create elements for each breadcrumb item
    items.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'breadcrumb-item';

        // Add arrow before all items except the first one
        if (index > 0) {
            const arrow = document.createElement('span');
            arrow.textContent = '→';
            itemDiv.appendChild(arrow);
        }

        const text = document.createElement('span');
        text.textContent = item;
        itemDiv.appendChild(text);

        breadcrumb.appendChild(itemDiv);
    });
}

// Handle form submission
courseForm.addEventListener('submit', function (e) {
    e.preventDefault();

    // Build final path string (for display, if needed)
    const finalPath = Object.values(selectedPath).join(' → ');

    // Main category text (e.g., "English", "Mathematics", "Computer Science")
    const courseCategory = selectedPath.main || '';

    // Full label from select, like "ENG 010 - English Fundamentals"
    const fullCourseLabel =
        selectedPath.sub2      // Computer Science case
        || selectedPath.sub1   // English / Math case
        || '';

    // Extract code and name from label like "ENG 010 - English Fundamentals"
    const labelParts = fullCourseLabel.split(' - ');
    const courseCode = labelParts[0].trim();
    const courseName = labelParts.length > 1 ? labelParts[1].trim() : courseCategory;

    // Object representing the new course
    const newCourse = {
        code: courseCode,         // e.g., "ENG 010"
        name: courseName,         // e.g., "English Fundamentals"
        category: courseCategory, // e.g., "English"
        fullPath: finalPath
    };

    // Read existing course list from sessionStorage (or start empty)
    let courseList = [];
    try {
        const stored = sessionStorage.getItem('myCourses');
        if (stored) {
            courseList = JSON.parse(stored);
        }
    } catch (err) {
        console.warn('Could not read myCourses from sessionStorage:', err);
    }

    // Optional: avoid duplicates (same category + code)
    const exists = courseList.some(
        c => c.category === newCourse.category && c.code === newCourse.code
    );

    if (!exists) {
        courseList.push(newCourse);
    }

    // Save updated list back to sessionStorage
    try {
        sessionStorage.setItem('myCourses', JSON.stringify(courseList));
    } catch (err) {
        console.warn('Could not save myCourses to sessionStorage:', err);
    }

    // Redirect back to user-area page
    window.location.href = 'User-Area.html';
});
