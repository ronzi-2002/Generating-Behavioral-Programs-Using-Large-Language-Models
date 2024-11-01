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
If a mouse click is received, this component will terminate the movie and forward
the user to the main menu component.
Otherwise, the movie will continue to its completion and the user will be moved to the main menu.
*/

// Events needed:
// 1. Event to start the movie.
// 2. Event to detect mouse click to terminate the movie.
// 3. Event to complete the movie.
// 4. Event to move to the main menu component.

// Event names:
// startMovieEvent - Starts the movie.
// mouseClickDuringMovieEvent - Detects mouse click during the movie.
// movieCompletedEvent - Indicates the movie has completed.
// moveToMainMenuComponentEvent - Moves the game phase to the main menu component.

// Check if events exist:
// None of the required events except for moving to a component (moveToMovieComponentEvent) exist. 
// However, moveToMovieComponentEvent is specific to moving to the movie component, so a new event for moving to the main menu is needed.

// Declare new events:
function startMovieEvent() {
    return Event("startMovieEvent");
}

function mouseClickDuringMovieEvent() {
    return Event("mouseClickDuringMovieEvent");
}

function movieCompletedEvent() {
    return Event("movieCompletedEvent");
}

function moveToMainMenuComponentEvent() {
    return Event("moveToMainMenuComponentEvent");
}

// Register effect for moving to the main menu component:
ctx.registerEffect('moveToMainMenuComponentEvent', function (data) {
    let phase = ctx.getEntityById('gamePhase1');
    phase.currentComponent = 'main_menu';
});

// Bthread for handling the movie component logic:
ctx.bthread('Handle movie component', 'phase.movie', function (phase) {
    while (true) {
        sync({request: [startMovieEvent()]});
        let event = sync({waitFor: [mouseClickDuringMovieEvent(), movieCompletedEvent()]});
        if (event.name === 'mouseClickDuringMovieEvent' || event.name === 'movieCompletedEvent') {
            sync({request: [moveToMainMenuComponentEvent()]});
        }
    }
});
/*TODO RON: When space is deleted, it generates this:
(check it later when isolating)

ctx.bthread('Handle movie component interactions', 'phase.movie', function (phase) {
    while (true) {
        let event = sync({waitFor: [mouseClickEvent(), movieCompleteEvent()]});
        if (event.name === 'mouseClickEvent' || event.name === 'movieCompleteEvent') {
            sync({request: [moveToMainMenuComponentEvent(phase.id)]});
            break;
        }
    }
});
*/
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
// Events needed:
// 1. selectGameSequenceButtonEvent
// 2. selectMathUmbrellaButtonEvent
// 3. selectQuestionUpdaterButtonEvent
// 4. selectDenominatorsWebPageButtonEvent
// 5. moveToGameSequenceComponentEvent - has an effect to change the phase to 'game_sequence'
// 6. moveToMathUmbrellaComponentEvent - has an effect to change the phase to 'math_umbrella'
// 7. moveToQuestionUpdaterComponentEvent - has an effect to change the phase to 'question_updater'
// 8. redirectToDenominatorsWebPageEvent - no effect needed, external action

// Checking if any of the events already exist:
// None of the specific button select events exist, so we need to declare them.
// The moveTo component events need to be declared with their effects.

function selectGameSequenceButtonEvent() {
    return Event("selectGameSequenceButtonEvent");
}

function selectMathUmbrellaButtonEvent() {
    return Event("selectMathUmbrellaButtonEvent");
}

function selectQuestionUpdaterButtonEvent() {
    return Event("selectQuestionUpdaterButtonEvent");
}

function selectDenominatorsWebPageButtonEvent() {
    return Event("selectDenominatorsWebPageButtonEvent");
}

function moveToGameSequenceComponentEvent() {
    return Event("moveToGameSequenceComponentEvent");
}

ctx.registerEffect('moveToGameSequenceComponentEvent', function (data) {
    let phase = ctx.getEntityById('gamePhase1');
    phase.currentComponent = 'game_sequence';
});

