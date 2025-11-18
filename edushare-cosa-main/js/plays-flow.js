// js/plays-flow.js
(function () {
    const btnOpenPlays = document.getElementById('btnOpenPlays');

    const rowPlays  = document.getElementById('rowPlays');
    const rowActs   = document.getElementById('rowActs');
    const rowScenes = document.getElementById('rowScenes');
    const content   = document.getElementById('contentArea');

    // Se faltar algum elemento, sai sem fazer nada (evita erro)
    if (!btnOpenPlays || !rowPlays || !rowActs || !rowScenes || !content) {
        return;
    }

    function clearActive(container, selector) {
        container.querySelectorAll(selector).forEach(el => el.classList.remove('active'));
    }

    // ---------- Estado inicial: só a linha de Plays aparece ----------
    rowPlays.classList.remove('hidden');
    rowActs.classList.add('hidden');
    rowScenes.classList.add('hidden');
    content.classList.add('hidden');

    // ---------- Step 1: clicar em "Plays" no topo ----------
    btnOpenPlays.addEventListener('click', () => {
        // mostra só Plays
        rowPlays.classList.remove('hidden');
        rowActs.classList.add('hidden');
        rowScenes.classList.add('hidden');
        content.classList.add('hidden');

        // limpa seleção das tabs
        clearActive(rowPlays, '.tab--play');
        clearActive(rowActs, '.tab--act');
        clearActive(rowScenes, '.tab--scene');
    });

    // ---------- Step 2: escolher um Play → mostra Acts ----------
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

    // ---------- Step 3: escolher um Act → mostra Scenes ----------
    rowActs.addEventListener('click', (e) => {
        const btn = e.target.closest('.tab--act');
        if (!btn) return;

        clearActive(rowActs, '.tab--act');
        btn.classList.add('active');

        rowScenes.classList.remove('hidden');
        content.classList.add('hidden');

        clearActive(rowScenes, '.tab--scene');
    });

    // ---------- Step 4: escolher Scene → mostra Questions ----------
    rowScenes.addEventListener('click', (e) => {
        const btn = e.target.closest('.tab--scene');
        if (!btn) return;

        clearActive(rowScenes, '.tab--scene');
        btn.classList.add('active');

        content.classList.remove('hidden');
    });
})();
