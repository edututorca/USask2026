/* =========================================================
   EduShare — Profile Setup Wizard (Full JS)
   - Multi-step form with inline validation (all fields required)
   - Persists state in localStorage
   - Renders review summary
   - Custom success modal with redirect to Login.html
   ========================================================= */

// ---------- Config ----------
const LOGIN_URL = "Login.html";
function redirectToLogin() {
    const target = new URL(LOGIN_URL, location.href).toString();
    try {
        window.location.replace(target);
        setTimeout(() => { window.location.href = target; }, 0);
    } catch {
        window.location.href = target;
    }
}

// ---------- Local state helpers ----------
const load = () => JSON.parse(localStorage.getItem("profileState") || "{}");
const save = (s) => localStorage.setItem("profileState", JSON.stringify(s));

// ---------- DOM refs ----------
const form = document.getElementById("formProfile");
const progressBar = document.getElementById("progressBar");
const stepLabel = document.getElementById("stepLabel");
const errorLine = document.getElementById("errorLine");
const btnBack = document.getElementById("btnBack");
const btnNext = document.getElementById("btnNext");
const btnSubmit = document.getElementById("btnSubmit");
const reviewBox = document.getElementById("reviewBox");
const steps = Array.from(document.querySelectorAll(".step"));
const TOTAL = steps.length;

// ---------- In-memory state ----------
let state = load();

// ---------- Role handling ----------
// Try to read role from query string
const urlParams = new URLSearchParams(window.location.search);
const roleParam = urlParams.get("role"); // expects "teacher" or "learner"

// 1) If URL has a valid role, use it
if (roleParam === "Teacher" || roleParam === "Learner") {
    state.role = roleParam;
} else {
    // 2) If no role in URL:
    //    - keep existing state.role if present
    //    - otherwise default to "teacher"
    if (!state.role) {
        state.role = "Teacher"; // DEFAULT: teacher
    }
}

// Save updated state
save(state);

// current step from hash or 1
let step = Number((location.hash.match(/step=(\d+)/) || [])[1]) || 1;

// ---------- Modal helpers ----------
function showSuccessModal(opts = {}) {
    const modal = document.getElementById("successModal");
    if (!modal) { redirectToLogin(); return; }

    const title = modal.querySelector(".modal__title");
    const text  = modal.querySelector(".modal__text");
    const btnGo = document.getElementById("modalGoBtn");
    const btnStay = document.getElementById("modalStayBtn");
    const backdrop = modal.querySelector(".modal__backdrop");

    title.textContent = opts.title ?? "Profile created";
    text.textContent  = opts.text  ?? "Your profile was created successfully.";

    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");

    const go = () => { cleanup(); redirectToLogin(); };
    const stay = () => { cleanup(); };
    const onEsc = (e) => { if (e.key === "Escape") go(); };

    function cleanup() {
        modal.classList.add("hidden");
        modal.setAttribute("aria-hidden", "true");
        btnGo.removeEventListener("click", go);
        btnStay.removeEventListener("click", stay);
        backdrop.removeEventListener("click", go);
        document.removeEventListener("keydown", onEsc);
    }

    btnGo.addEventListener("click", go);
    btnStay.addEventListener("click", stay);
    backdrop.addEventListener("click", go);
    document.addEventListener("keydown", onEsc);

    if (opts.autoMs && Number(opts.autoMs) > 0) {
        setTimeout(go, Number(opts.autoMs));
    }
}

// ---------- UI helpers ----------
function show(n) {
    // Clamp step to [1, TOTAL]
    step = Math.min(Math.max(n, 1), TOTAL);

    // Show/hide sections
    steps.forEach(s => s.classList.toggle("hidden", Number(s.dataset.step) !== step));

    // Progress/labels
    const titles = ["Personal info", "Contact", "School Address", "Role details", "Review"];
    stepLabel.textContent = `Step ${step} of ${TOTAL} · ${titles[step - 1]}`;
    progressBar.style.width = `${((step - 1) / (TOTAL - 1)) * 100}%`;

    // Nav buttons
    btnBack.disabled = step === 1;
    btnNext.classList.toggle("hidden", step === TOTAL);
    btnSubmit.classList.toggle("hidden", step !== TOTAL);

    // Role-conditional content (show only the active role block)
    const activeRole = state.role || initialRole || "Teacher";

    const teacherBlock = document.querySelector(".role--Teacher");
    const learnerBlock = document.querySelector(".role--Learner");

    if (teacherBlock) {
        teacherBlock.classList.toggle("is-active", activeRole === "Teacher");
    }
    if (learnerBlock) {
        learnerBlock.classList.toggle("is-active", activeRole === "Learner");
    }

    // -------------------------------------------

    // Review step rendering
    if (step === TOTAL) renderReview();

    // Preserve current step in hash (supports refresh)
    location.hash = `step=${step}`;
}

