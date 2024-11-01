/*
SYSTEM Update:

The system was already coded, but some new requirements appeared. 
You are asked to add functionality to the existing system. As a result some events already exist. You can use them if they fit your need. If not, create new events as regular. 



#Your process should be as follows:
     Before implementing answer the 2 next question.
      1. What events are needed? First answer in words, then give them a name. 
                *Remember that any change/update in entities requires an event, and you can't modify an entity inside a bthread.
               *Make sure you don't miss any mentioned functionality or event that is mentioned. We declare every functionality as event and don't assume any other libraries.
                *Remember that if an effect is needed for a waitedFor event, you need to create a new event that has the effect and which you will request.
                
      2. Do they already exist?
      After answering the questions, implement.

       * Make sure that you create the events you described as needed!(unless they exist).
      * Make sure you obey your original instructions. Providing one bthread.

*All parts that aren't code should be in a comment.
 

A summary of existing events that were declared before and you can use if needed, without declaring them again:

            1. startButtonClickEvent() 
            2. moveToMovieComponentEvent() - has an effect:
                        ctx.registerEffect('moveToMovieComponentEvent', function (data) {
                              let phase = ctx.getEntityById('gamePhase1'); 
                              phase.currentComponent = 'movie'; 
                         });
            3. startMovieEvent()
            4. mouseClickDuringMovieEvent()
            5. movieCompletedEvent()
            6. moveToMainMenuComponentEvent() - has an effect:
                        ctx.registerEffect('moveToMainMenuComponentEvent', function (data) {
                                let phase = ctx.getEntityById('gamePhase1'); 
                                phase.currentComponent = 'main_menu'; 
                             });

           
      * Don't assume the existence of any other functions.
      * Rememeber that you must create an effect (and an according event) if you want to update an entity. You cant do it without an effect.
      **Make sure you provide all parameters when calling the function. If you don't know all parameters, use `anyEventNameWithData` function using the function name as the event name. For example: anyEventNameWithData("<EventName>").  If you know all parameters, use the function directly, for example:  <EventName>(param1, param2). 
*/
/*


//A question has its content, 4 options and the index of the right option
function question(id, content, options, rightOptionIndex) {
    return ctx.Entity(id, 'question', {
        content: content,
        options: options,
        rightOptionIndex: rightOptionIndex
    });
}
/*
There is one entity called "AllQuestions" which will hold 4 questions about the USA history(place the right answer at a random position)
*/
function AllQuestions(id, questions) {
    return ctx.Entity(id, 'AllQuestions', { questions: questions });
}

ctx.populateContext([
    AllQuestions('allQuestions1', [
        question('q1', 'Who was the first President of the United States?', ['George Washington', 'Thomas Jefferson', 'Abraham Lincoln', 'Theodore Roosevelt'], 0),
        question('q2', 'What year did the United States declare independence?', ['1776', '1492', '1607', '1865'], 0),
        question('q3', 'What is the capital of the United States?', ['New York City', 'Los Angeles', 'Washington D.C.', 'Miami'], 2),
        question('q4', 'Which event began on April 12, 1861?', ['World War I', 'The Great Depression', 'The Civil War', 'The Declaration of Independence'], 2)
    ])
]);

//In addition, there is a phase to the game that holds the current component of the game, starting with "game_start" at the beginning and a score entity
function phase(id, currentComponent) {
    return ctx.Entity(id, 'phase', {currentComponent: currentComponent});
}

function score(id, value) {
    return ctx.Entity(id, 'score', {value: value});
}

ctx.populateContext([
    phase('gamePhase1', 'game_start'),
    score('score1', 0)
]);
//queries needed:
//a query for each phase of the game(start, movie, main menu, game sequence, ending scene, question updater, math umbrella )
ctx.registerQuery('phase.start', entity => entity.type == 'phase' && entity.currentComponent == 'game_start');
ctx.registerQuery('phase.movie', entity => entity.type == 'phase' && entity.currentComponent == 'movie');
ctx.registerQuery('phase.mainMenu', entity => entity.type == 'phase' && entity.currentComponent == 'main_menu');
ctx.registerQuery('phase.gameSequence', entity => entity.type == 'phase' && entity.currentComponent == 'game_sequence');
ctx.registerQuery('phase.endingScene', entity => entity.type == 'phase' && entity.currentComponent == 'ending_scene');
ctx.registerQuery('phase.questionUpdater', entity => entity.type == 'phase' && entity.currentComponent == 'question_updater');
ctx.registerQuery('phase.mathUmbrella', entity => entity.type == 'phase' && entity.currentComponent == 'math_umbrella');

