/*
SYSTEM MESSAGE

The system was already coded, but some new requirements appeared. 
You are asked to add functionality to the existing system. As a result some events already exist. You can use them if they fit your need. If not, create new events as regular. 

Please, before using them, understand what you need, according to your instructions. Then if one of the existing events works for you, you can use it instead of declaring a new one, if not, all good, just declare a new one.

Your process should be as followed:
      1. What events are needed? First answer in words, then give them a name. Make sure you don't miss any needed functionality. Remember that if an effect is needed for a waitedFor event, you need to create a new event that has the effect and which you will request.
      2. Do they already exist?
 

A summary of existing events that were declared before and you can use if needed, without declaring them again:

*/
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
API MESSAGE

*You are asked to add functionality to an existing system. As a result some events already exist. You can use them if they fit your need. If not, create new events as regular.

A summary of exisiting events that were decalred before and you can use if needed, without declaring them again:

            1. startButtonClickEvent() 
            2. moveToMovieComponentEvent() - has an effect:
                        ctx.registerEffect('moveToMovieComponentEvent', function (data) {
                              let phase = ctx.getEntityById('gamePhase1'); 
                              phase.currentComponent = 'movie'; 
                         });
            
      **Make sure you provide all parameters when calling the function. If you don't know all parameters, use `anyEventNameWithData` function using the function name as the event name. For example: anyEventNameWithData("<EventName>").  If you know all parameters, use the function directly, for example:  <EventName>(param1, param2). 

*/
/*
Upon entrance to the movie component,  the introductory movie will begin playing.
After the movie begins playing, if a mouse click is received, this component will terminate the movie and forward  the user to the main menu component. Otherwise, after movie completion, the user will be moved to the main menu. 
*/

//###Implemantation

function movieStartedEvent() {
    return Event("movieStartedEvent");
}

