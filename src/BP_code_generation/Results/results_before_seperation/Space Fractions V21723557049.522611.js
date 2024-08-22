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
    question('q3', 'Which document declared the independence of the United States?', ['The Constitution', 'The Bill of Rights', 'The Declaration of Independence', 'The Federalist Papers'], 2),
    question('q4', 'Who purchased the Louisiana Territory from France?', ['Benjamin Franklin', 'John Adams', 'Thomas Jefferson', 'George Washington'], 2)
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

// 1. Time Aspect:
// No time aspect involved.

// 2. Many Events Requested:
// No, only one event is requested.

// 3. Effects:
// Yes, the phase entity is updated. The event to change the phase to 'movie' is requested.

// 4. Bthread Context:
// Specific context for the start phase. Query used: 'phase.start'

// 5. Waiting for an Event:
// Waiting for a specific event, the start button click.

//Implementation
function startButtonClickEvent() {
    return Event("startButtonClickEvent");
}

function changePhaseToMovieEvent() {
    return Event("changePhaseToMovieEvent");
}

ctx.registerEffect('changePhaseToMovieEvent', function (data) {
    let phaseEntity = ctx.getEntityById(data.phaseId);
    phaseEntity.currentComponent = 'movie';
});

ctx.bthread('Move to movie component on start button click', 'phase.start', function (phase) {
    sync({waitFor: [startButtonClickEvent()]});
    sync({request: [changePhaseToMovieEvent({phaseId: phase.id})]});
});

/*
Upon entrance to the movie component, the introductory movie will begin playing.
If a mouse click is received, this component will terminate the movie and forward 
the user to the main menu component. 
Otherwise, the movie will continue to its completion and the user will be moved to the main menu. 
*/

// 1. Is there a time aspect involved?
//    No time aspect related to the duration of an event or query, or a specific time requirement.

// 2. Are there many events requested at once?
//    No, only one event is requested at a time.

// 3. Effects:
//    Yes, changing the phase component is an effect on the phase entity.
//    Relevant entity: phase
//    Event with effect: changePhaseToMainMenuEvent

// 4. Bthread Context:
//    Specific context for the bthread is phase.movie.

// 5. Are you waiting for a:
//    Waiting for a specific event (mouseClickEvent) and an event marking the end of the movie (movieCompleteEvent).

// 6. Does Your Loop has some sync it will surely meet?
//    Yes, the loop will meet either the mouse click or the movie completion event.

// 7. Which Events are needed?
//    Needed Events: mouseClickEvent, movieCompleteEvent, changePhaseToMainMenuEvent.
//    Don't Declare the Events: changePhaseToMovieEvent because it already exists.

//Implementation
function mouseClickEvent() {
    return Event("mouseClickEvent");
}

function movieCompleteEvent() {
    return Event("movieCompleteEvent");
}

function changePhaseToMainMenuEvent(phaseId) {
    return Event("changePhaseToMainMenuEvent", {phaseId: phaseId});
}

ctx.registerEffect('changePhaseToMainMenuEvent', function (data) {
    let phaseEntity = ctx.getEntityById(data.phaseId);
    phaseEntity.currentComponent = 'main_menu';
});

ctx.bthread('Handle movie component interactions', 'phase.movie', function (phase) {
    let event = sync({waitFor: [mouseClickEvent(), movieCompleteEvent()]});
    sync({request: [changePhaseToMainMenuEvent(phase.id)]});
});

//The main menu component will wait until the user selects a button. At that time, the user will be forwarded to one of the following: game sequence component, Denominators' web page, math umbrella component, or the question updater component depending on the button selected

// 1. Time Aspect:
//    No time aspect involved.

// 2. Multiple Events Request:
//    No multiple events requested at once.

// 3. Effects:
//    No effects involved as no state change of entities is required.

// 4. Bthread Context:
//    Specific context: phase.mainMenu

// 5. Waiting for Events:
//    Waiting for a specific event based on user interaction.

// 6. Loop Sync:
//    The loop will meet a sync as it waits for user interaction.

// 7. Needed Events:
//    Needed Events: gameSequenceButtonEvent(), denominatorsWebPageButtonEvent(), mathUmbrellaButtonEvent(), questionUpdaterButtonEvent().
//    Don't Declare the Events: None, all events are new.

//Implementation
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

function changePhaseToGameSequenceEvent(phaseId) {
    return Event("changePhaseToGameSequenceEvent", {phaseId: phaseId});
}