/*At the start of the game, When the user clicks on the start button, the game will move to the movie component. */
function startButtonClickEvent() {
    return Event("startButtonClickEvent");
}

function moveToMovieComponentEvent() {
    return Event("moveToMovieComponentEvent");
}

ctx.registerEffect('moveToMovieComponentEvent', function (data) {
    let phase = ctx.getEntityById(data.phaseId);
    phase.currentComponent = 'movie';
});

ctx.bthread('Move to movie component on start button click', 'phase.start', function (phase) {
    while (true) {
        sync({waitFor: [startButtonClickEvent()]});
        sync({request: [moveToMovieComponentEvent(phase.id)]});
    }
});
/*
A summary of existing events that were declared before and you can use if needed, without declaring them again:

            1. startButtonClickEvent() 
            2. moveToMovieComponentEvent() - has an effect:
                        ctx.registerEffect('moveToMovieComponentEvent', function (data) {
                              let phase = ctx.getEntityById('gamePhase1'); 
                              phase.currentComponent = 'movie'; 
                         });
         
*/

/*
Upon entrance to the movie component, the introductory movie will begin playing.
If a mouse click is received, this component will terminate the movie and forward the user to the main menu component. Otherwise, the user will be moved to the main menu  after the movie ends.
*/

// Events needed:
// 1. playIntroMovieEvent - to start the movie in the movie component.
// 2. endIntroMovieEvent - to end the movie and move to the main menu.
// 3. mouseClickEvent - to detect a mouse click and terminate the movie early.
// 4. moveToMainMenuComponentEvent - to move to the main menu component.

// Do they already exist? No, these events do not exist in the provided list.

// Declaring new events
function playIntroMovieEvent() {
    return Event("playIntroMovieEvent");
}

function endIntroMovieEvent() {
    return Event("endIntroMovieEvent");
}

function mouseClickEvent() {
    return Event("mouseClickEvent");
}

function moveToMainMenuComponentEvent() {
    return Event("moveToMainMenuComponentEvent");
}

// Registering effects for moving to the main menu component
ctx.registerEffect('moveToMainMenuComponentEvent', function (data) {
    let phase = ctx.getEntityById('gamePhase1');
    phase.currentComponent = 'main_menu';
});

// Bthread for handling the movie component logic
ctx.bthread('Handle movie component', 'phase.movie', function (phase) {
    while (true) {
        sync({request: [playIntroMovieEvent()]});
        let event = sync({waitFor: [endIntroMovieEvent(), mouseClickEvent()]});
        if (event.name === 'mouseClickEvent') {
            sync({request: [moveToMainMenuComponentEvent()]});
            break;
        } else if (event.name === 'endIntroMovieEvent') {
            sync({request: [moveToMainMenuComponentEvent()]});
            break;
        }
    }
});


/*
A summary of existing events that were declared before and you can use if needed, without declaring them again:

            1. startButtonClickEvent() 
            2. moveToMovieComponentEvent() - has an effect:
                        ctx.registerEffect('moveToMovieComponentEvent', function (data) {
                              let phase = ctx.getEntityById('gamePhase1'); 
                              phase.currentComponent = 'movie'; 
                         });
            3. startMovieEvent()
            4. mouseClickDuringMovieEvent()
            5. movieCompletedEvent()
            6. moveToMainMenuComponentEvent() - has an effect:
                        ctx.registerEffect('moveToMainMenuComponentEvent', function (data) {
                                let phase = ctx.getEntityById('gamePhase1'); 
                                phase.currentComponent = 'main_menu'; 
                             });




         
*/
/*
The main menu component will wait until the user selects a button. At that time, the user will be forwarded to one of the following: game sequence component, math umbrella component, the question updater component or the Denominators' web page depending on the button selected 
*/
// 1. What events are needed?
// Events needed:
// - selectGameSequenceButtonEvent
// - selectMathUmbrellaButtonEvent
// - selectQuestionUpdaterButtonEvent
// - selectDenominatorsWebButtonEvent
// - moveToGameSequenceComponentEvent
// - moveToMathUmbrellaComponentEvent
// - moveToQuestionUpdaterComponentEvent
// - openDenominatorsWebPageEvent

// 2. Do they already exist?
// None of these events exist in the provided list of existing events.

