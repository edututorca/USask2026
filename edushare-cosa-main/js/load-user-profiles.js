/* ===================================================== */
/* ========== LOAD USER PROFILE FROM DATABASE ========= */
/* ===================================================== */
/**
 * Loads the logged-in user's profile from the UserProfile table
 * and populates the sidebar profile card and top-right user chip
 */
(function () {
    async function loadUserProfile() {
        const userId = getCurrentUserId();
        if (!userId) {
            console.warn('No user ID found - user may not be logged in');
            return;
        }

        try {
            // Fetch user profile
            const data = await apiRequest(`${API_CONFIG.ENDPOINTS.USER_PROFILE}?userId=${userId}`);
            const profile = data.profile || data;

            // Update sidebar profile card
            updateProfileCard(profile);
            
            // Update top-right user chip
            updateUserChip(profile);

        } catch (error) {
            console.error('Failed to load user profile:', error);
            // Set fallback values
            updateProfileCard({ FirstName: 'User', UserType: 'Teacher' });
            updateUserChip({ FirstName: 'User', LastName: '' });
        }
    }

    /**
     * Update the sidebar profile card
     */
    function updateProfileCard(profile) {
        const card = document.getElementById('profileCard');
        if (!card) return;

        const firstName = profile.FirstName || 'User';
        const userType = profile.UserType || 'Teacher';
        const initial = firstName.charAt(0).toUpperCase();

        card.innerHTML = `
            <div class="avatar large" aria-hidden="true">${initial}</div>
            <div class="profile-meta">
                <div class="profile-name">${escapeHtml(firstName)}</div>
                <div class="profile-role">${escapeHtml(userType)}</div>
            </div>
        `;
    }

    /**
     * Update the top-right user chip
     */
    function updateUserChip(profile) {
        const chip = document.getElementById('userChip');
        if (!chip) return;

        const firstName = profile.FirstName || 'User';
        const lastName = profile.LastName || '';
        const fullName = `${firstName} ${lastName}`.trim();
        const initial = firstName.charAt(0).toUpperCase();
        const xp = profile.ExperiencePoints || 0;

        chip.innerHTML = `
            <div class="avatar" aria-hidden="true">${initial}</div>
            <div class="user-chip__txt">
                <div class="user-name">${escapeHtml(fullName)}</div>
                <div class="user-points">XP: <strong>${xp}</strong></div>
            </div>
        `;
    }

    // Load profile when page loads
    document.addEventListener('DOMContentLoaded', loadUserProfile);
    
    // Make function available globally for refresh
    window.loadUserProfile = loadUserProfile;
})();