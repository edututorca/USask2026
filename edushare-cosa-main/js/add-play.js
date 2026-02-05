
(function () {
    // -------- DOM references --------
    const btnCancel = document.getElementById('btnCancel');
    const form = document.querySelector('.add-play-form');

    // Main page to go back to if nothing else is available
    const DEFAULT_BACK = './User-Area.html';

    function resolveBackTarget() {
        const qs = new URLSearchParams(window.location.search);
        const fromParam   = qs.get('from');
        const fromSession = sessionStorage.getItem('lastPage');
        const lastPageLS  = localStorage.getItem('lastPage');
        const ref         = (document.referrer || '').trim();


        const safeRef = (ref && !ref.endsWith('/index.html')) ? ref : '';

        return fromParam ||
            fromSession ||
            lastPageLS ||
            safeRef ||
            DEFAULT_BACK;
    }

    // -------- Cancel button behaviour --------
    if (btnCancel) {
        btnCancel.addEventListener('click', function (e) {
            e.preventDefault();
            const target = resolveBackTarget();
            window.location.href = target;
        });
    }

    // -------- Save Play behaviour --------
    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Gather fields
        const title    = (document.getElementById('title')    ?.value || '').trim();
        const author   = (document.getElementById('author')   ?.value || '').trim();
        const year     = (document.getElementById('year')     ?.value || '').trim();
        const language = (document.getElementById('language') ?.value || '').trim();

        if (!title) {
            alert('Please enter a Play Title.');
            return;
        }

        // Build a simple play object
        const newPlay = {
            id: 'p_' + Date.now(),
            title,
            author,
            year,
            language
        };

        // Append to the existing custom list
        const list = JSON.parse(localStorage.getItem('customPlays') || '[]');
        list.push(newPlay);
        localStorage.setItem('customPlays', JSON.stringify(list));

        // Navigate back using the same logic as Cancel
        const target = resolveBackTarget();
        window.location.href = target;
    });
})();