// Declare new events
function selectGameSequenceButtonEvent() {
    return Event("selectGameSequenceButtonEvent");
}

function selectMathUmbrellaButtonEvent() {
    return Event("selectMathUmbrellaButtonEvent");
}

function selectQuestionUpdaterButtonEvent() {
    return Event("selectQuestionUpdaterButtonEvent");
}

function selectDenominatorsWebButtonEvent() {
    return Event("selectDenominatorsWebButtonEvent");
}

function moveToGameSequenceComponentEvent() {
    return Event("moveToGameSequenceComponentEvent");
}

function moveToMathUmbrellaComponentEvent() {
    return Event("moveToMathUmbrellaComponentEvent");
}

function moveToQuestionUpdaterComponentEvent() {
    return Event("moveToQuestionUpdaterComponentEvent");
}

function openDenominatorsWebPageEvent() {
    return Event("openDenominatorsWebPageEvent");
}

// Register effects for component change events
ctx.registerEffect('moveToGameSequenceComponentEvent', function (data) {
    let phase = ctx.getEntityById('gamePhase1');
    phase.currentComponent = 'game_sequence';
});

ctx.registerEffect('moveToMathUmbrellaComponentEvent', function (data) {
    let phase = ctx.getEntityById('gamePhase1');
    phase.currentComponent = 'math_umbrella';
});

ctx.registerEffect('moveToQuestionUpdaterComponentEvent', function (data) {
    let phase = ctx.getEntityById('gamePhase1');
    phase.currentComponent = 'question_updater';
});

// Bthread for handling main menu selections
ctx.bthread('Handle main menu selections', 'phase.mainMenu', function (phase) {
    while (true) {
        let event = sync({waitFor: [
            selectGameSequenceButtonEvent(),
            selectMathUmbrellaButtonEvent(),
            selectQuestionUpdaterButtonEvent(),
            selectDenominatorsWebButtonEvent()
        ]});

        switch (event.name) {
            case 'selectGameSequenceButtonEvent':
                sync({request: [moveToGameSequenceComponentEvent()]});
                break;
            case 'selectMathUmbrellaButtonEvent':
                sync({request: [moveToMathUmbrellaComponentEvent()]});
                break;
            case 'selectQuestionUpdaterButtonEvent':
                sync({request: [moveToQuestionUpdaterComponentEvent()]});
                break;
            case 'selectDenominatorsWebButtonEvent':
                sync({request: [openDenominatorsWebPageEvent()]});
                break;
        }
    }
});
/*
A summary of existing events that were declared before and you can use if needed, without declaring them again:

            1. startButtonClickEvent() 
            2. moveToMovieComponentEvent() - has an effect:
                        ctx.registerEffect('moveToMovieComponentEvent', function (data) {
                              let phase = ctx.getEntityById('gamePhase1'); 
                              phase.currentComponent = 'movie'; 
                         });
            3. startMovieEvent()
            4. mouseClickDuringMovieEvent()
            5. movieCompletedEvent()
            6. moveToMainMenuComponentEvent() - has an effect:
                        ctx.registerEffect('moveToMainMenuComponentEvent', function (data) {
                              let phase = ctx.getEntityById('gamePhase1'); 
                              phase.currentComponent = 'main_menu'; 
                         });
            7. selectGameSequenceButtonEvent()
            8. selectMathUmbrellaButtonEvent()
            9. selectQuestionUpdaterButtonEvent()
            10. selectDenominatorsWebButtonEvent()
            11. moveToGameSequenceComponentEvent() - has an effect:
                        ctx.registerEffect('moveToGameSequenceComponentEvent', function (data) {
                              let phase = ctx.getEntityById('gamePhase1'); 
                              phase.currentComponent = 'game_sequence'; 
                         });
            12. moveToMathUmbrellaComponentEvent() - has an effect:
                        ctx.registerEffect('moveToMathUmbrellaComponentEvent', function (data) {
                                let phase = ctx.getEntityById('gamePhase1'); 
                                phase.currentComponent = 'math_umbrella'; 
                        });  

            13. moveToQuestionUpdaterComponentEvent() - has an effect:
                        ctx.registerEffect('moveToQuestionUpdaterComponentEvent', function (data) {
                                let phase = ctx.getEntityById('gamePhase1'); 
                                phase.currentComponent = 'question_updater'; 
                        });
            14. openDenominatorsWebPageEvent()  
*/