function changePhaseToMathUmbrellaEvent(phaseId) {
    return Event("changePhaseToMathUmbrellaEvent", {phaseId: phaseId});
}

function changePhaseToQuestionUpdaterEvent(phaseId) {
    return Event("changePhaseToQuestionUpdaterEvent", {phaseId: phaseId});
}

ctx.registerEffect('changePhaseToGameSequenceEvent', function (data) {
    let phaseEntity = ctx.getEntityById(data.phaseId);
    phaseEntity.currentComponent = 'game_sequence';
});

ctx.registerEffect('changePhaseToMathUmbrellaEvent', function (data) {
    let phaseEntity = ctx.getEntityById(data.phaseId);
    phaseEntity.currentComponent = 'math_umbrella';
});

ctx.registerEffect('changePhaseToQuestionUpdaterEvent', function (data) {
    let phaseEntity = ctx.getEntityById(data.phaseId);
    phaseEntity.currentComponent = 'question_updater';
});

ctx.bthread('Handle main menu selections', 'phase.mainMenu', function (phase) {
    let event = sync({waitFor: [gameSequenceButtonEvent(), denominatorsWebPageButtonEvent(), mathUmbrellaButtonEvent(), questionUpdaterButtonEvent()]});
    switch (event.name) {
        case 'gameSequenceButtonEvent':
            sync({request: [changePhaseToGameSequenceEvent(phase.id)]});
            break;
        case 'denominatorsWebPageButtonEvent':
            // Open Denominators' web page
            window.open("http://denominators.com");
            break;
        case 'mathUmbrellaButtonEvent':
            sync({request: [changePhaseToMathUmbrellaEvent(phase.id)]});
            break;
        case 'questionUpdaterButtonEvent':
            sync({request: [changePhaseToQuestionUpdaterEvent(phase.id)]});
            break;
    }
});

//The game sequence component will display a question, and then wait until the user chooses an answer. If the user selects the correct answer, a message to this effect will be displayed and the component will move to the next question. If its his first answer to the question he will receive 1 point. If the incorrect answer is selected, this component will inform the user of   this and give them another chance to answer the question. However, their score will not count this question as being answered correctly.  After the user has proceeded through a set number of questions, they will be directed to the ending scene component. 

// 1. Time aspect:
   No time aspect involved.

// 2. Many events requested at once:
   No, only one event is requested at a time based on user interaction.

// 3. Effects:
   Yes, updating the score entity is needed when the user answers correctly for the first time.
   Relevant entity: score
   Event with effect: updateScoreEvent

// 4. Bthread Context:
   Specific context: phase.gameSequence
   Query: phase.gameSequence

// 5. Waiting for:
   Waiting for a specific event: user selects an answer.

// 6. Loop sync:
   The loop will always meet a sync with user interaction events.

// 7. Needed Events:
   Needed Events: answerSelectedEvent, updateScoreEvent, displayMessageEvent, changeQuestionEvent, changePhaseToEndingSceneEvent
   Don't Declare the Events: None, all events are new.

// Implementation
function answerSelectedEvent(questionId, selectedOptionIndex) {
    return Event("answerSelectedEvent", {questionId: questionId, selectedOptionIndex: selectedOptionIndex});
}

function updateScoreEvent(scoreId, increment) {
    return Event("updateScoreEvent", {scoreId: scoreId, increment: increment});
}

function displayMessageEvent(message) {
    return Event("displayMessageEvent", {message: message});
}

function changeQuestionEvent() {
    return Event("changeQuestionEvent");
}

function changePhaseToEndingSceneEvent(phaseId) {
    return Event("changePhaseToEndingSceneEvent", {phaseId: phaseId});
}

ctx.registerEffect('updateScoreEvent', function (data) {
    let scoreEntity = ctx.getEntityById(data.scoreId);
    scoreEntity.value += data.increment;
});

ctx.bthread('Game sequence interactions', 'phase.gameSequence', function (phase) {
    let questionsAnswered = 0;
    let correctAnswers = 0;
    const totalQuestions = 5; // Assuming there are 5 questions to be answered
    while (questionsAnswered < totalQuestions) {
        let event = sync({waitFor: [answerSelectedEvent()]});
        let question = ctx.getEntityById(event.data.questionId);
        if (event.data.selectedOptionIndex === question.rightOptionIndex) {
            if (correctAnswers === 0) { // First correct answer
                sync({request: [updateScoreEvent('score1', 1)]});
            }
            correctAnswers++;
            sync({request: [displayMessageEvent("Correct answer!")]});
        } else {
            sync({request: [displayMessageEvent("Incorrect answer, try again.")]});
        }
        questionsAnswered++;
        if (questionsAnswered < totalQuestions) {
            sync({request: [changeQuestionEvent()]});
        }
    }
    sync({request: [changePhaseToEndingSceneEvent(phase.id)]});
});

