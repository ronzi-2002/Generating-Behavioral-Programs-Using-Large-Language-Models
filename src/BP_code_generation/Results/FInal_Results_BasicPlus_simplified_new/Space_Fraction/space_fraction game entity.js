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

function startMovieEvent() {
    return Event("startMovieEvent");
}

function endMovieEvent() {
    return Event("endMovieEvent");
}

function mouseClickedEvent() {
    return Event("mouseClickedEvent");
}

function updateComponentEvent(gameId, component) {
    return Event("updateComponentEvent", {gameId: gameId, component: component});
}

ctx.registerEffect('updateComponentEvent', function (data) {
    let game = ctx.getEntityById(data.gameId);
    game.currentComponent = data.component;
});

ctx.bthread('Play movie on game movie component', 'game.movie', function (game) {
    sync({request: [startMovieEvent()]});
    let event = sync({waitFor: [endMovieEvent(), mouseClickedEvent()]});
    if (event.name === 'mouseClickedEvent') {
        sync({request: [updateComponentEvent(game.id, 'main menu')]});
    } else {
        sync({request: [updateComponentEvent(game.id, 'main menu')]});
    }
});


/*
The main menu component will wait until the user selects a button. At that time, the user will be forwarded to one of the following: game sequence component, math umbrella component, the question updater component or the Denominators' web page depending on the button selected 
*/
function buttonSelectedEvent(buttonId) {
    return Event("buttonSelectedEvent", {buttonId: buttonId});
}

ctx.bthread('Handle main menu selections', 'game.mainMenu', function (game) {
    let event = sync({waitFor: [anyEventWithData(buttonSelectedEvent)]});
    switch (event.data.buttonId) {
        case 'gameSequence':
            sync({request: [updateComponentEvent(game.id, 'game sequence')]});
            break;
        case 'mathUmbrella':
            sync({request: [updateComponentEvent(game.id, 'math umbrella')]});
            break;
        case 'questionUpdater':
            sync({request: [updateComponentEvent(game.id, 'question updater')]});
            break;
        case 'denominatorsWeb':
            // Assuming there's an event to handle external navigation
            sync({request: [navigateToDenominatorsWebEvent()]});
            break;
    }
});

function navigateToDenominatorsWebEvent() {
    return Event("navigateToDenominatorsWebEvent");
}
/*
The game sequence component will display a question and then wait until the user chooses an answer, starting from the first question.
i) If the user selects the correct answer, a message to this effect will be displayed, and the component will move to the next question. If it is his first attempt he will receive 1 point. 
ii) If the incorrect answer is selected, this component will inform the user of this and give them another chance to answer the question. However, their score will not count this question as being answered correctly.
iii) After the user has completed all questions, they will be directed to the ending scene component.
*/
function displayQuestionEvent(questionId) {
    return Event("displayQuestionEvent", {questionId: questionId});
}

function answerSelectedEvent(questionId, selectedOptionIndex) {
    return Event("answerSelectedEvent", {questionId: questionId, selectedOptionIndex: selectedOptionIndex});
}

function displayMessageEvent(message) {
    return Event("displayMessageEvent", {message: message});
}

function updateScoreEvent(gameId, score) {
    return Event("updateScoreEvent", {gameId: gameId, score: score});
}

ctx.registerEffect('updateScoreEvent', function (data) {
    let game = ctx.getEntityById(data.gameId);
    game.score = data.score;
});

ctx.bthread('Game sequence logic', 'game.gameSequence', function (game) {
    let currentQuestionIndex = 0;
    let attempts = 0;

    while (currentQuestionIndex < game.questions.length) {
        let currentQuestion = game.questions[currentQuestionIndex];
        sync({request: [displayQuestionEvent(currentQuestion.id)]});
        let event = sync({waitFor: [anyEventWithData(answerSelectedEvent, {questionId: currentQuestion.id})]});

        if (event.data.selectedOptionIndex === currentQuestion.rightOptionIndex) {
            sync({request: [displayMessageEvent("Correct answer!")]});
            if (attempts === 0) { // First attempt
                sync({request: [updateScoreEvent(game.id, game.score + 1)]});
            }
            currentQuestionIndex++;
            attempts = 0; // Reset attempts for next question
        } else {
            sync({request: [displayMessageEvent("Incorrect answer, try again.")]});
            attempts++;
        }
    }

    sync({request: [updateComponentEvent(game.id, 'ending scene')]});
});
/*
The ending scene will wait until the user selects either to return to the main menu or to exit the game. After receiving the user's input, the component will act accordingly.
*/
function endingSceneSelectionEvent(selection) {
    return Event("endingSceneSelectionEvent", {selection: selection});
}

ctx.bthread('Handle ending scene selections', 'game.endingScene', function (game) {
    let event = sync({waitFor: [anyEventWithData(endingSceneSelectionEvent)]});
    if (event.data.selection === 'mainMenu') {
        sync({request: [updateComponentEvent(game.id, 'main menu')]});
    } else if (event.data.selection === 'exitGame') {
        sync({request: [exitGameEvent()]});
    }
});

function exitGameEvent() {
    return Event("exitGameEvent");
}

/*
Question Updater component will wait for the user to submit new questions. After the button is clicked, the component will check that 4 options were given and all are different, if they are, it will add the new question.
*/

function submitQuestionEvent(questionId, description, options, rightOptionIndex) {
    return Event("submitQuestionEvent", {questionId: questionId, description: description, options: options, rightOptionIndex: rightOptionIndex});
}

function addQuestionEvent(gameId, question) {
    return Event("addQuestionEvent", {gameId: gameId, question: question});
}

ctx.registerEffect('addQuestionEvent', function (data) {
    let game = ctx.getEntityById(data.gameId);
    game.questions.push(data.question);
});

ctx.bthread('Question Updater logic', 'game.questionUpdater', function (game) {
    while (true) {
        let event = sync({waitFor: [anyEventWithData(submitQuestionEvent)]});
        if (event.data.options.length === 4 && new Set(event.data.options).size === 4) { // Check if all options are different
            let newQuestion = question(event.data.questionId, event.data.description, event.data.options, event.data.rightOptionIndex);
            sync({request: [addQuestionEvent(game.id, newQuestion)]});
        } else {
            sync({request: [displayMessageEvent("Error: Ensure all four options are different and provided.")]});
        }
    }
});

/*
The Math Umbrella component will wait for a user to click a link, and then follow that link.
*/

function linkClickedEvent(linkUrl) {
    return Event("linkClickedEvent", {linkUrl: linkUrl});
}

function followLinkEvent(linkUrl) {
    return Event("followLinkEvent", {linkUrl: linkUrl});
}

ctx.bthread('Handle Math Umbrella link clicks', 'game.mathUmbrella', function (game) {
    while (true) {
        let event = sync({waitFor: [anyEventWithData(linkClickedEvent)]});
        sync({request: [followLinkEvent(event.data.linkUrl)]});
    }
});


//Edited first requirement:
/*
The game sequence component will display a question and then wait until the user chooses an answer, starting from the first question. Before displaying the first question, the component will reset the score to 0. 
i) If the user selects the correct answer, a message to this effect will be displayed, and the component will move to the next question. If it is his first attempt he will receive 1 point. 
ii) If the incorrect answer is selected, this component will inform the user of this and give them another chance to answer the question. However, their score will not count this question as being answered correctly.
iii) After the user has completed all questions, they will be directed to the ending scene component.
*/