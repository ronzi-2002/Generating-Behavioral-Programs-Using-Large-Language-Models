//A question has its content, 4 options and the index of the right option
function question(id, content, options, rightOptionIndex) {
    return ctx.Entity(id, 'question', {content: content, options: options, rightOptionIndex: rightOptionIndex})
}
//Generate 4 questions about the USA history(place the right answer at a random position)
function question(id, content, options, rightOptionIndex) {
    return ctx.Entity(id, 'question', {content: content, options: options, rightOptionIndex: rightOptionIndex})
}

ctx.populateContext([
    question('q1', 'Who was the first President of the United States?', ['George Washington', 'Thomas Jefferson', 'Abraham Lincoln', 'John Adams'], 0),
    question('q2', 'What year did the American Civil War begin?', ['1850', '1861', '1877', '1845'], 1),
    question('q3', 'Which event marked the end of the American Revolution?', ['Signing of the Constitution', 'Battle of Yorktown', 'Boston Tea Party', 'Declaration of Independence'], 1),
    question('q4', 'What is the supreme law of the land in the United States?', ['The Declaration of Independence', 'The Emancipation Proclamation', 'The Constitution', 'The Federalist Papers'], 2)
])
//In addition there is a phase to the game that holds the current component, which is "game_start' at the beginning. And a score entity( score value is 0 at the beginning)
function phase(id, currentComponent) {
    return ctx.Entity(id, 'phase', {currentComponent: currentComponent})
}

function score(id, value) {
    return ctx.Entity(id, 'score', {value: value})
}

ctx.populateContext([
    phase('phase1', 'game_start'),
    score('score1', 0)
])
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
//At the start of the game, When the user clicks on the start button, the game will move to the movie component. 
function startButtonClickEvent() {
    return Event("startButtonClickEvent");
}

function changePhaseEvent(phaseId, newComponent) {
    return Event("changePhaseEvent", {phaseId: phaseId, newComponent: newComponent});
}

ctx.registerEffect('changePhaseEvent', function (data) {
    let phase = ctx.getEntityById(data.phaseId);
    phase.currentComponent = data.newComponent;
});

ctx.bthread('Move to movie component on start button click', 'phase.start', function (phase) {
    sync({waitFor: [startButtonClickEvent()]});
    sync({request: [changePhaseEvent(phase.id, 'movie')]});
});
/*
Upon entrance to the movie component, the introductory movie will begin playing.
If a mouse click is received, this component will terminate the movie and forward 
the user to the main menu component. 
Otherwise, the movie will continue to its completion and the user will be moved to the main menu. 
*/
function mouseClickEvent() {
    return Event("mouseClickEvent");
}

function movieCompleteEvent() {
    return Event("movieCompleteEvent");
}

ctx.bthread('Handle movie component interactions', 'phase.movie', function (phase) {
    let event = sync({waitFor: [mouseClickEvent(), movieCompleteEvent()]});
    if (event.name === "mouseClickEvent") {
        // Terminate the movie early
    }
    sync({request: [changePhaseEvent(phase.id, 'main_menu')]});
});
//The main menu component will wait until the user selects a button. At that time, the user will be forwarded to one of the following: game sequence component, Denominators' web page, math umbrella component, or the question updater component depending on the button selected
function gameSequenceButtonEvent() {
    return Event("gameSequenceButtonEvent");
}

function denominatorsWebPageButtonEvent() {
    return Event("denominatorsWebPageButtonEvent");
}

function mathUmbrellaButtonEvent() {
    return Event("mathUmbrellaButtonEvent");
}

function questionUpdaterButtonEvent() {
    return Event("questionUpdaterButtonEvent");
}

