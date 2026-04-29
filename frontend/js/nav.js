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
            sessionStorage.clear();
            window.location.href = 'Login.html';
        })
        .catch(() => {
            sessionStorage.clear();
            window.location.href = 'Login.html';
        });
}

// Show logged-in user name next to profile button
(function showUserName() {
    const name = sessionStorage.getItem('firstName') || localStorage.getItem('firstName');
    if (!name) return;

    const profileMenu = document.querySelector('.profile-menu');
    if (!profileMenu) return;

    const nameEl = document.createElement('span');
    nameEl.className = 'nav-user-name';
    nameEl.textContent = name;
    profileMenu.parentNode.insertBefore(nameEl, profileMenu);
})();

// Make logo clickable — link to dashboard on all pages
(function() {
    const logo = document.querySelector('.logo-container .logo');
    if (logo && !logo.closest('a')) {
        const link = document.createElement('a');
        link.href = 'dashboard.html';
        logo.parentNode.insertBefore(link, logo);
        link.appendChild(logo);
    }
})();