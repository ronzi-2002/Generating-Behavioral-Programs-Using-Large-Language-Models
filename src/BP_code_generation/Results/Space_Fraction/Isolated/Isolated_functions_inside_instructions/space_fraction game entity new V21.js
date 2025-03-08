//When generating the first behavioral code, we remove the next from the instructions:
/*
   - You can use the next events without declaring them: 
       *When not knowing the parameter value, use `anyEventWithData` function, don't use `any` as a parameter value(for example anyEventWithData(tapButtonPressedEvent)).
*/


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

// Event for starting the movie
function startMovieEvent(gameId) {
    return Event("startMovieEvent", {gameId: gameId});
}

// Event for mouse click to terminate the movie
function mouseClickedEvent() {
    return Event("mouseClickedEvent");
}

// Event for completing the movie
function movieCompletedEvent(gameId) {
    return Event("movieCompletedEvent", {gameId: gameId});
}

// Event for changing the game component
function changeGameComponentEvent(gameId, component) {
    return Event("changeGameComponentEvent", {gameId: gameId, component: component});
}

ctx.registerEffect('changeGameComponentEvent', function (data) {
    let game = ctx.getEntityById(data.gameId);
    game.currentComponent = data.component;
});

ctx.bthread('Play movie on game movie component', 'game.movie', function (game) {
    sync({requestOne: [startMovieEvent(game.id)]});
    let event = sync({waitFor: [mouseClickedEvent(), movieCompletedEvent(game.id)]});
    if (event.name === "mouseClickedEvent") {
        sync({requestOne: [changeGameComponentEvent(game.id, 'main menu')]});
    } else if (event.name === "movieCompletedEvent") {
        sync({requestOne: [changeGameComponentEvent(game.id, 'main menu')]});
    }
});

/*Functions created:
        1. function startMovieEvent(gameId) - Event for starting the movie
        2. function mouseClickedEvent() - Event for mouse click to terminate the movie
        3. function movieCompletedEvent(gameId) - Event for completing the movie
        4. function changeGameComponentEvent(gameId, component) - Event for changing the game component. has effect:
            ctx.registerEffect('changeGameComponentEvent', function (data) {
                let game = ctx.getEntityById(data.gameId);
                game.currentComponent = data.component;
            });
*/

/*
The main menu component will wait until the user selects a button. At that time, the user will be forwarded to the Denominators' web page or to one of the following components: game sequence component, math umbrella component, the question updater component. depending on the button selected.
*/
// Event for user selecting a button to navigate to a different component or external link
function userSelectsButtonEvent(gameId, component) {
    return Event("userSelectsButtonEvent", {gameId: gameId, component: component})
}

ctx.bthread('Handle main menu navigation', 'game.mainMenu', function (game) {
    while (true) {
        let event = sync({waitFor: [anyEventWithData(userSelectsButtonEvent, {gameId: game.id})]});
        if (event.data.component === 'DenominatorsWebPage') {
            sync({requestOne: [openDenominatorsWebPageEvent()]});
        } else {
            sync({requestOne: [changeGameComponentEvent(game.id, event.data.component)]});
        }
    }
});

// Event for opening the Denominators' web page
function openDenominatorsWebPageEvent() {
    return Event("openDenominatorsWebPageEvent");
}

/*
        1. function startMovieEvent(gameId) - Event for starting the movie
        2. function mouseClickedEvent() - Event for mouse click to terminate the movie
        3. function movieCompletedEvent(gameId) - Event for completing the movie
        4. function changeGameComponentEvent(gameId, component) - Event for changing the game component. has effect:
            ctx.registerEffect('changeGameComponentEvent', function (data) {
                let game = ctx.getEntityById(data.gameId);
                game.currentComponent = data.component;
            });
        5. function userSelectsButtonEvent(gameId, component) - Event for user selecting a button to navigate to a different component or external link
        6. function openDenominatorsWebPageEvent() - Event for opening the Denominators' web page
*/
/*
The game sequence component will display a question and then wait until the user chooses an answer, starting from the first question.
i) If the user selects the correct answer, a message to this effect will be displayed, and the component will move to the next question. If it is his first attempt he will receive 1 point. 
ii) If the incorrect answer is selected, this component will inform the user of this and give them another chance to answer the question. However, their score will not count this question as being answered correctly.
iii) After the user has completed all questions, they will be directed to the ending scene component.
*/
// Event for displaying a question
function displayQuestionEvent(gameId, questionId) {
    return Event("displayQuestionEvent", {gameId: gameId, questionId: questionId});
}

