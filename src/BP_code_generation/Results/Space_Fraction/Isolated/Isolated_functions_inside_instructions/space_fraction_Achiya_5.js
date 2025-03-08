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

ctx.bthread('Play introductory movie', 'game.movie', function (game) {
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
        if (event.data.selectedComponent === 'DenominatorsWebPage') {
            sync({requestOne: [redirectToDenominatorsWebPageEvent()]});
        } else {
            sync({requestOne: [changeGameComponentEvent(game.id, event.data.selectedComponent)]});
        }
    }
});

// Event for redirecting to the Denominators' web page
function redirectToDenominatorsWebPageEvent() {
    return Event("redirectToDenominatorsWebPageEvent");
}
/*
        1. startMovieEvent(gameId) - Event for starting the movie in the movie component
        2. mouseClickedEvent() - Event for mouse click to terminate the movie
        3. movieCompletedEvent(gameId) - Event for completing the movie
        4. changeGameComponentEvent(gameId) - Event for changing the game component. has effect:
            ctx.registerEffect('changeComponentEvent', function (data) {
                let game = ctx.getEntityById(data.gameId);
                game.currentComponent = data.newComponent;
            });
        5. userSelectsButtonEvent(gameId, selectedComponent) - Event for user selecting a button in the main menu
        6. redirectToDenominatorsWebPageEvent() - Event for redirecting to the Denominators' web page
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

// Event for displaying a message about the correct answer
function displayCorrectAnswerMessageEvent(gameId) {
    return Event("displayCorrectAnswerMessageEvent", {gameId: gameId});
}

// Event for displaying a message about the incorrect answer
function displayIncorrectAnswerMessageEvent(gameId) {
    return Event("displayIncorrectAnswerMessageEvent", {gameId: gameId});
}

// Event for updating the game component to the ending scene
function updateComponentToEndingSceneEvent(gameId) {
    return Event("updateComponentToEndingSceneEvent", {gameId: gameId});
}

ctx.registerEffect('updateComponentToEndingSceneEvent', function (data) {
    let game = ctx.getEntityById(data.gameId);
    game.currentComponent = 'ending scene';
});

ctx.bthread('Handle game sequence component', 'game.gameSequence', function (game) {
    let currentQuestionIndex = 0;
    let attempts = 0;

    while (currentQuestionIndex < game.questions.length) {
        let question = game.questions[currentQuestionIndex];
        sync({requestOne: [displayQuestionEvent(game.id, question.id)]});
        let answerEvent = sync({waitFor: [anyEventWithData(userSelectsAnswerEvent, {gameId: game.id, questionId: question.id})]});
        
        if (answerEvent.data.selectedOptionIndex === question.rightOptionIndex) {
            sync({requestOne: [displayCorrectAnswerMessageEvent(game.id)]});
            if (attempts === 0) {
                game.score += 1;
            }
            currentQuestionIndex++;
            attempts = 0; // Reset attempts for the next question
        } else {
            sync({requestOne: [displayIncorrectAnswerMessageEvent(game.id)]});
            attempts++;
        }
    }

    sync({requestOne: [updateComponentToEndingSceneEvent(game.id)]});
});

// Event for displaying a question
function displayQuestionEvent(gameId, questionId) {
    return Event("displayQuestionEvent", {gameId: gameId, questionId: questionId});
}

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
        10. userSelectsAnswerEvent(gameId, questionId, selectedOptionIndex) - Event for user selecting an answer in the game sequence
        11. displayCorrectAnswerMessageEvent(gameId) - Event for displaying a message about the correct answer
        12. displayIncorrectAnswerMessageEvent(gameId) - Event for displaying a message about the incorrect answer
        13. updateComponentToEndingSceneEvent(gameId) - Event for updating the game component to the ending scene. has effect:
            ctx.registerEffect('updateComponentToEndingSceneEvent', function (data) {
                let game = ctx.getEntityById(data.gameId);
                game.currentComponent = 'ending scene';
            }
        14. displayQuestionEvent(gameId, questionId) - Event for displaying a question

*/


    
/*
The ending scene will wait until the user selects either to return to the main menu or to exit the game. After receiving the user's input, the component will act accordingly.
*/
// Event for user selecting to return to the main menu from the ending scene
function userSelectsReturnToMainMenuEvent(gameId) {
    return Event("userSelectsReturnToMainMenuEvent", {gameId: gameId});
}

// Event for user selecting to exit the game from the ending scene
function userSelectsExitGameEvent(gameId) {
    return Event("userSelectsExitGameEvent", {gameId: gameId});
}

ctx.bthread('Handle user input in the ending scene', 'game.endingScene', function (game) {
    while (true) {
        let event = sync({waitFor: [userSelectsReturnToMainMenuEvent(game.id), userSelectsExitGameEvent(game.id)]});
        if (event.name === "userSelectsReturnToMainMenuEvent") {
            sync({requestOne: [updateComponentToMainMenuEvent(game.id)]});
        } else if (event.name === "userSelectsExitGameEvent") {
            // Assuming an event to handle game exit
            sync({requestOne: [exitGameEvent(game.id)]});
        }
    }
});

