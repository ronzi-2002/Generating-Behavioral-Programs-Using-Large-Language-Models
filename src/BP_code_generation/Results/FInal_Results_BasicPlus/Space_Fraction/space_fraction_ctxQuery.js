//In this version we introduce the use of ctx.runQuery to get all the rooms of type kitchen.
//Notice this requires a small change in the instructions.


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
    let phase = ctx.getEntityById(data.phaseId);
    phase.currentComponent = 'main_menu';
});

ctx.bthread('Start movie on entering movie component', 'phase.movie', function (phase) {
    sync({request: [movieStartEvent()]});
    let event = sync({waitFor: [mouseClickEvent(), movieCompletionEvent()]});
    sync({request: [moveToMainMenuComponentEvent(phase.id)]});
});

function movieCompletionEvent() {
    return Event("movieCompletionEvent");
}
/*TODO RON:  it generates this:
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
/*
function displayQuestionEvent(questionId) {
    return Event("displayQuestionEvent", {questionId: questionId});
}

function userAnswerEvent(questionId, selectedOptionIndex) {
    return Event("userAnswerEvent", {questionId: questionId, selectedOptionIndex: selectedOptionIndex});
}

function correctAnswerMessageEvent() {
    return Event("correctAnswerMessageEvent");
}

function incorrectAnswerMessageEvent() {
    return Event("incorrectAnswerMessageEvent");
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
    const questions = ctx.runQuery(entity => entity.type == 'question');
    let questionIndex = 0;
    let firstAttempt = true;

    while (questionIndex < questions.length) {
        sync({request: [displayQuestionEvent(questions[questionIndex].id)]});
        let answerEvent = sync({waitFor: [userAnswerEvent(questions[questionIndex].id, any)]});

        if (answerEvent.data.selectedOptionIndex === questions[questionIndex].rightOptionIndex) {
            sync({request: [correctAnswerMessageEvent()]});
            if (firstAttempt) {
                sync({request: [addScoreEvent()]});
            }
            questionIndex++;
            firstAttempt = true; // Reset for next question
        } else {
            sync({request: [incorrectAnswerMessageEvent()]});
            firstAttempt = false;
        }
    }

    sync({request: [moveToEndingSceneComponentEvent()]});
});
---------------------------------------------------------------------------------------------------------------------
User: Compilation error at:             let answerEvent = sync({waitFor: [userAnswerEvent(questions[questionIndex].id, any)]});
 Provide a full corrected implementation, without additional explanation. 
---------------------------------------------------------------------------------------------------------------------
function displayQuestionEvent(questionId) {
    return Event("displayQuestionEvent", {questionId: questionId});
}

function userAnswerEvent(questionId, selectedOptionIndex) {
    return Event("userAnswerEvent", {questionId: questionId, selectedOptionIndex: selectedOptionIndex});
}

function correctAnswerMessageEvent() {
    return Event("correctAnswerMessageEvent");
}

function incorrectAnswerMessageEvent() {
    return Event("incorrectAnswerMessageEvent");
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
    const questions = ctx.runQuery(entity => entity.type == 'question');
    let questionIndex = 0;
    let firstAttempt = true;

    while (questionIndex < questions.length) {
        sync({request: [displayQuestionEvent(questions[questionIndex].id)]});
        let answerEvent = sync({waitFor: [anyEventNameWithData("userAnswerEvent", {questionId: questions[questionIndex].id})]});

        if (answerEvent.data.selectedOptionIndex === questions[questionIndex].rightOptionIndex) {
            sync({request: [correctAnswerMessageEvent()]});
            if (firstAttempt) {
                sync({request: [addScoreEvent()]});
            }
            questionIndex++;
            firstAttempt = true; // Reset for next question
        } else {
            sync({request: [incorrectAnswerMessageEvent()]});
            firstAttempt = false;
        }
    }

    sync({request: [moveToEndingSceneComponentEvent()]});
});
---------------------------------------------------------------------------------------------------------------------
User: Compilation error at:                            sync({request: [addScoreEvent()]});
 Provide a full corrected implementation, without additional explanation.  
---------------------------------------------------------------------------------------------------------------------
*/

function displayQuestionEvent(questionId) {
    return Event("displayQuestionEvent", {questionId: questionId});
}

function userAnswerEvent(questionId, selectedOptionIndex) {
    return Event("userAnswerEvent", {questionId: questionId, selectedOptionIndex: selectedOptionIndex});
}

function correctAnswerMessageEvent() {
    return Event("correctAnswerMessageEvent");
}

