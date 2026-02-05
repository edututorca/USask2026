// js/profile.js
// Profile page prepared for future database integration.
// - Right now I still use localStorage as the primary storage
// - I already have async hooks to connect to the backend later
// - When the API is ready, we only need to update loadProfileFromBackend / saveProfileToBackend

/**
 * Keys and helpers
 */
const PROFILE_STORAGE_KEY = "edushareProfile";

/**
 * Load profile from localStorage (fallback storage)
 */
function loadProfileFromLocal() {
    try {
        return JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY) || "{}");
    } catch {
        return {};
    }
}

/**
 * Save profile to localStorage (fallback storage)
 */
function saveProfileToLocal(state) {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(state));
}

/**
 * FUTURE: Load profile from backend (database)
 * - When the API exists, we will replace the body of this function.
 * - For now it just returns null and logs a message.
 */
async function loadProfileFromBackend(userId) {
    if (!userId || !window.apiRequest || !window.API_CONFIG) {
        console.warn("Backend profile API not configured yet – using localStorage only.");
        return null;
    }

    try {
        // Example endpoint: /api/profile?userId=123
        const url = `${API_CONFIG.ENDPOINTS.PROFILE}?userId=${encodeURIComponent(userId)}`;
        const data = await apiRequest(url);
        // I assume the API returns an object shaped like my "state"
        return data.profile || data || null;
    } catch (err) {
        console.error("Failed to load profile from backend:", err);
        return null;
    }
}

/**
 * FUTURE: Save profile to backend (database)
 * - When the API exists, I will replace the body of this function.
 * - For now it only logs and returns true.
 */
async function saveProfileToBackend(userId, state) {
    if (!userId || !window.apiRequest || !window.API_CONFIG) {
        console.warn("Backend profile API not configured yet – skipping remote save.");
        return true; // I still consider local save successful
    }

    try {
        // Example: POST /api/profile
        await apiRequest(API_CONFIG.ENDPOINTS.PROFILE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, profile: state })
        });
        return true;
    } catch (err) {
        console.error("Failed to save profile to backend:", err);
        return false;
    }
}

/**
 * MAIN INITIALIZATION
 */
document.addEventListener("DOMContentLoaded", async () => {
    // 1) Get current user ID (same pattern as other pages)
    const userId = typeof getCurrentUserId === "function" ? getCurrentUserId() : null;

    // 2) Start state from localStorage
    let state = loadProfileFromLocal();

    // 3) Try to load from backend (when available) and override local state
    try {
        const remote = await loadProfileFromBackend(userId);
        if (remote && typeof remote === "object") {
            state = { ...state, ...remote };
        }
    } catch (err) {
        console.warn("Using local profile only (backend not ready or failed).", err);
    }

    // ---------- DOM refs ----------
    const nameEl        = document.getElementById("profileName");
    const roleEl        = document.getElementById("profileRole");
    const emailEl       = document.getElementById("profileEmail");
    const photoPreview  = document.getElementById("photoPreview");
    const photoInput    = document.getElementById("photoInput");
    const btnRemovePhoto = document.getElementById("btnRemovePhoto");
    const roleDisplay   = document.getElementById("roleDisplay");

    const formPersonal     = document.getElementById("formPersonal");
    const formAccount      = document.getElementById("formAccount");
    const formSchool       = document.getElementById("formSchool");
    const formPreferences  = document.getElementById("formPreferences");

    // ---------- Helpers ----------
    function fillForm(form, data) {
        if (!form || !data) return;
        for (const [key, value] of Object.entries(data)) {
            const field = form.elements[key];
            if (!field) continue;

            if (field.type === "checkbox") {
                field.checked = Boolean(value);
            } else {
                field.value = value;
            }
        }
    }

    function collectForm(form) {
        const fd = new FormData(form);
        return Object.fromEntries(fd.entries());
    }

    function showSavedToast() {
        alert("Profile section saved.");
    }

    // ---------- Restore forms from state ----------
    fillForm(formPersonal,    state.personal);
    fillForm(formAccount,     state.account);
    fillForm(formSchool,      state.school);
    fillForm(formPreferences, state.preferences);

    // Ensure the role comes from state (and is locked/read-only)
    if (roleDisplay) {
        const role = state.school?.role || state.role || "Teacher";
        roleDisplay.value = role;
    }

    // ---------- Header summary ----------
    function updateHeaderSummary() {
        const firstName = state.personal?.firstName || "";
        const lastName  = state.personal?.lastName  || "";
        const preferred = state.personal?.preferredName;

        const displayName = preferred?.trim()
            ? preferred
            : `${firstName} ${lastName}`.trim() || "Your Name";

        const role  = state.school?.role || state.role || "Teacher";
        const email = state.account?.email || "email@example.com";

        if (nameEl)  nameEl.textContent  = displayName;
        if (roleEl)  roleEl.textContent  = role;
        if (emailEl) emailEl.textContent = email;
    }

    updateHeaderSummary();

    // ---------- Photo restore ----------
    if (state.photoDataUrl) {
        photoPreview.src = state.photoDataUrl;
    }

    // ---------- Tabs ----------
    const tabButtons = document.querySelectorAll(".tab-btn");
    const sections   = document.querySelectorAll(".profile-section");

    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const targetId = btn.dataset.target;

            tabButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            sections.forEach(sec => {
                sec.classList.toggle("active", sec.id === targetId);
            });
        });
    });

    // ---------- Photo upload ----------
    if (photoInput) {
        photoInput.addEventListener("change", (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            if (!file.type.startsWith("image/")) {
                alert("Please select an image file.");
                return;
            }

            const reader = new FileReader();
            reader.onload = function (ev) {
                const dataUrl = ev.target?.result;
                if (typeof dataUrl === "string") {
                    photoPreview.src = dataUrl;
                    state.photoDataUrl = dataUrl;
                    saveProfileToLocal(state);
                }
            };
            reader.readAsDataURL(file);
        });
    }

    if (btnRemovePhoto) {
        btnRemovePhoto.addEventListener("click", () => {
            // Always restore the default image when removing
            photoPreview.src = "assets/EduShare_Logo.png";
            delete state.photoDataUrl;
            saveProfileToLocal(state);
        });
    }

    // ---------- Save buttons ----------
    document.querySelectorAll("[data-save]").forEach(btn => {
        btn.addEventListener("click", async () => {
            const section = btn.dataset.save;

            if (section === "personal") {
                state.personal = collectForm(formPersonal);
            } else if (section === "account") {
                state.account = collectForm(formAccount);
            } else if (section === "school") {
                state.school = collectForm(formSchool);

                // Keep role locked and consistent with the read-only field
                if (roleDisplay && roleDisplay.value) {
                    state.school.role = roleDisplay.value;
                    state.role = roleDisplay.value;
                }
            } else if (section === "preferences") {
                const data = collectForm(formPreferences);
                data.showTooltips       = formPreferences.elements["showTooltips"].checked;
                data.emailNotifications = formPreferences.elements["emailNotifications"].checked;
                data.quizReminders      = formPreferences.elements["quizReminders"].checked;
                state.preferences = data;
            }

            // Save locally
            saveProfileToLocal(state);
            updateHeaderSummary();

            // Try to save remotely (future DB)
            await saveProfileToBackend(userId, state);

            showSavedToast();
        });
    });
});