function moveToMathUmbrellaComponentEvent() {
    return Event("moveToMathUmbrellaComponentEvent");
}

ctx.registerEffect('moveToMathUmbrellaComponentEvent', function (data) {
    let phase = ctx.getEntityById('gamePhase1');
    phase.currentComponent = 'math_umbrella';
});

function moveToQuestionUpdaterComponentEvent() {
    return Event("moveToQuestionUpdaterComponentEvent");
}

ctx.registerEffect('moveToQuestionUpdaterComponentEvent', function (data) {
    let phase = ctx.getEntityById('gamePhase1');
    phase.currentComponent = 'question_updater';
});

function redirectToDenominatorsWebPageEvent() {
    return Event("redirectToDenominatorsWebPageEvent");
}

// Bthread to handle the main menu selections
ctx.bthread('Handle main menu selections', 'phase.mainMenu', function (phase) {
    while (true) {
        let event = sync({waitFor: [
            selectGameSequenceButtonEvent(),
            selectMathUmbrellaButtonEvent(),
            selectQuestionUpdaterButtonEvent(),
            selectDenominatorsWebPageButtonEvent()
        ]});

        switch (event.name) {
            case "selectGameSequenceButtonEvent":
                sync({request: [moveToGameSequenceComponentEvent()]});
                break;
            case "selectMathUmbrellaButtonEvent":
                sync({request: [moveToMathUmbrellaComponentEvent()]});
                break;
            case "selectQuestionUpdaterButtonEvent":
                sync({request: [moveToQuestionUpdaterComponentEvent()]});
                break;
            case "selectDenominatorsWebPageButtonEvent":
                sync({request: [redirectToDenominatorsWebPageEvent()]});
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
            10. selectDenominatorsWebPageButtonEvent()
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
            14. redirectToDenominatorsWebPageEvent()
            



/*
The game sequence component will display a question, and then wait until the user chooses an answer. If the user selects the correct answer, a message to this effect will be displayed and the component will move to the next question. If its his first answer to the question he will receive 1 point. If the incorrect answer is selected, this component will inform the user of   this and give them another chance to answer the question. However, their score will not count this question as being answered correctly.  After the user has proceeded through a set number of questions, they will be directed to the ending scene component.
*/
/*
function displayQuestionEvent(questionId) {
    return Event("displayQuestionEvent", {questionId: questionId});
}

function answerSelectedEvent(questionId, selectedOptionIndex) {
    return Event("answerSelectedEvent", {questionId: questionId, selectedOptionIndex: selectedOptionIndex});
}

function correctAnswerEvent() {
    return Event("correctAnswerEvent");
}

function incorrectAnswerEvent() {
    return Event("incorrectAnswerEvent");
}

function moveToNextQuestionEvent() {
    return Event("moveToNextQuestionEvent");
}

function moveToEndingSceneComponentEvent() {
    return Event("moveToEndingSceneComponentEvent");
}

ctx.registerEffect('moveToEndingSceneComponentEvent', function (data) {
    let phase = ctx.getEntityById(data.phaseId);
    phase.currentComponent = 'ending_scene';
});

ctx.registerEffect('updateScore', function (data) {
    let score = ctx.getEntityById(data.scoreId);
    score.value += data.increment;
});

ctx.bthread('Game sequence logic', 'phase.gameSequence', function (phase) {
    const questions = ctx.getEntitiesByType('question');
    let questionIndex = 0;
    let attempts = 0;

    while (questionIndex < questions.length) {
        sync({request: [displayQuestionEvent(questions[questionIndex].id)]});
        let answerEvent = sync({waitFor: [answerSelectedEvent(questions[questionIndex].id)]});
        let selectedOption = answerEvent.data.selectedOptionIndex;
        let correctOption = questions[questionIndex].rightOptionIndex;

        if (selectedOption === correctOption) {
            sync({request: [correctAnswerEvent()]});
            if (attempts === 0) { // First attempt
                sync({request: [updateScore('score1', 1)]});
            }
            questionIndex++;
            attempts = 0; // Reset attempts for next question
            sync({request: [moveToNextQuestionEvent()]});
        } else {
            sync({request: [incorrectAnswerEvent()]});
            attempts++;
        }
    }

    sync({request: [moveToEndingSceneComponentEvent(phase.id)]});
});
-----------------------------------------------------------------
User: Compilation error at:         let event = sync({waitFor: [answerSelectedEvent(questions[currentQuestionIndex], any)]});.
 Provide a full corrected implementation, without additional explanation.
-----------------------------------------------------------------
function displayQuestionEvent(questionId) {
    return Event("displayQuestionEvent", {questionId: questionId});
}

function answerSelectedEvent(questionId, selectedOptionIndex) {
    return Event("answerSelectedEvent", {questionId: questionId, selectedOptionIndex: selectedOptionIndex});
}

function correctAnswerEvent() {
    return Event("correctAnswerEvent");
}

function incorrectAnswerEvent() {
    return Event("incorrectAnswerEvent");
}

function moveToNextQuestionEvent() {
    return Event("moveToNextQuestionEvent");
}

function moveToEndingSceneComponentEvent() {
    return Event("moveToEndingSceneComponentEvent");
}

ctx.registerEffect('moveToEndingSceneComponentEvent', function (data) {
    let phase = ctx.getEntityById(data.phaseId);
    phase.currentComponent = 'ending_scene';
});

ctx.registerEffect('updateScore', function (data) {
    let score = ctx.getEntityById(data.scoreId);
    score.value += data.increment;
});

ctx.bthread('Game sequence handling', 'phase.gameSequence', function (phase) {
    const questions = ['q1', 'q2', 'q3', 'q4']; // Assuming these are the IDs of the questions
    let currentQuestionIndex = 0;
    let attempts = 0;

    while (currentQuestionIndex < questions.length) {
        sync({request: [displayQuestionEvent(questions[currentQuestionIndex])]});
        let event = sync({waitFor: [anyEventNameWithData("answerSelectedEvent", {questionId: questions[currentQuestionIndex]})]});

        let question = ctx.getEntityById(event.data.questionId);
        if (event.data.selectedOptionIndex === question.rightOptionIndex) {
            sync({request: [correctAnswerEvent()]});
            if (attempts === 0) { // First attempt
                sync({request: [updateScore({scoreId: 'score1', increment: 1})]});
            }
            attempts = 0; // Reset attempts for next question
            currentQuestionIndex++;
            if (currentQuestionIndex < questions.length) {
                sync({request: [moveToNextQuestionEvent()]});
            } else {
                sync({request: [moveToEndingSceneComponentEvent(phase.id)]});
            }
        } else {
            sync({request: [incorrectAnswerEvent()]});
            attempts++;
        }
    }
});
-----------------------------------------------------------------
User: Compilation error at:                        sync({request: [updateScore({scoreId: 'score1', increment: 1})]});
 Provide a full corrected implementation, without additional explanation. */

 function displayQuestionEvent(questionId) {
    return Event("displayQuestionEvent", {questionId: questionId});
}

function answerSelectedEvent(questionId, selectedOptionIndex) {
    return Event("answerSelectedEvent", {questionId: questionId, selectedOptionIndex: selectedOptionIndex});
}

function correctAnswerEvent() {
    return Event("correctAnswerEvent");
}

function incorrectAnswerEvent() {
    return Event("incorrectAnswerEvent");
}

function moveToNextQuestionEvent() {
    return Event("moveToNextQuestionEvent");
}

function moveToEndingSceneComponentEvent() {
    return Event("moveToEndingSceneComponentEvent");
}

function updateScoreEvent(scoreId, increment) {
    return Event("updateScoreEvent", {scoreId: scoreId, increment: increment});
}

ctx.registerEffect('moveToEndingSceneComponentEvent', function (data) {
    let phase = ctx.getEntityById(data.phaseId);
    phase.currentComponent = 'ending_scene';
});

ctx.registerEffect('updateScoreEvent', function (data) {
    let score = ctx.getEntityById(data.scoreId);
    score.value += data.increment;
});

ctx.bthread('Game sequence handling', 'phase.gameSequence', function (phase) {
    const questions = ['q1', 'q2', 'q3', 'q4']; // Assuming these are the IDs of the questions
    let currentQuestionIndex = 0;
    let attempts = 0;

    while (currentQuestionIndex < questions.length) {
        sync({request: [displayQuestionEvent(questions[currentQuestionIndex])]});
        let event = sync({waitFor: [anyEventNameWithData("answerSelectedEvent", {questionId: questions[currentQuestionIndex]})]});

        let question = ctx.getEntityById(event.data.questionId);
        if (event.data.selectedOptionIndex === question.rightOptionIndex) {
            sync({request: [correctAnswerEvent()]});
            if (attempts === 0) { // First attempt
                sync({request: [updateScoreEvent('score1', 1)]});
            }
            attempts = 0; // Reset attempts for next question
            currentQuestionIndex++;
            if (currentQuestionIndex < questions.length) {
                sync({request: [moveToNextQuestionEvent()]});
            } else {
                sync({request: [moveToEndingSceneComponentEvent(phase.id)]});
            }
        } else {
            sync({request: [incorrectAnswerEvent()]});
            attempts++;
        }
    }
});

/*
The ending scene will wait until the user selects either to return to the main menu or to exit the game. After receiving the user's input, the component will act accordingly.
*/
function returnToMainMenuButtonEvent() {
    return Event("returnToMainMenuButtonEvent");
}

function exitGameButtonEvent() {
    return Event("exitGameButtonEvent");
}

function moveToMainMenuComponentEvent() {
    return Event("moveToMainMenuComponentEvent");
}

ctx.registerEffect('moveToMainMenuComponentEvent', function (data) {
    let phase = ctx.getEntityById(data.phaseId);
    phase.currentComponent = 'main_menu';
});

ctx.bthread('Handle ending scene selections', 'phase.endingScene', function (phase) {
    while (true) {
        let event = sync({waitFor: [returnToMainMenuButtonEvent(), exitGameButtonEvent()]});
        if (event.name === 'returnToMainMenuButtonEvent') {
            sync({request: [moveToMainMenuComponentEvent(phase.id)]});
        } else if (event.name === 'exitGameButtonEvent') {
            exitGame();
        }
    }
});

function exitGame() {
    // Simulated function to exit the game
    window.close();
}

//From here, using version 13.13

/*
The Question Updater component will wait for the user to submit new questions. After the button is clicked, the component will add the new question to the question database.
*/

function submitNewQuestionEvent(questionId, content, options, rightOptionIndex) {
    return Event("submitNewQuestionEvent", {questionId: questionId, content: content, options: options, rightOptionIndex: rightOptionIndex});
}

function addQuestionToDatabaseEvent(questionId, content, options, rightOptionIndex) {
    return Event("addQuestionToDatabaseEvent", {questionId: questionId, content: content, options: options, rightOptionIndex: rightOptionIndex});
}

ctx.registerEffect('addQuestionToDatabaseEvent', function (data) {
    ctx.populateContext([
        question(data.questionId, data.content, data.options, data.rightOptionIndex)
    ]);
});

ctx.bthread('Add new questions on submission', 'phase.questionUpdater', function (phase) {
    while(true){
        let event = sync({waitFor: [anyEventNameWithData("submitNewQuestionEvent", {})]});
        sync({request: [addQuestionToDatabaseEvent(event.data.questionId, event.data.content, event.data.options, event.data.rightOptionIndex)]});
    }
});

/*
The Math Umbrella component will wait for a user to click a link, and then follow that link.
*/

function userClicksLinkEvent(linkUrl) {
    return Event("userClicksLinkEvent", {linkUrl: linkUrl});
}

function followLinkEvent(linkUrl) {
    return Event("followLinkEvent", {linkUrl: linkUrl});
}

ctx.bthread('Handle link clicks in Math Umbrella component', 'phase.mathUmbrella', function (phase) {
    while(true){
        let event = sync({waitFor: [anyEventNameWithData("userClicksLinkEvent", {})]});
        sync({request: [followLinkEvent(event.data.linkUrl)]});
    }
});