function movieEndedEvent() {
    return Event("movieEndedEvent");
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

ctx.bthread('Play and handle movie interactions', 'phase.movie', function (phase) {
    while (true) {
        sync({request: [movieStartedEvent()]});
        let event = sync({waitFor: [movieEndedEvent(), mouseClickEvent()]});
        if (event.name === 'mouseClickEvent') {
            sync({request: [moveToMainMenuComponentEvent()]});
            break;
        } else if (event.name === 'movieEndedEvent') {
            sync({request: [moveToMainMenuComponentEvent()]});
            break;
        }
    }
});

/*
API MESSAGE

*You are asked to add functionality to an existing system. As a result some events already exist. You can use them if they fit your need. If not, create new events as regular.

A summary of existing events that were declared before and you can use if needed, without declaring them again:

            1. startButtonClickEvent() 
            2. moveToMovieComponentEvent() - has an effect:
                        ctx.registerEffect('moveToMovieComponentEvent', function (data) {
                              let phase = ctx.getEntityById('gamePhase1'); 
                              phase.currentComponent = 'movie'; 
                         });
            3. movieStartedEvent()
            4. movieEndedEvent()
            5. mouseClickEvent()
            6. moveToMainMenuComponentEvent() - has an effect:
                        ctx.registerEffect('moveToMainMenuComponentEvent', function (data) {
                                let phase = ctx.getEntityById('gamePhase1');
                                phase.currentComponent = 'main_menu';
                        });
                        


            
      **Make sure you provide all parameters when calling the function. If you don't know all parameters, use `anyEventNameWithData` function using the function name as the event name. For example: anyEventNameWithData("<EventName>").  If you know all parameters, use the function directly, for example:  <EventName>(param1, param2). 

*/                     
/*
The main menu component will wait until the user selects a button. At that time, the user will be forwarded to one of the following: game sequence component, math umbrella component, the question updater component or the Denominators' web page depending on the button selected 
*/
// Event declarations for button presses
function gameSequenceButtonPressEvent() {
    return Event("gameSequenceButtonPressEvent");
}

function mathUmbrellaButtonPressEvent() {
    return Event("mathUmbrellaButtonPressEvent");
}

function questionUpdaterButtonPressEvent() {
    return Event("questionUpdaterButtonPressEvent");
}

function denominatorsWebPageButtonPressEvent() {
    return Event("denominatorsWebPageButtonPressEvent");
}

// Effects to move to different components
function moveToGameSequenceComponentEvent() {
    return Event("moveToGameSequenceComponentEvent");
}

ctx.registerEffect('moveToGameSequenceComponentEvent', function (data) {
    let phase = ctx.getEntityById('gamePhase1');
    phase.currentComponent = 'game_sequence';
});

function moveToMathUmbrellaComponentEvent() {
    return Event("moveToMathUmbrellaComponentEvent");
}

ctx.registerEffect('moveToMathUmbrellaComponentEvent', function (data) {
    let phase = ctx.getEntityById('gamePhase1');
    phase.currentComponent = 'math_umbrella';
});

function moveToQuestionUpdaterComponentEvent() {
    return Event("moveToQuestionUpdaterComponentEvent");
}

ctx.registerEffect('moveToQuestionUpdaterComponentEvent', function (data) {
    let phase = ctx.getEntityById('gamePhase1');
    phase.currentComponent = 'question_updater';
});

function openDenominatorsWebPageEvent() {
    return Event("openDenominatorsWebPageEvent");
}

// Bthread to handle the main menu navigation
ctx.bthread('Handle main menu navigation', 'phase.mainMenu', function (phase) {
    while (true) {
        let event = sync({waitFor: [
            gameSequenceButtonPressEvent(),
            mathUmbrellaButtonPressEvent(),
            questionUpdaterButtonPressEvent(),
            denominatorsWebPageButtonPressEvent()
        ]});

        switch (event.name) {
            case "gameSequenceButtonPressEvent":
                sync({request: [moveToGameSequenceComponentEvent()]});
                break;
            case "mathUmbrellaButtonPressEvent":
                sync({request: [moveToMathUmbrellaComponentEvent()]});
                break;
            case "questionUpdaterButtonPressEvent":
                sync({request: [moveToQuestionUpdaterComponentEvent()]});
                break;
            case "denominatorsWebPageButtonPressEvent":
                sync({request: [openDenominatorsWebPageEvent()]});
                break;
        }
    }
});

/*
A summary of existing events that were declared before and you can use if needed, without declaring them again:

            1. startButtonClickEvent() 
            2. moveToMovieComponentEvent() - has an effect:
                        ctx.registerEffect('moveToMovieComponentEvent', function (data) {
                              let phase = ctx.getEntityById('gamePhase1'); 
                              phase.currentComponent = 'movie'; 
                         });
            3. movieStartedEvent()
            4. movieEndedEvent()
            5. mouseClickEvent()
            6. moveToMainMenuComponentEvent() - has an effect:
                        ctx.registerEffect('moveToMainMenuComponentEvent', function (data) {
                                let phase = ctx.getEntityById('gamePhase1');
                                phase.currentComponent = 'main_menu';
                        });
            7. gameSequenceButtonPressEvent()
            8. mathUmbrellaButtonPressEvent()
            9. questionUpdaterButtonPressEvent()
            10. denominatorsWebPageButtonPressEvent()
            11. moveToGameSequenceComponentEvent() - has an effect:
                        ctx.registerEffect('moveToGameSequenceComponentEvent', function (data) {
                            let phase = ctx.getEntityById('gamePhase1');
                            phase.currentComponent = 'game_sequence';
                        });
            12. moveToMathUmbrellaComponentEvent() - has an effect:
                        ctx.registerEffect('moveToMathUmbrellaComponentEvent', function (data) {
                            let phase = ctx.getEntityById('gamePhase1');
                            phase.currentComponent = 'math_umbrella';
                        });
            13. moveToQuestionUpdaterComponentEvent() - has an effect:  
                        ctx.registerEffect('moveToQuestionUpdaterComponentEvent', function (data) {
                            let phase = ctx.getEntityById('gamePhase1');
                            phase.currentComponent = 'question_updater';
                        });
            14. openDenominatorsWebPageEvent()

*/
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