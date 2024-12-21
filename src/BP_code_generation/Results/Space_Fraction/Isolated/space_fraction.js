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
  Summary of existing events you can use if needed, without declaring them again:
            1. startButtonClickEvent() 
            2. moveToMovieComponentEvent()
                     has an effect:
                     ctx.registerEffect('moveToMainMenuComponentEvent', function (data) {
                               let phase = ctx.getEntityById('gamePhase1);
                               phase.currentComponent = 'main_menu';
                     });
/*
Upon entrance to the movie component,  the introductory movie will begin playing.
After the movie begins playing, if a mouse click is received, this component will terminate the movie and forward  the user to the main menu component. Otherwise, after movie completion, the user will be moved to the main menu. 
*/

function startMovieEvent() {
    return Event("startMovieEvent");
}

function stopMovieEvent() {
    return Event("stopMovieEvent");
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

ctx.bthread('Play movie on movie component entrance', 'phase.movie', function (phase) {
    sync({request: [startMovieEvent()]});
    let event = sync({waitFor: [mouseClickEvent(), stopMovieEvent()]});
    if (event.name === 'mouseClickEvent') {
        sync({request: [stopMovieEvent()]});
    }
    sync({request: [moveToMainMenuComponentEvent()]});
});
/*TODO RON: Sometimes it doesnt "stop movie" on mouse click.
*/
/*
 Summary of existing events you can use if needed, without declaring them again:
             Summary of existing events you can use if needed, without declaring them again:
            1. startButtonClickEvent() 
            2. moveToMovieComponentEvent()
                     has an effect:
                     ctx.registerEffect('moveToMainMenuComponentEvent', function (data) {
                               let phase = ctx.getEntityById('gamePhase1);
                               phase.currentComponent = 'main_menu';
                     });
            3. startMovieEvent()
            4. stopMovieEvent()
            5. mouseClickEvent()
            6. moveToMainMenuComponentEvent()
                     has an effect:
                     ctx.registerEffect('moveToMainMenuComponentEvent', function (data) {
                               let phase = ctx.getEntityById('gamePhase1);
                               phase.currentComponent = 'main_menu';
                     });
                     
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
//! This solution includes getEntitiesByType function which doesnt exist.


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

function updateScoreEvent(scoreId, points) {
    return Event("updateScoreEvent", {scoreId: scoreId, points: points});
}

ctx.registerEffect('updateScoreEvent', function (data) {
    let score = ctx.getEntityById(data.scoreId);
    score.value += data.points;
});

ctx.bthread('Game sequence logic', 'phase.gameSequence', function (phase) {
    const questions = ctx.getEntitiesByType('question');
    let questionIndex = 0;
    let firstAttempt = true;

    while (questionIndex < questions.length) {
        sync({request: [displayQuestionEvent(questions[questionIndex].id)]});
        let answerEvent = sync({waitFor: [userAnswerEvent(questions[questionIndex].id, any)]});

        if (answerEvent.data.selectedOptionIndex === questions[questionIndex].rightOptionIndex) {
            sync({request: [correctAnswerMessageEvent()]});
            if (firstAttempt) {
                sync({request: [updateScoreEvent('score1', 1)]});
            }
            questionIndex++;
            firstAttempt = true;
            sync({request: [moveToNextQuestionEvent()]});
        } else {
            sync({request: [incorrectAnswerMessageEvent()]});
            firstAttempt = false;
        }
    }

    sync({request: [moveToEndingSceneComponentEvent(phase.id)]});
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