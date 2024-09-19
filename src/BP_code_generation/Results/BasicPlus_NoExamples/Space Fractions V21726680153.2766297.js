/*
A question has its content, 4 options and the index of the right option
*/
function question(id, content, options, rightOptionIndex) {
    return ctx.Entity(id, 'question', {content: content, options: options, rightOptionIndex: rightOptionIndex});
}
/*
Generate 4 questions about the USA history(place the right answer at a random position)
*/
function question(id, content, options, rightOptionIndex) {
    return ctx.Entity(id, 'question', {content: content, options: options, rightOptionIndex: rightOptionIndex});
}

ctx.populateContext([
    question('q1', 'Who was the first President of the United States?', ['George Washington', 'Thomas Jefferson', 'Abraham Lincoln', 'John Adams'], 0),
    question('q2', 'What year did the American Civil War begin?', ['1850', '1861', '1871', '1845'], 1),
    question('q3', 'Which document declared the independence of the United States from Britain?', ['The Constitution', 'The Bill of Rights', 'The Declaration of Independence', 'The Federalist Papers'], 2),
    question('q4', 'Who purchased the Louisiana Territory from France?', ['Benjamin Franklin', 'John Adams', 'Thomas Jefferson', 'George Washington'], 2)
]);
/*
In addition there is a phase to the game that holds the current component, which is "game_start' at the beginning. And a score entity( score value is 0 at the beginning)
*/
function phase(id, currentComponent) {
    return ctx.Entity(id, 'phase', {currentComponent: currentComponent});
}

function score(id, value) {
    return ctx.Entity(id, 'score', {value: value});
}

ctx.populateContext([
    phase('phase1', 'game_start'),
    score('score1', 0)
]);
/*
queries needed:
a query for each phase of the game(start, movie, main menu, game sequence, ending scene, question updater, math umbrella ) 
  
*/
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

ctx.registerEffect('startButtonClickEvent', function (data) {
    let phase = ctx.query('phase.start')[0];
    phase.currentComponent = 'movie';
});

ctx.bthread('Move to movie component on start button click', 'phase.start', function (startPhase) {
    sync({waitFor: [startButtonClickEvent()]});
});
/*
Upon entrance to the movie component, the introductory movie will begin playing.
If a mouse click is received, this component will terminate the movie and forward 
the user to the main menu component. 
Otherwise, the movie will continue to its completion and the user will be moved to the main menu. 
*/
function movieStartEvent() {
    return Event("movieStartEvent");
}

function movieEndEvent() {
    return Event("movieEndEvent");
}

function mouseClickEvent() {
    return Event("mouseClickEvent");
}

ctx.registerEffect('movieStartEvent', function (data) {
    // Assuming the effect to start the movie is handled elsewhere in the system
});

ctx.registerEffect('movieEndEvent', function (data) {
    let phase = ctx.query('phase.movie')[0];
    phase.currentComponent = 'main_menu';
});

ctx.registerEffect('mouseClickEvent', function (data) {
    let phase = ctx.query('phase.movie')[0];
    phase.currentComponent = 'main_menu';
});

ctx.bthread('Play introductory movie', 'phase.movie', function (moviePhase) {
    sync({request: [movieStartEvent()]});
    let event = sync({waitFor: [movieEndEvent(), mouseClickEvent()]});
    if (event.name === 'movieEndEvent') {
        sync({request: [movieEndEvent()]});
    } else if (event.name === 'mouseClickEvent') {
        sync({request: [mouseClickEvent()]});
    }
});
/*
The main menu component will wait until the user selects a button. At that time, the user will be forwarded to one of the following: game sequence component, Denominators' web page, math umbrella component, or the question updater component depending on the button selected
*/
function gameSequenceButtonEvent() {
    return Event("gameSequenceButtonEvent");
}

function denominatorsWebButtonEvent() {
    return Event("denominatorsWebButtonEvent");
}

function mathUmbrellaButtonEvent() {
    return Event("mathUmbrellaButtonEvent");
}

function questionUpdaterButtonEvent() {
    return Event("questionUpdaterButtonEvent");
}

ctx.registerEffect('gameSequenceButtonEvent', function (data) {
    let phase = ctx.query('phase.mainMenu')[0];
    phase.currentComponent = 'game_sequence';
});

ctx.registerEffect('denominatorsWebButtonEvent', function (data) {
    // Assuming the effect to navigate to the Denominators' web page is handled elsewhere in the system
});

ctx.registerEffect('mathUmbrellaButtonEvent', function (data) {
    let phase = ctx.query('phase.mainMenu')[0];
    phase.currentComponent = 'math_umbrella';
});

ctx.registerEffect('questionUpdaterButtonEvent', function (data) {
    let phase = ctx.query('phase.mainMenu')[0];
    phase.currentComponent = 'question_updater';
});

