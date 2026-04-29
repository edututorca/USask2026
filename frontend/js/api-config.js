/* ===================================================== */
/* ============= API CONFIGURATION ==================== */
/* ===================================================== */
/**
 * Centralized API configuration and helper functions
 *
 * ⚠️  SET YOUR BACKEND URL BELOW
 *
 * Pick ONE of these options based on how you're running EduShare:
 *
 *   1) LOCAL DEVELOPMENT (running backend on the same machine)
 *      → 'http://localhost:3000/api'
 *
 *   2) NGROK TUNNEL (running backend on another machine, exposed via ngrok)
 *      → 'https://your-ngrok-url.ngrok-free.dev/api'
 *
 *   3) PRODUCTION / RENDER DEPLOYMENT
 *      → 'https://your-render-app.onrender.com/api'
 *
 * Just edit BASE_URL below and save. No build step needed.
 */

const API_CONFIG = {
    // ⚠️  CHANGE THIS LINE to your backend URL (see options above)
    BASE_URL: 'http://localhost:3000/api',

    // Endpoints
    ENDPOINTS: {
        // User endpoints
        USER_PROFILE: '/user/profile',
        USER_COURSES: '/user/courses',

        // Subject/Topic hierarchy
        SUBJECTS: '/subjects',
        TOPICS: '/topics',
        SUBTOPICS: '/subtopics',
        SECTIONS: '/sections',

        // Questions
        QUESTIONS: '/questions',
        QUESTION_CREATE: '/questions',
        QUESTION_DELETE: '/questions',
        QUESTION_VOTE: '/questions/vote',

        // Courses
        COURSES: '/courses',

        // Quizzes
        QUIZZES: '/quizzes',
        QUIZZES_CREATE: '/quizzes/create',
        QUIZZES_RECENT: '/quizzes/recent',
        QUIZZES_COMMUNITY: '/quizzes/community',
        QUIZZES_MY_RATINGS: '/quizzes/my-ratings',

        // Dashboard
        DASHBOARD_STATS: '/dashboard/stats',

        // Support
        SUPPORT_CONTACT: '/support/contact',

        // Auth
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout'
    }
};

/**
 * Helper function to make API requests with error handling
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;

    // Default options
    const defaultOptions = {
    headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
    }
};

    // Add auth token if available
    const token = getAuthToken();
    if (token) {
        defaultOptions.headers['Authorization'] = `Bearer ${token}`;
    }

    // Merge options
    const fetchOptions = { ...defaultOptions, ...options };
    if (options.headers) {
        fetchOptions.headers = { ...defaultOptions.headers, ...options.headers };
    }

    try {
        const response = await fetch(url, fetchOptions);

        // Handle non-JSON responses
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error(`Server returned non-JSON response: ${response.statusText}`);
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || data.error || `HTTP ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error(`API request failed [${endpoint}]:`, error);
        throw error;
    }
}

/**
 * Get auth token from sessionStorage or localStorage
 */
function getAuthToken() {
    return sessionStorage.getItem('authToken') || localStorage.getItem('authToken');
}

/**
 * Get current user ID from storage
 */
function getCurrentUserId() {
    return sessionStorage.getItem('userId') || localStorage.getItem('userId');
}

/**
 * Escape HTML to prevent XSS attacks
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

/**
 * Show error message in a container
 */
function showError(container, message) {
    if (typeof container === 'string') {
        container = document.getElementById(container) || document.querySelector(container);
    }
    if (!container) return;

    container.innerHTML = `
        <div class="error-state" style="text-align: center; padding: 40px; color: #c33;">
            <p>${escapeHtml(message)}</p>
            <button class="btn btn-orange-pill" onclick="location.reload()">Retry</button>
        </div>
    `;
}

/**
 * Show loading state in a container
 */
function showLoading(container, message = 'Loading...') {
    if (typeof container === 'string') {
        container = document.getElementById(container) || document.querySelector(container);
    }
    if (!container) return;

    container.innerHTML = `
        <div class="loading-state" style="text-align: center; padding: 40px; color: #999;">
            <p>${escapeHtml(message)}</p>
        </div>
    `;
}

/**
 * Show empty state in a container
 */
function showEmpty(container, message = 'No items found') {
    if (typeof container === 'string') {
        container = document.getElementById(container) || document.querySelector(container);
    }
    if (!container) return;

    container.innerHTML = `
        <div class="empty-state" style="text-align: center; padding: 40px; color: #999;">
            <p>${escapeHtml(message)}</p>
        </div>
    `;
}

/**
 * Format a date string into a human-readable relative time
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
}

// Make functions globally available
window.API_CONFIG = API_CONFIG;
window.apiRequest = apiRequest;
window.getAuthToken = getAuthToken;
window.getCurrentUserId = getCurrentUserId;
window.escapeHtml = escapeHtml;
window.showError = showError;
window.showLoading = showLoading;
window.showEmpty = showEmpty;
window.formatDate = formatDate;