/*
The game sequence component will display a question, and then wait until the user chooses an answer. If the user selects the correct answer, a message to this effect will be displayed and the component will move to the next question. If its his first answer to the question he will receive 1 point. If the incorrect answer is selected, this component will inform the user of   this and give them another chance to answer the question. However, their score will not count this question as being answered correctly.  After the user has proceeded through a set number of questions, they will be directed to the ending scene component.
*/
/* 
1. What events are needed?
   - Event to display a question.
   - Event for user selecting an answer.
   - Event to display correct answer message.
   - Event to display incorrect answer message.
   - Event to update the score if the answer is correct on the first try.
   - Event to move to the next question.
   - Event to move to the ending scene after a set number of questions.

   Named Events:
   - displayQuestionEvent(questionId)
   - userSelectsAnswerEvent(questionId, selectedOptionIndex)
   - displayCorrectAnswerMessageEvent()
   - displayIncorrectAnswerMessageEvent()
   - updateScoreEvent()
   - moveToNextQuestionEvent()
   - moveToEndingSceneComponentEvent()

2. Do they already exist?
   - No, these specific events do not exist in the provided list of existing events.
*/

function displayQuestionEvent(questionId) {
    return Event("displayQuestionEvent", {questionId: questionId});
}

function userSelectsAnswerEvent(questionId, selectedOptionIndex) {
    return Event("userSelectsAnswerEvent", {questionId: questionId, selectedOptionIndex: selectedOptionIndex});
}

function displayCorrectAnswerMessageEvent() {
    return Event("displayCorrectAnswerMessageEvent");
}

function displayIncorrectAnswerMessageEvent() {
    return Event("displayIncorrectAnswerMessageEvent");
}

function updateScoreEvent() {
    return Event("updateScoreEvent");
}

function moveToNextQuestionEvent() {
    return Event("moveToNextQuestionEvent");
}

function moveToEndingSceneComponentEvent() {
    return Event("moveToEndingSceneComponentEvent");
}

ctx.registerEffect('updateScoreEvent', function (data) {
    let score = ctx.getEntityById('score1');
    score.value += 1;
});

ctx.registerEffect('moveToEndingSceneComponentEvent', function (data) {
    let phase = ctx.getEntityById('gamePhase1');
    phase.currentComponent = 'ending_scene';
});

ctx.bthread('Game Sequence Logic', 'AllQuestions', function (allQuestions) {
    let questionIndex = 0;
    let firstAttempt = true;
    while (questionIndex < allQuestions.questions.length) {
        sync({request: [displayQuestionEvent(allQuestions.questions[questionIndex].id)]});
        let event = sync({waitFor: [anyEventNameWithData("userSelectsAnswerEvent", {questionId: allQuestions.questions[questionIndex].id})]});
        if (event.data.selectedOptionIndex === allQuestions.questions[questionIndex].rightOptionIndex) {
            sync({request: [displayCorrectAnswerMessageEvent()]});
            if (firstAttempt) {
                sync({request: [updateScoreEvent()]});
            }
            questionIndex++;
            firstAttempt = true;
            if (questionIndex < allQuestions.questions.length) {
                sync({request: [moveToNextQuestionEvent()]});
            } else {
                sync({request: [moveToEndingSceneComponentEvent()]});
            }
        } else {
            sync({request: [displayIncorrectAnswerMessageEvent()]});
            firstAttempt = false;
        }
    }
});