function incorrectAnswerMessageEvent() {
    return Event("incorrectAnswerMessageEvent");
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
    const questions = ctx.runQuery(entity => entity.type == 'question');
    let questionIndex = 0;
    let firstAttempt = true;

    while (questionIndex < questions.length) {
        sync({request: [displayQuestionEvent(questions[questionIndex].id)]});
        let answerEvent = sync({waitFor: [anyEventNameWithData("userAnswerEvent", {questionId: questions[questionIndex].id})]});

        if (answerEvent.data.selectedOptionIndex === questions[questionIndex].rightOptionIndex) {
            sync({request: [correctAnswerMessageEvent()]});
            if (firstAttempt) {
                sync({request: [addScoreEvent()]});
            }
            questionIndex++;
            firstAttempt = true; // Reset for next question
        } else {
            sync({request: [incorrectAnswerMessageEvent()]});
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

ctx.bthread('Handle ending scene selections', 'phase.endingScene', function (phase) {
    while (true) {
        let event = sync({waitFor: [returnToMainMenuButtonEvent(), exitGameButtonEvent()]});
        if (event.name === 'returnToMainMenuButtonEvent') {
            sync({request: [moveToMainMenuFromEndingEvent()]});
        } else if (event.name === 'exitGameButtonEvent') {
            sync({request: [exitGameEvent()]});
            break; // Exit the loop and effectively end the bthread if exiting the game
        }
    }
});



/*
The Question Updater component will wait for the user to submit new questions, providing all the relevant data. After the button is clicked, the component will add the new question to the question database. 
*/
//! Added "providing all the relevant data" to the requirement. Without it, it sometimes simply set default values to the question.
/*
The Question Updater component will wait for the user to submit new questions. After the button is clicked, the component will add the new question to the question database.

function submitNewQuestionButtonEvent() {
    return Event("submitNewQuestionButtonEvent");
}

function newQuestionSubmittedEvent(questionId, content, options, rightOptionIndex) {
    return Event("newQuestionSubmittedEvent", {questionId: questionId, content: content, options: options, rightOptionIndex: rightOptionIndex});
}

ctx.registerEffect('newQuestionSubmittedEvent', function (data) {
    ctx.populateContext([
        question(data.questionId, data.content, data.options, data.rightOptionIndex)
    ]);
});

ctx.bthread('Handle new question submissions', 'phase.questionUpdater', function (phase) {
    while (true) {
        sync({waitFor: [submitNewQuestionButtonEvent()]});
        // Assuming the new question details are somehow provided, perhaps via a form in the UI
        // Here we simulate with placeholders
        let newQuestionId = `q${Date.now()}`; // Unique ID based on timestamp
        let newContent = "Sample question content";
        let newOptions = ["Option 1", "Option 2", "Option 3", "Option 4"];
        let newRightOptionIndex = Math.floor(Math.random() * 4); // Randomly select the correct answer index

        sync({request: [newQuestionSubmittedEvent(newQuestionId, newContent, newOptions, newRightOptionIndex)]});
    }
});
*/
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

ctx.bthread('Add new questions on submission', 'phase.questionUpdater', function (phase) {
    while (true) {
        let submitEvent = sync({waitFor: [anyEventNameWithData("submitNewQuestionEvent")]});
        let newQuestionId = `q${Date.now()}`; // Generate a unique ID based on the current timestamp
        sync({request: [addNewQuestionEvent(newQuestionId, submitEvent.data.content, submitEvent.data.options, submitEvent.data.rightOptionIndex)]});
    }
});
/*
The Question Updater component will wait for the user to submit new questions, providing 4 options, where the first it the right one. Randomize the place of the corrrect answer. After the button is clicked, the component will add the new question to the question database.  

function submitNewQuestionEvent(content, options) {
    return Event("submitNewQuestionEvent", {content: content, options: options});
}

function addNewQuestionEvent(content, options, rightOptionIndex) {
    return Event("addNewQuestionEvent", {content: content, options: options, rightOptionIndex: rightOptionIndex});
}

ctx.registerEffect('addNewQuestionEvent', function (data) {
    // Randomize the position of the correct answer
    const correctAnswer = data.options[0];
    const shuffledOptions = data.options.sort(() => Math.random() - 0.5);
    const newRightOptionIndex = shuffledOptions.indexOf(correctAnswer);

    // Add the new question to the database
    ctx.populateContext([
        question(`q${Date.now()}`, data.content, shuffledOptions, newRightOptionIndex)
    ]);
});

ctx.bthread('Handle new question submissions', 'phase.questionUpdater', function (phase) {
    while (true) {
        let event = sync({waitFor: [submitNewQuestionEvent()]});
        sync({request: [addNewQuestionEvent(event.data.content, event.data.options, 0)]});
    }
});
*/
/*
The Math Umbrella component will wait for a user to click a link, and then follow that link.
*/

function linkClickEvent(linkUrl) {
    return Event("linkClickEvent", {linkUrl: linkUrl});
}

function followLinkEvent(linkUrl) {
    return Event("followLinkEvent", {linkUrl: linkUrl});
}

ctx.bthread('Follow link on click in Math Umbrella component', 'phase.mathUmbrella', function (phase) {
    while (true) {
        let clickEvent = sync({waitFor: [anyEventNameWithData("linkClickEvent")]});
        sync({request: [followLinkEvent(clickEvent.data.linkUrl)]});
    }
});