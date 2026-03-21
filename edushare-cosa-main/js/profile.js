/* ===================================================== */
/* ============= PROFILE PAGE JS ======================== */
/* Loads from user_profiles table, saves back to server   */
/* ===================================================== */

const profileUserId = getCurrentUserId() || 1;

// DOM refs
const nameEl = document.getElementById('profileName');
const roleEl = document.getElementById('profileRole');
const emailEl = document.getElementById('profileEmail');
const photoPreview = document.getElementById('photoPreview');
const photoInput = document.getElementById('photoInput');
const btnRemovePhoto = document.getElementById('btnRemovePhoto');
const roleDisplay = document.getElementById('roleDisplay');

const formPersonal = document.getElementById('formPersonal');
const formAccount = document.getElementById('formAccount');
const formSchool = document.getElementById('formSchool');
const formPreferences = document.getElementById('formPreferences');

let profileData = {};

// ============ LOAD PROFILE FROM DATABASE ============

async function loadProfile() {
    try {
        const data = await apiRequest('/user/profile?userId=' + profileUserId);
        profileData = data;

        // Fill sidebar
        const firstName = data.first_name || '';
        const lastName = data.last_name || '';
        const displayName = (firstName + ' ' + lastName).trim() || data.display_name || 'Your Name';

        nameEl.textContent = displayName;
        roleEl.textContent = (data.role || 'teacher').charAt(0).toUpperCase() + (data.role || 'teacher').slice(1);
        emailEl.textContent = data.email || 'No email';

        // Fill Personal Info tab
        if (formPersonal) {
            formPersonal.elements['firstName'].value = data.first_name || '';
            formPersonal.elements['lastName'].value = data.last_name || '';
            formPersonal.elements['phone'].value = data.phone || '';
        }

        // Fill Account tab
        if (formAccount) {
            formAccount.elements['email'].value = data.email || '';
        }

        // Fill School tab
        if (formSchool) {
            if (roleDisplay) roleDisplay.value = (data.role || 'Teacher').charAt(0).toUpperCase() + (data.role || 'Teacher').slice(1);
            formSchool.elements['school'].value = data.school || '';
            formSchool.elements['schoolCity'].value = data.school_city || '';
            formSchool.elements['schoolCountry'].value = data.school_country || '';
            formSchool.elements['subjects'].value = data.subjects || '';
        }

        // Load photo from localStorage if saved
        const savedPhoto = localStorage.getItem('profilePhoto_' + profileUserId);
        if (savedPhoto) {
            photoPreview.src = savedPhoto;
        }

        // Load preferences from localStorage
        const prefs = JSON.parse(localStorage.getItem('profilePrefs_' + profileUserId) || '{}');
        if (formPreferences) {
            if (prefs.defaultSubject) formPreferences.elements['defaultSubject'].value = prefs.defaultSubject;
            if (prefs.showTooltips !== undefined) formPreferences.elements['showTooltips'].checked = prefs.showTooltips;
            if (prefs.emailNotifications !== undefined) formPreferences.elements['emailNotifications'].checked = prefs.emailNotifications;
        }

    } catch (err) {
        console.error('Failed to load profile:', err);
        nameEl.textContent = sessionStorage.getItem('firstName') || 'Your Name';
        emailEl.textContent = sessionStorage.getItem('userEmail') || 'No email';
    }
}

// ============ TABS ============

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.profile-section').forEach(sec => {
            sec.classList.toggle('active', sec.id === btn.dataset.target);
        });
    });
});

// ============ PHOTO ============

if (photoInput) {
    photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { alert('Please select an image file.'); return; }

        const reader = new FileReader();
        reader.onload = function(ev) {
            photoPreview.src = ev.target.result;
            localStorage.setItem('profilePhoto_' + profileUserId, ev.target.result);
        };
        reader.readAsDataURL(file);
    });
}

if (btnRemovePhoto) {
    btnRemovePhoto.addEventListener('click', () => {
        photoPreview.src = 'assets/EduShare_Logo.png';
        localStorage.removeItem('profilePhoto_' + profileUserId);
    });
}

// ============ SAVE HANDLERS ============

