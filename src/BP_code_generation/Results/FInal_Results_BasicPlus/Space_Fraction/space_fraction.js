//A question has its content, 4 options and the index of the right option
function question(id, content, options, rightOptionIndex) {
    return ctx.Entity(id, 'question', {
        content: content,
        options: options,
        rightOptionIndex: rightOptionIndex
    });
}

//Generate 4 questions about the USA history(place the right answer at a random position)
ctx.populateContext([
    question('q1', 'Who was the first President of the United States?', ['George Washington', 'Thomas Jefferson', 'Abraham Lincoln', 'Theodore Roosevelt'], 0),
    question('q2', 'What year did the American Civil War begin?', ['1850', '1861', '1877', '1845'], 1),
    question('q3', 'Which document declared the independence of the United States from Britain?', ['The Constitution', 'The Bill of Rights', 'The Declaration of Independence', 'The Federalist Papers'], 2),
    question('q4', 'Who was the president during the Louisiana Purchase?', ['John Adams', 'Andrew Jackson', 'James Monroe', 'Thomas Jefferson'], 3)
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
    let phase = ctx.getEntityById('gamePhase1');
    phase.currentComponent = 'movie';
});

ctx.bthread('Move to movie component on start button click', 'phase.start', function (phase) {
    while (true) {
        sync({waitFor: [startButtonClickEvent()]});
        sync({request: [moveToMovieComponentEvent()]});
    }
});

/*
Upon entrance to the movie component, the introductory movie will begin playing.
If a mouse click is received, this component will terminate the movie and forward  the user to the main menu component.  Otherwise, the movie will continue to its completion and the user will be moved to the main menu. 
*/

function movieStartEvent() {
    return Event("movieStartEvent");
}

function mouseClickEvent() {
    return Event("mouseClickEvent");
}

function moveToMainMenuComponentEvent() {
    return Event("moveToMainMenuComponentEvent");
}

ctx.registerEffect('moveToMainMenuComponentEvent', function (data) {
    let phase = ctx.getEntityById('gamePhase1');
    phase.currentComponent = 'main_menu';
});

ctx.bthread('Start movie on movie component entrance', 'phase.movie', function (phase) {
    sync({request: [movieStartEvent()]});
    let event = sync({waitFor: [mouseClickEvent(), movieCompletionEvent()]});
    sync({request: [moveToMainMenuComponentEvent()]});
});

function movieCompletionEvent() {
    return Event("movieCompletionEvent");
}

/*
The main menu component will wait until the user selects a button. At that time, the user will be forwarded to one of the following: game sequence component, math umbrella component, the question updater component or the Denominators' web page depending on the button selected 
*/
function gameSequenceButtonEvent() {
    return Event("gameSequenceButtonEvent");
}

function mathUmbrellaButtonEvent() {
    return Event("mathUmbrellaButtonEvent");
}

function questionUpdaterButtonEvent() {
    return Event("questionUpdaterButtonEvent");
}

function denominatorsWebPageButtonEvent() {
    return Event("denominatorsWebPageButtonEvent");
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

ctx.registerEffect('openDenominatorsWebPageEvent', function (data) {
    // This effect would typically handle opening a web page, which is outside the scope of this simulation.
    // Assume the action is handled appropriately.
});

ctx.bthread('Handle main menu selections', 'phase.mainMenu', function (phase) {
    while (true) {
        let event = sync({waitFor: [gameSequenceButtonEvent(), mathUmbrellaButtonEvent(), questionUpdaterButtonEvent(), denominatorsWebPageButtonEvent()]});
        switch (event.name) {
            case 'gameSequenceButtonEvent':
                sync({request: [moveToGameSequenceComponentEvent()]});
                break;
            case 'mathUmbrellaButtonEvent':
                sync({request: [moveToMathUmbrellaComponentEvent()]});
                break;
            case 'questionUpdaterButtonEvent':
                sync({request: [moveToQuestionUpdaterComponentEvent()]});
                break;
            case 'denominatorsWebPageButtonEvent':
                sync({request: [openDenominatorsWebPageEvent()]});
                break;
        }
    }
});

/*
The game sequence component will display a question, and then wait until the user chooses an answer. If the user selects the correct answer, a message to this effect will be displayed and the component will move to the next question. If its his first answer to the question he will receive 1 point. If the incorrect answer is selected, this component will inform the user of   this and give them another chance to answer the question. However, their score will not count this question as being answered correctly.  After the user has proceeded through all questions, they will be directed to the ending scene component. 
*/
//! In half of the times, it includes getEntitiesByType function which doesnt exist.
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
    let phase = ctx.getEntityById('gamePhase1');
    phase.currentComponent = 'ending_scene';
});