/*
A summary of existing events that were declared before and you can use if needed, without declaring them again:

            1. startButtonClickEvent() 
            2. moveToMovieComponentEvent() - has an effect:
                        ctx.registerEffect('moveToMovieComponentEvent', function (data) {
                              let phase = ctx.getEntityById('gamePhase1'); 
                              phase.currentComponent = 'movie'; 
                         });
            3. startMovieEvent()
            4. mouseClickDuringMovieEvent()
            5. movieCompletedEvent()
            6. moveToMainMenuComponentEvent() - has an effect:
                        ctx.registerEffect('moveToMainMenuComponentEvent', function (data) {
                              let phase = ctx.getEntityById('gamePhase1'); 
                              phase.currentComponent = 'main_menu'; 
                         });
            7. selectGameSequenceButtonEvent()
            8. selectMathUmbrellaButtonEvent()
            9. selectQuestionUpdaterButtonEvent()
            10. selectDenominatorsWebButtonEvent()
            11. moveToGameSequenceComponentEvent() - has an effect:
                        ctx.registerEffect('moveToGameSequenceComponentEvent', function (data) {
                              let phase = ctx.getEntityById('gamePhase1'); 
                              phase.currentComponent = 'game_sequence'; 
                         });
            12. moveToMathUmbrellaComponentEvent() - has an effect:
                        ctx.registerEffect('moveToMathUmbrellaComponentEvent', function (data) {
                                let phase = ctx.getEntityById('gamePhase1'); 
                                phase.currentComponent = 'math_umbrella'; 
                        });  

            13. moveToQuestionUpdaterComponentEvent() - has an effect:
                        ctx.registerEffect('moveToQuestionUpdaterComponentEvent', function (data) {
                                let phase = ctx.getEntityById('gamePhase1'); 
                                phase.currentComponent = 'question_updater'; 
                        });
            14. openDenominatorsWebPageEvent()  
            15. displayQuestionEvent(questionId)
            16. userSelectsAnswerEvent(questionId, selectedOptionIndex)
            17. displayCorrectAnswerMessageEvent()
            18. displayIncorrectAnswerMessageEvent()
            19. updateScoreEvent() - has an effect:
                        ctx.registerEffect('updateScoreEvent', function (data) {
                            let score = ctx.getEntityById('score1');
                            score.value += 1;
                        });
            20. moveToNextQuestionEvent()
            21. moveToEndingSceneComponentEvent() - has an effect:
                        ctx.registerEffect('moveToEndingSceneComponentEvent', function (data) {
                            let phase = ctx.getEntityById('gamePhase1');
                            phase.currentComponent = 'ending_scene';
                        });
            
            

*/
/*
The ending scene will wait until the user selects either to return to the main menu or to exit the game. After receiving the user's input, the component will act accordingly.
*/
// Events needed:
// 1. userSelectsReturnToMainMenuEvent - User chooses to return to the main menu.
// 2. userSelectsExitGameEvent - User chooses to exit the game.
// 3. moveToMainMenuComponentEvent - Already exists, moves the phase to the main menu.
// 4. exitGameEvent - Exits the game.

// Do they already exist?
// - moveToMainMenuComponentEvent exists.
// - userSelectsReturnToMainMenuEvent, userSelectsExitGameEvent, and exitGameEvent need to be declared.

function userSelectsReturnToMainMenuEvent() {
    return Event("userSelectsReturnToMainMenuEvent");
}

function userSelectsExitGameEvent() {
    return Event("userSelectsExitGameEvent");
}

function exitGameEvent() {
    return Event("exitGameEvent");
}

ctx.bthread('Handle ending scene user choices', 'phase.endingScene', function (phase) {
    while (true) {
        let event = sync({waitFor: [userSelectsReturnToMainMenuEvent(), userSelectsExitGameEvent()]});
        if (event.name === "userSelectsReturnToMainMenuEvent") {
            sync({request: [moveToMainMenuComponentEvent()]});
        } else if (event.name === "userSelectsExitGameEvent") {
            sync({request: [exitGameEvent()]});
        }
    }
});

