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
Upon entrance to the movie component, the introductory movie will begin playing.
If a mouse click is received, this component will terminate the movie and forward
the user to the main menu component.
Otherwise, the movie will continue to its completion and the user will be moved to the main menu.
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
    let phase = ctx.getEntityById(data.phaseId);
    phase.currentComponent = 'game_sequence';
});

ctx.registerEffect('moveToMathUmbrellaComponentEvent', function (data) {
    let phase = ctx.getEntityById(data.phaseId);
    phase.currentComponent = 'math_umbrella';
});

ctx.registerEffect('moveToQuestionUpdaterComponentEvent', function (data) {
    let phase = ctx.getEntityById(data.phaseId);
    phase.currentComponent = 'question_updater';
});

ctx.registerEffect('openDenominatorsWebPageEvent', function (data) {
    // This effect would typically handle opening a web page, which is outside the scope of this simulation.
    // Assume the action is handled appropriately.
});

ctx.bthread('Handle main menu selections', 'phase.mainMenu', function (phase) {
    while (true) {
        let event = sync({waitFor: [
            gameSequenceButtonEvent(),
            mathUmbrellaButtonEvent(),
            questionUpdaterButtonEvent(),
            denominatorsWebPageButtonEvent()
        ]});

        switch (event.name) {
            case 'gameSequenceButtonEvent':
                sync({request: [moveToGameSequenceComponentEvent(phase.id)]});
                break;
            case 'mathUmbrellaButtonEvent':
                sync({request: [moveToMathUmbrellaComponentEvent(phase.id)]});
                break;
            case 'questionUpdaterButtonEvent':
                sync({request: [moveToQuestionUpdaterComponentEvent(phase.id)]});
                break;
            case 'denominatorsWebPageButtonEvent':
                sync({request: [openDenominatorsWebPageEvent()]});
                break;
        }
    }
});

/*
The game sequence component will display a question, and then wait until the user chooses an answer. If the user selects the correct answer, a message to this effect will be displayed and the component will move to the next question. If its his first answer to the question he will receive 1 point. If the incorrect answer is selected, this component will inform the user of   this and give them another chance to answer the question. However, their score will not count this question as being answered correctly.  After the user has proceeded through a set number of questions, they will be directed to the ending scene component.
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

function updateScoreEvent(scoreId, increment) {
    return Event("updateScoreEvent", {scoreId: scoreId, increment: increment});
}

ctx.registerEffect('updateScoreEvent', function (data) {
    let score = ctx.getEntityById(data.scoreId);
    score.value += data.increment;
});

ctx.bthread('Game sequence logic', 'phase.gameSequence', function (phase) {
    const questions = ctx.runQuery(() => entity.type == 'question');
    let questionIndex = 0;
    let firstAttempt = true;

    while (questionIndex < questions.length) {
        sync({request: [displayQuestionEvent(questions[questionIndex].id)]});
        let answerEvent = sync({waitFor: [userAnswerEvent(questions[questionIndex].id)]});

        if (answerEvent.data.selectedOptionIndex === questions[questionIndex].rightOptionIndex) {
            sync({request: [correctAnswerMessageEvent()]});
            if (firstAttempt) {
                sync({request: [updateScoreEvent('score1', 1)]});
            }
            questionIndex++;
            firstAttempt = true;
            if (questionIndex < questions.length) {
                sync({request: [moveToNextQuestionEvent()]});
            } else {
                sync({request: [moveToEndingSceneComponentEvent(phase.id)]});
                break;
            }
        } else {
            sync({request: [incorrectAnswerMessageEvent()]});
            firstAttempt = false;
        }
    }
});
---------------------------------------------------------------------------------------------------------------------
User: userAnswerEvent called without all parameters
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

ctx.bthread('Game sequence logic', 'phase.gameSequence', function (phase) {
    const questions = ctx.runQuery(() => entity.type == 'question');
    let questionIndex = 0;
    let firstAttempt = true;

    while (questionIndex < questions.length) {
        sync({request: [displayQuestionEvent(questions[questionIndex].id)]});
        let answerEvent = sync({waitFor: [anyEventNameWithData("userAnswerEvent", {questionId: questions[questionIndex].id})]});

        if (answerEvent.data.selectedOptionIndex === questions[questionIndex].rightOptionIndex) {
            sync({request: [correctAnswerMessageEvent()]});
            if (firstAttempt) {
                sync({request: [updateScoreEvent('score1', 1)]});
            }
            questionIndex++;
            firstAttempt = true;
            if (questionIndex < questions.length) {
                sync({request: [moveToNextQuestionEvent()]});
            } else {
                sync({request: [moveToEndingSceneComponentEvent(phase.id)]});
                break;
            }
        } else {
            sync({request: [incorrectAnswerMessageEvent()]});
            firstAttempt = false;
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

function moveToMainMenuFromEndingEvent() {
    return Event("moveToMainMenuFromEndingEvent");
}

function exitGameEvent() {
    return Event("exitGameEvent");
}

ctx.registerEffect('moveToMainMenuFromEndingEvent', function (data) {
    let phase = ctx.getEntityById(data.phaseId);
    phase.currentComponent = 'main_menu';
});

ctx.registerEffect('exitGameEvent', function (data) {
    // This effect would typically handle the logic to exit the game, which might include cleaning up resources, saving state, etc.
    // Assume the action is handled appropriately.
});

ctx.bthread('Handle ending scene selections', 'phase.endingScene', function (phase) {
    while (true) {
        let event = sync({waitFor: [
            returnToMainMenuButtonEvent(),
            exitGameButtonEvent()
        ]});

        switch (event.name) {
            case 'returnToMainMenuButtonEvent':
                sync({request: [moveToMainMenuFromEndingEvent(phase.id)]});
                break;
            case 'exitGameButtonEvent':
                sync({request: [exitGameEvent()]});
                break;
        }
    }
});



/*
The Question Updater component will wait for the user to submit new questions. After the button is clicked, the component will add the new question to the question database.
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

ctx.bthread('Add new question on submit', 'phase.questionUpdater', function (phase) {
    while (true) {
        let submitEvent = sync({waitFor: [anyEventNameWithData("submitNewQuestionEvent")]});
        let newQuestionId = `q${Date.now()}`; // Generate a unique ID based on the current timestamp
        sync({request: [addNewQuestionEvent(newQuestionId, submitEvent.data.content, submitEvent.data.options, submitEvent.data.rightOptionIndex)]});
    }
});
/*
The Math Umbrella component will wait for a user to click a link, and then follow that link.
*/

function clickLinkEvent(linkUrl) {
    return Event("clickLinkEvent", {linkUrl: linkUrl});
}

function followLinkEvent(linkUrl) {
    return Event("followLinkEvent", {linkUrl: linkUrl});
}

ctx.bthread('Follow link on click', 'phase.mathUmbrella', function (phase) {
    while (true) {
        let clickEvent = sync({waitFor: [anyEventNameWithData("clickLinkEvent")]});
        sync({request: [followLinkEvent(clickEvent.data.linkUrl)]});
    }
});