// Event for user selecting an answer
function userSelectsAnswerEvent(gameId, questionId, selectedOptionIndex) {
    return Event("userSelectsAnswerEvent", {gameId: gameId, questionId: questionId, selectedOptionIndex: selectedOptionIndex});
}

// Event for displaying correct answer message
function displayCorrectAnswerMessageEvent(gameId) {
    return Event("displayCorrectAnswerMessageEvent", {gameId: gameId});
}

// Event for displaying incorrect answer message
function displayIncorrectAnswerMessageEvent(gameId) {
    return Event("displayIncorrectAnswerMessageEvent", {gameId: gameId});
}

// Event for updating the score
function updateScoreEvent(gameId, newScore) {
    return Event("updateScoreEvent", {gameId: gameId, newScore: newScore});
}

ctx.registerEffect('updateScoreEvent', function (data) {
    let game = ctx.getEntityById(data.gameId);
    game.score = data.newScore;
});

ctx.bthread('Game sequence component behavior', 'game.gameSequence', function (game) {
    let currentQuestionIndex = 0;
    let attempts = 0;

    while (currentQuestionIndex < game.questions.length) {
        sync({requestOne: [displayQuestionEvent(game.id, game.questions[currentQuestionIndex].id)]});
        let answerEvent = sync({waitFor: [anyEventWithData(userSelectsAnswerEvent, {gameId: game.id, questionId: game.questions[currentQuestionIndex].id})]});
        
        if (answerEvent.data.selectedOptionIndex === game.questions[currentQuestionIndex].rightOptionIndex) {
            sync({requestOne: [displayCorrectAnswerMessageEvent(game.id)]});
            if (attempts === 0) {
                sync({requestOne: [updateScoreEvent(game.id, game.score + 1)]});
            }
            currentQuestionIndex++;
            attempts = 0; // Reset attempts for the next question
        } else {
            sync({requestOne: [displayIncorrectAnswerMessageEvent(game.id)]});
            attempts++;
        }
    }

    sync({requestOne: [changeGameComponentEvent(game.id, 'ending scene')]});
});

/*
        1. function startMovieEvent(gameId) - Event for starting the movie
        2. function mouseClickedEvent() - Event for mouse click to terminate the movie
        3. function movieCompletedEvent(gameId) - Event for completing the movie
        4. function changeGameComponentEvent(gameId, component) - Event for changing the game component. has effect:
            ctx.registerEffect('changeGameComponentEvent', function (data) {
                let game = ctx.getEntityById(data.gameId);
                game.currentComponent = data.component;
            });
        5. function userSelectsButtonEvent(gameId, component) - Event for user selecting a button to navigate to a different component or external link
        6. function openDenominatorsWebPageEvent() - Event for opening the Denominators' web page
        7. function displayQuestionEvent(gameId, questionId) - Event for displaying a question
        8. function userSelectsAnswerEvent(gameId, questionId, selectedOptionIndex) - Event for user selecting an answer
        9. function displayCorrectAnswerMessageEvent(gameId) - Event for displaying correct answer message
        10. function displayIncorrectAnswerMessageEvent(gameId) - Event for displaying incorrect answer message
        11. function updateScoreEvent(gameId, newScore) - Event for updating the score. has effect:
            ctx.registerEffect('updateScoreEvent', function (data) {
                let game = ctx.getEntityById(data.gameId);
                game.score = data.newScore;
            });
*/


    
/*
The ending scene will wait until the user selects either to return to the main menu or to exit the game. After receiving the user's input, the component will act accordingly.
*/
// Event for user selecting to return to the main menu
function userSelectsReturnToMainMenuEvent(gameId) {
    return Event("userSelectsReturnToMainMenuEvent", {gameId: gameId});
}

// Event for user selecting to exit the game
function userSelectsExitGameEvent(gameId) {
    return Event("userSelectsExitGameEvent", {gameId: gameId});
}

ctx.bthread('Handle user input in the ending scene', 'game.endingScene', function (game) {
    let event = sync({waitFor: [userSelectsReturnToMainMenuEvent(game.id), userSelectsExitGameEvent(game.id)]});
    if (event.name === "userSelectsReturnToMainMenuEvent") {
        sync({requestOne: [changeGameComponentEvent(game.id, 'main menu')]});
    } else if (event.name === "userSelectsExitGameEvent") {
        // Assuming there's an event to handle game exit
        sync({requestOne: [exitGameEvent(game.id)]});
    }
});

// Event for exiting the game
function exitGameEvent(gameId) {
    return Event("exitGameEvent", {gameId: gameId});
}

