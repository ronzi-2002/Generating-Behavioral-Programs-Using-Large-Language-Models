/*
A question has a description, four options, and the index of the right option.
*/
function question(id, description, options, rightOptionIndex) {
    return ctx.Entity(id, 'question', {description: description, options: options, rightOptionIndex: rightOptionIndex})
}
/*
A game holds questions, a score between 0 to 4, and the current component of the game (‘movie,’ ‘main menu,’ ‘game sequence,’ ‘ending scene,’ ‘question updater,’ or ‘math umbrella’). The initial component is ‘movie’, the initial score is 0 and there are 4 questions about USA history, with correct answer
in a random position.
*/
function game(id, questions, score, currentComponent) {
    return ctx.Entity(id, 'game', {questions: questions, score: score, currentComponent: currentComponent})
}

ctx.populateContext([
    game('game1', [
        question('q1', 'What is the capital of the USA?', ['New York', 'Washington D.C.', 'Los Angeles', 'Chicago'], 1),
        question('q2', 'Who was the first president of the USA?', ['Abraham Lincoln', 'George Washington', 'Thomas Jefferson', 'John Adams'], 1),
        question('q3', 'When did the USA gain independence?', ['1776', '1800', '1812', '1783'], 0),
        question('q4', 'What event began in 1861 in the USA?', ['World War I', 'The Great Depression', 'The Civil War', 'The Industrial Revolution'], 2)
    ], 0, 'movie')
])



// Needed queries: A query for each game component.ctx.registerQuery('game.movie', entity => entity.type == 'game' && entity.currentComponent == 'movie');
ctx.registerQuery('game.mainMenu', entity => entity.type == 'game' && entity.currentComponent == 'main menu');
ctx.registerQuery('game.gameSequence', entity => entity.type == 'game' && entity.currentComponent == 'game sequence');
ctx.registerQuery('game.endingScene', entity => entity.type == 'game' && entity.currentComponent == 'ending scene');
ctx.registerQuery('game.questionUpdater', entity => entity.type == 'game' && entity.currentComponent == 'question updater');
ctx.registerQuery('game.mathUmbrella', entity => entity.type == 'game' && entity.currentComponent == 'math umbrella');


/*
Upon entrance to the movie component, the introductory movie will begin playing. If a mouse click is received, this component will terminate the movie and forward the user to the main menu component. Otherwise, the movie will continue to its completion and the user will be moved to the main menu.
*/

function playIntroductoryMovieEvent(gameId) {
    return Event("playIntroductoryMovieEvent", {gameId: gameId})
}

function terminateMovieEvent(gameId) {
    return Event("terminateMovieEvent", {gameId: gameId})
}

function moveToMainMenuEvent(gameId) {
    return Event("moveToMainMenuEvent", {gameId: gameId})
}

ctx.registerEffect('moveToMainMenuEvent', function (data) {
    let game = ctx.getEntityById(data.gameId)
    game.currentComponent = 'main menu'
})

ctx.bthread('Introductory movie behavior', 'game.movie', function (game) {
    sync({request: [playIntroductoryMovieEvent(game.id)]})
    let event = sync({waitFor: [terminateMovieEvent(game.id), playIntroductoryMovieEvent(game.id)]})
    if (event.name === "terminateMovieEvent") {
        sync({request: [moveToMainMenuEvent(game.id)]})
    } else {
        sync({request: [moveToMainMenuEvent(game.id)]})
    }
})

/*
The main menu component will wait until the user selects a button. At that time, the user will be forwarded to one of the following: game sequence component, math umbrella component, the question updater component or the Denominators' web page depending on the button selected 
*/
function selectButtonEvent(gameId, button) {
    return Event("selectButtonEvent", {gameId: gameId, button: button})
}

function moveToGameSequenceEvent(gameId) {
    return Event("moveToGameSequenceEvent", {gameId: gameId})
}

function moveToMathUmbrellaEvent(gameId) {
    return Event("moveToMathUmbrellaEvent", {gameId: gameId})
}

function moveToQuestionUpdaterEvent(gameId) {
    return Event("moveToQuestionUpdaterEvent", {gameId: gameId})
}

