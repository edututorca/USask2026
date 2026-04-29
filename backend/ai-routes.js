/**
 * ============================================================
 * AI Question Generation Routes for EduShare
 * ============================================================
 *
 * SETUP:
 *
 * 1. Install the OpenAI SDK:
 *    cd ~/edushare-server
 *    npm install openai
 *
 * 2. Add your API key to ~/edushare-server/.env:
 *    OPENAI_API_KEY=sk-your-key-here
 *
 * 3. In your server.js, add these two lines:
 *    const aiRoutes = require('./ai-routes');
 *    app.use('/api/ai', aiRoutes);
 *
 * 4. Restart the server:
 *    pm2 restart edushare
 *
 * Endpoint: POST /api/ai/generate
 * ============================================================
 */

const express = require('express');
const router = express.Router();

// ─── Configuration ───────────────────────────────────────────
const USE_MOCK = !process.env.OPENAI_API_KEY;

let openai = null;
if (!USE_MOCK) {
    const OpenAI = require('openai');
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });
    console.log('[AI] OpenAI API key found - using real AI generation (GPT-4o mini)');
} else {
    console.log('[AI] No OPENAI_API_KEY found - using mock mode');
    console.log('[AI] Add OPENAI_API_KEY to .env to enable real AI generation');
}


// ─── POST /api/ai/generate ──────────────────────────────────
router.post('/generate', async (req, res) => {
    try {
        const {
            topic,          // e.g. "Romeo and Juliet"
            subtopic,       // e.g. "Act 3"
            section,        // e.g. "Scene 4"
            subject,        // e.g. "English"
            grade,          // e.g. "10"
            types,          // array: [{ type: "MCQ", count: 3 }, { type: "TF", count: 2 }]
            customPrompt,   // optional extra instructions
            documentText,   // optional: text extracted from uploaded PDF
            bloomsLevel     // optional: Bloom's taxonomy level
        } = req.body;

        // Validate
        if (!types || !Array.isArray(types) || types.length === 0) {
            return res.status(400).json({ error: 'Must specify at least one question type' });
        }

        const totalQuestions = types.reduce((sum, t) => sum + (t.count || 0), 0);
        if (totalQuestions === 0 || totalQuestions > 30) {
            return res.status(400).json({ error: 'Total questions must be between 1 and 30' });
        }

        let questions;

        if (USE_MOCK) {
            questions = generateMockQuestions(types, topic, subtopic, section);
        } else {
            questions = await generateWithAI(
                types, topic, subtopic, section, subject, grade, customPrompt, documentText, bloomsLevel
            );
        }

        res.json({
            success: true,
            questions,
            mode: USE_MOCK ? 'mock' : 'ai',
            count: questions.length
        });

    } catch (error) {
        console.error('[AI] Generation error:', error);
        res.status(500).json({
            error: 'Failed to generate questions',
            details: error.message
        });
    }
});


// ─── Real AI Generation ─────────────────────────────────────
async function generateWithAI(types, topic, subtopic, section, subject, grade, customPrompt, documentText, bloomsLevel) {

    // Build the type breakdown string
    const typeBreakdown = types.map(t => {
        const typeName = {
            'MCQ': 'Multiple Choice (4 options, 1 correct)',
            'TF': 'True/False',
            'SA': 'Short Answer',
            'LA': 'Long Answer / Essay'
        }[t.type] || t.type;
        return `- ${t.count}x ${typeName}`;
    }).join('\n');

    // Build context
    let contextInfo = '';
    if (topic) contextInfo += `Topic: ${topic}\n`;
    if (subtopic) contextInfo += `Section/Chapter: ${subtopic}\n`;
    if (section) contextInfo += `Specific part: ${section}\n`;
    if (subject) contextInfo += `Subject area: ${subject}\n`;
    if (grade) contextInfo += `Grade level: ${grade}\n`;
    if (bloomsLevel) contextInfo += `Bloom's Taxonomy level: ${bloomsLevel} - focus questions on this cognitive level\n`;

    let documentContext = '';
    if (documentText && documentText.trim().length > 0) {
        const truncated = documentText.slice(0, 3000);
        documentContext = `\n\nThe teacher uploaded the following document content to base questions on:\n---\n${truncated}\n---\n`;
    }

    const prompt = `You are an expert teacher creating quiz questions for high school students.

Context:
${contextInfo}
Generate the following questions:
${typeBreakdown}
${documentContext}
${customPrompt ? `\nAdditional instructions from the teacher: ${customPrompt}` : ''}

IMPORTANT: Respond ONLY with a valid JSON array. No markdown, no backticks, no explanation.

Each question object must have this exact format:

For Multiple Choice (MCQ):
{
  "type": "MCQ",
  "text": "The question text",
  "options": [
    { "text": "Option A text", "correct": false },
    { "text": "Option B text", "correct": true },
    { "text": "Option C text", "correct": false },
    { "text": "Option D text", "correct": false }
  ]
}

For True/False (TF):
{
  "type": "TF",
  "text": "Statement that is either true or false",
  "options": [
    { "text": "True", "correct": true },
    { "text": "False", "correct": false }
  ]
}

For Short Answer (SA):
{
  "type": "SA",
  "text": "The question text",
  "options": []
}

For Long Answer (LA):
{
  "type": "LA",
  "text": "The essay/long answer question",
  "options": []
}

Rules:
- Questions should be appropriate for grade ${grade || '9-12'} students
- Questions should be clear, educational, and test understanding (not just recall)
- For MCQ, always provide exactly 4 options with exactly 1 correct answer
- Vary difficulty across the questions
- Make questions specific to the topic, not generic
- Respond with ONLY the JSON array, nothing else`;

    const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 4096,
        temperature: 0.7,
        messages: [
            {
                role: 'system',
                content: 'You are an expert teacher who creates high-quality quiz questions. Always respond with valid JSON only.'
            },
            {
                role: 'user',
                content: prompt
            }
        ]
    });

    // Extract the text response
    const responseText = completion.choices[0].message.content || '';

    // Parse JSON - handle potential markdown wrapping
    let cleaned = responseText.trim();
    if (cleaned.startsWith('```json')) {
        cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
        cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();

    const questions = JSON.parse(cleaned);

    if (!Array.isArray(questions)) {
        throw new Error('AI response was not a JSON array');
    }

    // Validate and clean each question
    return questions.map(q => ({
        type: q.type || 'SA',
        text: q.text || 'Question text missing',
        options: Array.isArray(q.options) ? q.options.map(opt => ({
            text: opt.text || '',
            correct: !!opt.correct
        })) : []
    }));
}