/*
        1. function startMovieEvent(gameId) - Event for starting the movie
        2. function mouseClickedEvent() - Event for mouse click to terminate the movie
        3. function movieCompletedEvent(gameId) - Event for completing the movie
        4. function changeGameComponentEvent(gameId, component) - Event for changing the game component. has effect:
            ctx.registerEffect('changeGameComponentEvent', function (data) {
                let game = ctx.getEntityById(data.gameId);
                game.currentComponent = data.component;
            });
        5. function userSelectsButtonEvent(gameId, component) - Event for user selecting a button to navigate to a different component or external link
        6. function openDenominatorsWebPageEvent() - Event for opening the Denominators' web page
        7. function displayQuestionEvent(gameId, questionId) - Event for displaying a question
        8. function userSelectsAnswerEvent(gameId, questionId, selectedOptionIndex) - Event for user selecting an answer
        9. function displayCorrectAnswerMessageEvent(gameId) - Event for displaying correct answer message
        10. function displayIncorrectAnswerMessageEvent(gameId) - Event for displaying incorrect answer message
        11. function updateScoreEvent(gameId, newScore) - Event for updating the score. has effect:
            ctx.registerEffect('updateScoreEvent', function (data) {
                let game = ctx.getEntityById(data.gameId);
                game.score = data.newScore;
            });
        12. function userSelectsReturnToMainMenuEvent(gameId) - Event for user selecting to return to the main menu
        13. function userSelectsExitGameEvent(gameId) - Event for user selecting to exit the game
        14. function exitGameEvent(gameId) - Event for exiting the game
*/
/*
Question Updater component will wait for the user to submit new questions. After the button is clicked, the component will check that 4 options were given and all are different, if they are, it will add the new question.
*/

// Event for submitting new question details
function submitNewQuestionEvent(gameId, description, options, rightOptionIndex) {
    return Event("submitNewQuestionEvent", {gameId: gameId, description: description, options: options, rightOptionIndex: rightOptionIndex});
}

// Event for adding a new question to the game
function addNewQuestionEvent(gameId, question) {
    return Event("addNewQuestionEvent", {gameId: gameId, question: question});
}

ctx.registerEffect('addNewQuestionEvent', function (data) {
    let game = ctx.getEntityById(data.gameId);
    game.questions.push(data.question);
});

ctx.bthread('Question Updater - Wait for new question submission and validate', 'game.questionUpdater', function (game) {
    while (true) {
        let submission = sync({waitFor: [submitNewQuestionEvent(game.id)]});
        let {description, options, rightOptionIndex} = submission.data;
        if (options.length === 4 && new Set(options).size === 4) { // Check if all options are provided and are unique
            let newQuestion = question('q' + (game.questions.length + 1), description, options, rightOptionIndex);
            sync({requestOne: [addNewQuestionEvent(game.id, newQuestion)]});
        }
    }
});
/*
        1. function startMovieEvent(gameId) - Event for starting the movie
        2. function mouseClickedEvent() - Event for mouse click to terminate the movie
        3. function movieCompletedEvent(gameId) - Event for completing the movie
        4. function changeGameComponentEvent(gameId, component) - Event for changing the game component. has effect:
            ctx.registerEffect('changeGameComponentEvent', function (data) {
                let game = ctx.getEntityById(data.gameId);
                game.currentComponent = data.component;
            });
        5. function userSelectsButtonEvent(gameId, component) - Event for user selecting a button to navigate to a different component or external link
        6. function openDenominatorsWebPageEvent() - Event for opening the Denominators' web page
        7. function displayQuestionEvent(gameId, questionId) - Event for displaying a question
        8. function userSelectsAnswerEvent(gameId, questionId, selectedOptionIndex) - Event for user selecting an answer
        9. function displayCorrectAnswerMessageEvent(gameId) - Event for displaying correct answer message
        10. function displayIncorrectAnswerMessageEvent(gameId) - Event for displaying incorrect answer message
        11. function updateScoreEvent(gameId, newScore) - Event for updating the score. has effect:
            ctx.registerEffect('updateScoreEvent', function (data) {
                let game = ctx.getEntityById(data.gameId);
                game.score = data.newScore;
            });
        12. function userSelectsReturnToMainMenuEvent(gameId) - Event for user selecting to return to the main menu
        13. function userSelectsExitGameEvent(gameId) - Event for user selecting to exit the game
        14. function exitGameEvent(gameId) - Event for exiting the game
        15. function submitNewQuestionEvent(gameId, description, options, rightOptionIndex) - Event for submitting new question details
        16. function addNewQuestionEvent(gameId, question) - Event for adding a new question to the game. has effect:
            ctx.registerEffect('addNewQuestionEvent', function (data) {
                let game = ctx.getEntityById(data.gameId);
                game.questions.push(data.question);
            });
        

*/
/*
The Math Umbrella component will wait for a user to click a link, and then follow that link.
*/