// Event for exiting the game
function exitGameEvent(gameId) {
    return Event("exitGameEvent", {gameId: gameId});
}
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
        10. userSelectsAnswerEvent(gameId, questionId, selectedOptionIndex) - Event for user selecting an answer in the game sequence
        11. displayCorrectAnswerMessageEvent(gameId) - Event for displaying a message about the correct answer
        12. displayIncorrectAnswerMessageEvent(gameId) - Event for displaying a message about the incorrect answer
        13. updateComponentToEndingSceneEvent(gameId) - Event for updating the game component to the ending scene. has effect:
            ctx.registerEffect('updateComponentToEndingSceneEvent', function (data) {
                let game = ctx.getEntityById(data.gameId);
                game.currentComponent = 'ending scene';
            }
        14. displayQuestionEvent(gameId, questionId) - Event for displaying a question
        15. userSelectsReturnToMainMenuEvent(gameId) - Event for user selecting to return to the main menu from the ending scene
        16. userSelectsExitGameEvent(gameId) - Event for user selecting to exit the game from the ending scene
        17. exitGameEvent(gameId) - Event for exiting the game
*/
/*
Question Updater component will wait for the user to submit new questions. After the button is clicked, the component will check that 4 options were given and all are different, if they are, it will add the new question.
*/

// Event for user submitting new question details
function userSubmitsQuestionEvent(gameId, description, options, rightOptionIndex) {
    return Event("userSubmitsQuestionEvent", {gameId: gameId, description: description, options: options, rightOptionIndex: rightOptionIndex});
}

// Event for adding a new question to the game
function addQuestionEvent(gameId, question) {
    return Event("addQuestionEvent", {gameId: gameId, question: question});
}

ctx.registerEffect('addQuestionEvent', function (data) {
    let game = ctx.getEntityById(data.gameId);
    game.questions.push(data.question);
});

ctx.bthread('Wait for new question submission and validate options', 'game.questionUpdater', function (game) {
    while (true) {
        let submitEvent = sync({waitFor: [userSubmitsQuestionEvent(game.id)]});
        let {description, options, rightOptionIndex} = submitEvent.data;
        if (options.length === 4 && new Set(options).size === 4) { // Check if all options are provided and are unique
            let newQuestion = question(`q${game.questions.length + 1}`, description, options, rightOptionIndex);
            sync({requestOne: [addQuestionEvent(game.id, newQuestion)]});
        }
    }
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
        10. userSelectsAnswerEvent(gameId, questionId, selectedOptionIndex) - Event for user selecting an answer in the game sequence
        11. displayCorrectAnswerMessageEvent(gameId) - Event for displaying a message about the correct answer
        12. displayIncorrectAnswerMessageEvent(gameId) - Event for displaying a message about the incorrect answer
        13. updateComponentToEndingSceneEvent(gameId) - Event for updating the game component to the ending scene. has effect:
            ctx.registerEffect('updateComponentToEndingSceneEvent', function (data) {
                let game = ctx.getEntityById(data.gameId);
                game.currentComponent = 'ending scene';
            }
        14. displayQuestionEvent(gameId, questionId) - Event for displaying a question
        15. userSelectsReturnToMainMenuEvent(gameId) - Event for user selecting to return to the main menu from the ending scene
        16. userSelectsExitGameEvent(gameId) - Event for user selecting to exit the game from the ending scene
        17. exitGameEvent(gameId) - Event for exiting the game
        18. userSubmitsQuestionEvent(gameId, description, options, rightOptionIndex) - Event for user submitting new question details
        19. addQuestionEvent(gameId, question) - Event for adding a new question to the game. has effect:
            ctx.registerEffect('addQuestionEvent', function (data) {
                let game = ctx.getEntityById(data.gameId);
                game.questions.push(data.question);
            }
*/

//!VERSION 4 used from here. The above is version 3. The below is version 4.
/*
The Math Umbrella component will wait for a user to click a link, and then follow that link.
*/
// Event for user clicking a link in the Math Umbrella component
function userClicksLinkEvent(gameId, linkUrl) {
    return Event("userClicksLinkEvent", {gameId: gameId, linkUrl: linkUrl});
}

// Event for following a link in the Math Umbrella component
function followLinkEvent(gameId, linkUrl) {
    return Event("followLinkEvent", {gameId: gameId, linkUrl: linkUrl});
}

ctx.bthread('Follow link when user clicks in Math Umbrella', 'game.mathUmbrella', function (game) {
    while (true) {
        let event = sync({waitFor: [anyEventWithData(userClicksLinkEvent, {gameId: game.id})]});
        sync({requestOne: [followLinkEvent(game.id, event.data.linkUrl)]});
    }
});

//! Sometimes the below happens. The requirement also didnt say there is more then one link.
// Event for user clicking a link in the Math Umbrella component
function userClicksLinkEvent(gameId) {
    return Event("userClicksLinkEvent", {gameId: gameId});
}

// Event for following a link in the Math Umbrella component
function followLinkEvent(gameId) {
    return Event("followLinkEvent", {gameId: gameId});
}

ctx.bthread('Follow link on user click in Math Umbrella', 'game.mathUmbrella', function (game) {
    while (true) {
        sync({waitFor: [userClicksLinkEvent(game.id)]});
        sync({requestOne: [followLinkEvent(game.id)]});
    }
});

//! An alternative req below
/*
The Math Umbrella component will wait for a user to click a link (out of several options), and then follow that link. 
*/



//Edited game seq requirement:
/*
The game sequence component will reset the score to 0. Then it will display a question and then wait until the user chooses an answer, starting from the first question.  
i) If the user selects the correct answer, a message to this effect will be displayed, and the component will move to the next question. If it is his first attempt he will receive 1 point. 
ii) If the incorrect answer is selected, this component will inform the user of this and give them another chance to answer the question. However, their score will not count this question as being answered correctly.
iii) After the user has completed all questions, they will be directed to the ending scene component.
*/
