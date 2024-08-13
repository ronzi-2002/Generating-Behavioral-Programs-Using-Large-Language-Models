//A question has its content, 4 options and the index of the right option
function question(id, content, options, rightOptionIndex) {
    return ctx.Entity(id, 'question', {content: content, options: options, rightOptionIndex: rightOptionIndex});
}
//Generate 4 questions about the USA history(place the right answer at a random position)
ctx.populateContext([
    question('q1', 'Who was the first President of the United States?', ['George Washington', 'Thomas Jefferson', 'Abraham Lincoln', 'Theodore Roosevelt'], 0),
    question('q2', 'What year did the American Civil War begin?', ['1850', '1861', '1877', '1845'], 1),
    question('q3', 'Which document declared the independence of the United States?', ['The Constitution', 'The Bill of Rights', 'The Declaration of Independence', 'The Emancipation Proclamation'], 2),
    question('q4', 'Who was the President during the Louisiana Purchase?', ['John Adams', 'Andrew Jackson', 'James Monroe', 'Thomas Jefferson'], 3)
]);
//In addition there is a phase to the game that holds the current component, which is "game_start' at the beginning
function phase(id, currentComponent) {
    return ctx.Entity(id, 'phase', {currentComponent: currentComponent});
}

ctx.populateContext([
    phase('gamePhase1', 'game_start')
]);
/*
queries needed:
a query for each phase of the game(start, movie, main menu, game sequence, ending scene, question updater, math umbrella ) 
  
*/
ctx.registerQuery('phase.gameStart', entity => entity.type == 'phase' && entity.currentComponent == 'game_start');
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

ctx.bthread('Move to movie component on start button click', 'phase.gameStart', function (phase) {
    sync({waitFor: [startButtonClickEvent()]});
    sync({request: [changePhaseEvent(phase.id, 'movie')]});
});
/*
Upon entrance to the movie component, the introductory movie will begin playing.
If a mouse click is received, this component will terminate the movie and forward 
the user to the main menu component. 
Otherwise, the movie will continue to its completion and the user will be moved to the main menu. 
*/
function movieStartEvent(phaseId) {
    return Event("movieStartEvent", {phaseId: phaseId});
}

function movieEndEvent(phaseId) {
    return Event("movieEndEvent", {phaseId: phaseId});
}

function mouseClickEvent() {
    return Event("mouseClickEvent");
}

ctx.bthread('Handle movie component behavior', 'phase.movie', function (phase) {
    sync({request: [movieStartEvent(phase.id)]});
    let event = sync({waitFor: [mouseClickEvent(), movieEndEvent(phase.id)]});
    if (event.name === 'mouseClickEvent') {
        // Terminate the movie if it's still playing
    }
    sync({request: [changePhaseEvent(phase.id, 'main_menu')]});
});
//The main menu component will wait until the user selects a button. At that time, the user will be forwarded to one of the following: game sequence component, Denominators' web page, math umbrella component, or the question updater component depending on the button selected
function mainMenuSelectionEvent(selection) {
    return Event("mainMenuSelectionEvent", {selection: selection});
}

ctx.bthread('Handle main menu selections', 'phase.mainMenu', function (phase) {
    while (true) {
        let event = sync({waitFor: [mainMenuSelectionEvent()]});
        switch (event.data.selection) {
            case 'gameSequence':
                sync({request: [changePhaseEvent(phase.id, 'game_sequence')]});
                break;
            case 'denominatorsWeb':
                // Open Denominators' web page
                break;
            case 'mathUmbrella':
                sync({request: [changePhaseEvent(phase.id, 'math_umbrella')]});
                break;
            case 'questionUpdater':
                sync({request: [changePhaseEvent(phase.id, 'question_updater')]});
                break;
        }
    }
});
//The game sequence component will display a question, and then wait until the user chooses an answer. If the user selects the correct answer, a message to this effect will be displayed and the component will move to the next question. If its his first answer to the question he will receive 1 point. If the incorrect answer is selected, this component will inform the user of   this and give them another chance to answer the question. However, their score will not count this question as being answered correctly.  After the user has proceeded through a set number of questions, they will be directed to the ending scene component. 
function displayQuestionEvent(questionId) {
    return Event("displayQuestionEvent", {questionId: questionId});
}

function answerSelectedEvent(questionId, selectedOption) {
    return Event("answerSelectedEvent", {questionId: questionId, selectedOption: selectedOption});
}

function correctAnswerEvent(questionId) {
    return Event("correctAnswerEvent", {questionId: questionId});
}

function incorrectAnswerEvent(questionId) {
    return Event("incorrectAnswerEvent", {questionId: questionId});
}

function updateScoreEvent(points) {
    return Event("updateScoreEvent", {points: points});
}

ctx.registerEffect('updateScoreEvent', function (data) {
    let player = ctx.getEntityById('player'); // Assuming player entity exists
    player.score += data.points;
});

ctx.bthread('Handle game sequence logic', 'phase.gameSequence', function (phase) {
    const questions = ctx.getEntitiesByType('question');
    let questionIndex = 0;
    let firstAttempt = true;

    while (questionIndex < questions.length) {
        sync({request: [displayQuestionEvent(questions[questionIndex].id)]});
        let event = sync({waitFor: [answerSelectedEvent(questions[questionIndex].id)]});

        if (event.data.selectedOption === questions[questionIndex].rightOptionIndex) {
            sync({request: [correctAnswerEvent(questions[questionIndex].id)]});
            if (firstAttempt) {
                sync({request: [updateScoreEvent(1)]});
            }
            questionIndex++;
            firstAttempt = true; // Reset for next question
        } else {
            sync({request: [incorrectAnswerEvent(questions[questionIndex].id)]});
            firstAttempt = false;
        }
    }

    sync({request: [changePhaseEvent(phase.id, 'ending_scene')]});
});
//The ending scene will wait until the user selects either to return to the main menu or to exit the game. After receiving the user's input, the component will act accordingly.
function endingSceneSelectionEvent(selection) {
    return Event("endingSceneSelectionEvent", {selection: selection});
}

ctx.bthread('Handle ending scene selections', 'phase.endingScene', function (phase) {
    let event = sync({waitFor: [endingSceneSelectionEvent()]});
    switch (event.data.selection) {
        case 'mainMenu':
            sync({request: [changePhaseEvent(phase.id, 'main_menu')]});
            break;
        case 'exitGame':
            // Handle game exit logic
            break;
    }
});
//The Question Updater component will wait for the user to submit new questions. After the button is clicked, the component will add the new question to the question database. 
function submitNewQuestionEvent(questionId, content, options, rightOptionIndex) {
    return Event("submitNewQuestionEvent", {questionId: questionId, content: content, options: options, rightOptionIndex: rightOptionIndex});
}

ctx.bthread('Handle new question submissions', 'phase.questionUpdater', function (phase) {
    while (true) {
        let event = sync({waitFor: [submitNewQuestionEvent()]});
        ctx.populateContext([
            question(event.data.questionId, event.data.content, event.data.options, event.data.rightOptionIndex)
        ]);
    }
});
//The Math Umbrella component will wait for a user to click a link, and then follow that link.
function linkClickEvent(url) {
    return Event("linkClickEvent", {url: url});
}

ctx.bthread('Handle link clicks in Math Umbrella component', 'phase.mathUmbrella', function (phase) {
    let event = sync({waitFor: [linkClickEvent()]});
    // Follow the link specified in the event
    // This is a placeholder for the action to follow the link
});