function moveToDenominatorsWebPageEvent(gameId) {
    return Event("moveToDenominatorsWebPageEvent", {gameId: gameId})
}

ctx.registerEffect('moveToGameSequenceEvent', function (data) {
    let game = ctx.getEntityById(data.gameId)
    game.currentComponent = 'game sequence'
})

ctx.registerEffect('moveToMathUmbrellaEvent', function (data) {
    let game = ctx.getEntityById(data.gameId)
    game.currentComponent = 'math umbrella'
})

ctx.registerEffect('moveToQuestionUpdaterEvent', function (data) {
    let game = ctx.getEntityById(data.gameId)
    game.currentComponent = 'question updater'
})

ctx.bthread('Main menu button selection', 'game.mainMenu', function (game) {
    let event = sync({waitFor: [anyEventWithData(selectButtonEvent, {gameId: game.id})]})
    if (event.data.button === "game sequence") {
        sync({request: [moveToGameSequenceEvent(game.id)]})
    } else if (event.data.button === "math umbrella") {
        sync({request: [moveToMathUmbrellaEvent(game.id)]})
    } else if (event.data.button === "question updater") {
        sync({request: [moveToQuestionUpdaterEvent(game.id)]})
    } else if (event.data.button === "Denominators' web page") {
        sync({request: [moveToDenominatorsWebPageEvent(game.id)]})
    }
})

/*
The game sequence component will display a question, and then wait until the user chooses an answer. If the user selects the correct answer, a message to this effect will be displayed and the component will move to the next question. If its his first answer to the question he will receive 1 point. If the incorrect answer is selected, this component will inform the user of   this and give them another chance to answer the question. However, their score will not count this question as being answered correctly.  After the user has proceeded through all questions, they will be directed to the ending scene component.
*/
function displayQuestionEvent(gameId, questionId) {
    return Event("displayQuestionEvent", {gameId: gameId, questionId: questionId});
}

function userSelectsAnswerEvent(gameId, questionId, selectedOptionIndex) {
    return Event("userSelectsAnswerEvent", {gameId: gameId, questionId: questionId, selectedOptionIndex: selectedOptionIndex});
}

function correctAnswerEvent(gameId, questionId) {
    return Event("correctAnswerEvent", {gameId: gameId, questionId: questionId});
}

function incorrectAnswerEvent(gameId, questionId) {
    return Event("incorrectAnswerEvent", {gameId: gameId, questionId: questionId});
}

function moveToEndingSceneEvent(gameId) {
    return Event("moveToEndingSceneEvent", {gameId: gameId});
}

ctx.bthread('Game sequence question handling', 'game.gameSequence', function (game) {
    let questions = game.questions;
    for (let i = 0; i < questions.length; i++) {
        let question = questions[i];
        sync({request: [displayQuestionEvent(game.id, question.id)]});
        let firstAttempt = true;
        while (true) {
            let event = sync({waitFor: [anyEventWithData(userSelectsAnswerEvent, {gameId: game.id, questionId: question.id})]});
            if (event.data.selectedOptionIndex === question.rightOptionIndex) {
                sync({request: [correctAnswerEvent(game.id, question.id)]});
                if (firstAttempt) {
                    sync({request: [increaseScoreEvent(game.id)]});
                }
                break;
            } else {
                sync({request: [incorrectAnswerEvent(game.id, question.id)]});
                firstAttempt = false;
            }
        }
    }
    sync({request: [moveToEndingSceneEvent(game.id)]});
});

function increaseScoreEvent(gameId) {
    return Event("increaseScoreEvent", {gameId: gameId});
}

ctx.registerEffect('increaseScoreEvent', function (data) {
    let game = ctx.getEntityById(data.gameId);
    game.score += 1;
});

ctx.registerEffect('moveToEndingSceneEvent', function (data) {
    let game = ctx.getEntityById(data.gameId);
    game.currentComponent = 'ending scene';
});
/*
The ending scene will wait until the user selects either to return to the main menu or to exit the game. After receiving the user's input, the component will act accordingly.
*/
function endingSceneSelectionEvent(gameId, selection) {
    return Event("endingSceneSelectionEvent", {gameId: gameId, selection: selection});
}

