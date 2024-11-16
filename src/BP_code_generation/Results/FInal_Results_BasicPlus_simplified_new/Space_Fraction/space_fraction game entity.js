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
Upon entrance to the movie component, the introductory movie will begin playing. Then, if a mouse click is received, this component will terminate the movie and forward the user to the main menu component. Otherwise, the movie will continue to its completion and the user will be moved to the main menu afterward.
*/
//Updated req:
/*
Upon entrance to the movie component, the introductory movie will begin playing. Then, if a mouse click is received, this component will terminate the movie and forward the user to the main menu component. Otherwise, the user will be moved to the main menu after movies completion. 
*/

function startMovieEvent() {
    return Event("startMovieEvent");
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

ctx.registerEffect('moveToMainMenuComponentEvent', function (data) {
    let phase = ctx.getEntityById('gamePhase1');
    phase.currentComponent = 'main_menu';
});

ctx.bthread('Play introductory movie on movie component', 'phase.movie', function (phase) {
    sync({request: [startMovieEvent()]});
    let event = sync({waitFor: [mouseClickEvent(), movieCompleteEvent()]});
    if (event.name === 'mouseClickEvent' || event.name === 'movieCompleteEvent') {
        sync({request: [moveToMainMenuComponentEvent()]});
    }
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
The game sequence component will display a question, and then wait until the user chooses an answer. If the user selects the correct answer, a message to this effect will be displayed and the component will move to the next question. If its his first answer to the question he will receive 1 point. If the incorrect answer is selected, this component will inform the user of   this and give them another chance to answer the question. However, their score will not count this question as being answered correctly.  After the user has proceeded through all questions, they will be directed to the ending scene component.
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

ctx.registerEffect('moveToEndingSceneComponentEvent', function (data) {
    let phase = ctx.getEntityById('gamePhase1');
    phase.currentComponent = 'ending_scene';
});

ctx.registerEffect('addScoreEvent', function (data) {
    let scoreEntity = ctx.getEntityById('score1');
    scoreEntity.value += 1;
});

ctx.bthread('Game sequence logic', 'phase.gameSequence', function (phase) {
    const questions = ctx.getEntityById('allQuestions1').questions;
    let questionIndex = 0;
    let firstAttempt = true;

    while (questionIndex < questions.length) {
        sync({request: [displayQuestionEvent(questions[questionIndex].id)]});
        let answerEvent = sync({waitFor: [anyEventWithData(answerSelectedEvent, {questionId: questions[questionIndex].id})]});
        
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
            }
        } else {
            sync({request: [incorrectAnswerEvent()]});
            firstAttempt = false;
        }
    }
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

ctx.bthread('Handle ending scene selections', 'phase.endingScene', function (phase) {
    while (true) {
        let event = sync({waitFor: [returnToMainMenuButtonEvent(), exitGameButtonEvent()]});
        if (event.name === 'returnToMainMenuButtonEvent') {
            sync({request: [moveToMainMenuComponentEvent()]});
        } else if (event.name === 'exitGameButtonEvent') {
            // Assuming there's an event to handle game exit
            sync({request: [exitGameEvent()]});
        }
    }
});


/*
Question Updater component will wait for the user to submit new questions. After the button is clicked, the component will check that 4 options were given and all are different, if they are, it will add the new question.
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

ctx.bthread('Question Updater logic', 'phase.questionUpdater', function (phase) {
    while (true) {
        let submitEvent = sync({waitFor: [anyEventWithData(submitNewQuestionEvent)]});
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

ctx.bthread('Handle link clicks in Math Umbrella component', 'phase.mathUmbrella', function (phase) {
    while (true) {
        let linkEvent = sync({waitFor: [anyEventWithData(linkClickEvent)]});
        sync({request: [followLinkEvent(linkEvent.data.linkUrl)]});
    }
});