ctx.bthread('Handle main menu selections', 'phase.mainMenu', function (mainMenuPhase) {
    let event = sync({waitFor: [gameSequenceButtonEvent(), denominatorsWebButtonEvent(), mathUmbrellaButtonEvent(), questionUpdaterButtonEvent()]});
    switch (event.name) {
        case 'gameSequenceButtonEvent':
            sync({request: [gameSequenceButtonEvent()]});
            break;
        case 'denominatorsWebButtonEvent':
            sync({request: [denominatorsWebButtonEvent()]});
            break;
        case 'mathUmbrellaButtonEvent':
            sync({request: [mathUmbrellaButtonEvent()]});
            break;
        case 'questionUpdaterButtonEvent':
            sync({request: [questionUpdaterButtonEvent()]});
            break;
    }
});
/*
The game sequence component will display a question, and then wait until the user chooses an answer. If the user selects the correct answer, a message to this effect will be displayed and the component will move to the next question. If its his first answer to the question he will receive 1 point. If the incorrect answer is selected, this component will inform the user of   this and give them another chance to answer the question. However, their score will not count this question as being answered correctly.  After the user has proceeded through a set number of questions, they will be directed to the ending scene component. 
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

function nextQuestionEvent() {
    return Event("nextQuestionEvent");
}

function moveToEndingSceneEvent() {
    return Event("moveToEndingSceneEvent");
}

ctx.registerEffect('answerSelectedEvent', function (data) {
    let question = ctx.getEntityById(data.questionId);
    let score = ctx.query('score')[0];
    if (data.selectedOptionIndex === question.rightOptionIndex) {
        if (!question.attempted) {
            score.value += 1;
            question.attempted = true;
        }
        sync({request: [correctAnswerEvent()]});
    } else {
        sync({request: [incorrectAnswerEvent()]});
    }
});

ctx.registerEffect('moveToEndingSceneEvent', function (data) {
    let phase = ctx.query('phase.gameSequence')[0];
    phase.currentComponent = 'ending_scene';
});

ctx.bthread('Game sequence logic', 'phase.gameSequence', function (gameSequencePhase) {
    const questions = ctx.query('question');
    let questionIndex = 0;
    while (questionIndex < questions.length) {
        let question = questions[questionIndex];
        sync({request: [displayQuestionEvent(question.id)]});
        let event = sync({waitFor: [answerSelectedEvent(question.id, any)]});
        if (event.data.selectedOptionIndex === question.rightOptionIndex) {
            sync({waitFor: [correctAnswerEvent()]});
            questionIndex++;
            if (questionIndex < questions.length) {
                sync({request: [nextQuestionEvent()]});
            } else {
                sync({request: [moveToEndingSceneEvent()]});
                break;
            }
        } else {
            sync({waitFor: [incorrectAnswerEvent()]});
        }
    }
});
/*
The ending scene will wait until the user selects either to return to the main menu or to exit the game. After receiving the user's input, the component will act accordingly.
*/
function returnToMainMenuEvent() {
    return Event("returnToMainMenuEvent");
}

function exitGameEvent() {
    return Event("exitGameEvent");
}

ctx.registerEffect('returnToMainMenuEvent', function (data) {
    let phase = ctx.query('phase.endingScene')[0];
    phase.currentComponent = 'main_menu';
});

ctx.registerEffect('exitGameEvent', function (data) {
    // Assuming the effect to exit the game is handled elsewhere in the system
});

ctx.bthread('Handle ending scene selections', 'phase.endingScene', function (endingScenePhase) {
    let event = sync({waitFor: [returnToMainMenuEvent(), exitGameEvent()]});
    if (event.name === 'returnToMainMenuEvent') {
        sync({request: [returnToMainMenuEvent()]});
    } else if (event.name === 'exitGameEvent') {
        sync({request: [exitGameEvent()]});
    }
});
/*
The Question Updater component will wait for the user to submit new questions. After the button is clicked, the component will add the new question to the question database. 
*/
function submitNewQuestionEvent(content, options, rightOptionIndex) {
    return Event("submitNewQuestionEvent", {content: content, options: options, rightOptionIndex: rightOptionIndex});
}

ctx.registerEffect('submitNewQuestionEvent', function (data) {
    let newQuestionId = `q${ctx.query('question').length + 1}`; // Generate a new question ID based on the number of existing questions
    ctx.populateContext([
        question(newQuestionId, data.content, data.options, data.rightOptionIndex)
    ]);
});

ctx.bthread('Add new question on submit', 'phase.questionUpdater', function (questionUpdaterPhase) {
    sync({waitFor: [submitNewQuestionEvent(any)]});
});
/*
The Math Umbrella component will wait for a user to click a link, and then follow that link.
*/
function linkClickedEvent(linkUrl) {
    return Event("linkClickedEvent", {linkUrl: linkUrl});
}

ctx.registerEffect('linkClickedEvent', function (data) {
    // Assuming the effect to follow the link is handled elsewhere in the system
});

ctx.bthread('Follow link on click', 'phase.mathUmbrella', function (mathUmbrellaPhase) {
    sync({waitFor: [linkClickedEvent(any)]});
});