// Event for user clicking a link in the Math Umbrella component
function userClicksLinkInMathUmbrellaEvent(gameId, linkUrl) {
    return Event("userClicksLinkInMathUmbrellaEvent", {gameId: gameId, linkUrl: linkUrl});
}

// Event for following a link in the Math Umbrella component
function followLinkInMathUmbrellaEvent(linkUrl) {
    return Event("followLinkInMathUmbrellaEvent", {linkUrl: linkUrl});
}

ctx.bthread('Follow link when user clicks in Math Umbrella', 'game.mathUmbrella', function (game) {
    while (true) {
        let event = sync({waitFor: [anyEventWithData(userClicksLinkInMathUmbrellaEvent, {gameId: game.id})]});
        sync({requestOne: [followLinkInMathUmbrellaEvent(event.data.linkUrl)]});
    }
});


//Required adding "* Use this technique for any external actions." to the instructions, above "In some cases you be asked to show the details of an entity. In such caseyou must declare two different events."



//Edited game seq requirement:
/*
The game sequence component will reset the score to 0. Then it will display a question and then wait until the user chooses an answer, starting from the first question.  
i) If the user selects the correct answer, a message to this effect will be displayed, and the component will move to the next question. If it is his first attempt he will receive 1 point. 
ii) If the incorrect answer is selected, this component will inform the user of this and give them another chance to answer the question. However, their score will not count this question as being answered correctly.
iii) After the user has completed all questions, they will be directed to the ending scene component.
*/
// Event for resetting the game score
function resetScoreEvent(gameId) {
    return Event("resetScoreEvent", {gameId: gameId});
}

ctx.registerEffect('resetScoreEvent', function (data) {
    let game = ctx.getEntityById(data.gameId);
    game.score = 0;
});

// Event for displaying a question
function displayQuestionEvent(gameId, questionId) {
    return Event("displayQuestionEvent", {gameId: gameId, questionId: questionId});
}

// Event for user selecting an answer
function userSelectsAnswerEvent(gameId, questionId, selectedOptionIndex) {
    return Event("userSelectsAnswerEvent", {gameId: gameId, questionId: questionId, selectedOptionIndex: selectedOptionIndex});
}

// Event for displaying correct answer message
function displayCorrectAnswerMessageEvent(gameId) {
    return Event("displayCorrectAnswerMessageEvent", {gameId: gameId});
}

// Event for displaying incorrect answer message
function displayIncorrectAnswerMessageEvent(gameId) {
    return Event("displayIncorrectAnswerMessageEvent", {gameId: gameId});
}

// Event for updating the score
function updateScoreEvent(gameId) {
    return Event("updateScoreEvent", {gameId: gameId});
}

ctx.registerEffect('updateScoreEvent', function (data) {
    let game = ctx.getEntityById(data.gameId);
    game.score += 1;
});

// Event for moving to the next question
function moveToNextQuestionEvent(gameId) {
    return Event("moveToNextQuestionEvent", {gameId: gameId});
}

// Event for moving to the ending scene
function moveToEndingSceneEvent(gameId) {
    return Event("moveToEndingSceneEvent", {gameId: gameId});
}

ctx.registerEffect('moveToEndingSceneEvent', function (data) {
    let game = ctx.getEntityById(data.gameId);
    game.currentComponent = 'ending scene';
});

ctx.bthread('Game sequence component behavior', 'game.gameSequence', function (game) {
    sync({requestOne: [resetScoreEvent(game.id)]});
    let currentQuestionIndex = 0;
    let firstAttempt = true;

    while (currentQuestionIndex < game.questions.length) {
        sync({requestOne: [displayQuestionEvent(game.id, game.questions[currentQuestionIndex].id)]});
        let answerEvent = sync({waitFor: [anyEventWithData(userSelectsAnswerEvent, {gameId: game.id, questionId: game.questions[currentQuestionIndex].id})]});
        
        if (answerEvent.data.selectedOptionIndex === game.questions[currentQuestionIndex].rightOptionIndex) {
            sync({requestOne: [displayCorrectAnswerMessageEvent(game.id)]});
            if (firstAttempt) {
                sync({requestOne: [updateScoreEvent(game.id)]});
            }
            currentQuestionIndex++;
            firstAttempt = true;
            if (currentQuestionIndex < game.questions.length) {
                sync({requestOne: [moveToNextQuestionEvent(game.id)]});
            } else {
                sync({requestOne: [moveToEndingSceneEvent(game.id)]});
            }
        } else {
            sync({requestOne: [displayIncorrectAnswerMessageEvent(game.id)]});
            firstAttempt = false;
        }
    }
});