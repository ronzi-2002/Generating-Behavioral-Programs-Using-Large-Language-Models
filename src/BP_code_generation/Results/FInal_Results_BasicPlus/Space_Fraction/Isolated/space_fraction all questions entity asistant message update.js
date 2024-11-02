/*
SYSTEM Update:

The system was already coded, but some new requirements appeared. 
You are asked to add functionality to the existing system. As a result some events already exist. You can use them if they fit your needs. If not, create new events as regular. 



## Your process should be as follows: ##
     Before implementing answer the 2 next question:
      1. What events are needed? First answer in words, then give them a name. 
                 Important: Any change/update in entities requires an event (with an effect). You can't modify an entity inside a bthread.
               *Make sure you don't miss any mentioned functionality or event that is mentioned. We declare every functionality as an event and don't assume any other libraries.
                *Remember that if an effect is needed for a waitedFor event, you need to create a new event that has the effect and which you will request.
                
      2. Do they already exist?
      After answering the questions, implement.

      * Make sure that you create the events you described as needed! (unless they exist).
      * Make sure you obey your original instructions. Providing one bthread.

*All parts that aren't code should be in a comment.
 
## A Summary of existing events ## 
            1. startButtonClickEvent() 
            2. moveToMovieComponentEvent() - has an effect:
                        ctx.registerEffect('moveToMovieComponentEvent', function (data) {
                              let phase = ctx.getEntityById('gamePhase1'); 
                              phase.currentComponent = 'movie'; 
                         });
            
           

           
      * Don't assume the existence of any other functions or events. 

* Rememeber that you must create an effect (and an according event) if you want to update an entity. You cant do it without an effect.
*Make sure you provide all parameters when calling the function. If you don't know all parameters, use `anyEventNameWithData` function using the function name as the event name. For example: anyEventNameWithData("<EventName>").  If you know all parameters, use the function directly, for example:  <EventName>(param1, param2). 


*/
/*


//A question has its content, 4 options and the index of the right option
function question(id, content, options, rightOptionIndex) {
    return ctx.Entity(id, 'question', {
        content: content,
        options: options,
        rightOptionIndex: rightOptionIndex
    });
}
/*
There is one entity called "AllQuestions" which will hold 4 questions about the USA history(place the right answer at a random position)
*/
function AllQuestions(id, questions) {
    return ctx.Entity(id, 'AllQuestions', { questions: questions });
}

