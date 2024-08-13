//A question has its content, 4 options and the index of the right option
function question(id, content, options, rightOptionIndex) {
    return ctx.Entity(id, 'question', {content: content, options: options, rightOptionIndex: rightOptionIndex});
}
//Generate 4 questions about the USA history(place the right answer at a random position)
ctx.populateContext([
    question('q1', 'Who was the first President of the United States?', ['George Washington', 'Thomas Jefferson', 'Abraham Lincoln', 'Theodore Roosevelt'], 0),
    question('q2', 'What year did the United States declare independence?', ['1776', '1492', '1607', '1865'], 0),
    question('q3', 'Which event marked the beginning of the American Civil War?', ['Battle of Fort Sumter', 'Boston Tea Party', 'Signing of the Declaration of Independence', 'Louisiana Purchase'], 0),
    question('q4', 'Who wrote the Declaration of Independence?', ['Thomas Jefferson', 'Benjamin Franklin', 'John Adams', 'James Madison'], 0)
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
// No multiple events are requested at once.

// 3. Effects:
// Yes, there is an effect involved. The state of the 'phase' entity needs to be updated.
// Relevant entity: phase
// Event with effect: startGameEvent

// 4. Bthread Context:
// Specific context for the bthread is the start phase of the game.
// Query used: phase.start

// 5. Waiting for:
// Waiting for a specific event: startGameEvent

// 6. Loop Sync:
// The loop will meet a sync with the startGameEvent.

// Implementation
function startGameEvent() {
    return Event("startGameEvent");
}

ctx.registerEffect('startGameEvent', function (data) {
    let phaseEntity = ctx.getEntityById(data.id); // Assuming the event data includes the phase entity ID
    phaseEntity.currentComponent = 'movie';
});

ctx.bthread('Move to movie component on game start', 'phase.start', function (phase) {
    sync({waitFor: [startGameEvent()]});
});

