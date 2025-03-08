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

function startMovieEvent(gameId) {
    return Event("startMovieEvent", {gameId: gameId});
}

function mouseClickEvent() {
    return Event("mouseClickEvent");
}

function endMovieEvent(gameId) {
    return Event("endMovieEvent", {gameId: gameId});
}

function changeComponentEvent(gameId, component) {
    return Event("changeComponentEvent", {gameId: gameId, component: component});
}

ctx.registerEffect('changeComponentEvent', function (data) {
    let game = ctx.getEntityById(data.gameId);
    game.currentComponent = data.component;
});

ctx.bthread('Play movie on movie component entrance', 'game.movie', function (game) {
    sync({requestOne: [startMovieEvent(game.id)]});
    let event = sync({waitFor: [mouseClickEvent(), endMovieEvent(game.id)]});
    if (event.name === "mouseClickEvent") {
        sync({requestOne: [changeComponentEvent(game.id, 'main menu')]});
    } else {
        sync({requestOne: [changeComponentEvent(game.id, 'main menu')]});
    }
});
/*
The main menu component will wait until the user selects a button. At that time, the user will be forwarded to the Denominators' web page or to one of the following components: game sequence component, math umbrella component, the question updater component. depending on the button selected.
*/
function userSelectsButtonEvent(gameId, selectedComponent) {
    return Event("userSelectsButtonEvent", {gameId: gameId, selectedComponent: selectedComponent});
}

function redirectToWebPageEvent(url) {
    return Event("redirectToWebPageEvent", {url: url});
}

ctx.bthread('Handle main menu selections', 'game.mainMenu', function (game) {
    let event = sync({waitFor: [anyEventWithData(userSelectsButtonEvent, {gameId: game.id})]});
    if (event.data.selectedComponent === 'Denominators web page') {
        sync({requestOne: [redirectToWebPageEvent('http://denominators.example.com')]});
    } else {
        sync({requestOne: [changeComponentEvent(game.id, event.data.selectedComponent)]});
    }
});
/*
The game sequence component will display a question and then wait until the user chooses an answer, starting from the first question.
i) If the user selects the correct answer, a message to this effect will be displayed, and the component will move to the next question. If it is his first attempt he will receive 1 point. 
ii) If the incorrect answer is selected, this component will inform the user of this and give them another chance to answer the question. However, their score will not count this question as being answered correctly.
iii) After the user has completed all questions, they will be directed to the ending scene component.
*/
function displayQuestionEvent(gameId, questionId) {
    return Event("displayQuestionEvent", {gameId: gameId, questionId: questionId});
}

function userSelectsAnswerEvent(gameId, questionId, selectedOptionIndex) {
    return Event("userSelectsAnswerEvent", {gameId: gameId, questionId: questionId, selectedOptionIndex: selectedOptionIndex});
}

function displayCorrectAnswerMessageEvent(gameId) {
    return Event("displayCorrectAnswerMessageEvent", {gameId: gameId});
}

function displayIncorrectAnswerMessageEvent(gameId) {
    return Event("displayIncorrectAnswerMessageEvent", {gameId: gameId});
}

function updateScoreEvent(gameId, increment) {
    return Event("updateScoreEvent", {gameId: gameId, increment: increment});
}

ctx.registerEffect('updateScoreEvent', function (data) {
    let game = ctx.getEntityById(data.gameId);
    game.score += data.increment;
});

ctx.bthread('Game sequence handling', 'game.gameSequence', function (game) {
    for (let i = 0; i < game.questions.length; i++) {
        sync({requestOne: [displayQuestionEvent(game.id, game.questions[i].id)]});
        let firstAttempt = true;
        while (true) {
            let answerEvent = sync({waitFor: [anyEventWithData(userSelectsAnswerEvent, {gameId: game.id, questionId: game.questions[i].id})]});
            if (answerEvent.data.selectedOptionIndex === game.questions[i].rightOptionIndex) {
                sync({requestOne: [displayCorrectAnswerMessageEvent(game.id)]});
                if (firstAttempt) {
                    sync({requestOne: [updateScoreEvent(game.id, 1)]});
                }
                break;
            } else {
                sync({requestOne: [displayIncorrectAnswerMessageEvent(game.id)]});
                firstAttempt = false;
            }
        }
    }
    sync({requestOne: [changeComponentEvent(game.id, 'ending scene')]});
});
/*
The ending scene will wait until the user selects either to return to the main menu or to exit the game. After receiving the user's input, the component will act accordingly.
*/
function userEndsGameEvent(gameId, action) {
    return Event("userEndsGameEvent", {gameId: gameId, action: action});
}

function exitGameEvent(gameId) {
    return Event("exitGameEvent", {gameId: gameId});
}

