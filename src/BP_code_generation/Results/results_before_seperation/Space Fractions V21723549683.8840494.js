//A question has its content, 4 options and the index of the right option
function question(id, content, options, rightOptionIndex) {
    return ctx.Entity(id, 'question', {content: content, options: options, rightOptionIndex: rightOptionIndex});
}
//Generate 4 questions about the USA history(place the right answer at a random position)
ctx.populateContext([
    question('q1', 'Who was the first President of the United States?', ['George Washington', 'Thomas Jefferson', 'Abraham Lincoln', 'Theodore Roosevelt'], 0),
    question('q2', 'What year did the United States declare independence?', ['1776', '1804', '1812', '1765'], 0),
    question('q3', 'Which event marked the end of the American Civil War?', ['Battle of Gettysburg', 'Signing of the Emancipation Proclamation', 'Lee\'s Surrender at Appomattox Court House', 'The Battle of Fort Sumter'], 2),
    question('q4', 'What is the supreme law of the land in the United States?', ['The Declaration of Independence', 'The Federalist Papers', 'The Constitution', 'The Emancipation Proclamation'], 2)
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

// 2. Multiple Events Requested:
// No multiple events requested.

// 3. Effects:
// Yes, changing the phase of the game. Relevant entity: phase. Event with effect: startGameEvent.

// 4. Bthread Context:
// Specific context: phase.start. Query used: phase.start.

// 5. Waiting for Event:
// Waiting for a specific event: startGameEvent.

// 6. Loop Sync:
// The loop has a sync that will surely meet: waiting for startGameEvent.

//Implementation
function startGameEvent() {
    return Event("startGameEvent");
}

ctx.registerEffect('startGameEvent', function (data) {
    let phaseEntity = ctx.getEntitiesByType('phase')[0]; // Assuming there's only one phase entity
    phaseEntity.currentComponent = 'movie';
});

ctx.bthread('Move to movie component on game start', 'phase.start', function (phase) {
    sync({waitFor: [startGameEvent()]});
});

/*
Upon entrance to the movie component, the introductory movie will begin playing.
If a mouse click is received, this component will terminate the movie and forward 
the user to the main menu component. 
Otherwise, the movie will continue to its completion and the user will be moved to the main menu. 
*/

// Analysis:
// 1. Time Aspect:
//    There is a time aspect related to the length of the movie, which is the duration of an event.
//    Action: Declare a new specific event for the movie completion.

// 2. Multiple Events Requested:
//    No multiple events are requested at once.

// 3. Effects:
//    There is an effect involved as the phase entity needs to change its currentComponent to 'main_menu'.
//    Relevant entity: phase
//    Event with effect: movieCompletedEvent

// 4. Bthread Context:
//    The context is specific to the movie phase.
//    Query: phase.movie

// 5. Waiting for Events:
//    Waiting for a specific event (mouse click) and a new event for movie completion.
//    Action: Use anyEventNameWithData if needed, but here exact events are known.

// 6. Loop Sync:
//    The loop will meet a sync with the movie completion or mouse click event.

// 7. Needed Events:
//    Needed Events: movieCompletedEvent, mouseClickEvent.
//    Don't Declare the Events: None, as they do not exist yet.

// Implementation
function movieCompletedEvent() {
    return Event("movieCompletedEvent");
}

function mouseClickEvent() {
    return Event("mouseClickEvent");
}

ctx.registerEffect('movieCompletedEvent', function (data) {
    let phaseEntity = ctx.getEntitiesByType('phase')[0]; // Assuming there's only one phase entity
    phaseEntity.currentComponent = 'main_menu';
});

ctx.bthread('Handle movie component behavior', 'phase.movie', function (phase) {
    let event = sync({waitFor: [movieCompletedEvent(), mouseClickEvent()]});
    if (event.name === 'movieCompletedEvent' || event.name === 'mouseClickEvent') {
        sync({request: [movieCompletedEvent()]});
    }
});

//The main menu component will wait until the user selects a button. At that time, the user will be forwarded to one of the following: game sequence component, Denominators' web page, math umbrella component, or the question updater component depending on the button selected

// Analysis:
// 1. Time Aspect:
//    No time aspect involved.
// 2. Multiple Events Requested:
//    No multiple events requested at once.
// 3. Effects:
//    No effects involved as no state change of entities is required.
// 4. Bthread Context:
//    Specific context: phase.mainMenu
// 5. Waiting for Events:
//    Waiting for a specific event based on user interaction.
// 6. Loop Sync:
//    The loop will meet a sync with user interaction events.
// 7. Needed Events:
//    Needed Events: gameSequenceEvent, denominatorsWebPageEvent, mathUmbrellaEvent, questionUpdaterEvent.
//    Don't Declare the Events: None, all events are new.

// Implementation
function gameSequenceEvent() {
    return Event("gameSequenceEvent");
}

function denominatorsWebPageEvent() {
    return Event("denominatorsWebPageEvent");
}

function mathUmbrellaEvent() {
    return Event("mathUmbrellaEvent");
}

function questionUpdaterEvent() {
    return Event("questionUpdaterEvent");
}

ctx.bthread('Main menu interaction', 'phase.mainMenu', function (phase) {
    let event = sync({waitFor: [gameSequenceEvent(), denominatorsWebPageEvent(), mathUmbrellaEvent(), questionUpdaterEvent()]});
    switch (event.name) {
        case 'gameSequenceEvent':
            phase.currentComponent = 'game_sequence';
            break;
        case 'denominatorsWebPageEvent':
            // Redirect to Denominators' web page
            break;
        case 'mathUmbrellaEvent':
            phase.currentComponent = 'math_umbrella';
            break;
        case 'questionUpdaterEvent':
            phase.currentComponent = 'question_updater';
            break;
    }
});

//The game sequence component will display a question, and then wait until the user chooses an answer. If the user selects the correct answer, a message to this effect will be displayed and the component will move to the next question. If its his first answer to the question he will receive 1 point. If the incorrect answer is selected, this component will inform the user of   this and give them another chance to answer the question. However, their score will not count this question as being answered correctly.  After the user has proceeded through a set number of questions, they will be directed to the ending scene component. 

// Analysis:
// 1. Time Aspect:
//    No time aspect involved.
// 2. Multiple Events Requested:
//    No multiple events requested simultaneously.
// 3. Effects:
//    No effects on entities are required as per the given requirement.
// 4. Bthread Context:
//    Specific context: phase.gameSequence
// 5. Waiting for Events:
//    Waiting for a specific event based on user interaction.
// 6. Loop Sync:
//    The loop will always meet a sync condition based on user interaction.
// 7. Needed Events:
//    Needed Events: answerSelectedEvent, moveToNextQuestionEvent, endGameSequenceEvent, displayCorrectAnswerEvent, displayIncorrectAnswerEvent.
//    Don't Declare the Events: None of these events exist yet.

// Implementation:
function answerSelectedEvent(questionId, selectedOptionIndex) {
    return Event("answerSelectedEvent", {questionId: questionId, selectedOptionIndex: selectedOptionIndex});
}

function moveToNextQuestionEvent() {
    return Event("moveToNextQuestionEvent");
}

function endGameSequenceEvent() {
    return Event("endGameSequenceEvent");
}

function displayCorrectAnswerEvent() {
    return Event("displayCorrectAnswerEvent");
}

function displayIncorrectAnswerEvent() {
    return Event("displayIncorrectAnswerEvent");
}

ctx.bthread('Game sequence interaction', 'phase.gameSequence', function (phase) {
    let questions = ctx.getEntitiesByType('question'); // Assuming we have a way to fetch questions
    let questionIndex = 0;
    let attempts = 0;

    while (questionIndex < questions.length) {
        let question = questions[questionIndex];
        let event = sync({waitFor: [answerSelectedEvent(question.id, any)]});

        if (event.data.selectedOptionIndex === question.rightOptionIndex) {
            sync({request: [displayCorrectAnswerEvent()]});
            if (attempts === 0) {
                // Increment score by 1
            }
            questionIndex++;
            attempts = 0;
            sync({request: [moveToNextQuestionEvent()]});
        } else {
            sync({request: [displayIncorrectAnswerEvent()]});
            attempts++;
        }
    }

    sync({request: [endGameSequenceEvent()]});
});

//The ending scene will wait until the user selects either to return to the main menu or to exit the game. After receiving the user's input, the component will act accordingly.

// 1. Time Aspect:
//    No time aspect involved.

// 2. Multiple Events Requested:
//    No multiple events requested at once.

// 3. Effects:
//    No effects involved as no state of an entity is changed.

// 4. Bthread Context:
//    Specific context: phase.endingScene

// 5. Waiting for:
//    Waiting for a specific event.

// 6. Loop Sync:
//    The loop will meet a sync with the user's choice.

// 7. Needed Events:
//    Needed Events: returnToMainMenuEvent(), exitGameEvent().
//    Don't Declare the Events: None, because they do not exist yet.

// Implementation
function returnToMainMenuEvent() {
    return Event("returnToMainMenuEvent");
}

function exitGameEvent() {
    return Event("exitGameEvent");
}

ctx.bthread('Ending scene user interaction', 'phase.endingScene', function (phase) {
    let event = sync({waitFor: [returnToMainMenuEvent(), exitGameEvent()]});
    if (event.name === 'returnToMainMenuEvent') {
        phase.currentComponent = 'main_menu';
    } else if (event.name === 'exitGameEvent') {
        // Handle game exit logic
    }
});

//The Question Updater component will wait for the user to submit new questions. After the button is clicked, the component will add the new question to the question database. 

// 1. Time Aspect:
//    No time aspect involved.

// 2. Multiple Events Requested:
//    No multiple events requested at once.

// 3. Effects:
//    Yes, there is an effect involved. The effect is adding a new question to the database.
//    Relevant entity: question
//    Event with effect: submitNewQuestionEvent

// 4. Bthread Context:
//    Specific context: phase.questionUpdater

// 5. Waiting for Event:
//    Waiting for a specific event: submitNewQuestionEvent

// 6. Loop Sync Check:
//    The loop will meet the sync with submitNewQuestionEvent.

// 7. Needed Events:
//    Needed Events: submitNewQuestionEvent
//    Don't Declare the Events: None, because submitNewQuestionEvent does not exist yet.

// Implementation
function submitNewQuestionEvent(questionContent, options, rightOptionIndex) {
    return Event("submitNewQuestionEvent", {questionContent: questionContent, options: options, rightOptionIndex: rightOptionIndex});
}

ctx.registerEffect('submitNewQuestionEvent', function (data) {
    ctx.populateContext([
        question(ctx.generateId(), data.questionContent, data.options, data.rightOptionIndex)
    ]);
});

ctx.bthread('Submit new questions in Question Updater component', 'phase.questionUpdater', function (phase) {
    while (true) {
        let event = sync({waitFor: [submitNewQuestionEvent()]});
        sync({request: [submitNewQuestionEvent(event.data.questionContent, event.data.options, event.data.rightOptionIndex)]});
    }
});

//The Math Umbrella component will wait for a user to click a link, and then follow that link.

// 1. Time Aspect:
//    No time aspect involved.

// 2. Multiple Events Request:
//    No multiple events requested at once.

// 3. Effects:
//    No effects involved as no state of an entity is changed.

// 4. Bthread Context:
//    Specific context: phase.mathUmbrella

// 5. Waiting for:
//    Waiting for a specific event.

// 6. Loop Sync:
//    The loop will meet a sync with the clickLinkEvent.

// 7. Needed Events:
//    Needed Events: clickLinkEvent. Don't Declare the Events: none, because none exist.

//Implementation
function clickLinkEvent(url) {
    return Event("clickLinkEvent", {url: url});
}

ctx.bthread('Follow link on user click in Math Umbrella component', 'phase.mathUmbrella', function (phase) {
    while (true) {
        let event = sync({waitFor: [clickLinkEvent()]});
        window.location.href = event.data.url; // Assuming this runs in a browser environment
    }
});

