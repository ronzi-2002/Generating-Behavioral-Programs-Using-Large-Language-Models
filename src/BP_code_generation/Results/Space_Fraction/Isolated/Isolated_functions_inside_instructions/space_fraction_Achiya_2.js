//When generating the first behavioral code, we remove the System Update part from the instructions. ANd also remove "    * Notice that you can use previously declared events that are provided in "# Available functions you can use"  at the end of the instructions." from the instructions.


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
ctx.registerQuery('game.questionUpdater', e0tity => entity.type == 'game' && entity.currentComponent == 'question updater');
ctx.registerQuery('game.mathUmbrella', entity => entity.type == 'game' && entity.currentComponent == 'math umbrella');


/*
Upon entrance to the movie component, the introductory movie will begin playing. If a mouse click is received, this component will terminate the movie and forward the user to the main menu component. Otherwise, the movie will continue to its completion and the user will be moved to the main menu.
*/

// Event for starting the movie in the movie component
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

// Event for updating the game component to main menu
function updateComponentToMainMenuEvent(gameId) {
    return Event("updateComponentToMainMenuEvent", {gameId: gameId});
}

ctx.registerEffect('updateComponentToMainMenuEvent', function (data) {
    let game = ctx.getEntityById(data.gameId);
    game.currentComponent = 'main menu';
});

ctx.bthread('Play movie on movie component entrance', 'game.movie', function (game) {
    sync({requestOne: [startMovieEvent(game.id)]});
    let event = sync({waitFor: [mouseClickedEvent(), movieCompletedEvent(game.id)]});
    sync({requestOne: [updateComponentToMainMenuEvent(game.id)]});
});

/*Functions created:
        1. startMovieEvent(gameId) - Event for starting the movie in the movie component
        2. mouseClickedEvent() - Event for mouse click to terminate the movie
        3. movieCompletedEvent(gameId) - Event for completing the movie
        4. updateComponentToMainMenuEvent(gameId) - Event for updating the game component to main menu. has effect:
            ctx.registerEffect('changeComponentEvent', function (data) {
                let game = ctx.getEntityById(data.gameId);
                game.currentComponent = 'main menu';
            });
*/

/*
The main menu component will wait until the user selects a button. At that time, the user will be forwarded to the Denominators' web page or to one of the following components: game sequence component, math umbrella component, the question updater component. depending on the button selected.
*/
// Event for user selecting a button in the main menu
function userSelectsButtonEvent(gameId, selectedComponent) {
    return Event("userSelectsButtonEvent", {gameId: gameId, selectedComponent: selectedComponent});
}

ctx.bthread('Handle main menu selections', 'game.mainMenu', function (game) {
    while (true) {
        let event = sync({waitFor: [userSelectsButtonEvent(game.id)]});
        switch (event.data.selectedComponent) {
            case 'game sequence':
                sync({requestOne: [updateComponentToGameSequenceEvent(game.id)]});
                break;
            case 'math umbrella':
                sync({requestOne: [updateComponentToMathUmbrellaEvent(game.id)]});
                break;
            case 'question updater':
                sync({requestOne: [updateComponentToQuestionUpdaterEvent(game.id)]});
                break;
            case 'denominators web page':
                sync({requestOne: [redirectToDenominatorsWebPageEvent(game.id)]});
                break;
        }
    }
});

// Event for updating the game component to game sequence
function updateComponentToGameSequenceEvent(gameId) {
    return Event("updateComponentToGameSequenceEvent", {gameId: gameId});
}

// Event for updating the game component to math umbrella
function updateComponentToMathUmbrellaEvent(gameId) {
    return Event("updateComponentToMathUmbrellaEvent", {gameId: gameId});
}

// Event for updating the game component to question updater
function updateComponentToQuestionUpdaterEvent(gameId) {
    return Event("updateComponentToQuestionUpdaterEvent", {gameId: gameId});
}

// Event for redirecting to the Denominators web page
function redirectToDenominatorsWebPageEvent(gameId) {
    return Event("redirectToDenominatorsWebPageEvent", {gameId: gameId});
}

ctx.registerEffect('updateComponentToGameSequenceEvent', function (data) {
    let game = ctx.getEntityById(data.gameId);
    game.currentComponent = 'game sequence';
});

ctx.registerEffect('updateComponentToMathUmbrellaEvent', function (data) {
    let game = ctx.getEntityById(data.gameId);
    game.currentComponent = 'math umbrella';
});

