/*
A question has its content, 4 options and the index of the right option 
*/
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


/*
In addition, there is a phase to the game that holds the current component of the game, starting with "game_start" at the beginning and a score entity
*/
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
Upon entrance to the movie component, the introductory movie will begin playing. 
After the movie begins playing, If a mouse click is received, this component will terminate the movie and forward  the user to the main menu component. Otherwise, the movie will continue to its completion and the user will be moved to the main menu. 
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
    let phaseEntity = ctx.getEntityById('gamePhase1');
    phaseEntity.currentComponent = 'main_menu';
});

ctx.bthread('Start movie on movie component entrance', 'phase.movie', function (phase) {
    sync({request: [movieStartEvent()]});
    let event = sync({waitFor: [mouseClickEvent(), movieEndEvent()]});
    sync({request: [moveToMainMenuComponentEvent()]});
});

function movieEndEvent() {
    return Event("movieEndEvent");
}


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
    let phaseEntity = ctx.getEntityById('gamePhase1');
    phaseEntity.currentComponent = 'game_sequence';
});

ctx.registerEffect('moveToMathUmbrellaComponentEvent', function (data) {
    let phaseEntity = ctx.getEntityById('gamePhase1');
    phaseEntity.currentComponent = 'math_umbrella';
});

ctx.registerEffect('moveToQuestionUpdaterComponentEvent', function (data) {
    let phaseEntity = ctx.getEntityById('gamePhase1');
    phaseEntity.currentComponent = 'question_updater';
});

