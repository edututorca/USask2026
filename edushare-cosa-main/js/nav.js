/* ===================================================== */
/* ============= SHARED NAVIGATION JS ================== */
/* ===================================================== */

// Toggle side menu
function toggleMenu() {
    document.getElementById('sideMenu').classList.toggle('active');
}

// Toggle profile dropdown
function toggleProfileMenu() {
    document.getElementById('profileDropdown').classList.toggle('show');
}

// Close menus when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.hamburger-menu') && !e.target.closest('.side-menu')) {
        const sideMenu = document.getElementById('sideMenu');
        if (sideMenu) sideMenu.classList.remove('active');
    }
    if (!e.target.closest('.profile-menu')) {
        const dropdown = document.getElementById('profileDropdown');
        if (dropdown) dropdown.classList.remove('show');
    }
});

// Logout function
function logout() {
    apiRequest(API_CONFIG.ENDPOINTS.LOGOUT, { method: 'POST' })
        .then(() => {
            window.location.href = 'Login.html';
        })
        .catch(() => {
            // Even if logout API fails, redirect to login
            window.location.href = 'Login.html';
        });
}
