// Add-course.js - Database-connected version
// This replaces the hardcoded courseData with real API calls

// Load API config
const API_BASE_URL = 'http://localhost:3000/api';

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

// Object to store the current selected path
let selectedPath = {};

// Store fetched course data
let coursesByCategory = {};
let allCourses = [];

// ============================================
// INITIALIZE: Load courses from database
// ============================================
async function loadCoursesFromDatabase() {
    try {
        // Show loading state
        mainCategory.disabled = true;
        
        // Fetch all courses from API
        const response = await fetch(`${API_BASE_URL}/user/courses?userId=1`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        allCourses = data.courses || [];
        
        // Organize courses by category
        coursesByCategory = {};
        allCourses.forEach(course => {
            const categoryName = course.category_name;
            if (!coursesByCategory[categoryName]) {
                coursesByCategory[categoryName] = [];
            }
            coursesByCategory[categoryName].push(course);
        });
        
        // Populate main category dropdown
        populateMainCategories();
        
        // Enable the dropdown
        mainCategory.disabled = false;
        
        console.log('✅ Loaded courses from database:', coursesByCategory);
        
    } catch (error) {
        console.error('❌ Failed to load courses:', error);
        alert('Failed to load courses from database. Please make sure the backend server is running on http://localhost:3000');
        mainCategory.disabled = false;
    }
}

// ============================================
// Populate main category dropdown
// ============================================
function populateMainCategories() {
    // Clear existing options except the first one
    mainCategory.innerHTML = '<option value="">-- Select Category --</option>';
    
    // Add categories from database
    Object.keys(coursesByCategory).forEach(categoryName => {
        const option = document.createElement('option');
        option.value = categoryName.toLowerCase().replace(/\s+/g, '_');
        option.textContent = categoryName;
        option.dataset.categoryName = categoryName;
        mainCategory.appendChild(option);
    });
}

// ============================================
// Handle main category change
// ============================================
mainCategory.addEventListener('change', function () {
    const categoryValue = this.value;
    const categoryName = this.options[this.selectedIndex].dataset.categoryName;

    // Save selected main category text
    selectedPath = { main: categoryName || this.options[this.selectedIndex].text };

    // Reset subcategory groups and options
    subCategory1Group.classList.add('hidden');
    subCategory2Group.classList.add('hidden');
    subCategory1.innerHTML = '<option value="">-- Select --</option>';
    subCategory2.innerHTML = '<option value="">-- Select --</option>';
    submitBtn.disabled = true;

    if (categoryValue && categoryName) {
        // Get courses for this category
        const courses = coursesByCategory[categoryName] || [];
        
        // Populate course dropdown
        subCategory1Label.textContent = 'Select Course';
        courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.course_id;
            option.textContent = `${course.course_name} - ${course.description || ''}`;
            option.dataset.courseId = course.course_id;
            option.dataset.courseName = course.course_name;
            option.dataset.courseDescription = course.description;
            subCategory1.appendChild(option);
        });
        
        subCategory1Group.classList.remove('hidden');
    }

    // Update the visual breadcrumb path
    updateBreadcrumb();
});

// ============================================
// Handle course selection (subCategory1)
// ============================================
subCategory1.addEventListener('change', function () {
    const courseId = this.value;

    // Hide second subcategory (not needed for basic setup)
    subCategory2Group.classList.add('hidden');
    subCategory2.innerHTML = '<option value="">-- Select --</option>';

    if (courseId) {
        // Save the selected course info
        const selectedOption = this.options[this.selectedIndex];
        selectedPath.sub1 = selectedOption.textContent;
        selectedPath.courseId = courseId;
        selectedPath.courseName = selectedOption.dataset.courseName;
        
        // Enable submit button
        submitBtn.disabled = false;
    } else {
        delete selectedPath.sub1;
        delete selectedPath.courseId;
        delete selectedPath.courseName;
        submitBtn.disabled = true;
    }

    // Update the visual breadcrumb path
    updateBreadcrumb();
});

// ============================================
// Update breadcrumb display
// ============================================
function updateBreadcrumb() {
    breadcrumb.innerHTML = '';

    if (Object.keys(selectedPath).length === 0) {
        selectionPath.classList.remove('show');
        return;
    }

    selectionPath.classList.add('show');

    const items = [];
    if (selectedPath.main) items.push(selectedPath.main);
    if (selectedPath.sub1) items.push(selectedPath.sub1);

    items.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'breadcrumb-item';

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

// ============================================
// Handle form submission
// ============================================
courseForm.addEventListener('submit', function (e) {
    e.preventDefault();

    // Build the course object to save
    const newCourse = {
        category: selectedPath.main || '',
        code: selectedPath.courseName || '',
        courseId: selectedPath.courseId || '',
        fullPath: Object.values(selectedPath).filter(v => typeof v === 'string').join(' → ')
    };

    // Read existing course list from sessionStorage
    let courseList = [];
    try {
        const stored = sessionStorage.getItem('myCourses');
        if (stored) {
            courseList = JSON.parse(stored);
        }
    } catch (err) {
        console.warn('Could not read myCourses from sessionStorage:', err);
    }

    // Avoid duplicates
    const exists = courseList.some(
        c => c.courseId === newCourse.courseId
    );

    if (!exists) {
        courseList.push(newCourse);
        console.log('✅ Added course:', newCourse);
    } else {
        console.log('ℹ️ Course already exists');
    }

    // Save updated list back to sessionStorage
    try {
        sessionStorage.setItem('myCourses', JSON.stringify(courseList));
    } catch (err) {
        console.warn('Could not save myCourses to sessionStorage:', err);
    }

    // Redirect back to user area
    window.location.href = 'User-Area.html';
});

// ============================================
// Initialize on page load
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Loading courses from database...');
    loadCoursesFromDatabase();
});