/*
/*
A summary of existing events that were declared before and you can use if needed, without declaring them again:

            1. startButtonClickEvent() 
            2. moveToMovieComponentEvent() - has an effect:
                        ctx.registerEffect('moveToMovieComponentEvent', function (data) {
                              let phase = ctx.getEntityById('gamePhase1'); 
                              phase.currentComponent = 'movie'; 
                         });
            3. startMovieEvent()
            4. mouseClickDuringMovieEvent()
            5. movieCompletedEvent()
            6. moveToMainMenuComponentEvent() - has an effect:
                        ctx.registerEffect('moveToMainMenuComponentEvent', function (data) {
                              let phase = ctx.getEntityById('gamePhase1'); 
                              phase.currentComponent = 'main_menu'; 
                         });
            7. selectGameSequenceButtonEvent()
            8. selectMathUmbrellaButtonEvent()
            9. selectQuestionUpdaterButtonEvent()
            10. selectDenominatorsWebButtonEvent()
            11. moveToGameSequenceComponentEvent() - has an effect:
                        ctx.registerEffect('moveToGameSequenceComponentEvent', function (data) {
                              let phase = ctx.getEntityById('gamePhase1'); 
                              phase.currentComponent = 'game_sequence'; 
                         });
            12. moveToMathUmbrellaComponentEvent() - has an effect:
                        ctx.registerEffect('moveToMathUmbrellaComponentEvent', function (data) {
                                let phase = ctx.getEntityById('gamePhase1'); 
                                phase.currentComponent = 'math_umbrella'; 
                        });  

            13. moveToQuestionUpdaterComponentEvent() - has an effect:
                        ctx.registerEffect('moveToQuestionUpdaterComponentEvent', function (data) {
                                let phase = ctx.getEntityById('gamePhase1'); 
                                phase.currentComponent = 'question_updater'; 
                        });
            14. openDenominatorsWebPageEvent()  
            15. displayQuestionEvent(questionId)
            16. userSelectsAnswerEvent(questionId, selectedOptionIndex)
            17. displayCorrectAnswerMessageEvent()
            18. displayIncorrectAnswerMessageEvent()
            19. updateScoreEvent() - has an effect:
                        ctx.registerEffect('updateScoreEvent', function (data) {
                            let score = ctx.getEntityById('score1');
                            score.value += 1;
                        });
            20. moveToNextQuestionEvent()
            21. moveToEndingSceneComponentEvent() - has an effect:
                        ctx.registerEffect('moveToEndingSceneComponentEvent', function (data) {
                            let phase = ctx.getEntityById('gamePhase1');
                            phase.currentComponent = 'ending_scene';
                        });
            22. userSelectsReturnToMainMenuEvent()
            23. userSelectsExitGameEvent()
            24. exitGameEvent()

            
            

*/


/*
The Question Updater component will wait for the user to submit new questions. After the button is clicked, the component will add the new question to the question database.
*/
/*
\/*
1. What events are needed?
   - An event for the user submitting a new question.
   - An event to add the new question to the database.

   Named Events:
   - userSubmitsNewQuestionEvent(questionContent, options, rightOptionIndex)
   - addNewQuestionToDatabaseEvent(questionContent, options, rightOptionIndex)

2. Do they already exist?
   - No, these events do not exist in the provided list.


// Event Declarations
function userSubmitsNewQuestionEvent(questionContent, options, rightOptionIndex) {
    return Event("userSubmitsNewQuestionEvent", {questionContent, options, rightOptionIndex});
}

function addNewQuestionToDatabaseEvent(questionContent, options, rightOptionIndex) {
    return Event("addNewQuestionToDatabaseEvent", {questionContent, options, rightOptionIndex});
}

// Registering the effect for adding a new question to the database
ctx.registerEffect('addNewQuestionToDatabaseEvent', function (data) {
    let allQuestions = ctx.getEntityById('allQuestions1');
    allQuestions.questions.push(question('q' + (allQuestions.questions.length + 1), data.questionContent, data.options, data.rightOptionIndex));
});

// Bthread for handling the submission and addition of new questions
ctx.bthread('Handle new question submission', 'phase.questionUpdater', function (phase) {
    while (true) {
        let submission = sync({waitFor: [userSubmitsNewQuestionEvent()]});
        sync({request: [addNewQuestionToDatabaseEvent(submission.data.questionContent, submission.data.options, submission.data.rightOptionIndex)]});
    }
});

User: userSubmitsNewQuestionEvent called without all parameters
*/
/* 
1. What events are needed?
   - An event for the user submitting a new question without all parameters.
   - An event to add the new question to the database.

   Named Events:
   - userSubmitsNewQuestionEventWithData(data)
   - addNewQuestionToDatabaseEvent(questionContent, options, rightOptionIndex)

2. Do they already exist?
   - No, these events do not exist in the provided list.
*/

// Event Declarations
function userSubmitsNewQuestionEvent(questionContent, options, rightOptionIndex) {
    return Event("userSubmitsNewQuestionEvent", {questionContent, options, rightOptionIndex});
}

function addNewQuestionToDatabaseEvent(questionContent, options, rightOptionIndex) {
    return Event("addNewQuestionToDatabaseEvent", {questionContent, options, rightOptionIndex});
}

// Registering the effect for adding a new question to the database
ctx.registerEffect('addNewQuestionToDatabaseEvent', function (data) {
    let allQuestions = ctx.getEntityById('allQuestions1');
    allQuestions.questions.push(question('q' + (allQuestions.questions.length + 1), data.questionContent, data.options, data.rightOptionIndex));
});