ctx.bthread('Handle main menu selections', 'phase.mainMenu', function (phase) {
    while (true) {
        let event = sync({waitFor: [gameSequenceButtonEvent(), mathUmbrellaButtonEvent(), questionUpdaterButtonEvent(), denominatorsWebPageButtonEvent()]});
        switch (event.name) {
            case 'gameSequenceButtonEvent':
                sync({request: [moveToGameSequenceComponentEvent()]});
                break;
            case 'mathUmbrellaButtonEvent':
                sync({request: [moveToMathUmbrellaComponentEvent()]});
                break;
            case 'questionUpdaterButtonEvent':
                sync({request: [moveToQuestionUpdaterComponentEvent()]});
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
/*
function displayQuestionEvent(questionId) {
    return Event("displayQuestionEvent", {questionId: questionId});
}

function answerSelectedEvent(questionId, selectedOptionIndex) {
    return Event("answerSelectedEvent", {questionId: questionId, selectedOptionIndex: selectedOptionIndex});
}

function correctAnswerEvent() {
    return Event("correctAnswerEvent");
}

function incorrectAnswerEvent() {
    return Event("incorrectAnswerEvent");
}

function moveToNextQuestionEvent() {
    return Event("moveToNextQuestionEvent");
}

function moveToEndingSceneComponentEvent() {
    return Event("moveToEndingSceneComponentEvent");
}

ctx.registerEffect('moveToEndingSceneComponentEvent', function (data) {
    let phaseEntity = ctx.getEntityById('gamePhase1');
    phaseEntity.currentComponent = 'ending_scene';
});

ctx.registerEffect('addScoreEvent', function (data) {
    let scoreEntity = ctx.getEntityById('score1');
    scoreEntity.value += 1;
});

function addScoreEvent() {
    return Event("addScoreEvent");
}

ctx.bthread('Game sequence logic', 'phase.gameSequence', function (phase) {
    const questions = ctx.getEntityById('allQuestions1').questions;
    let questionIndex = 0;
    let firstAttempt = true;

    while (questionIndex < questions.length) {
        sync({request: [displayQuestionEvent(questions[questionIndex].id)]});
        let answerEvent = sync({waitFor: [answerSelectedEvent(questions[questionIndex].id)]});

        if (answerEvent.data.selectedOptionIndex === questions[questionIndex].rightOptionIndex) {
            sync({request: [correctAnswerEvent()]});
            if (firstAttempt) {
                sync({request: [addScoreEvent()]});
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
            sync({request: [incorrectAnswerEvent()]});
            firstAttempt = false;
        }
    }
});
----------------------------------------------------------
User: Compilation error at:       let answerEvent = sync({waitFor: [answerSelectedEvent(questions[questionIndex].id, any)]});
 Provide a full corrected implementation, without additional explanation.
----------------------------------------------------------
*/
function displayQuestionEvent(questionId) {
    return Event("displayQuestionEvent", {questionId: questionId});
}

function answerSelectedEvent(questionId, selectedOptionIndex) {
    return Event("answerSelectedEvent", {questionId: questionId, selectedOptionIndex: selectedOptionIndex});
}

function correctAnswerEvent() {
    return Event("correctAnswerEvent");
}

function incorrectAnswerEvent() {
    return Event("incorrectAnswerEvent");
}

function moveToNextQuestionEvent() {
    return Event("moveToNextQuestionEvent");
}

function moveToEndingSceneComponentEvent() {
    return Event("moveToEndingSceneComponentEvent");
}

function updateScoreEvent() {
    return Event("updateScoreEvent");
}

ctx.registerEffect('moveToEndingSceneComponentEvent', function (data) {
    let phaseEntity = ctx.getEntityById('gamePhase1');
    phaseEntity.currentComponent = 'ending_scene';
});

ctx.registerEffect('updateScoreEvent', function (data) {
    let scoreEntity = ctx.getEntityById('score1');
    scoreEntity.value += 1;
});

ctx.bthread('Handle game sequence', 'phase.gameSequence', function (phase) {
    const questions = ctx.getEntityById('allQuestions1').questions;
    let questionIndex = 0;
    let attempts = 0;

    while (questionIndex < questions.length) {
        sync({request: [displayQuestionEvent(questions[questionIndex].id)]});
        let event = sync({waitFor: [anyEventNameWithData("answerSelectedEvent", {questionId: questions[questionIndex].id})]});

        if (event.data.selectedOptionIndex === questions[questionIndex].rightOptionIndex) {
            sync({request: [correctAnswerEvent()]});
            if (attempts === 0) {
                sync({request: [updateScoreEvent()]});
            }
            questionIndex++;
            attempts = 0;
            sync({request: [moveToNextQuestionEvent()]});
        } else {
            sync({request: [incorrectAnswerEvent()]});
            attempts++;
        }
    }

    sync({request: [moveToEndingSceneComponentEvent()]});
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

ctx.bthread('Handle ending scene choices', 'phase.endingScene', function (phase) {
    while (true) {
        let event = sync({waitFor: [returnToMainMenuButtonEvent(), exitGameButtonEvent()]});
        if (event.name === 'returnToMainMenuButtonEvent') {
            sync({request: [moveToMainMenuComponentEvent()]});
        } else if (event.name === 'exitGameButtonEvent') {
            sync({request: [exitGameEvent()]});
        }
    }
});

function exitGameEvent() {
    return Event("exitGameEvent");
}




/*
Question Updater component will wait for the user to submit new questions. After the button is clicked, the component will check that 4 options were given and all are different, if they are, it will add the new question.
*/
/*
function submitNewQuestionEvent(content, options, rightOptionIndex) {
    return Event("submitNewQuestionEvent", {content: content, options: options, rightOptionIndex: rightOptionIndex});
}

function addNewQuestionEvent(questionId, content, options, rightOptionIndex) {
    return Event("addNewQuestionEvent", {questionId: questionId, content: content, options: options, rightOptionIndex: rightOptionIndex});
}

ctx.registerEffect('addNewQuestionEvent', function (data) {
    let allQuestions = ctx.getEntityById('allQuestions1');
    allQuestions.questions.push(question(data.questionId, data.content, data.options, data.rightOptionIndex));
});

ctx.bthread('Handle new question submissions', 'phase.questionUpdater', function (phase) {
    while (true) {
        let event = sync({waitFor: [submitNewQuestionEvent()]});
        let {content, options, rightOptionIndex} = event.data;

        if (options.length === 4 && new Set(options).size === 4) { // Check if all options are provided and are unique
            let newQuestionId = `q${ctx.getEntityById('allQuestions1').questions.length + 1}`;
            sync({request: [addNewQuestionEvent(newQuestionId, content, options, rightOptionIndex)]});
        }
    }
});

submitNewQuestionEvent() called without all parameters in  let submitEvent = sync({waitFor: [submitNewQuestionEvent()]}); 
Provide a full (providing all needed code) corrected implementation, without additional explanation. 
*/

function submitNewQuestionEvent(content, options, rightOptionIndex) {
    return Event("submitNewQuestionEvent", {content: content, options: options, rightOptionIndex: rightOptionIndex});
}

function addNewQuestionEvent(questionId, content, options, rightOptionIndex) {
    return Event("addNewQuestionEvent", {questionId: questionId, content: content, options: options, rightOptionIndex: rightOptionIndex});
}

ctx.registerEffect('addNewQuestionEvent', function (data) {
    let allQuestions = ctx.getEntityById('allQuestions1');
    allQuestions.questions.push(question(data.questionId, data.content, data.options, data.rightOptionIndex));
});

ctx.bthread('Handle new question submissions', 'phase.questionUpdater', function (phase) {
    while (true) {
        let submitEvent = sync({waitFor: [anyEventNameWithData("submitNewQuestionEvent")]});
        let {content, options, rightOptionIndex} = submitEvent.data;

        if (options.length === 4 && new Set(options).size === 4) { // Check if all options are provided and are unique
            let newQuestionId = `q${ctx.getEntityById('allQuestions1').questions.length + 1}`;
            sync({request: [addNewQuestionEvent(newQuestionId, content, options, rightOptionIndex)]});
        }
    }
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

function linkClickEvent(linkUrl) {
    return Event("linkClickEvent", {linkUrl: linkUrl});
}

function followLinkEvent(linkUrl) {
    return Event("followLinkEvent", {linkUrl: linkUrl});
}

ctx.bthread('Math Umbrella link following', 'phase.mathUmbrella', function (phase) {
    while (true) {
        let linkEvent = sync({waitFor: [anyEventNameWithData("linkClickEvent")]});
        sync({request: [followLinkEvent(linkEvent.data.linkUrl)]});
    }
});