function exitGameEvent(gameId) {
    return Event("exitGameEvent", {gameId: gameId});
}

ctx.bthread('Ending scene user selection', 'game.endingScene', function (game) {
    let event = sync({waitFor: [anyEventWithData(endingSceneSelectionEvent, {gameId: game.id})]});
    if (event.data.selection === "return to main menu") {
        sync({request: [moveToMainMenuEvent(game.id)]});
    } else if (event.data.selection === "exit game") {
        sync({request: [exitGameEvent(game.id)]});
    }
});


/*
Question Updater component will wait for the user to submit new questions. After the button is clicked, the component will check that 4 options were given and all are different, if they are, it will add the new question.
*/

function submitNewQuestionEvent(gameId, description, options, rightOptionIndex) {
    return Event("submitNewQuestionEvent", {gameId: gameId, description: description, options: options, rightOptionIndex: rightOptionIndex});
}

function addNewQuestionEvent(gameId, questionId, description, options, rightOptionIndex) {
    return Event("addNewQuestionEvent", {gameId: gameId, questionId: questionId, description: description, options: options, rightOptionIndex: rightOptionIndex});
}

ctx.bthread('Question updater component', 'game.questionUpdater', function (game) {
    while (true) {
        let event = sync({waitFor: [anyEventWithData(submitNewQuestionEvent, {gameId: game.id})]});
        let options = event.data.options;
        if (options.length === 4 && new Set(options).size === 4) {
            let newQuestionId = 'q' + (game.questions.length + 1);
            sync({request: [addNewQuestionEvent(game.id, newQuestionId, event.data.description, options, event.data.rightOptionIndex)]});
        }
    }
});

ctx.registerEffect('addNewQuestionEvent', function (data) {
    let game = ctx.getEntityById(data.gameId);
    game.questions.push(question(data.questionId, data.description, data.options, data.rightOptionIndex));
});
/*An alternative:
The Question Updater component will wait for the user to submit new questions, providing the correct answer as first option. After the button is clicked, the component will add the new question to the question database, setting the correct option randomly.

function submitNewQuestionEvent(content, options) {
    return Event("submitNewQuestionEvent", {content: content, options: options});
}

function addNewQuestionEvent(questionId, content, options, rightOptionIndex) {
    return Event("addNewQuestionEvent", {questionId: questionId, content: content, options: options, rightOptionIndex: rightOptionIndex});
}

ctx.registerEffect('addNewQuestionEvent', function (data) {
    let allQuestions = ctx.getEntityById('allQuestions1');
    allQuestions.questions.push({
        id: data.questionId,
        content: data.content,
        options: data.options,
        rightOptionIndex: data.rightOptionIndex
    });
});

ctx.bthread('Question Updater logic', 'phase.questionUpdater', function (phase) {
    while (true) {
        let submitEvent = sync({waitFor: [submitNewQuestionEvent()]});
        let content = submitEvent.data.content;
        let options = submitEvent.data.options;
        let rightOptionIndex = Math.floor(Math.random() * options.length); // Randomize the correct answer index

        // Rotate the options array so that the correct answer is at the randomized index
        let correctOption = options[0];
        options.splice(0, 1); // Remove the correct answer from the beginning
        options.splice(rightOptionIndex, 0, correctOption); // Insert it at the new index

        let newQuestionId = `q${ctx.getEntityById('allQuestions1').questions.length + 1}`;
        sync({request: [addNewQuestionEvent(newQuestionId, content, options, rightOptionIndex)]});
    }
});
*/

/*
The Math Umbrella component will wait for a user to click a link, and then follow that link.
*/

function clickLinkEvent(gameId, link) {
    return Event("clickLinkEvent", {gameId: gameId, link: link});
}

function followLinkEvent(gameId, link) {
    return Event("followLinkEvent", {gameId: gameId, link: link});
}

ctx.bthread('Math Umbrella link handling', 'game.mathUmbrella', function (game) {
    while (true) {
        let event = sync({waitFor: [anyEventWithData(clickLinkEvent, {gameId: game.id})]});
        sync({request: [followLinkEvent(game.id, event.data.link)]});
    }
});