// Bthread for handling the submission and addition of new questions
ctx.bthread('Handle new question submission with partial data', 'phase.questionUpdater', function (phase) {
    while (true) {
        let submission = sync({waitFor: [anyEventNameWithData("userSubmitsNewQuestionEvent")]});
        sync({request: [addNewQuestionToDatabaseEvent(submission.data.questionContent, submission.data.options, submission.data.rightOptionIndex)]});
    }
});

/*
            1. startButtonClickEvent() 
            2. moveToMovieComponentEvent() - has an effect:
                        ctx.registerEffect('moveToMovieComponentEvent', function (data) {
                              let phase = ctx.getEntityById('gamePhase1'); 
                              phase.currentComponent = 'movie'; 
                         });
            3. startMovieEvent()
            4. mouseClickDuringMovieEvent()
            5. movieCompletedEvent()
            6. moveToMainMenuComponentEvent() - has an effect:
                        ctx.registerEffect('moveToMainMenuComponentEvent', function (data) {
                              let phase = ctx.getEntityById('gamePhase1'); 
                              phase.currentComponent = 'main_menu'; 
                         });
            7. selectGameSequenceButtonEvent()
            8. selectMathUmbrellaButtonEvent()
            9. selectQuestionUpdaterButtonEvent()
            10. selectDenominatorsWebButtonEvent()
            11. moveToGameSequenceComponentEvent() - has an effect:
                        ctx.registerEffect('moveToGameSequenceComponentEvent', function (data) {
                              let phase = ctx.getEntityById('gamePhase1'); 
                              phase.currentComponent = 'game_sequence'; 
                         });
            12. moveToMathUmbrellaComponentEvent() - has an effect:
                        ctx.registerEffect('moveToMathUmbrellaComponentEvent', function (data) {
                                let phase = ctx.getEntityById('gamePhase1'); 
                                phase.currentComponent = 'math_umbrella'; 
                        });  

            13. moveToQuestionUpdaterComponentEvent() - has an effect:
                        ctx.registerEffect('moveToQuestionUpdaterComponentEvent', function (data) {
                                let phase = ctx.getEntityById('gamePhase1'); 
                                phase.currentComponent = 'question_updater'; 
                        });
            14. openDenominatorsWebPageEvent()  
            15. displayQuestionEvent(questionId)
            16. userSelectsAnswerEvent(questionId, selectedOptionIndex)
            17. displayCorrectAnswerMessageEvent()
            18. displayIncorrectAnswerMessageEvent()
            19. updateScoreEvent() - has an effect:
                        ctx.registerEffect('updateScoreEvent', function (data) {
                            let score = ctx.getEntityById('score1');
                            score.value += 1;
                        });
            20. moveToNextQuestionEvent()
            21. moveToEndingSceneComponentEvent() - has an effect:
                        ctx.registerEffect('moveToEndingSceneComponentEvent', function (data) {
                            let phase = ctx.getEntityById('gamePhase1');
                            phase.currentComponent = 'ending_scene';
                        });
            22. userSelectsReturnToMainMenuEvent()
            23. userSelectsExitGameEvent()
            24. exitGameEvent()
            25. userSubmitsNewQuestionEvent(questionContent, options, rightOptionIndex)
            26. addNewQuestionToDatabaseEvent(questionContent, options, rightOptionIndex) - has an effect:
                        ctx.registerEffect('addNewQuestionToDatabaseEvent', function (data) {
                            let allQuestions = ctx.getEntityById('allQuestions1');
                            allQuestions.questions.push(question('q' + (allQuestions.questions.length + 1), data.questionContent, data.options, data.rightOptionIndex));
                        });
            
            
        */

/*
The Math Umbrella component will wait for a user to click a link(out of many), and then follow that link. 
*/
//Added "out of many" to the description for clarity, without it, it simply waited for a link click and followed it.

/* 
1. What events are needed?
   - An event for user clicking a specific link in the Math Umbrella component.
   - An event for following the clicked link.

2. Do they already exist?
   - No existing events directly match these requirements.
*/

// Declare the events
function userClicksLinkEvent(linkId) {
    return Event("userClicksLinkEvent", {linkId: linkId});
}

function followLinkEvent(linkId) {
    return Event("followLinkEvent", {linkId: linkId});
}

// Bthread to handle the link click and follow process
ctx.bthread('Handle link click and follow in Math Umbrella', 'phase.mathUmbrella', function () {
    while (true) {
        let event = sync({waitFor: anyEventNameWithData("userClicksLinkEvent")});
        sync({request: [followLinkEvent(event.data.linkId)]});
    }
});

