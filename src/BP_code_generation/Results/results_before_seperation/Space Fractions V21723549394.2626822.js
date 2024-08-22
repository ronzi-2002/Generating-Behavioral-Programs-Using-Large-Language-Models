//A question has its content, 4 options and the index of the right option
function question(id, content, options, rightOptionIndex) {
    return ctx.Entity(id, 'question', {content: content, options: options, rightOptionIndex: rightOptionIndex});
}
//Generate 4 questions about the USA history(place the right answer at a random position)
function question(id, content, options, rightOptionIndex) {
    return ctx.Entity(id, 'question', {content: content, options: options, rightOptionIndex: rightOptionIndex});
}

ctx.populateContext([
    question('q1', 'Who was the first President of the United States?', ['George Washington', 'Thomas Jefferson', 'Abraham Lincoln', 'John Adams'], 0),
    question('q2', 'What year did the American Civil War begin?', ['1850', '1861', '1871', '1845'], 1),
    question('q3', 'Which document declared the independence of the United States from Britain?', ['The Constitution', 'The Bill of Rights', 'The Declaration of Independence', 'The Federalist Papers'], 2),
    question('q4', 'Who wrote the famous speech "I Have a Dream"?', ['Abraham Lincoln', 'George Washington', 'Martin Luther King Jr.', 'Franklin D. Roosevelt'], 2)
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

// 1. Time Aspect:
// No time aspect involved.

// 2. Multiple Events Requested:
// No multiple events requested.

// 3. Effects:
// Yes, changing the phase of the game. Relevant entity: phase. Event with effect: startGameEvent.

// 4. Bthread Context:
// Specific context: phase.gameStart. Query used: phase.gameStart.

// 5. Waiting for Event:
// Waiting for a specific event: startGameEvent.

//Implementation

function startGameEvent() {
    return Event("startGameEvent");
}

ctx.registerEffect('startGameEvent', function (data) {
    let phase = ctx.getEntitiesByType('phase')[0]; // Assuming there's only one phase entity
    phase.currentComponent = 'movie';
});

ctx.bthread('Move to movie component on game start', 'phase.gameStart', function (phase) {
    sync({waitFor: [startGameEvent()]});
});

