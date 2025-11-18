(function () {
    const btnOpenPlays = document.getElementById('btnOpenPlays');

    const rowPlays  = document.getElementById('rowPlays');
    const rowActs   = document.getElementById('rowActs');
    const rowScenes = document.getElementById('rowScenes');
    const content   = document.getElementById('contentArea');

    function clearActive(container, selector){
        container.querySelectorAll(selector).forEach(el => el.classList.remove('active'));
    }

    // Step 1: open Plays row from top menu
    btnOpenPlays.addEventListener('click', () => {
        rowPlays.classList.remove('hidden');
        rowActs.classList.add('hidden');
        rowScenes.classList.add('hidden');
        content.classList.add('hidden');
        clearActive(rowPlays, '.tab--play');
        clearActive(rowActs, '.tab--act');
        clearActive(rowScenes, '.tab--scene');
    });

    // Step 2: choose Play → show Acts
    rowPlays.addEventListener('click', (e) => {
        const btn = e.target.closest('.tab--play');
        if (!btn) return;
        clearActive(rowPlays, '.tab--play');
        btn.classList.add('active');

        rowActs.classList.remove('hidden');
        rowScenes.classList.add('hidden');
        content.classList.add('hidden');
        clearActive(rowActs, '.tab--act');
        clearActive(rowScenes, '.tab--scene');
    });

    // Step 3: choose Act → show Scenes
    rowActs.addEventListener('click', (e) => {
        const btn = e.target.closest('.tab--act');
        if (!btn) return;
        clearActive(rowActs, '.tab--act');
        btn.classList.add('active');

        rowScenes.classList.remove('hidden');
        content.classList.add('hidden');
        clearActive(rowScenes, '.tab--scene');
    });

    // Step 4: choose Scene → show content
    rowScenes.addEventListener('click', (e) => {
        const btn = e.target.closest('.tab--scene');
        if (!btn) return;
        clearActive(rowScenes, '.tab--scene');
        btn.classList.add('active');
        content.classList.remove('hidden');
    });

    // Optional: start with Plays row open (to match your last frame quickly)

   // rowPlays.classList.remove('hidden');
    //rowActs.classList.remove('hidden');
})();

/* =========================================================
   Log Out → go back to Home
   - Binds only to the "Log Out" button in the left sidebar
   - Clears lightweight UI state (optional)
   - Redirects to home.html (adjust path if needed)
   ========================================================= */
(function () {
    // Find the "Log Out" button by text so we don't hit "Archive" or "Profile"
    const logoutBtn = Array.from(document.querySelectorAll('.btn.btn-muted.full'))
        .find(btn => btn.textContent.trim().toLowerCase() === 'log out');

    if (!logoutBtn) return;

    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();

        // Optional confirm (remove if you don’t want the prompt)
        const ok = confirm('Do you want to log out and return to the Home page?');
        if (!ok) return;

        // Optional: clear only ephemeral UI state we set earlier
        sessionStorage.removeItem('playsOpen');
        sessionStorage.removeItem('lastPage');

        // If your files live in the same folder, this is enough:
        window.location.href = 'home.html';

        // If your pages are in subfolders, use this instead:
        // const base = location.pathname.replace(/[^/]+$/, '');
        // window.location.href = base + 'home.html';
    });
})();