//The ending scene will wait until the user selects either to return to the main menu or to exit the game. After receiving the user's input, the component will act accordingly.

// 1. Is there a time aspect involved?
//    No time aspect involved.

// 2. Are there many events requested at once?
//    No, only one event is requested based on user input.

// 3. Effects:
//    No effects are involved as no entity state is changed directly by events.

// 4. Bthread Context:
//    The specific context for this bthread is the ending scene phase. Query used: phase.endingScene

// 5. Are you waiting for a:
//    Waiting for a specific event based on user input.

// 6. Does Your Loop has some sync it will surely meet?
//    Yes, the loop will meet a sync based on user input.

// 7. Which Events are needed?
//    Needed Events: returnToMainMenuEvent(), exitGameEvent().
//    Don't Declare the Events: None, because they do not exist yet.

// Implementation
function returnToMainMenuEvent(phaseId) {
    return Event("returnToMainMenuEvent", {phaseId: phaseId});
}

function exitGameEvent() {
    return Event("exitGameEvent");
}

ctx.bthread('Handle ending scene user choices', 'phase.endingScene', function (phase) {
    let event = sync({waitFor: [returnToMainMenuEvent(phase.id), exitGameEvent()]});
    if (event.name === 'returnToMainMenuEvent') {
        sync({request: [changePhaseToMainMenuEvent(phase.id)]});
    } else if (event.name === 'exitGameEvent') {
        // Exit the game, possibly close the application or navigate away
    }
});

//The Question Updater component will wait for the user to submit new questions. After the button is clicked, the component will add the new question to the question database. 

// 1. Time Aspect:
// No time aspect involved.

// 2. Multiple Events Requested:
// No multiple events are requested at once.

// 3. Effects:
// Yes, there is an effect involved. The effect is adding a new question to the database.
// Relevant entity: question
// Event with effect: submitNewQuestionEvent

// 4. Bthread Context:
// Specific context: phase.questionUpdater

// 5. Waiting for:
// Waiting for a specific event: submitNewQuestionEvent

// 6. Loop Sync:
// The loop will meet the sync condition of waiting for the submitNewQuestionEvent.

// 7. Needed Events:
// Needed Events: submitNewQuestionEvent
// Don't Declare the Events: None, all needed events are new.

// Implementation
function submitNewQuestionEvent(content, options, rightOptionIndex) {
    return Event("submitNewQuestionEvent", {content: content, options: options, rightOptionIndex: rightOptionIndex});
}

ctx.registerEffect('submitNewQuestionEvent', function (data) {
    ctx.populateContext([
        question(ctx.generateId(), data.content, data.options, data.rightOptionIndex)
    ]);
});

ctx.bthread('Add new question on submit', 'phase.questionUpdater', function () {
    while (true) {
        let event = sync({waitFor: [submitNewQuestionEvent()]});
        sync({request: [submitNewQuestionEvent(event.data.content, event.data.options, event.data.rightOptionIndex)]});
    }
});

//The Math Umbrella component will wait for a user to click a link, and then follow that link.

// Analysis:
// 1. Time Aspect:
//    No time aspect involved.

// 2. Multiple Events Requested:
//    No multiple events are requested at once.

// 3. Effects:
//    No effects are involved as no state of an entity is changed.

// 4. Bthread Context:
//    Specific context for the bthread is 'phase.mathUmbrella'.

// 5. Waiting for:
//    Waiting for a specific event, which is a user clicking a link.

// 6. Loop Sync:
//    The loop will meet a sync with the link click event.

// 7. Needed Events:
//    Needed Events: linkClickEvent(url).
//    Don't Declare the Events: None, because linkClickEvent does not exist yet.

// Implementation:
function linkClickEvent(url) {
    return Event("linkClickEvent", {url: url});
}

ctx.bthread('Follow link on user click', 'phase.mathUmbrella', function () {
    while (true) {
        let event = sync({waitFor: [linkClickEvent()]});
        window.location.href = event.data.url; // Follow the link
    }
});