function showToast(msg) {
    const toast = document.getElementById('profileToast');
    document.getElementById('profileToastMsg').textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

document.querySelectorAll('[data-save]').forEach(btn => {
    btn.addEventListener('click', async () => {
        const section = btn.dataset.save;
        btn.disabled = true;
        const originalText = btn.textContent;
        btn.textContent = 'Saving...';

        try {
            if (section === 'personal') {
                await savePersonalInfo();
            } else if (section === 'account') {
                await saveAccountSettings();
            } else if (section === 'school') {
                await saveSchoolInfo();
            } else if (section === 'preferences') {
                savePreferences();
            }
            showToast('Updated successfully!');
        } catch (err) {
            console.error('Save failed:', err);
            alert(err.message || 'Failed to save. Please try again.');
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    });
});

async function savePersonalInfo() {
    const firstName = formPersonal.elements['firstName'].value.trim();
    const lastName = formPersonal.elements['lastName'].value.trim();
    const phone = formPersonal.elements['phone'].value.trim();

    if (!firstName || !lastName) throw new Error('First and last name are required.');

    await apiRequest('/user/profile', {
        method: 'POST',
        body: JSON.stringify({
            userId: profileUserId,
            firstName: firstName,
            lastName: lastName,
            phone: phone || null,
            street: profileData.street || null,
            city: profileData.city || null,
            province: profileData.province || null,
            postalCode: profileData.postal_code || null,
            school: profileData.school || null,
            schoolCity: profileData.school_city || null,
            schoolCountry: profileData.school_country || null,
            subjects: profileData.subjects || null,
            grade: profileData.grade || null,
            interests: profileData.interests || null
        })
    });

    // Update sidebar and sessionStorage
    const displayName = (firstName + ' ' + lastName).trim();
    nameEl.textContent = displayName;
    sessionStorage.setItem('firstName', firstName);
    sessionStorage.setItem('lastName', lastName);
}

async function saveAccountSettings() {
    const currentPw = formAccount.elements['currentPassword'].value;
    const newPw = formAccount.elements['newPassword'].value;
    const confirmPw = formAccount.elements['confirmNewPassword'].value;

    // If they're trying to change password
    if (newPw || confirmPw) {
        if (!currentPw) throw new Error('Enter your current password to change it.');
        if (newPw.length < 8) throw new Error('New password must be at least 8 characters.');
        if (newPw !== confirmPw) throw new Error('New passwords do not match.');

        // TODO: Add a password change endpoint on the server
        // For now, show acknowledgment
        alert('Password change functionality coming soon. Your other account settings have been noted.');
    }

    // Clear password fields
    formAccount.elements['currentPassword'].value = '';
    formAccount.elements['newPassword'].value = '';
    formAccount.elements['confirmNewPassword'].value = '';
}

async function saveSchoolInfo() {
    const school = formSchool.elements['school'].value.trim();
    const schoolCity = formSchool.elements['schoolCity'].value.trim();
    const schoolCountry = formSchool.elements['schoolCountry'].value.trim();
    const subjects = formSchool.elements['subjects'].value.trim();

    await apiRequest('/user/profile', {
        method: 'POST',
        body: JSON.stringify({
            userId: profileUserId,
            firstName: profileData.first_name || sessionStorage.getItem('firstName') || 'User',
            lastName: profileData.last_name || sessionStorage.getItem('lastName') || '',
            phone: profileData.phone || null,
            street: profileData.street || null,
            city: profileData.city || null,
            province: profileData.province || null,
            postalCode: profileData.postal_code || null,
            school: school || null,
            schoolCity: schoolCity || null,
            schoolCountry: schoolCountry || null,
            subjects: subjects || null,
            grade: profileData.grade || null,
            interests: profileData.interests || null
        })
    });

    // Update local data
    profileData.school = school;
    profileData.school_city = schoolCity;
    profileData.school_country = schoolCountry;
    profileData.subjects = subjects;
}

function savePreferences() {
    const prefs = {
        defaultSubject: formPreferences.elements['defaultSubject'].value,
        showTooltips: formPreferences.elements['showTooltips'].checked,
        emailNotifications: formPreferences.elements['emailNotifications'].checked
    };
    localStorage.setItem('profilePrefs_' + profileUserId, JSON.stringify(prefs));
}

// ============ INIT ============

loadProfile();