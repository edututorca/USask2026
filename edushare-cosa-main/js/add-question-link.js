
(function () {

    const btn = document.getElementById('btnAddQuestion');
    if (!btn) return;


    function activeOrFirst(selector) {
        const active = document.querySelector(selector + '.active');
        if (active) return active.dataset.topicName || active.dataset.subtopicName || active.dataset.sectionName || active.textContent.trim();

        const first = document.querySelector(selector);
        return first ? (first.dataset.topicName || first.dataset.subtopicName || first.dataset.sectionName || first.textContent.trim()) : '';
    }


    function getContext() {
        const playRaw = activeOrFirst('.tab--topic') || 'Unknown Play';
        const actRaw = activeOrFirst('.tab--subtopic');
        const scnRaw = activeOrFirst('.tab--section');


        const act = (actRaw || '').replace(/[^0-9]/g, '') || '1';
        const scene = (scnRaw || '').replace(/[^0-9]/g, '') || '1';

        return { play: playRaw, act, scene };
    }


    btn.addEventListener('click', (e) => {
        e.preventDefault();

        const { play, act, scene } = getContext();


        try {
            sessionStorage.setItem('ctx:last', JSON.stringify({ play, act, scene }));
        } catch { }


        const url = new URL('question-creator.html', window.location.href);
        url.searchParams.set('play', play);
        url.searchParams.set('act', act);
        url.searchParams.set('scene', scene);
        url.searchParams.set('from', window.location.href);


        window.location.href = url.toString();
    });
})();