ctx.registerEffect('addScoreEvent', function (data) {
    let scoreEntity = ctx.getEntityById('score1');
    scoreEntity.value += 1;
});

ctx.bthread('Game sequence logic', 'phase.gameSequence', function (phase) {
    const questions = ['q1', 'q2', 'q3', 'q4'];
    let currentQuestionIndex = 0;
    let firstAttempt = true;

    while (currentQuestionIndex < questions.length) {
        sync({request: [displayQuestionEvent(questions[currentQuestionIndex])]});
        let event = sync({waitFor: [answerSelectedEvent(questions[currentQuestionIndex], any)]});

        let question = ctx.getEntityById(event.data.questionId);
        if (event.data.selectedOptionIndex === question.rightOptionIndex) {
            sync({request: [correctAnswerEvent()]});
            if (firstAttempt) {
                sync({request: [addScoreEvent()]});
            }
            currentQuestionIndex++;
            firstAttempt = true; // Reset for next question
        } else {
            sync({request: [incorrectAnswerEvent()]});
            firstAttempt = false;
        }
    }

    sync({request: [moveToEndingSceneComponentEvent()]});
});
*/
/*In case it does: User: Compilation error at:         const questions = ctx.getEntitiesByType('question');
 Provide a full corrected implementation, without additional explanation. 
*/

/*
----------------------------------------------------------
User: Compilation error at:          let event = sync({waitFor: [answerSelectedEvent(questions[currentQuestionIndex], any)]}); 
 Provide a full corrected implementation, without additional explanation.
----------------------------------------------------------
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
    let phase = ctx.getEntityById('gamePhase1');
    phase.currentComponent = 'ending_scene';
});

ctx.registerEffect('addScoreEvent', function (data) {
    let scoreEntity = ctx.getEntityById('score1');
    scoreEntity.value += 1;
});

ctx.bthread('Game sequence logic', 'phase.gameSequence', function (phase) {
    const questions = ['q1', 'q2', 'q3', 'q4'];
    let currentQuestionIndex = 0;
    let firstAttempt = true;

    while (currentQuestionIndex < questions.length) {
        sync({request: [displayQuestionEvent(questions[currentQuestionIndex])]});
        let question = ctx.getEntityById(questions[currentQuestionIndex]);
        let event = sync({waitFor: [anyEventNameWithData("answerSelectedEvent", {questionId: question.id})]});

        if (event.data.selectedOptionIndex === question.rightOptionIndex) {
            sync({request: [correctAnswerEvent()]});
            if (firstAttempt) {
                sync({request: [addScoreEvent()]});
            }
            currentQuestionIndex++;
            firstAttempt = true; // Reset for next question
        } else {
            sync({request: [incorrectAnswerEvent()]});
            firstAttempt = false;
        }
    }

    sync({request: [moveToEndingSceneComponentEvent()]});
});
-------------------------------------------------------------
User: Compilation error at:                   sync({request: [addScoreEvent()]});
 Provide a full corrected implementation, without additional explanation.
-------------------------------------------------------------
*/
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

function addScoreEvent() {
    return Event("addScoreEvent");
}

ctx.registerEffect('moveToEndingSceneComponentEvent', function (data) {
    let phase = ctx.getEntityById('gamePhase1');
    phase.currentComponent = 'ending_scene';
});

ctx.registerEffect('addScoreEvent', function (data) {
    let scoreEntity = ctx.getEntityById('score1');
    scoreEntity.value += 1;
});