ctx.bthread('Handle ending scene actions', 'game.endingScene', function (game) {
    let event = sync({waitFor: [anyEventWithData(userEndsGameEvent, {gameId: game.id})]});
    if (event.data.action === 'return to main menu') {
        sync({requestOne: [changeComponentEvent(game.id, 'main menu')]});
    } else if (event.data.action === 'exit game') {
        sync({requestOne: [exitGameEvent(game.id)]});
    }
});
/*
Question Updater component will wait for the user to submit new questions. After the button is clicked, the component will check that 4 options were given and all are different, if they are, it will add the new question.
*/

function userSubmitsQuestionEvent(gameId, description, options, rightOptionIndex) {
    return Event("userSubmitsQuestionEvent", {gameId: gameId, description: description, options: options, rightOptionIndex: rightOptionIndex});
}

function addQuestionEvent(gameId, question) {
    return Event("addQuestionEvent", {gameId: gameId, question: question});
}

ctx.registerEffect('addQuestionEvent', function (data) {
    let game = ctx.getEntityById(data.gameId);
    game.questions.push(data.question);
});

ctx.bthread('Question Updater handling', 'game.questionUpdater', function (game) {
    while (true) {
        let submitEvent = sync({waitFor: [anyEventWithData(userSubmitsQuestionEvent, {gameId: game.id})]});
        if (new Set(submitEvent.data.options).size === 4) { // Check if all options are unique
            let newQuestion = question('q' + (game.questions.length + 1), submitEvent.data.description, submitEvent.data.options, submitEvent.data.rightOptionIndex);
            sync({requestOne: [addQuestionEvent(game.id, newQuestion)]});
        }
    }
});
/*
The Math Umbrella component will wait for a user to click a link, and then follow that link.
*/

function userClicksLinkEvent(gameId, url) {
    return Event("userClicksLinkEvent", {gameId: gameId, url: url});
}

function followLinkEvent(url) {
    return Event("followLinkEvent", {url: url});
}

ctx.bthread('Handle link clicks in Math Umbrella component', 'game.mathUmbrella', function (game) {
    while (true) {
        let clickEvent = sync({waitFor: [anyEventWithData(userClicksLinkEvent, {gameId: game.id})]});
        sync({requestOne: [followLinkEvent(clickEvent.data.url)]});
    }
});


//Edited game seq requirement:
/*
The game sequence component will reset the score to 0. Then it will display a question and then wait until the user chooses an answer, starting from the first question.  
i) If the user selects the correct answer, a message to this effect will be displayed, and the component will move to the next question. If it is his first attempt he will receive 1 point. 
ii) If the incorrect answer is selected, this component will inform the user of this and give them another chance to answer the question. However, their score will not count this question as being answered correctly.
iii) After the user has completed all questions, they will be directed to the ending scene component.
*/
function resetScoreEvent(gameId) {
    return Event("resetScoreEvent", {gameId: gameId});
}

function displayQuestionEvent(gameId, questionId) {
    return Event("displayQuestionEvent", {gameId: gameId, questionId: questionId});
}

function userSelectsAnswerEvent(gameId, questionId, selectedOptionIndex) {
    return Event("userSelectsAnswerEvent", {gameId: gameId, questionId: questionId, selectedOptionIndex: selectedOptionIndex});
}

function displayCorrectAnswerMessageEvent(gameId) {
    return Event("displayCorrectAnswerMessageEvent", {gameId: gameId});
}

function displayIncorrectAnswerMessageEvent(gameId) {
    return Event("displayIncorrectAnswerMessageEvent", {gameId: gameId});
}

function updateScoreEvent(gameId, increment) {
    return Event("updateScoreEvent", {gameId: gameId, increment: increment});
}

ctx.registerEffect('resetScoreEvent', function (data) {
    let game = ctx.getEntityById(data.gameId);
    game.score = 0;
});

ctx.registerEffect('updateScoreEvent', function (data) {
    let game = ctx.getEntityById(data.gameId);
    game.score += data.increment;
});

ctx.bthread('Game sequence logic', 'game.gameSequence', function (game) {
    sync({requestOne: [resetScoreEvent(game.id)]});
    let attempts = new Array(game.questions.length).fill(0);

    for (let i = 0; i < game.questions.length; i++) {
        sync({requestOne: [displayQuestionEvent(game.id, game.questions[i].id)]});
        let answerEvent = sync({waitFor: [anyEventWithData(userSelectsAnswerEvent, {gameId: game.id, questionId: game.questions[i].id})]});
        
        if (answerEvent.data.selectedOptionIndex === game.questions[i].rightOptionIndex) {
            sync({requestOne: [displayCorrectAnswerMessageEvent(game.id)]});
            if (attempts[i] === 0) {
                sync({requestOne: [updateScoreEvent(game.id, 1)]});
            }
            continue;
        } else {
            sync({requestOne: [displayIncorrectAnswerMessageEvent(game.id)]});
            attempts[i]++;
            i--; // Repeat the same question
        }
    }

    sync({requestOne: [changeComponentEvent(game.id, 'ending scene')]});
});