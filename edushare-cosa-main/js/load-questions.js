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
            const questions = data.questions || data || [];

            if (questions.length === 0) {
                showEmpty(list, 'No questions found for this section. Click "Add Question" below to create one!');
                return;
            }

            // Build questions HTML
            const html = questions.map(q => buildQuestionRow(q)).join('');
            list.innerHTML = html;

        } catch (error) {
            console.error('Failed to load questions:', error);
            showError(list, 'Failed to load questions');
        }
    }

    /**
     * Build HTML for a single question row
     */
    function buildQuestionRow(question) {
        // Map question types to display labels
        const typeMap = {
            'Multiple Choice': 'M/C',
            'True/False': 'T/F',
            'Short Answer': 'S/A'
        };
        const typeLabel = typeMap[question.QuestionType] || typeMap[question.questionType] || 'M/C';
        
        const questionId = question.QuestionID || question.questionID;
        const questionText = question.QuestionText || question.questionText || 'No question text';
        
        // Get usage count - number of users who have used this question
        const usageCount = question.UsageCount || question.usageCount || 0;

        // Progress bar width (optional - can be adjusted or removed)
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
                    <div class="progress">
                        <span class="bar" style="width:${progressWidth}%"></span>
                        <span class="pval">0 /1</span>
                    </div>
                    <div class="usage-count" title="Number of users who used this question">${usageCount}</div>
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