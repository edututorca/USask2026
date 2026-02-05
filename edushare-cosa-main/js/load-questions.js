/* ===================================================== */
/* ======= LOAD QUESTIONS FROM QUESTIONPOOL TABLE ===== */
/* ===================================================== */
/**
 * Loads questions from QuestionPool table for the selected Section
 */
(function () {
    async function loadQuestionsForSection(sectionId) {
        const list = document.getElementById('questionsList');
        if (!list) return;

        showLoading(list, 'Loading questions...');

        try {
            // Fetch questions for this section
            const data = await apiRequest(`${API_CONFIG.ENDPOINTS.QUESTIONS}?sectionId=${sectionId}`);
            let questions = data.questions || data || [];

            // Build questions HTML
            const html = questions.map(q => buildQuestionRow(q)).join('');
            list.innerHTML = html;

            // Add click handlers for AI buttons
            list.querySelectorAll('[data-action="ai"]').forEach(btn => {
                btn.addEventListener('click', handleAiButtonClick);
            });

        } catch (error) {
            console.error('Failed to load questions:', error);
            showError(list, 'Failed to load questions');
        }
    }

    function handleAiButtonClick(e) {
        const btn = e.currentTarget;
        const row = btn.closest('.q-row');
        const qText = row.querySelector('.q-title')?.textContent || '';

        // Get context from tabs
        const play = getTabText('.tab--topic') || 'Romeo & Juliet';
        const actRaw = getTabText('.tab--subtopic') || 'Act 1';
        const scnRaw = getTabText('.tab--section') || 'Scene 1';

        const act = actRaw.replace(/[^0-9]/g, '') || '1';
        const scene = scnRaw.replace(/[^0-9]/g, '') || '1';

        const url = new URL('ai-question-creator.html', window.location.href);
        url.searchParams.set('play', play);
        url.searchParams.set('act', act);
        url.searchParams.set('scene', scene);
        // url.searchParams.set('seed', qText); // Could pass the question text as a seed

        window.location.href = url.toString();
    }

    function getTabText(selector) {
        const active = document.querySelector(selector + '.active');
        if (active) return active.dataset.topicName || active.dataset.subtopicName || active.dataset.sectionName || active.textContent.trim();
        return '';
    }

    /**
     * Build HTML for a single question row
     */
    function buildQuestionRow(question) {
        // ... (rest of the buildQuestionRow function looks unchanged except for using question.questionID)
        const typeMap = {
            'Multiple Choice': 'M/C',
            'True/False': 'T/F',
            'Short Answer': 'S/A'
        };
        const typeLabel = typeMap[question.QuestionType] || typeMap[question.questionType] || 'M/C';

        const questionId = question.QuestionID || question.questionID;
        const questionText = question.QuestionText || question.questionText || 'No question text';
        const difficulty = question.Difficulty || question.difficulty || 1;

        const usageCount = question.UsageCount || question.usageCount || 0;
        const voteDisplay = `<span class="usage-count" title="Number of users who used this question">${usageCount}</span>
                             <span class="point-value">/1</span>`;

        const progressWidth = Math.min(Math.max(usageCount * 10, 20), 100);

        return `
            <article class="q-row" data-question-id="${questionId}">
                <label class="q-checkbox">
                    <input type="checkbox"/>
                    <span class="box"></span>
                </label>
                <div class="q-main">
                    <div class="q-title">${escapeHtml(questionText)}</div>
                </div>
                <div class="q-side">
                    <div class="points">${typeLabel}</div>
                    <div class="points">${difficulty} point${difficulty !== 1 ? 's' : ''}</div>
                    <div class="progress">
                        <span class="bar" style="width:${progressWidth}%"></span>
                        <span class="pval">${voteDisplay}</span>
                    </div>
                    <div class="icons">
                        <button class="i check" title="Include" data-action="include">✓</button>
                        <button class="i cross" title="Delete" data-action="delete">✕</button>
                        <button class="i flag" title="Favorite" data-action="favorite">🏳️</button>
                    </div>
                    <button class="ai" data-action="ai">AI ?</button>
                </div>
            </article>
        `;
    }

    // Make functions available globally
    window.loadQuestionsForSection = loadQuestionsForSection;
    window.buildQuestionRow = buildQuestionRow;
})();