ctx.populateContext([
    AllQuestions('allQuestions1', [
        question('q1', 'Who was the first President of the United States?', ['George Washington', 'Thomas Jefferson', 'Abraham Lincoln', 'Theodore Roosevelt'], 0),
        question('q2', 'What year did the United States declare independence?', ['1776', '1492', '1607', '1865'], 0),
        question('q3', 'What is the capital of the United States?', ['New York City', 'Los Angeles', 'Washington D.C.', 'Miami'], 2),
        question('q4', 'Which event began on April 12, 1861?', ['World War I', 'The Great Depression', 'The Civil War', 'The Declaration of Independence'], 2)
    ])
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

/*
At the start of the game, When the user clicks on the start button, the game will move to the movie component. 
*/
// 1. What events are needed?
//    - An event for the user clicking the start button.
//    - An event to transition the game phase to the movie component.

// 2. Do they already exist?
//    - Assume no existing events for these specific actions, so we will create them.

function startButtonClickEvent() {
    return Event("startButtonClickEvent");
}

function moveToMovieComponentEvent() {
    return Event("moveToMovieComponentEvent");
}

ctx.registerEffect('moveToMovieComponentEvent', function (data) {
    let phaseEntity = ctx.getEntityById('gamePhase1');
    phaseEntity.currentComponent = 'movie';
});

ctx.bthread('Move to movie component on start button click', 'phase.start', function (phase) {
    while (true) {
        sync({waitFor: [startButtonClickEvent()]});
        sync({request: [moveToMovieComponentEvent()]});
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
         
*/

/*
Upon entrance to the movie component, the introductory movie will begin playing. 
After the movie begins playing, If a mouse click is received, this component will terminate the movie and forward  the user to the main menu component. Otherwise, the movie will continue to its completion and the user will be moved to the main menu. 
*/
//Ron: added "After the movie begins playing," to the requirement, without it, it sometimes didnt request movieStartEvent.(because it assumes it was started externally)


// 1. What events are needed?
//    - playMovieEvent: To start playing the movie.
//    - mouseClickEvent: To detect a mouse click to terminate the movie.
//    - movieCompleteEvent: To indicate the movie has completed.
//    - moveToMainMenuComponentEvent: To move to the main menu after the movie or on mouse click.

// 2. Do they already exist?
//    - playMovieEvent, mouseClickEvent, movieCompleteEvent, and moveToMainMenuComponentEvent need to be declared.

// Declaring the necessary events
function playMovieEvent() {
    return Event("playMovieEvent");
}

function mouseClickEvent() {
    return Event("mouseClickEvent");
}

function movieCompleteEvent() {
    return Event("movieCompleteEvent");
}

function moveToMainMenuComponentEvent() {
    return Event("moveToMainMenuComponentEvent");
}

// Registering the effect for moving to the main menu component
ctx.registerEffect('moveToMainMenuComponentEvent', function (data) {
    let phase = ctx.getEntityById('gamePhase1');
    phase.currentComponent = 'main_menu';
});

// Bthread for handling the movie component logic
ctx.bthread('Handle movie component', 'phase.movie', function (phase) {
    while (true) {
        sync({request: [playMovieEvent()]});
        let event = sync({waitFor: [mouseClickEvent(), movieCompleteEvent()]});
        if (event.name === 'mouseClickEvent' || event.name === 'movieCompleteEvent') {
            sync({request: [moveToMainMenuComponentEvent()]});
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
            3. playMovieEvent() 
            4. mouseClickEvent() 
            5. movieCompleteEvent() 
            6. moveToMainMenuComponentEvent() - has an effect:
                        ctx.registerEffect('moveToMainMenuComponentEvent', function (data) {   
                                let phase = ctx.getEntityById('gamePhase1'); 
                                phase.currentComponent = 'main_menu'; 
                             });







         
*/
/*
The main menu component will wait until the user selects a button. At that time, the user will be forwarded to one of the following: game sequence component, math umbrella component, the question updater component or the Denominators' web page depending on the button selected 
*/
/* 
1. What events are needed?
   - Events for each button selection in the main menu: gameSequenceButtonSelectedEvent, mathUmbrellaButtonSelectedEvent, questionUpdaterButtonSelectedEvent, denominatorsWebPageButtonSelectedEvent.
   - Events to move to each respective component or external link: moveToGameSequenceComponentEvent, moveToMathUmbrellaComponentEvent, moveToQuestionUpdaterComponentEvent, openDenominatorsWebPageEvent.

2. Do they already exist?
   - No, these specific events do not exist in the provided list and need to be declared.
*/

// Declare the events
function gameSequenceButtonSelectedEvent() {
    return Event("gameSequenceButtonSelectedEvent");
}

function mathUmbrellaButtonSelectedEvent() {
    return Event("mathUmbrellaButtonSelectedEvent");
}

function questionUpdaterButtonSelectedEvent() {
    return Event("questionUpdaterButtonSelectedEvent");
}

function denominatorsWebPageButtonSelectedEvent() {
    return Event("denominatorsWebPageButtonSelectedEvent");
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

// Register effects for component change events
ctx.registerEffect('moveToGameSequenceComponentEvent', function (data) {
    let phase = ctx.getEntityById('gamePhase1');
    phase.currentComponent = 'game_sequence';
});

ctx.registerEffect('moveToMathUmbrellaComponentEvent', function (data) {
    let phase = ctx.getEntityById('gamePhase1');
    phase.currentComponent = 'math_umbrella';
});

ctx.registerEffect('moveToQuestionUpdaterComponentEvent', function (data) {
    let phase = ctx.getEntityById('gamePhase1');
    phase.currentComponent = 'question_updater';
});

// Bthread to handle the main menu selections
ctx.bthread('Handle main menu selections', 'phase.mainMenu', function (phase) {
    while (true) {
        let event = sync({waitFor: [
            gameSequenceButtonSelectedEvent(),
            mathUmbrellaButtonSelectedEvent(),
            questionUpdaterButtonSelectedEvent(),
            denominatorsWebPageButtonSelectedEvent()
        ]});

        switch (event.name) {
            case "gameSequenceButtonSelectedEvent":
                sync({request: [moveToGameSequenceComponentEvent()]});
                break;
            case "mathUmbrellaButtonSelectedEvent":
                sync({request: [moveToMathUmbrellaComponentEvent()]});
                break;
            case "questionUpdaterButtonSelectedEvent":
                sync({request: [moveToQuestionUpdaterComponentEvent()]});
                break;
            case "denominatorsWebPageButtonSelectedEvent":
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
            3. playMovieEvent() 
            4. mouseClickEvent() 
            5. movieCompleteEvent() 
            6. moveToMainMenuComponentEvent() - has an effect:
                        ctx.registerEffect('moveToMainMenuComponentEvent', function (data) {   
                                let phase = ctx.getEntityById('gamePhase1'); 
                                phase.currentComponent = 'main_menu'; 
                             });
            7. selectGameSequenceButtonEvent()
            8. selectMathUmbrellaButtonEvent()
            9. selectQuestionUpdaterButtonEvent()
            10. selectDenominatorsWebPageButtonEvent()
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
/* 
1. What events are needed?
   - DisplayQuestionEvent: To display a question to the user.
   - UserSelectsAnswerEvent(answerIndex, questionId): When the user selects an answer.
   - CorrectAnswerSelectedEvent(questionId): If the correct answer is selected.
   - IncorrectAnswerSelectedEvent(questionId): If an incorrect answer is selected.
   - UpdateScoreEvent: To update the score when the user selects the correct answer on the first try.
   - MoveToNextQuestionEvent: To move to the next question after answering.
   - MoveToEndingSceneEvent: To move to the ending scene after all questions are answered.

2. Do they already exist?
   - No, these events do not exist in the provided list and need to be declared.
*/

function displayQuestionEvent(questionId) {
    return Event("displayQuestionEvent", {questionId: questionId});
}

function userSelectsAnswerEvent(answerIndex, questionId) {
    return Event("userSelectsAnswerEvent", {answerIndex: answerIndex, questionId: questionId});
}

function correctAnswerSelectedEvent(questionId) {
    return Event("correctAnswerSelectedEvent", {questionId: questionId});
}

function incorrectAnswerSelectedEvent(questionId) {
    return Event("incorrectAnswerSelectedEvent", {questionId: questionId});
}

function updateScoreEvent() {
    return Event("updateScoreEvent");
}

function moveToNextQuestionEvent() {
    return Event("moveToNextQuestionEvent");
}

function moveToEndingSceneEvent() {
    return Event("moveToEndingSceneEvent");
}

ctx.registerEffect('updateScoreEvent', function (data) {
    let score = ctx.getEntityById('score1');
    score.value += 1;
});

ctx.registerEffect('moveToEndingSceneEvent', function (data) {
    let phase = ctx.getEntityById('gamePhase1');
    phase.currentComponent = 'ending_scene';
});

ctx.bthread('Game Sequence Logic', 'phase.gameSequence', function (phase) {
    let questions = ctx.getEntityById('allQuestions1').questions;
    let questionIndex = 0;
    let firstAttempt = true;

    while (questionIndex < questions.length) {
        sync({request: [displayQuestionEvent(questions[questionIndex].id)]});
        let event = sync({waitFor: [anyEventNameWithData("userSelectsAnswerEvent", {questionId: questions[questionIndex].id})]});

        if (event.data.answerIndex === questions[questionIndex].rightOptionIndex) {
            sync({request: [correctAnswerSelectedEvent(questions[questionIndex].id)]});
            if (firstAttempt) {
                sync({request: [updateScoreEvent()]});
            }
            questionIndex++;
            firstAttempt = true;
            sync({request: [moveToNextQuestionEvent()]});
        } else {
            sync({request: [incorrectAnswerSelectedEvent(questions[questionIndex].id)]});
            firstAttempt = false;
        }
    }

    sync({request: [moveToEndingSceneEvent()]});
});


/*
A summary of existing events that were declared before and you can use if needed, without declaring them again:

            1. startButtonClickEvent() 
            2. moveToMovieComponentEvent() - has an effect:
                        ctx.registerEffect('moveToMovieComponentEvent', function (data) {
                              let phase = ctx.getEntityById('gamePhase1'); 
                              phase.currentComponent = 'movie'; 
                         });
            3. playIntroductoryMovieEvent()
            4. endIntroductoryMovieEvent()
            5. mouseClickEvent()
            6. moveToMainMenuComponentEvent() - has an effect:
                        ctx.registerEffect('moveToMainMenuComponentEvent', function (data) {   
                                let phase = ctx.getEntityById('gamePhase1'); 
                                phase.currentComponent = 'main_menu'; 
                             });
            7. selectGameSequenceButtonEvent()
            8. selectMathUmbrellaButtonEvent()
            9. selectQuestionUpdaterButtonEvent()
            10. selectDenominatorsWebPageButtonEvent()
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
            15. displayQuestionEvent(questionId)
            16. userSelectsAnswerEvent(questionId, selectedOptionIndex)
            17. correctAnswerSelectedEvent(questionId)
            18. incorrectAnswerSelectedEvent(questionId)
            19. updateScoreEvent() - has an effect:
                        ctx.registerEffect('updateScoreEvent', function (data) {
                            let score = ctx.getEntityById('score1');
                            score.value += 1;
                        });
            20. moveToNextQuestionEvent()
            21. moveToEndingSceneEvent() - has an effect:
                        ctx.registerEffect('moveToEndingSceneEvent', function (data) {  
                            let phase = ctx.getEntityById('gamePhase1');
                            phase.currentComponent = 'ending_scene';
                        });
            
            
            

*/
/*
The ending scene will wait until the user selects either to return to the main menu or to exit the game. After receiving the user's input, the component will act accordingly.
*/
/* 
1. What events are needed?
   - Event to capture user's selection to return to the main menu.
   - Event to capture user's selection to exit the game.
   - These events will determine the next component or action in the game.

   Named Events:
   - returnToMainMenuEvent()
   - exitGameEvent()

2. Do they already exist?
   - No, these events do not exist in the provided list and need to be created.
*/

function returnToMainMenuEvent() {
    return Event("returnToMainMenuEvent");
}

function exitGameEvent() {
    return Event("exitGameEvent");
}

ctx.bthread('Handle ending scene choices', 'phase.endingScene', function (phase) {
    while (true) {
        let event = sync({waitFor: [returnToMainMenuEvent(), exitGameEvent()]});
        if (event.name === "returnToMainMenuEvent") {
            sync({request: [moveToMainMenuComponentEvent()]});
        } else if (event.name === "exitGameEvent") {
            // Assuming there's a function to handle game exit
            sync({request: [exitGame()]});
        }
    }
});

// Assuming exitGame() is a function that handles the game exit process.
function exitGame() {
    return Event("exitGame");
}

/*
/*
A summary of existing events that were declared before and you can use if needed, without declaring them again:

            1. startButtonClickEvent() 
            2. moveToMovieComponentEvent() - has an effect:
                        ctx.registerEffect('moveToMovieComponentEvent', function (data) {
                              let phase = ctx.getEntityById('gamePhase1'); 
                              phase.currentComponent = 'movie'; 
                         });
            3. playIntroductoryMovieEvent()
            4. endIntroductoryMovieEvent()
            5. mouseClickEvent()
            6. moveToMainMenuComponentEvent() - has an effect:
                        ctx.registerEffect('moveToMainMenuComponentEvent', function (data) {   
                                let phase = ctx.getEntityById('gamePhase1'); 
                                phase.currentComponent = 'main_menu'; 
                             });
            7. selectGameSequenceButtonEvent()
            8. selectMathUmbrellaButtonEvent()
            9. selectQuestionUpdaterButtonEvent()
            10. selectDenominatorsWebPageButtonEvent()
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
            15. displayQuestionEvent(questionId)
            16. userSelectsAnswerEvent(questionId, selectedOptionIndex)
            17. correctAnswerSelectedEvent(questionId)
            18. incorrectAnswerSelectedEvent(questionId)
            19. updateScoreEvent() - has an effect:
                        ctx.registerEffect('updateScoreEvent', function (data) {
                            let score = ctx.getEntityById('score1');
                            score.value += 1;
                        });
            20. moveToNextQuestionEvent()
            21. moveToEndingSceneEvent() - has an effect:
                        ctx.registerEffect('moveToEndingSceneEvent', function (data) {  
                            let phase = ctx.getEntityById('gamePhase1');
                            phase.currentComponent = 'ending_scene';
                        });
            22. returnToMainMenuEvent()
            23. exitGameEvent()
            24. exitGame()


            
            

*/


/*
The Question Updater component will wait for the user to submit new questions. After the button is clicked, the component will add the new question to the question database.
*/

/*

1. What events are needed?
   - An event for the user submitting new questions.
   - An event to add the new question to the database.

   Named Events:
   - submitNewQuestionEvent(questionContent, options, rightOptionIndex)
   - addQuestionToDatabaseEvent(questionContent, options, rightOptionIndex)

2. Do they already exist?
   - No, these events do not exist in the provided list and need to be created.


function submitNewQuestionEvent(questionContent, options, rightOptionIndex) {
    return Event("submitNewQuestionEvent", { questionContent, options, rightOptionIndex });
}

function addQuestionToDatabaseEvent(questionContent, options, rightOptionIndex) {
    return Event("addQuestionToDatabaseEvent", { questionContent, options, rightOptionIndex });
}

ctx.registerEffect('addQuestionToDatabaseEvent', function (data) {
    let allQuestions = ctx.getEntityById('allQuestions1');
    let newQuestion = question('q' + (allQuestions.questions.length + 1), data.questionContent, data.options, data.rightOptionIndex);
    allQuestions.questions.push(newQuestion);
});

ctx.bthread('Add new question to database after submission', 'phase.questionUpdater', function (phase) {
    while (true) {
        let submitEvent = sync({waitFor: [submitNewQuestionEvent]});
        sync({request: [addQuestionToDatabaseEvent(submitEvent.data.questionContent, submitEvent.data.options, submitEvent.data.rightOptionIndex)]});
    }
});

User: userSubmitsNewQuestionEvent was called without all parameters in let submitEvent = sync({waitFor: [submitNewQuestionEvent]});.

Provide a full corrected implementation, without additional explanation.
*/
function submitNewQuestionEvent(questionContent, options, rightOptionIndex) {
    return Event("submitNewQuestionEvent", { questionContent, options, rightOptionIndex });
}

function addQuestionToDatabaseEvent(questionContent, options, rightOptionIndex) {
    return Event("addQuestionToDatabaseEvent", { questionContent, options, rightOptionIndex });
}

ctx.registerEffect('addQuestionToDatabaseEvent', function (data) {
    let allQuestions = ctx.getEntityById('allQuestions1');
    let newQuestion = question('q' + (allQuestions.questions.length + 1), data.questionContent, data.options, data.rightOptionIndex);
    allQuestions.questions.push(newQuestion);
});

ctx.bthread('Add new question to database after submission', 'phase.questionUpdater', function (phase) {
    while (true) {
        let submitEvent = sync({waitFor: [anyEventNameWithData("submitNewQuestionEvent")]});
        sync({request: [addQuestionToDatabaseEvent(submitEvent.data.questionContent, submitEvent.data.options, submitEvent.data.rightOptionIndex)]});
    }
});

/*
            1. startButtonClickEvent() 
            2. moveToMovieComponentEvent() - has an effect:
                        ctx.registerEffect('moveToMovieComponentEvent', function (data) {
                              let phase = ctx.getEntityById('gamePhase1'); 
                              phase.currentComponent = 'movie'; 
                         });
            3. playIntroductoryMovieEvent()
            4. endIntroductoryMovieEvent()
            5. mouseClickEvent()
            6. moveToMainMenuComponentEvent() - has an effect:
                        ctx.registerEffect('moveToMainMenuComponentEvent', function (data) {   
                                let phase = ctx.getEntityById('gamePhase1'); 
                                phase.currentComponent = 'main_menu'; 
                             });
            7. selectGameSequenceButtonEvent()
            8. selectMathUmbrellaButtonEvent()
            9. selectQuestionUpdaterButtonEvent()
            10. selectDenominatorsWebPageButtonEvent()
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
            15. displayQuestionEvent(questionId)
            16. userSelectsAnswerEvent(questionId, selectedOptionIndex)
            17. correctAnswerSelectedEvent(questionId)
            18. incorrectAnswerSelectedEvent(questionId)
            19. updateScoreEvent() - has an effect:
                        ctx.registerEffect('updateScoreEvent', function (data) {
                            let score = ctx.getEntityById('score1');
                            score.value += 1;
                        });
            20. moveToNextQuestionEvent()
            21. moveToEndingSceneEvent() - has an effect:
                        ctx.registerEffect('moveToEndingSceneEvent', function (data) {  
                            let phase = ctx.getEntityById('gamePhase1');
                            phase.currentComponent = 'ending_scene';
                        });
            22. returnToMainMenuEvent()
            23. exitGameEvent()
            24. exitGame()
            25. submitNewQuestionEvent(questionContent, options, rightOptionIndex)
            26. addQuestionToDatabaseEvent(questionContent, options, rightOptionIndex)
                        ctx.registerEffect('addQuestionToDatabaseEvent', function (data) {
                            let allQuestions = ctx.getEntityById('allQuestions1');
                            let newQuestion = question('q' + (allQuestions.questions.length + 1), data.questionContent, data.options, data.rightOptionIndex);
                            allQuestions.questions.push(newQuestion);
                        });
            

            
            
        */

/*
The Math Umbrella component will wait for a user to click a link, and then follow that link. 
*many links are presented.  
*/
//Added "*many links are presented" to the description for clarity, without it, it simply waited for a link click and followed it.

/* 
1. What events are needed?
   - An event for user clicking on a specific link in the Math Umbrella component.
   - An event for following the clicked link.

2. Do they already exist?
   - A generic mouseClickEvent exists, but it does not specify clicking on a link in the Math Umbrella component.
   - No existing event for following a link.
*/

// Declare the new events
function mathUmbrellaLinkClickEvent(linkId) {
    return Event("mathUmbrellaLinkClickEvent", {linkId: linkId});
}

function followMathUmbrellaLinkEvent(linkId) {
    return Event("followMathUmbrellaLinkEvent", {linkId: linkId});
}

// Bthread to handle the link click and following the link in the Math Umbrella component
ctx.bthread('Handle link click in Math Umbrella', 'phase.mathUmbrella', function (phase) {
    while (true) {
        let event = sync({waitFor: [anyEventNameWithData("mathUmbrellaLinkClickEvent")]});
        let linkId = event.data.linkId;
        sync({request: [followMathUmbrellaLinkEvent(linkId)]});
    }
});
