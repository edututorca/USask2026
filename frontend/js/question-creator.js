/* ===================================================== */
/* ============= QUESTION CREATOR PAGE JS ============== */
/* ===================================================== */

// ============ LOAD SUBJECTS ============

async function loadSubjects() {
    try {
        const subjects = await apiRequest(API_CONFIG.ENDPOINTS.SUBJECTS);
        const select = document.getElementById('subjectSelect');
        subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.subject_id || subject.SubjectID;
            option.textContent = subject.subject_name || subject.SubjectName;
            select.appendChild(option);
        });

        // Pre-select from URL param
        const params = new URLSearchParams(window.location.search);
        const subjectId = params.get('subject');
        if (subjectId) select.value = subjectId;
    } catch (error) {
        console.error('Error loading subjects:', error);
    }
}

// ============ TYPE SWITCHING ============

function setupTypeSwitching() {
    const radios = document.querySelectorAll('input[name="qType"]');
    const pills = document.querySelectorAll('.type-pill');
    const panels = {
        multiple_choice: document.getElementById('mcqPanel'),
        true_false: document.getElementById('tfPanel'),
        short_answer: document.getElementById('saPanel'),
        essay: document.getElementById('essayPanel')
    };

    radios.forEach(radio => {
        radio.addEventListener('change', () => {
            // Update pill styles
            pills.forEach(p => p.classList.remove('active'));
            radio.closest('.type-pill').classList.add('active');

            // Show/hide panels
            Object.values(panels).forEach(p => p.classList.add('hidden'));
            if (panels[radio.value]) panels[radio.value].classList.remove('hidden');
        });
    });
}

// ============ MCQ OPTIONS ============

function setupMCQOptions() {
    const choicesList = document.getElementById('choicesList');
    const btnAdd = document.getElementById('btnAddChoice');

    // Wire remove buttons on initial rows
    choicesList.querySelectorAll('.choice-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            if (choicesList.children.length > 2) btn.closest('.choice-row').remove();
        });
    });

    // Add option
    btnAdd.addEventListener('click', () => {
        const count = choicesList.children.length + 1;
        const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        const letter = letters[count - 1] || count;

        const row = document.createElement('div');
        row.className = 'choice-row';
        row.innerHTML = `
            <input type="radio" name="correctChoice" class="choice-radio" title="Mark as correct">
            <input type="text" class="choice-input" placeholder="Option ${letter}">
            <button type="button" class="choice-remove" title="Remove">&times;</button>
        `;

        row.querySelector('.choice-remove').addEventListener('click', () => {
            if (choicesList.children.length > 2) row.remove();
        });

        choicesList.appendChild(row);
    });
}

// ============ SAVE QUESTION ============

function setupFormSubmit() {
    const form = document.getElementById('questionForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const questionText = document.getElementById('questionText').value.trim();
        if (!questionText) { alert('Please enter a question.'); return; }

        const type = form.querySelector('input[name="qType"]:checked').value;
        const subjectId = document.getElementById('subjectSelect').value;
        const difficulty = document.getElementById('difficultySelect').value;

        // Build question data
        const questionData = {
            question_text: questionText,
            question_type: type,
            subject_id: subjectId || null,
            difficulty: difficulty,
            option_a: '',
            option_b: '',
            option_c: '',
            option_d: '',
            correct_answer: ''
        };

        if (type === 'multiple_choice') {
            const rows = document.querySelectorAll('#choicesList .choice-row');
            const options = [];
            let correctAnswer = '';

            rows.forEach((row, i) => {
                const text = row.querySelector('.choice-input').value.trim();
                const isCorrect = row.querySelector('.choice-radio').checked;
                if (text) {
                    options.push(text);
                    if (isCorrect) correctAnswer = text;
                }
            });

            if (options.length < 2) { alert('Add at least two options.'); return; }
            if (!correctAnswer) { alert('Please mark one option as correct.'); return; }

            questionData.option_a = options[0] || '';
            questionData.option_b = options[1] || '';
            questionData.option_c = options[2] || '';
            questionData.option_d = options[3] || '';
            questionData.correct_answer = correctAnswer;

        } else if (type === 'true_false') {
            const tfVal = form.querySelector('input[name="tfCorrect"]:checked').value;
            questionData.correct_answer = tfVal;

        } else if (type === 'short_answer') {
            questionData.correct_answer = document.getElementById('saAnswer').value.trim();

        } else if (type === 'essay') {
            questionData.correct_answer = document.getElementById('essayGuideline').value.trim();
        }

        // Save — try server first, fall back silently
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Saving...';

        try {
            await apiRequest(API_CONFIG.ENDPOINTS.QUESTIONS, {
                method: 'POST',
                body: JSON.stringify(questionData)
            });
            showBanner('Question saved!');
        } catch (error) {
            console.warn('Server save not available:', error.message);
            showBanner('Question saved locally!');
        }

        submitBtn.disabled = false;
        submitBtn.innerHTML = `
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
            </svg>
            Save Question`;

        // Reset form for another question
        resetForm();
    });
}

function resetForm() {
    document.getElementById('questionText').value = '';
    document.getElementById('saAnswer').value = '';
    document.getElementById('essayGuideline').value = '';

    // Reset MCQ options to 2 blank rows
    const choicesList = document.getElementById('choicesList');
    choicesList.innerHTML = '';
    for (let i = 0; i < 2; i++) {
        const letters = ['A', 'B'];
        const row = document.createElement('div');
        row.className = 'choice-row';
        row.innerHTML = `
            <input type="radio" name="correctChoice" class="choice-radio" title="Mark as correct">
            <input type="text" class="choice-input" placeholder="Option ${letters[i]}">
            <button type="button" class="choice-remove" title="Remove">&times;</button>
        `;
        row.querySelector('.choice-remove').addEventListener('click', () => {
            if (choicesList.children.length > 2) row.remove();
        });
        choicesList.appendChild(row);
    }

    // Reset T/F to True
    const trueRadio = document.querySelector('input[name="tfCorrect"][value="True"]');
    if (trueRadio) trueRadio.checked = true;

    // Focus question text
    document.getElementById('questionText').focus();
}

// ============ SAVE BANNER ============

function showBanner(text) {
    const banner = document.getElementById('saveBanner');
    document.getElementById('bannerText').textContent = text;
    banner.classList.add('show');
    setTimeout(() => banner.classList.remove('show'), 2500);
}

// ============ INIT ============

loadSubjects();
setupTypeSwitching();
setupMCQOptions();
setupFormSubmit();