ctx.registerEffect('updateComponentToQuestionUpdaterEvent', function (data) {
    let game = ctx.getEntityById(data.gameId);
    game.currentComponent = 'question updater';
});


/*
        1. startMovieEvent(gameId) - Event for starting the movie in the movie component
        2. mouseClickedEvent() - Event for mouse click to terminate the movie
        3. movieCompletedEvent(gameId) - Event for completing the movie
        4. updateComponentToMainMenuEvent(gameId) - Event for updating the game component to main menu. has effect:
            ctx.registerEffect('changeComponentEvent', function (data) {
                let game = ctx.getEntityById(data.gameId);
                game.currentComponent = 'main menu';
            });
        5. userSelectsButtonEvent(gameId, selectedComponent) - Event for user selecting a button in the main menu
        6. updateComponentToGameSequenceEvent(gameId) - Event for updating the game component to game sequence. has effect:
            ctx.registerEffect('updateComponentToGameSequenceEvent', function (data) {
                let game = ctx.getEntityById(data.gameId);
                game.currentComponent = 'game sequence';
            }
        7. updateComponentToMathUmbrellaEvent(gameId) - Event for updating the game component to math umbrella. has effect:
            ctx.registerEffect('updateComponentToMathUmbrellaEvent', function (data) {
                let game = ctx.getEntityById(data.gameId);
                game.currentComponent = 'math umbrella';
            }
        8. updateComponentToQuestionUpdaterEvent(gameId) - Event for updating the game component to question updater. has effect:
            ctx.registerEffect('updateComponentToQuestionUpdaterEvent', function (data) {
                let game = ctx.getEntityById(data.gameId);
                game.currentComponent = 'question updater';
            }
        9. redirectToDenominatorsWebPageEvent(gameId) - Event for redirecting to the Denominators web page
             

*/
/*
The game sequence component will display a question and then wait until the user chooses an answer, starting from the first question.
i) If the user selects the correct answer, a message to this effect will be displayed, and the component will move to the next question. If it is his first attempt he will receive 1 point. 
ii) If the incorrect answer is selected, this component will inform the user of this and give them another chance to answer the question. However, their score will not count this question as being answered correctly.
iii) After the user has completed all questions, they will be directed to the ending scene component.
*/
// Event for user selecting an answer in the game sequence
function userSelectsAnswerEvent(gameId, questionId, selectedOptionIndex) {
    return Event("userSelectsAnswerEvent", {gameId: gameId, questionId: questionId, selectedOptionIndex: selectedOptionIndex});
}

// Event for displaying a message about the user's answer correctness
function displayAnswerMessageEvent(message) {
    return Event("displayAnswerMessageEvent", {message: message});
}

// Event for updating the game score
function updateGameScoreEvent(gameId, newScore) {
    return Event("updateGameScoreEvent", {gameId: gameId, newScore: newScore});
}

ctx.registerEffect('updateGameScoreEvent', function (data) {
    let game = ctx.getEntityById(data.gameId);
    game.score = data.newScore;
});

ctx.bthread('Game sequence component behavior', 'game.gameSequence', function (game) {
    let currentQuestionIndex = 0;
    let attempts = 0;

    while (currentQuestionIndex < game.questions.length) {
        let currentQuestion = game.questions[currentQuestionIndex];
        sync({requestOne: [displayQuestionEvent(game.id, currentQuestion.id)]});

        let answerEvent = sync({waitFor: [anyEventWithData(userSelectsAnswerEvent, {gameId: game.id, questionId: currentQuestion.id})]});
        if (answerEvent.data.selectedOptionIndex === currentQuestion.rightOptionIndex) {
            if (attempts === 0) {
                sync({requestOne: [updateGameScoreEvent(game.id, game.score + 1)]});
            }
            sync({requestOne: [displayAnswerMessageEvent("Correct answer!")]});
            currentQuestionIndex++;
            attempts = 0; // Reset attempts for the next question
        } else {
            sync({requestOne: [displayAnswerMessageEvent("Incorrect answer, try again.")]});
            attempts++;
        }
    }

    sync({requestOne: [changeComponentEvent(game.id, 'ending scene')]});
});

// Event for displaying a question
function displayQuestionEvent(gameId, questionId) {
    return Event("displayQuestionEvent", {gameId: gameId, questionId: questionId});
}

