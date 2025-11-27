/* ===================================================== */
/* ============= API CONFIGURATION ==================== */
/* ===================================================== */
/**
 * Centralized API configuration and helper functions
 */

const API_CONFIG = {
    // Changeed this to your actual URL
    BASE_URL: 'https://172.16.1.70',
    
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

// Make functions globally available
window.API_CONFIG = API_CONFIG;
window.apiRequest = apiRequest;
window.getAuthToken = getAuthToken;
window.getCurrentUserId = getCurrentUserId;
window.escapeHtml = escapeHtml;
window.showError = showError;
window.showLoading = showLoading;
window.showEmpty = showEmpty;