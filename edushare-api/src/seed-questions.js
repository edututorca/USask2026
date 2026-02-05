const pool = require("./db/pool");

async function seed() {
    console.log("Starting unique comprehensive seed for Romeo & Juliet...");
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Clear existing questions for Romeo & Juliet to avoid duplicates
        // We'll only clear questions from sections belonging to Romeo & Juliet Topic
        const [rjTopic] = await connection.execute("SELECT TopicID FROM Topic WHERE TopicName = 'Romeo & Juliet'");
        if (rjTopic.length === 0) {
            console.error("Romeo & Juliet topic not found.");
            return;
        }
        const topicId = rjTopic[0].TopicID;

        const [sections] = await connection.execute(
            `SELECT s.SectionID, st.SubTopicName, s.SectionName 
             FROM Section s 
             JOIN SubTopic st ON s.SubTopicID = st.SubTopicID 
             WHERE st.TopicID = ?`, [topicId]
        );

        console.log(`Cleaning up existing questions for ${sections.length} sections...`);
        for (const s of sections) {
            await connection.execute("DELETE FROM QuestionPool WHERE SectionID = ?", [s.SectionID]);
        }

        // 2. Define unique questions for each Act/Scene
        const questionData = {
            "Act 1": {
                "Scene 1": [
                    { type: "Multiple Choice", text: "Who starts the brawl in the opening scene?", options: [{ text: "Sampson and Gregory", correct: 1 }, { text: "Romeo and Benvolio", correct: 0 }, { text: "Tybalt and Mercutio", correct: 0 }, { text: "Prince Escalus", correct: 0 }] },
                    { type: "Short Answer", text: "What penalty does Prince Escalus threaten for further fighting?" },
                    { type: "True/False", text: "Romeo is in love with Juliet at the very beginning of the play.", options: [{ text: "True", correct: 0 }, { text: "False", correct: 1 }] }
                ],
                "Scene 2": [
                    { type: "Multiple Choice", text: "Who asks Lord Capulet for Juliet's hand in marriage?", options: [{ text: "Paris", correct: 1 }, { text: "Romeo", correct: 0 }, { text: "Tybalt", correct: 0 }, { text: "Mercutio", correct: 0 }] },
                    { type: "Short Answer", text: "How does Romeo find out about the Capulet party?" },
                    { type: "True/False", text: "Juliet is already 14 years old in this scene.", options: [{ text: "True", correct: 0 }, { text: "False", correct: 1 }] }
                ],
                "Scene 3": [
                    { type: "Multiple Choice", text: "Who tells Juliet that Paris is a 'man of wax'?", options: [{ text: "The Nurse", correct: 1 }, { text: "Lady Capulet", correct: 0 }, { text: "Romeo", correct: 0 }, { text: "Lord Capulet", correct: 0 }] },
                    { type: "Short Answer", text: "What is Juliet's initial attitude toward marriage?" },
                    { type: "True/False", text: "The Nurse has a daughter named Susan who died.", options: [{ text: "True", correct: 1 }, { text: "False", correct: 0 }] }
                ],
                "Scene 4": [
                    { type: "Multiple Choice", text: "Which mythical figure does Mercutio describe in his long speech?", options: [{ text: "Queen Mab", correct: 1 }, { text: "Cupid", correct: 0 }, { text: "Venus", correct: 0 }, { text: "Diana", correct: 0 }] },
                    { type: "Short Answer", text: "What is Romeo's premonition before entering the party?" },
                    { type: "True/False", text: "Romeo and his friends are wearing masks to the party.", options: [{ text: "True", correct: 1 }, { text: "False", correct: 0 }] }
                ],
                "Scene 5": [
                    { type: "Multiple Choice", text: "Who recognizes Romeo's voice and wants to fight him at the party?", options: [{ text: "Tybalt", correct: 1 }, { text: "Lord Capulet", correct: 0 }, { text: "Paris", correct: 0 }, { text: "Juliet", correct: 0 }] },
                    { type: "Short Answer", text: "What is the metaphor Romeo uses to describe Juliet when they first speak?" },
                    { type: "True/False", text: "Romeo and Juliet find out each other's identity before the party ends.", options: [{ text: "True", correct: 1 }, { text: "False", correct: 0 }] }
                ]
            },
            "Act 2": {
                "Scene 1": [
                    { type: "Multiple Choice", text: "Where does Romeo go after the party ends?", options: [{ text: "The Capulet orchard", correct: 1 }, { text: "His home", correct: 0 }, { text: "A tavern", correct: 0 }, { text: "The church", correct: 0 }] },
                    { type: "Short Answer", text: "Who are Mercutio and Benvolio looking for in this scene?" },
                    { type: "True/False", text: "Mercutio knows that Romeo is now in love with Juliet.", options: [{ text: "True", correct: 0 }, { text: "False", correct: 1 }] }
                ],
                "Scene 2": [
                    { type: "Multiple Choice", text: "What does Juliet say is the only enemy of her love?", options: [{ text: "Romeo's name", correct: 1 }, { text: "Her father", correct: 0 }, { text: "Tybalt", correct: 0 }, { text: "The moon", correct: 0 }] },
                    { type: "Short Answer", text: "What time are Romeo and Juliet supposed to meet (via messenger) the next day?" },
                    { type: "True/False", text: "Juliet is the first one to mention marriage in the balcony scene.", options: [{ text: "True", correct: 1 }, { text: "False", correct: 0 }] }
                ],
                "Scene 3": [
                    { type: "Multiple Choice", text: "What is Friar Lawrence doing when he first appears?", options: [{ text: "Gathering herbs", correct: 1 }, { text: "Praying", correct: 0 }, { text: "Reading", correct: 0 }, { text: "Cooking", correct: 0 }] },
                    { type: "Short Answer", text: "Why does Friar Lawrence agree to marry Romeo and Juliet?" },
                    { type: "True/False", text: "Friar Lawrence initially scolds Romeo for forgetting Rosaline so quickly.", options: [{ text: "True", correct: 1 }, { text: "False", correct: 0 }] }
                ],
                "Scene 4": [
                    { type: "Multiple Choice", text: "What has Tybalt sent to Romeo's house?", options: [{ text: "A challenge to a duel", correct: 1 }, { text: "A letter of apology", correct: 0 }, { text: "An invitation to dinner", correct: 0 }, { text: "A death threat", correct: 0 }] },
                    { type: "Short Answer", text: "How does Romeo plan to get into Juliet's room on their wedding night?" },
                    { type: "True/False", text: "Mercutio is impressed by Romeo's wit and high spirits in this scene.", options: [{ text: "True", correct: 1 }, { text: "False", correct: 0 }] }
                ],
                "Scene 5": [
                    { type: "Multiple Choice", text: "How long has the Nurse been gone to deliver the message to Romeo?", options: [{ text: "Three hours", correct: 1 }, { text: "One hour", correct: 0 }, { text: "All night", correct: 0 }, { text: "Thirty minutes", correct: 0 }] },
                    { type: "Short Answer", text: "Why does the Nurse delay telling Juliet the news?" },
                    { type: "True/False", text: "The Nurse thinks Romeo is a handsome and virtuous man.", options: [{ text: "True", correct: 1 }, { text: "False", correct: 0 }] }
                ]
            },
            "Act 3": {
                "Scene 1": [
                    { type: "Multiple Choice", text: "Who kills Mercutio?", options: [{ text: "Tybalt", correct: 1 }, { text: "Romeo", correct: 0 }, { text: "Benvolio", correct: 0 }, { text: "Paris", correct: 0 }] },
                    { type: "Short Answer", text: "Why does Romeo eventually fight Tybalt?" },
                    { type: "True/False", text: "Mercutio dies while wishing a 'plague on both your houses'.", options: [{ text: "True", correct: 1 }, { text: "False", correct: 0 }] }
                ],
                "Scene 2": [
                    { type: "Multiple Choice", text: "Who brings the news of Tybalt's death to Juliet?", options: [{ text: "The Nurse", correct: 1 }, { text: "Lady Capulet", correct: 0 }, { text: "A servant", correct: 0 }, { text: "Benvolio", correct: 0 }] },
                    { type: "Short Answer", text: "How does Juliet react when she first hears Romeo killed Tybalt?" },
                    { type: "True/False", text: "Juliet says Romeo's banishment is worse than a thousand Tybalt deaths.", options: [{ text: "True", correct: 1 }, { text: "False", correct: 0 }] }
                ],
                "Scene 3": [
                    { type: "Multiple Choice", text: "Where is Romeo hiding after the duel?", options: [{ text: "Friar Lawrence's cell", correct: 1 }, { text: "The orchard", correct: 0 }, { text: "Mantua", correct: 0 }, { text: "His own house", correct: 0 }] },
                    { type: "Short Answer", text: "How does Romeo describe his banishment?" },
                    { type: "True/False", text: "The Nurse gives Romeo a ring from Juliet.", options: [{ text: "True", correct: 1 }, { text: "False", correct: 0 }] }
                ],
                "Scene 4": [
                    { type: "Multiple Choice", text: "On what day does Lord Capulet schedule Juliet's wedding to Paris?", options: [{ text: "Thursday", correct: 1 }, { text: "Monday", correct: 0 }, { text: "Wednesday", correct: 0 }, { text: "Sunday", correct: 0 }] },
                    { type: "Short Answer", text: "Why does Lord Capulet think a small wedding is better than a large one?" },
                    { type: "True/False", text: "Lord Capulet believes Juliet will be obedient to his decision.", options: [{ text: "True", correct: 1 }, { text: "False", correct: 0 }] }
                ],
                "Scene 5": [
                    { type: "Multiple Choice", text: "What bird do Romeo and Juliet argue about hearing at dawn?", options: [{ text: "Lark and Nightingale", correct: 1 }, { text: "Robin and Eagle", correct: 0 }, { text: "Owl and Dove", correct: 0 }, { text: "Raven and Swan", correct: 0 }] },
                    { type: "Short Answer", text: "What is the Nurse's advice to Juliet regarding Paris?" },
                    { type: "True/False", text: "Juliet threatens to kill herself if she is forced to marry Paris.", options: [{ text: "True", correct: 1 }, { text: "False", correct: 0 }] }
                ]
            },
            "Act 4": {
                "Scene 1": [
                    { type: "Multiple Choice", text: "What will Friar Lawrence's potion do to Juliet?", options: [{ text: "Make her appear dead for 42 hours", correct: 1 }, { text: "Make her fall in love with Paris", correct: 0 }, { text: "Kill her instantly", correct: 0 }, { text: "Make her invisible", correct: 0 }] },
                    { type: "Short Answer", text: "What is Juliet's plan if the potion doesn't work?" },
                    { type: "True/False", text: "Paris is present in Friar Lawrence's cell when Juliet arrives.", options: [{ text: "True", correct: 1 }, { text: "False", correct: 0 }] }
                ],
                "Scene 2": [
                    { type: "Multiple Choice", text: "What does Juliet tell her father when she returns from the Friar?", options: [{ text: "She will marry Paris", correct: 1 }, { text: "She is leaving Verona", correct: 0 }, { text: "She hates Romeo", correct: 0 }, { text: "She wants to be a nun", correct: 0 }] },
                    { type: "Short Answer", text: "How does Lord Capulet reflect his excitement for the wedding?" },
                    { type: "True/False", text: "The wedding is moved from Thursday to Wednesday.", options: [{ text: "True", correct: 1 }, { text: "False", correct: 0 }] }
                ],
                "Scene 3": [
                    { type: "Multiple Choice", text: "What are some of Juliet's fears before taking the potion?", options: [{ text: "Waking up alone in the tomb", correct: 1 }, { text: "The potion being poisoned", correct: 0 }, { text: "Romeo not coming for her", correct: 0 }, { text: "All of the above", correct: 1 }] },
                    { type: "Short Answer", text: "What does Juliet keep by her bedside just in case?" },
                    { type: "True/False", text: "Juliet drinks a toast to Romeo before swallowing the liquid.", options: [{ text: "True", correct: 1 }, { text: "False", correct: 0 }] }
                ],
                "Scene 4": [
                    { type: "Multiple Choice", text: "What time is it when the Capulets are frantically preparing for the wedding?", options: [{ text: "Three in the morning", correct: 1 }, { text: "Noon", correct: 0 }, { text: "Sunset", correct: 0 }, { text: "Midnight", correct: 0 }] },
                    { type: "Short Answer", text: "Who is sent to wake up Juliet?" },
                    { type: "True/False", text: "Lord Capulet has stayed up all night to help with preparations.", options: [{ text: "True", correct: 1 }, { text: "False", correct: 0 }] }
                ],
                "Scene 5": [
                    { type: "Multiple Choice", text: "What does Lord Capulet say has 'married' his daughter instead of Paris?", options: [{ text: "Death", correct: 1 }, { text: "Romeo", correct: 0 }, { text: "Misery", correct: 0 }, { text: "The Grave", correct: 0 }] },
                    { type: "Short Answer", text: "How does Friar Lawrence console the grieving family?" },
                    { type: "True/False", text: "The wedding decorations are repurposed for a funeral.", options: [{ text: "True", correct: 1 }, { text: "False", correct: 0 }] }
                ]
            },
            "Act 5": {
                "Scene 1": [
                    { type: "Multiple Choice", text: "Who tells Romeo that Juliet is dead?", options: [{ text: "Balthasar", correct: 1 }, { text: "Friar Lawrence", correct: 0 }, { text: "The Nurse", correct: 0 }, { text: "Benvolio", correct: 0 }] },
                    { type: "Short Answer", text: "Where does Romeo get the poison?" },
                    { type: "True/False", text: "Selling poison is a capital crime in Mantua.", options: [{ text: "True", correct: 1 }, { text: "False", correct: 0 }] }
                ],
                "Scene 2": [
                    { type: "Multiple Choice", text: "Why was Friar John unable to deliver the letter to Romeo?", options: [{ text: "He was quarantined due to a plague", correct: 1 }, { text: "He lost the letter", correct: 0 }, { text: "Romeo had already left", correct: 0 }, { text: "He was attacked by bandits", correct: 0 }] },
                    { type: "Short Answer", text: "What is Friar Lawrence's new plan after learning the letter wasn't delivered?" },
                    { type: "True/False", text: "Friar Lawrence plans to keep Juliet in his cell until Romeo can be reached.", options: [{ text: "True", correct: 1 }, { text: "False", correct: 0 }] }
                ],
                "Scene 3": [
                    { type: "Multiple Choice", text: "Who does Romeo fight and kill at the Capulet tomb?", options: [{ text: "Paris", correct: 1 }, { text: "Tybalt's ghost", correct: 0 }, { text: "Balthasar", correct: 0 }, { text: "Prince Escalus", correct: 0 }] },
                    { type: "Short Answer", text: "How does the play end for the Capulet and Montague families?" },
                    { type: "True/False", text: "Romeo dies only seconds before Juliet wakes up.", options: [{ text: "True", correct: 1 }, { text: "False", correct: 0 }] }
                ],
                "Scene 4": [
                    { type: "Multiple Choice", text: "In this alternate Scene 4 context, who brings the statues of gold?", options: [{ text: "Both families as a sign of peace", correct: 1 }, { text: "The Prince", correct: 0 }, { text: "Friar Lawrence", correct: 0 }, { text: "Lord Capulet only", correct: 0 }] },
                    { type: "Short Answer", text: "What is the final message of the Prince in the play?" },
                    { type: "True/False", text: "Lady Montague is also dead by the end of the play.", options: [{ text: "True", correct: 1 }, { text: "False", correct: 0 }] }
                ],
                "Scene 5": [
                    { type: "Multiple Choice", text: "What is the global legacy of Romeo & Juliet?", options: [{ text: "The ultimate representation of young love", correct: 1 }, { text: "A warning against marriage", correct: 0 }, { text: "A story about ancient Italy", correct: 0 }, { text: "A comic masterpiece", correct: 0 }] },
                    { type: "Short Answer", text: "How would you redefine the 'star-crossed' fate of the characters?" },
                    { type: "True/False", text: "The play is considered a Shakespearean Tragedy.", options: [{ text: "True", correct: 1 }, { text: "False", correct: 0 }] }
                ]
            }
        };

        let totalQuestions = 0;

        for (const s of sections) {
            const actData = questionData[s.SubTopicName];
            if (!actData) continue;
            const scenes = actData[s.SectionName];
            if (!scenes) continue;

            console.log(`Inserting questions for ${s.SubTopicName} ${s.SectionName}...`);
            for (const q of scenes) {
                const [qResult] = await connection.execute(
                    "INSERT INTO QuestionPool (SectionID, QuestionText, QuestionType, Difficulty) VALUES (?, ?, ?, ?)",
                    [s.SectionID, q.text, q.type, 2]
                );
                const questionId = qResult.insertId;
                totalQuestions++;

                if (q.options) {
                    for (const opt of q.options) {
                        await connection.execute(
                            "INSERT INTO QuestionOption (QuestionID, OptionText, IsCorrect) VALUES (?, ?, ?)",
                            [questionId, opt.text, opt.correct]
                        );
                    }
                }
            }
        }

        await connection.commit();
        console.log(`Seed complete! Successfully inserted ${totalQuestions} unique questions.`);
    } catch (err) {
        await connection.rollback();
        console.error("Seed failed:", err);
    } finally {
        connection.release();
        process.exit();
    }
}

seed();
