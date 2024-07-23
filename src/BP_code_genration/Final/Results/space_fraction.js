//Generated using v13.12

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
function startGameButtonClickEvent() {
    return Event("startGameButtonClickEvent");
}

function moveToMovieComponentEvent() {
    return Event("moveToMovieComponentEvent");
}

ctx.registerEffect('moveToMovieComponentEvent', function (data) {
    let phase = ctx.getEntityById('gamePhase1');
    phase.currentComponent = 'movie';
});

ctx.bthread('Move to movie component on start game button click', 'phase.start', function (phase) {
    while(true){
        sync({waitFor: [startGameButtonClickEvent()]});
        sync({request: [moveToMovieComponentEvent()]});
    }
});

/*
Upon entrance to the movie component, the introductory movie will begin playing.
If a mouse click is received, this component will terminate the movie and forward
the user to the main menu component.
Otherwise, the movie will continue to its completion and the user will be moved to the main menu.
*/

function playIntroMovieEvent() {
    return Event("playIntroMovieEvent");
}

function terminateMovieEvent() {
    return Event("terminateMovieEvent");
}

function moveToMainMenuComponentEvent() {
    return Event("moveToMainMenuComponentEvent");
}

ctx.registerEffect('moveToMainMenuComponentEvent', function (data) {
    let phase = ctx.getEntityById('gamePhase1');
    phase.currentComponent = 'main_menu';
});

ctx.bthread('Play and manage movie in movie component', 'phase.movie', function (phase) {
    sync({request: [playIntroMovieEvent()]});
    let event = sync({waitFor: [terminateMovieEvent(), anyEventNameWithData("mouseClickEvent", {})]});
    if (event.name === "mouseClickEvent") {
        sync({request: [terminateMovieEvent()]});
    }
    sync({request: [moveToMainMenuComponentEvent()]});
});

/*
The main menu component will wait until the user selects a button. At that time, the user will be forwarded to one of the following: game sequence component, Denominators' web page, math umbrella component, or the question updater component depending on the button selected*/

function selectGameSequenceButtonEvent() {
    return Event("selectGameSequenceButtonEvent");
}

function selectDenominatorsWebPageButtonEvent() {
    return Event("selectDenominatorsWebPageButtonEvent");
}

function selectQuestionUpdaterButtonEvent() {
    return Event("selectQuestionUpdaterButtonEvent");
}

function selectMathUmbrellaButtonEvent() {
    return Event("selectMathUmbrellaButtonEvent");
}

function moveToGameSequenceComponentEvent() {
    return Event("moveToGameSequenceComponentEvent");
}

function navigateToDenominatorsWebPageEvent() {
    return Event("navigateToDenominatorsWebPageEvent");
}

function moveToQuestionUpdaterComponentEvent() {
    return Event("moveToQuestionUpdaterComponentEvent");
}

function moveToMathUmbrellaComponentEvent() {
    return Event("moveToMathUmbrellaComponentEvent");
}

ctx.registerEffect('moveToGameSequenceComponentEvent', function (data) {
    let phase = ctx.getEntityById('gamePhase1');
    phase.currentComponent = 'game_sequence';
});

ctx.registerEffect('moveToQuestionUpdaterComponentEvent', function (data) {
    let phase = ctx.getEntityById('gamePhase1');
    phase.currentComponent = 'question_updater';
});

ctx.registerEffect('moveToMathUmbrellaComponentEvent', function (data) {
    let phase = ctx.getEntityById('gamePhase1');
    phase.currentComponent = 'math_umbrella';
});

ctx.bthread('Handle main menu selections', 'phase.mainMenu', function (phase) {
    while(true){
        let event = sync({waitFor: [
                selectGameSequenceButtonEvent(),
                selectDenominatorsWebPageButtonEvent(),
                selectQuestionUpdaterButtonEvent(),
                selectMathUmbrellaButtonEvent()
            ]});

        switch(event.name) {
            case "selectGameSequenceButtonEvent":
                sync({request: [moveToGameSequenceComponentEvent()]});
                break;
            case "selectDenominatorsWebPageButtonEvent":
                sync({request: [navigateToDenominatorsWebPageEvent()]});//! This was updated using a post process. At first it called a non existing function called navigateToDenominatorsWebPage();
                break;
            case "selectQuestionUpdaterButtonEvent":
                sync({request: [moveToQuestionUpdaterComponentEvent()]});
                break;
            case "selectMathUmbrellaButtonEvent":
                sync({request: [moveToMathUmbrellaComponentEvent()]});
                break;
        }
    }
});

/*
The game sequence component will display a question, and then wait until the user chooses an answer. If the user selects the correct answer, a message to this effect will be displayed and the component will move to the next question. If its his first answer to the question he will receive 1 point. If the incorrect answer is selected, this component will inform the user of   this and give them another chance to answer the question. However, their score will not count this question as being answered correctly.  After the user has proceeded through a set number of questions, they will be directed to the ending scene component.
*/
//! To update the score, it sometimes used ctx.effect('updateScore', {}); Once again a simple post process fixed it.
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
ctx.registerEffect("moveToEndingSceneComponentEvent", function(date)
{
    let phase = ctx.getEntityById('gamePhase1');
    phase.currentComponent = 'ending_scene'
});

function updateScoreEvent() {
    return Event("updateScoreEvent");
}

ctx.registerEffect('updateScoreEvent', function (data) {
    let score = ctx.getEntityById('score1');
    score.value += 1;
});

ctx.bthread('Game sequence logic', 'phase.gameSequence', function (phase) {
    const questions = getEntities('question');
    let questionIndex = 0;
    let firstAttempt = true;

    while (questionIndex < questions.length) {
        sync({request: [displayQuestionEvent(questions[questionIndex].id)]});
        let event = sync({waitFor: [anyEventNameWithData("userAnswerEvent", {questionId: questions[questionIndex].id})]});

        if (event.data.selectedOptionIndex === questions[questionIndex].rightOptionIndex) {
            sync({request: [correctAnswerMessageEvent()]});
            if (firstAttempt) {
                sync({request: [updateScoreEvent()]});
            }
            questionIndex++;
            firstAttempt = true;
            if (questionIndex < questions.length) {
                sync({request: [moveToNextQuestionEvent()]});
            } else {
                sync({request: [moveToEndingSceneComponentEvent()]});
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
function selectReturnToMainMenuEvent() {
    return Event("selectReturnToMainMenuEvent");
}

function selectExitGameEvent() {
    return Event("selectExitGameEvent");
}

// function moveToMainMenuComponentEvent() {
//     return Event("moveToMainMenuComponentEvent");
// }

function exitGameEvent() {
    return Event("exitGameEvent");
}

ctx.bthread('Handle ending scene selections', 'phase.endingScene', function (phase) {
    let event = sync({waitFor: [selectReturnToMainMenuEvent(), selectExitGameEvent()]});
    if (event.name === "selectReturnToMainMenuEvent") {
        sync({request: [moveToMainMenuComponentEvent()]});
    } else if (event.name === "selectExitGameEvent") {
        sync({request: [exitGameEvent()]});
    }
});

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