// ─── Mock Generation (for development without API key) ──────
function generateMockQuestions(types, topic, subtopic, section) {
    const questions = [];
    const topicName = topic || 'the topic';

    const mcqBank = [
        {
            text: `In ${topicName}, which character undergoes the most significant transformation?`,
            options: [
                { text: 'The protagonist', correct: true },
                { text: 'The antagonist', correct: false },
                { text: 'The narrator', correct: false },
                { text: 'A minor character', correct: false }
            ]
        },
        {
            text: `What is the primary theme explored in ${topicName}?`,
            options: [
                { text: 'Love and sacrifice', correct: true },
                { text: 'Industrial progress', correct: false },
                { text: 'Space exploration', correct: false },
                { text: 'Cooking techniques', correct: false }
            ]
        },
        {
            text: `Which literary device is most prominently used in ${topicName}?`,
            options: [
                { text: 'Foreshadowing', correct: true },
                { text: 'Onomatopoeia', correct: false },
                { text: 'Alliteration only', correct: false },
                { text: 'None of the above', correct: false }
            ]
        },
        {
            text: `What is the setting of ${topicName}?`,
            options: [
                { text: 'A historical city', correct: true },
                { text: 'Outer space', correct: false },
                { text: 'A submarine', correct: false },
                { text: 'The future', correct: false }
            ]
        },
        {
            text: `What motivates the main conflict in ${topicName}?`,
            options: [
                { text: 'Family rivalry', correct: true },
                { text: 'A treasure map', correct: false },
                { text: 'A science experiment', correct: false },
                { text: 'A cooking competition', correct: false }
            ]
        }
    ];

    const tfBank = [
        `The events in ${topicName} take place over a single day.`,
        `${topicName} contains elements of dramatic irony.`,
        `The protagonist in ${topicName} achieves their goal by the end.`,
        `${topicName} was written in the 20th century.`,
        `The main conflict in ${topicName} is resolved peacefully.`
    ];

    const saBank = [
        `Explain how the theme of loyalty is presented in ${topicName}.`,
        `Describe the relationship between the two main characters in ${topicName}.`,
        `What role does the setting play in ${topicName}? Provide specific examples.`,
        `How does the author use symbolism in ${topicName}?`,
        `Analyze the turning point in ${topicName} and its significance.`
    ];

    const laBank = [
        `Write a detailed analysis of character development in ${topicName}. Use specific examples from the text to support your argument.`,
        `Compare and contrast two major themes in ${topicName}. How do they interact throughout the story?`,
        `How does ${topicName} reflect the social and cultural context in which it was written? Provide evidence from the text.`
    ];

    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

    types.forEach(({ type, count }) => {
        for (let i = 0; i < count; i++) {
            if (type === 'MCQ') {
                const q = pick(mcqBank);
                questions.push({ type: 'MCQ', text: q.text, options: [...q.options] });
            } else if (type === 'TF') {
                const text = pick(tfBank);
                questions.push({
                    type: 'TF',
                    text,
                    options: [
                        { text: 'True', correct: Math.random() > 0.5 },
                        { text: 'False', correct: false }
                    ]
                });
                const q = questions[questions.length - 1];
                q.options[1].correct = !q.options[0].correct;
            } else if (type === 'SA') {
                questions.push({ type: 'SA', text: pick(saBank), options: [] });
            } else if (type === 'LA') {
                questions.push({ type: 'LA', text: pick(laBank), options: [] });
            }
        }
    });

    return questions;
}


module.exports = router;