/*
        1. function startMovieEvent(gameId) - Event for starting the movie in the game
        2. function mouseClickedEvent() - Event for mouse click to terminate the movie
        3. function movieCompletedEvent(gameId) - Event for completing the movie
        4. function changeComponentEvent(gameId, component) - Event for changing the game component. has effect:
            ctx.registerEffect('changeComponentEvent', function (data) {
                let game = ctx.getEntityById(data.gameId);
                game.currentComponent = data.component;
            });
        5. function mainMenuSelectionEvent(gameId, selectedComponent) - Event for user selecting a button in the main menu
        6. function redirectToDenominatorsWebPageEvent() - Event for redirecting to the Denominators' web page
        7. function userSelectsAnswerEvent(gameId, questionId, selectedOptionIndex) - Event for user selecting an answer in the game sequence
        8. function displayAnswerMessageEvent(message) - Event for displaying a message about the user's answer correctness
        9. function updateGameScoreEvent(gameId, newScore) - Event for updating the game score. has effect:
            ctx.registerEffect('updateGameScoreEvent', function (data) {
                let game = ctx.getEntityById(data.gameId);
                game.score = data.newScore;
            });
        10. function displayQuestionEvent(gameId, questionId) - Event for displaying a question
*/


    
/*
The ending scene will wait until the user selects either to return to the main menu or to exit the game. After receiving the user's input, the component will act accordingly.
*/
// Event for user selecting to return to the main menu from the ending scene
function returnToMainMenuEvent(gameId) {
    return Event("returnToMainMenuEvent", {gameId: gameId});
}

// Event for user selecting to exit the game from the ending scene
function exitGameEvent(gameId) {
    return Event("exitGameEvent", {gameId: gameId});
}

ctx.bthread('Handle user selection in the ending scene', 'game.endingScene', function (game) {
    while (true) {
        let event = sync({waitFor: [returnToMainMenuEvent(game.id), exitGameEvent(game.id)]});
        if (event.name === "returnToMainMenuEvent") {
            sync({requestOne: [changeComponentEvent(game.id, 'main menu')]});
        } else if (event.name === "exitGameEvent") {
            // Assuming there's an event to handle game exit
            sync({requestOne: [redirectToDenominatorsWebPageEvent()]});
        }
    }
});
//! Problem here, it redirects to the Denominators' web page, but it should exit the game. The event should be created and used in the code.
/*
        1. function startMovieEvent(gameId) - Event for starting the movie in the game
        2. function mouseClickedEvent() - Event for mouse click to terminate the movie
        3. function movieCompletedEvent(gameId) - Event for completing the movie
        4. function changeComponentEvent(gameId, component) - Event for changing the game component. has effect:
            ctx.registerEffect('changeComponentEvent', function (data) {
                let game = ctx.getEntityById(data.gameId);
                game.currentComponent = data.component;
            });
        5. function mainMenuSelectionEvent(gameId, selectedComponent) - Event for user selecting a button in the main menu
        6. function redirectToDenominatorsWebPageEvent() - Event for redirecting to the Denominators' web page
        7. function userSelectsAnswerEvent(gameId, questionId, selectedOptionIndex) - Event for user selecting an answer in the game sequence
        8. function displayAnswerMessageEvent(message) - Event for displaying a message about the user's answer correctness
        9. function updateGameScoreEvent(gameId, newScore) - Event for updating the game score. has effect:
            ctx.registerEffect('updateGameScoreEvent', function (data) {
                let game = ctx.getEntityById(data.gameId);
                game.score = data.newScore;
            });
        10. function displayQuestionEvent(gameId, questionId) - Event for displaying a question
*/
/*
Question Updater component will wait for the user to submit new questions. After the button is clicked, the component will check that 4 options were given and all are different, if they are, it will add the new question.
*/



/*
The Math Umbrella component will wait for a user to click a link, and then follow that link.
*/




//Edited game seq requirement:
/*
The game sequence component will reset the score to 0. Then it will display a question and then wait until the user chooses an answer, starting from the first question.  
i) If the user selects the correct answer, a message to this effect will be displayed, and the component will move to the next question. If it is his first attempt he will receive 1 point. 
ii) If the incorrect answer is selected, this component will inform the user of this and give them another chance to answer the question. However, their score will not count this question as being answered correctly.
iii) After the user has completed all questions, they will be directed to the ending scene component.
*/
