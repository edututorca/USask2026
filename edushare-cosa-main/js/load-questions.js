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
     * Fixed to handle snake_case field names from MySQL
     */
    function buildQuestionRow(question) {
        // Map question types to display labels (supports multiple naming conventions)
        const typeMap = {
            'Multiple Choice': 'M/C',
            'multiple_choice': 'M/C',  // MySQL uses snake_case
            'True/False': 'T/F',
            'true_false': 'T/F',       // MySQL uses snake_case
            'Short Answer': 'S/A',
            'short_answer': 'S/A'      // MySQL uses snake_case
        };
        
<<<<<<< Updated upstream
        const questionId = question.QuestionID || question.questionID;
        const questionText = question.QuestionText || question.questionText || 'No question text';
        const difficulty = question.Difficulty || question.difficulty || 1;
        
        
        //CHANGED: replace votes with usage count 
        // const upvotes = question.Upvotes || question.upvotes || 0;
        // const downvotes = question.Downvotes || question.downvotes || 0;
        // const totalVotes = upvotes - downvotes;
        // const voteDisplay = totalVotes >= 0 ? `votes +${totalVotes}` : `votes ${totalVotes}`;
        
        const usageCount = question.UsageCount || question.usageCount || 0; // number of users who used question
        const voteDisplay = `<span class="usage-count" title="Number of users who used this question">${usageCount}</span>
                             <span class="point-value">/1</span>`; // default point value /1 with tooltip on usage-count
=======
        // Try all naming conventions: PascalCase, camelCase, snake_case
        const typeLabel = typeMap[question.QuestionType] || 
                          typeMap[question.questionType] || 
                          typeMap[question.question_type] || 
                          'M/C';
        
        const questionId = question.QuestionID || 
                           question.questionID || 
                           question.question_id;
        
        const questionText = question.QuestionText || 
                             question.questionText || 
                             question.question_text || 
                             'No question text';
        
        // Get usage count - number of users who have used this question
        const usageCount = question.UsageCount || 
                           question.usageCount || 
                           question.usage_count || 
                           0;
>>>>>>> Stashed changes

        // Progress bar width can be kept or repurposed, optional
        const progressWidth = Math.min(Math.max(usageCount * 10, 20), 100); // using usageCount for width
        
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
                        <span class="pval">${voteDisplay}</span> <!-- UPDATED: usage count + /1 -->
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