function collect() {
    const fd = new FormData(form);
    const obj = Object.fromEntries(fd.entries());
    state = { ...state, ...obj };

    // ensure we never lose the role from state
    if (!state.role) {
        state.role = "Teacher"; // keep default if somehow missing
    }

    save(state);
}

// ---------- Error helpers ----------
function setError(name, message) {
    if (name === "role") {
        const small = form.querySelector('.field__error[data-for="role"]');
        if (small) { small.textContent = message; small.classList.add("show"); }
        return;
    }
    const input = form.elements[name];
    if (!input) return;
    input.classList.add("is-invalid");

    const err = form.querySelector(`.field__error[data-for="${name}"]`);
    if (err) { err.textContent = message; err.classList.add("show"); }
}

function clearError(name) {
    if (name === "role") {
        const small = form.querySelector('.field__error[data-for="role"]');
        if (small) { small.textContent = ""; small.classList.remove("show"); }
        return;
    }
    const input = form.elements[name];
    if (!input) return;
    input.classList.remove("is-invalid");

    const err = form.querySelector(`.field__error[data-for="${name}"]`);
    if (err) { err.textContent = ""; err.classList.remove("show"); }
}

function clearAllErrors() {
    form.querySelectorAll(".is-invalid").forEach(el => el.classList.remove("is-invalid"));
    form.querySelectorAll(".field__error").forEach(el => {
        el.textContent = "";
        el.classList.remove("show");
    });
    errorLine.textContent = "";
}

// ---------- Validation (ALL fields required) ----------
function validate() {
    clearAllErrors();

    // Step 1: Personal info
    if (step === 1) {
        if (!form.firstName.value.trim()) setError("firstName", "First name is required.");
        if (!form.lastName.value.trim())  setError("lastName",  "Last name is required.");
        if (form.querySelector(".is-invalid")) return "Please fill the required fields.";
    }

    // Step 2: Contact
    if (step === 2) {
        // Work email
        if (!form.email.value.trim() || !form.email.checkValidity()) {
            setError("email", "Please enter a valid work email.");
        }
        
        // Password
        if (!form.password.value.trim()) {
            setError("password", "Password is required.");
        } else if (form.password.value.length < 8) {
            setError("password", "Password must be at least 8 characters.");
        }
        // Confirm password
        if (!form.confirmPassword.value.trim()) {
            setError("confirmPassword", "Please confirm your password.");
        } else if (form.password.value !== form.confirmPassword.value) {
            setError("confirmPassword", "Passwords do not match.");
        }

        // Work phone
        if (!form.phone.value.trim() || !form.phone.checkValidity()) {
            setError("phone", "Please enter a valid work phone number.");
        }
        if (form.querySelector(".is-invalid")) return "Please correct the highlighted fields.";
    }

    // Step 3: Address
    if (step === 3) {
        if (!form.street.value.trim()) setError("street", "Street address is required.");
        if (!form.city.value.trim())   setError("city",   "City is required.");
        if (!form.state.value.trim())  setError("state",  "Province/State is required.");
        if (!form.zip.value.trim())    setError("zip",    "Postal/ZIP is required.");
        if (form.querySelector(".is-invalid")) return "Please fill the required fields.";
    }

    // Step 4: Role-specific
    if (step === 4) {
        const activeRole = state.role || "Teacher";

        if (activeRole === "Teacher") {
            if (!form.school.value.trim())        setError("school",        "School is required.");
            if (!form.schoolCity.value.trim())    setError("schoolCity",    "City is required.");
            if (!form.schoolCountry.value.trim()) setError("schoolCountry", "Country is required.");
           // if (!form.subjects.value.trim())      setError("subjects",      "Subjects are required.");
        } else if (activeRole === "Learner") {
            if (!form.grade.value.trim())     setError("grade",     "Grade is required.");
            if (!form.interests.value.trim()) setError("interests", "Interests are required.");
        }

        if (form.querySelector(".is-invalid")) return "Please fill the required fields.";
    }

    // Step 5: Consent
    if (step === 5 && !form.agree.checked) {
        return "You must agree to continue.";
    }

    return "";
}

