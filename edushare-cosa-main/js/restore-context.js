/* ===================================================== */
/* === RESTORE LAST ACT/SCENE FROM SESSION (IF ANY) ==== */
/* ===================================================== */
/**
 * After the Plays bar is rendered, restore Act/Scene from 'ctx:last'
 * so the page context matches the saved question context on reload.
 */
(function () {
    document.addEventListener('DOMContentLoaded', () => {
        let last = null;
        try { last = JSON.parse(sessionStorage.getItem('ctx:last') || 'null'); } catch {}
        if (!last) return;

        // Activate the saved Act
        if (last.act) {
            document.querySelectorAll('.tab--act').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.act === String(last.act));
            });
        }
        // Activate the saved Scene
        if (last.scene) {
            document.querySelectorAll('.tab--scene').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.scene === String(last.scene));
            });
        }
    });
})();