ctx.bthread('Game sequence logic', 'phase.gameSequence', function (phase) {
    const questions = ['q1', 'q2', 'q3', 'q4'];
    let currentQuestionIndex = 0;
    let firstAttempt = true;

    while (currentQuestionIndex < questions.length) {
        sync({request: [displayQuestionEvent(questions[currentQuestionIndex])]});
        let question = ctx.getEntityById(questions[currentQuestionIndex]);
        let event = sync({waitFor: [anyEventNameWithData("answerSelectedEvent", {questionId: question.id})]});

        if (event.data.selectedOptionIndex === question.rightOptionIndex) {
            sync({request: [correctAnswerEvent()]});
            if (firstAttempt) {
                sync({request: [addScoreEvent()]});
            }
            currentQuestionIndex++;
            firstAttempt = true; // Reset for next question
        } else {
            sync({request: [incorrectAnswerEvent()]});
            firstAttempt = false;
        }
    }

    sync({request: [moveToEndingSceneComponentEvent()]});
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

function moveToMainMenuFromEndingEvent() {
    return Event("moveToMainMenuFromEndingEvent");
}

function exitGameEvent() {
    return Event("exitGameEvent");
}

ctx.registerEffect('moveToMainMenuFromEndingEvent', function (data) {
    let phase = ctx.getEntityById('gamePhase1');
    phase.currentComponent = 'main_menu';
});

// Assuming exitGameEvent would be handled externally, as it involves closing the application or similar action.
ctx.registerEffect('exitGameEvent', function (data) {
    // This effect would typically handle exiting the game, which is outside the scope of this simulation.
    // Assume the action is handled appropriately.
});

ctx.bthread('Ending scene choices', 'phase.endingScene', function (phase) {
    while (true) {
        let event = sync({waitFor: [returnToMainMenuButtonEvent(), exitGameButtonEvent()]});
        if (event.name === 'returnToMainMenuButtonEvent') {
            sync({request: [moveToMainMenuFromEndingEvent()]});
        } else if (event.name === 'exitGameButtonEvent') {
            sync({request: [exitGameEvent()]});
            break; // Exit the loop and effectively the game sequence
        }
    }
});

/*
The Question Updater component will wait for the user to submit new questions. After the button is clicked, the component will add the new question to the question database.
*/
/*
function submitNewQuestionEvent(content, options, rightOptionIndex) {
    return Event("submitNewQuestionEvent", {content: content, options: options, rightOptionIndex: rightOptionIndex});
}

function addNewQuestionEvent(questionId, content, options, rightOptionIndex) {
    return Event("addNewQuestionEvent", {questionId: questionId, content: content, options: options, rightOptionIndex: rightOptionIndex});
}

ctx.registerEffect('addNewQuestionEvent', function (data) {
    ctx.populateContext([
        question(data.questionId, data.content, data.options, data.rightOptionIndex)
    ]);
});

ctx.bthread('Question Updater logic', 'phase.questionUpdater', function (phase) {
    while (true) {
        let event = sync({waitFor: [submitNewQuestionEvent()]});
        let newQuestionId = `q${Math.random().toString(36).substr(2, 9)}`; // Generate a unique ID for the new question
        sync({request: [addNewQuestionEvent(newQuestionId, event.data.content, event.data.options, event.data.rightOptionIndex)]});
    }
});
-------------------------------------------------------------
User: submitNewQuestionEvent called without all needed parameters
Provide a full corrected implementation, without additional explanation.
-------------------------------------------------------------
*/

function submitNewQuestionEvent(content, options, rightOptionIndex) {
    return Event("submitNewQuestionEvent", {content: content, options: options, rightOptionIndex: rightOptionIndex});
}

function anySubmitNewQuestionWithData(data) {
    return anyEventNameWithData("submitNewQuestionEvent", data);
}

function addNewQuestionEvent(questionId, content, options, rightOptionIndex) {
    return Event("addNewQuestionEvent", {questionId: questionId, content: content, options: options, rightOptionIndex: rightOptionIndex});
}

ctx.registerEffect('addNewQuestionEvent', function (data) {
    ctx.populateContext([
        question(data.questionId, data.content, data.options, data.rightOptionIndex)
    ]);
});

ctx.bthread('Question Updater logic', 'phase.questionUpdater', function (phase) {
    while (true) {
        let event = sync({waitFor: [anySubmitNewQuestionWithData({})]});
        let newQuestionId = `q${Math.random().toString(36).substr(2, 9)}`; // Generate a unique ID for the new question
        sync({request: [addNewQuestionEvent(newQuestionId, event.data.content, event.data.options, event.data.rightOptionIndex)]});
    }
});
//!Notice that this is problematic now for the gameSequence because it refers only to existing Ids.
/*
The Math Umbrella component will wait for a user to click a link, and then follow that link.
*/

function linkClickEvent(linkUrl) {
    return Event("linkClickEvent", {linkUrl: linkUrl});
}

function followLinkEvent(linkUrl) {
    return Event("followLinkEvent", {linkUrl: linkUrl});
}

ctx.bthread('Math Umbrella link following', 'phase.mathUmbrella', function (phase) {
    while (true) {
        let event = sync({waitFor: [anyEventNameWithData("linkClickEvent", {})]});
        sync({request: [followLinkEvent(event.data.linkUrl)]});
    }
});