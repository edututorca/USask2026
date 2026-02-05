/* ===================================================== */
/* ================ LOG OUT → HOME.HTML ================= */
/* ===================================================== */
(function () {
    const btn = document.getElementById('btnLogout');
    if (!btn) return;
    btn.addEventListener('click', function () {
        try { sessionStorage.removeItem('playsOpen'); } catch {}
        window.location.href = 'Login.html';
    });
})();
