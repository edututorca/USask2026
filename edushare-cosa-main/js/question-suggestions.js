// js/question-suggestions.js
// Suggest existing questions while I type a new one.
// Now: uses MOCK_QUESTIONS in the front-end.
// Later: we will swap getSuggestions() to call Node.js + DB.

(function () {
    const input = document.getElementById('qText');
    const box   = document.getElementById('qSuggestions');

    if (!input || !box) return;

    // ---- Mock questions (front-end only for now) ----
    const MOCK_QUESTIONS = [
        {
            id: 1,
            text: "Identify the main conflict in Act 1 of Romeo and Juliet.",
            type: "MCQ",
            subject: "English",
            topic: "Plays"
        },
        {
            id: 2,
            text: "What is the slope of a line that passes through (2, 3) and (4, 7)?",
            type: "SA",
            subject: "Mathematics",
            topic: "Algebra"
        },
        {
            id: 3,
            text: "Explain the difference between RAM and ROM.",
            type: "SA",
            subject: "Computer Science",
            topic: "Hardware"
        },
        {
            id: 4,
            text: "Describe Juliet's emotional state in Act 2, Scene 2.",
            type: "SA",
            subject: "English",
            topic: "Plays"
        }

    ];

    // ---- Debounce helper ----
    let debounceTimer = null;
    function debounce(fn, delay) {
        return function (...args) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    /**
     * Now: simple filter in MOCK_QUESTIONS
     * Later: we will replace this with a real API call (Node.js).
     */
    function getSuggestions(query) {
        const q = query.trim().toLowerCase();
        if (!q || q.length < 3) return []; // only suggest after 3+ chars

        return MOCK_QUESTIONS
            .filter(item => item.text.toLowerCase().includes(q))
            .slice(0, 8);
    }

    function renderSuggestions(list) {
        if (!list || list.length === 0) {
            box.innerHTML = '';
            box.classList.add('hidden');
            return;
        }

        box.innerHTML = '';

        list.forEach(item => {
            const div = document.createElement('div');
            div.className = 'q-suggestion-item';
            div.dataset.questionId = item.id;

            div.innerHTML = `
                <div class="q-suggestion-title">${item.text}</div>
                <div class="q-suggestion-meta">
                    ${item.subject || ''}${item.topic ? ' · ' + item.topic : ''}${
                item.type ? ' · ' + item.type : ''
            }
                </div>
            `;

            div.addEventListener('click', () => {
                applySuggestion(item);
            });

            box.appendChild(div);
        });

        box.classList.remove('hidden');
    }

    function applySuggestion(item) {
        // 1) Fill question text
        input.value = item.text;

        // 2) Set answer type (MCQ / TF / SA) if it matches your radio values
        if (item.type) {
            const radio = document.querySelector(
                `input[name="qType"][value="${item.type}"]`
            );
            if (radio) {
                radio.checked = true;
                // trigger change so panels (MCQ/TF/SA) toggle correctly
                radio.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }

        // Hide suggestion list after selecting
        box.classList.add('hidden');
        box.innerHTML = '';
    }

    // ---- Listen for typing in qText ----
    const handleInput = debounce(() => {
        const query = input.value;
        const suggestions = getSuggestions(query);
        renderSuggestions(suggestions);
    }, 300);

    input.addEventListener('input', handleInput);

    // Hide suggestions when click outside
    document.addEventListener('click', (e) => {
        if (!box.contains(e.target) && e.target !== input) {
            box.classList.add('hidden');
        }
    });
})();
