/*
There is one game entity. The game holds: an array of questions, current component of the game(starting with "game_start") and the current score(starting with 0)
Each question has its content, 4 options and the index of the right option 

Generate 4 questions about the USA history(place the right answer at a random position
*/
//queries needed:
//a query for each phase of the game(start, movie, main menu, game sequence, ending scene, question updater, math umbrella )
ctx.registerQuery('game.start', entity => entity.type == 'game' && entity.currentComponent == 'game_start');
ctx.registerQuery('game.movie', entity => entity.type == 'game' && entity.currentComponent == 'movie');
ctx.registerQuery('game.mainMenu', entity => entity.type == 'game' && entity.currentComponent == 'main_menu');
ctx.registerQuery('game.gameSequence', entity => entity.type == 'game' && entity.currentComponent == 'game_sequence');
ctx.registerQuery('game.endingScene', entity => entity.type == 'game' && entity.currentComponent == 'ending_scene');
ctx.registerQuery('game.questionUpdater', entity => entity.type == 'game' && entity.currentComponent == 'question_updater');
ctx.registerQuery('game.mathUmbrella', entity => entity.type == 'game' && entity.currentComponent == 'math_umbrella');

/*At the start of the game, When the user clicks on the start button, the game will move to the movie component. */
function startButtonClickEvent() {
    return Event("startButtonClickEvent");
}

function moveToMovieComponentEvent() {
    return Event("moveToMovieComponentEvent");
}

ctx.registerEffect('moveToMovieComponentEvent', function (data) {
    let game = ctx.getEntityById(data.gameId);
    game.currentComponent = 'movie';
});

ctx.bthread('Move to movie component on start button click', 'phase.start', function (game) {
    while (true) {
        sync({waitFor: [startButtonClickEvent()]});
        sync({request: [moveToMovieComponentEvent({gameId: game.id})]});
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
The main menu component will wait until the user selects a button. At that time, the user will be forwarded to one of the following: game sequence component, Denominators' web page, math umbrella component, or the question updater component depending on the button selected*/

function gameSequenceButtonEvent() {
    return Event("gameSequenceButtonEvent");
}

function denominatorsWebButtonEvent() {
    return Event("denominatorsWebButtonEvent");
}

function mathUmbrellaButtonEvent() {
    return Event("mathUmbrellaButtonEvent");
}

function questionUpdaterButtonEvent() {
    return Event("questionUpdaterButtonEvent");
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

ctx.bthread('Handle main menu selections', 'phase.mainMenu', function (phase) {
    while (true) {
        let event = sync({waitFor: [gameSequenceButtonEvent(), denominatorsWebButtonEvent(), mathUmbrellaButtonEvent(), questionUpdaterButtonEvent()]});
        switch (event.name) {
            case "gameSequenceButtonEvent":
                sync({request: [moveToGameSequenceComponentEvent(phase.id)]});
                break;
            case "denominatorsWebButtonEvent":
                // Assuming there's a function to handle opening a web page
                openDenominatorsWebPage();
                break;
            case "mathUmbrellaButtonEvent":
                sync({request: [moveToMathUmbrellaComponentEvent(phase.id)]});
                break;
            case "questionUpdaterButtonEvent":
                sync({request: [moveToQuestionUpdaterComponentEvent(phase.id)]});
                break;
        }
    }
});

function openDenominatorsWebPage() {
    // This function would contain the logic to open the web page, not defined here as it's outside the scope of COBP.
}

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
function returnToMainMenuButtonEvent() {
    return Event("returnToMainMenuButtonEvent");
}

function exitGameButtonEvent() {
    return Event("exitGameButtonEvent");
}

function moveToMainMenuFromEndingEvent() {
    return Event("moveToMainMenuFromEndingEvent");
}

ctx.registerEffect('moveToMainMenuFromEndingEvent', function (data) {
    let phase = ctx.getEntityById(data.phaseId);
    phase.currentComponent = 'main_menu';
});

ctx.bthread('Handle ending scene selections', 'phase.endingScene', function (phase) {
    while (true) {
        let event = sync({waitFor: [returnToMainMenuButtonEvent(), exitGameButtonEvent()]});
        if (event.name === "returnToMainMenuButtonEvent") {
            sync({request: [moveToMainMenuFromEndingEvent(phase.id)]});
        } else if (event.name === "exitGameButtonEvent") {
            // Assuming there's a function to handle game exit
            exitGame();
        }
    }
});

function exitGame() {
    // This function would contain the logic to exit the game, not defined here as it's outside the scope of COBP.
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