// ---------- Review rendering ----------
function safe(v) { return v ? String(v) : "—"; }

function renderReview() {
    reviewBox.innerHTML = `
    <dl>
      <dt>Role</dt><dd>${safe(state.role)}</dd>
      <dt>Name</dt><dd>${safe(state.firstName)} ${safe(state.lastName)}</dd>
      <dt>Email</dt><dd>${safe(state.email)}</dd>
      <dt>Phone</dt><dd>${safe(state.phone)}</dd>
      <dt>Address</dt><dd>${safe(state.street)}, ${safe(state.city)}, ${safe(state.state)} ${safe(state.zip)}</dd>
      ${
        state.role === "Teacher"
            ? `
              <dt>School</dt><dd>${safe(state.school)}</dd>
              <dt>School city</dt><dd>${safe(state.schoolCity)}</dd>
              <dt>School country</dt><dd>${safe(state.schoolCountry)}</dd>
        
            `
            : `
              <dt>Grade</dt><dd>${safe(state.grade)}</dd>
              <dt>Interests</dt><dd>${safe(state.interests)}</dd>
            `
    }
    </dl>
  `;
}

// ---------- Event handlers ----------
btnNext.addEventListener("click", () => {
    collect();
    const err = validate();
    if (err) {
        errorLine.textContent = err;
        const firstInvalid = form.querySelector(".is-invalid");
        if (firstInvalid) firstInvalid.focus();
        return;
    }
    show(step + 1);
});

btnBack.addEventListener("click", () => {
    collect();
    show(step - 1);
});

// Live-clear field-level error when user types
form.addEventListener("input", (e) => {
    const el = e.target;
    if (el.name) clearError(el.name);
});


// Final submit: validate, register account, save profile, show modal
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    collect();
    const err = validate();
    if (err) {
        errorLine.textContent = err;
        const firstInvalid = form.querySelector(".is-invalid");
        if (firstInvalid) firstInvalid.focus();
        return;
    }

    // Disable submit button while processing
    btnSubmit.disabled = true;
    btnSubmit.textContent = "Creating account...";
    errorLine.textContent = "";

    try {
        // Step 1: Create user account
        const displayName = `${state.firstName || ""} ${state.lastName || ""}`.trim();
        const registerResult = await apiRequest("/auth/register", {
            method: "POST",
            body: JSON.stringify({
                email: state.email,
                password: state.password,
                displayName: displayName,
                role: (state.role || "Teacher").toLowerCase()
            })
        });

        if (!registerResult.success || !registerResult.userId) {
            throw new Error("Registration failed");
        }

        const userId = registerResult.userId;

        // Step 2: Save profile details
        await apiRequest("/user/profile", {
            method: "POST",
            body: JSON.stringify({
                userId: userId,
                firstName: state.firstName,
                lastName: state.lastName,
                phone: state.phone || null,
                street: state.street || null,
                city: state.city || null,
                province: state.state || null,
                postalCode: state.zip || null,
                school: state.school || null,
                schoolCity: state.schoolCity || null,
                schoolCountry: state.schoolCountry || null,
                subjects: state.subjects || null,
                grade: state.grade || null,
                interests: state.interests || null
            })
        });

        // Success — clear saved state and show modal
        localStorage.removeItem("profileState");
        showSuccessModal({
            title: "Profile created",
            text: "Everything looks good. You can go to login now.",
            autoMs: 0
        });

    } catch (error) {
        console.error("Registration failed:", error);
        errorLine.textContent = error.message || "Registration failed. Please try again.";
        btnSubmit.disabled = false;
        btnSubmit.textContent = "Create profile";
    }
});

// ---------- Seed UI with saved state and show current step ----------
for (const [k, v] of Object.entries(state)) {
    const el = form.elements[k];
    if (!el) continue;
    if (el.type === "radio") {
        const r = form.querySelector(`input[name="${k}"][value="${v}"]`);
        if (r) r.checked = true;
    } else if (el.type === "checkbox") {
        el.checked = Boolean(v);
    } else {
        el.value = v;
    }
}

show(step);