ctx.bthread('Handle main menu selections', 'phase.mainMenu', function (phase) {
    let event = sync({waitFor: [gameSequenceButtonEvent(), denominatorsWebPageButtonEvent(), mathUmbrellaButtonEvent(), questionUpdaterButtonEvent()]});
    switch (event.name) {
        case "gameSequenceButtonEvent":
            sync({request: [changePhaseEvent(phase.id, 'game_sequence')]});
            break;
        case "denominatorsWebPageButtonEvent":
            // Redirect to Denominators' web page
            break;
        case "mathUmbrellaButtonEvent":
            sync({request: [changePhaseEvent(phase.id, 'math_umbrella')]});
            break;
        case "questionUpdaterButtonEvent":
            sync({request: [changePhaseEvent(phase.id, 'question_updater')]});
            break;
    }
});
//The game sequence component will display a question, and then wait until the user chooses an answer. If the user selects the correct answer, a message to this effect will be displayed and the component will move to the next question. If its his first answer to the question he will receive 1 point. If the incorrect answer is selected, this component will inform the user of   this and give them another chance to answer the question. However, their score will not count this question as being answered correctly.  After the user has proceeded through a set number of questions, they will be directed to the ending scene component. 
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

function updateScoreEvent(scoreId, increment) {
    return Event("updateScoreEvent", {scoreId: scoreId, increment: increment});
}

ctx.registerEffect('updateScoreEvent', function (data) {
    let score = ctx.getEntityById(data.scoreId);
    score.value += data.increment;
});

ctx.bthread('Game sequence interactions', 'phase.gameSequence', function (phase) {
    const questions = getEntitiesByType('question'); // Assuming this function exists to fetch all questions
    let questionIndex = 0;
    let firstAttempt = true;

    while (questionIndex < questions.length) {
        sync({request: [displayQuestionEvent(questions[questionIndex].id)]});
        let answerEvent = sync({waitFor: [answerSelectedEvent(questions[questionIndex].id)]});
        if (answerEvent.data.selectedOptionIndex === questions[questionIndex].rightOptionIndex) {
            sync({request: [correctAnswerEvent()]});
            if (firstAttempt) {
                sync({request: [updateScoreEvent('score1', 1)]}); // Assuming 'score1' is the ID of the score entity
            }
            questionIndex++;
            firstAttempt = true; // Reset for next question
        } else {
            sync({request: [incorrectAnswerEvent()]});
            firstAttempt = false;
        }
    }

    sync({request: [changePhaseEvent(phase.id, 'ending_scene')]});
});
//The ending scene will wait until the user selects either to return to the main menu or to exit the game. After receiving the user's input, the component will act accordingly.
function returnToMainMenuEvent() {
    return Event("returnToMainMenuEvent");
}

function exitGameEvent() {
    return Event("exitGameEvent");
}

ctx.bthread('Handle ending scene interactions', 'phase.endingScene', function (phase) {
    let event = sync({waitFor: [returnToMainMenuEvent(), exitGameEvent()]});
    if (event.name === "returnToMainMenuEvent") {
        sync({request: [changePhaseEvent(phase.id, 'main_menu')]});
    } else if (event.name === "exitGameEvent") {
        // Handle game exit logic
    }
});
//The Question Updater component will wait for the user to submit new questions. After the button is clicked, the component will add the new question to the question database. 
function submitNewQuestionEvent(questionId, content, options, rightOptionIndex) {
    return Event("submitNewQuestionEvent", {questionId: questionId, content: content, options: options, rightOptionIndex: rightOptionIndex});
}

ctx.registerEffect('submitNewQuestionEvent', function (data) {
    ctx.populateContext([
        question(data.questionId, data.content, data.options, data.rightOptionIndex)
    ]);
});

ctx.bthread('Handle new question submissions', 'phase.questionUpdater', function (phase) {
    while (true) {
        let event = sync({waitFor: [submitNewQuestionEvent()]});
        // New question is automatically added to the database via the registered effect
    }
});
//The Math Umbrella component will wait for a user to click a link, and then follow that link.
function linkClickedEvent(url) {
    return Event("linkClickedEvent", {url: url});
}

ctx.bthread('Handle link clicks in Math Umbrella component', 'phase.mathUmbrella', function (phase) {
    while (true) {
        let event = sync({waitFor: [linkClickedEvent()]});
        // Follow the link specified in the event data
        // This is a placeholder for actual link navigation logic
    }
});
