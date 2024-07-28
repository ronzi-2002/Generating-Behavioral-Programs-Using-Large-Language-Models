//A question has its content, 4 options and the index of the right option
function question(id, content, options, rightOptionIndex) {
  return ctx.Entity(id, 'question', {
    content: content,
    options: options,
    rightOptionIndex: rightOptionIndex
  });
}

//Generate 4 questions about the USA history(make the index of the right answe random)
ctx.populateContext([
  question('q1', 'Who was the first President of the United States?', ['George Washington', 'Thomas Jefferson', 'Abraham Lincoln', 'Theodore Roosevelt'], 0),
  question('q2', 'In which year did the USA gain independence?', ['1776', '1783', '1791', '1802'], 0),
  question('q3', 'What event started on April 12, 1861?', ['World War I', 'The Civil War', 'The Boston Tea Party', 'The Great Depression'], 1),
  question('q4', 'Who wrote the Declaration of Independence?', ['Benjamin Franklin', 'John Adams', 'Thomas Jefferson', 'George Washington'], 2)
]);

//In addition there is a phase to the game that is "game_start' at the beginning
function phase(id, name) {
  return ctx.Entity(id, 'phase', {name: name});
}

ctx.populateContext([
  phase('phase1', 'game_start')
]);

//queries needed:
//a query for each phase of the game(start, movie, main menu, game sequence, ending scene)

ctx.registerQuery('phase.start', entity => entity.type == 'phase' && entity.name == 'game_start');
ctx.registerQuery('phase.movie', entity => entity.type == 'phase' && entity.name == 'movie');
ctx.registerQuery('phase.mainMenu', entity => entity.type == 'phase' && entity.name == 'main_menu');
ctx.registerQuery('phase.gameSequence', entity => entity.type == 'phase' && entity.name == 'game_sequence');
ctx.registerQuery('phase.endingScene', entity => entity.type == 'phase' && entity.name == 'ending_scene');

/*When the user clicks on the start button, the game will move to the movie component. */
function startButtonClickEvent() {
  return Event("startButtonClickEvent");
}

function changePhaseEvent(newPhase) {
  return Event("changePhaseEvent", {newPhase: newPhase});
}

ctx.registerEffect('changePhaseEvent', function (data) {
  let phaseEntity = ctx.getEntityById('phase1');
  phaseEntity.name = data.newPhase;
});

ctx.bthread('Move to movie component on start button click', 'phase.start', function (phase) {
  while(true){
    sync({waitFor: [startButtonClickEvent()]});
    sync({request: [changePhaseEvent('movie')]});
  }
});

// Upon entrance to the movie component, the introductory movie will begin
// playing. If a mouse click is received, this component will terminate the movie
// and forward the user to the main menu component. Otherwise, the movie will
// continue to its completion and the user will be moved to the main menu.

function mouseClickEvent() {
  return Event("mouseClickEvent");
}

function startMovieEvent() {
  return Event("startMovieEvent");
}

function movieCompleteEvent() {
  return Event("movieCompleteEvent");
}

ctx.bthread('Handle movie component behavior', 'phase.movie', function (phase) {
  while(true){
    sync({request: [startMovieEvent()]});
    let event = sync({waitFor: [mouseClickEvent(), movieCompleteEvent()]});
    if (event.name === 'mouseClickEvent' || event.name === 'movieCompleteEvent') {
      sync({request: [changePhaseEvent('main_menu')]});
    }
  }
});

/*
The main menu component will wait until the user selects a button. At that time, the user will be forwarded to the game sequence component or the Denominators' web page, depending on the button selected
*/

function gameSequenceButtonEvent() {
  return Event("gameSequenceButtonEvent");
}

function denominatorsWebPageButtonEvent() {
  return Event("denominatorsWebPageButtonEvent");
}

function goToWebPageEvent(url) {
  return Event("goToWebPageEvent", {url: url});
}

ctx.bthread('Handle main menu component selections', 'phase.mainMenu', function (phase) {
  while(true){
    let event = sync({waitFor: [gameSequenceButtonEvent(), denominatorsWebPageButtonEvent()]});
    if (event.name === 'gameSequenceButtonEvent') {
      sync({request: [changePhaseEvent('game_sequence')]});
    } else if (event.name === 'denominatorsWebPageButtonEvent') {
      sync({request: [goToWebPageEvent('http://www.denominators.com')]});
    }
  }
});

/*
The game sequence component will display a question, and then wait until the user chooses an answer. If the user selects the correct answer, a message to this effect will be displayed and the component will move to the next question. If the incorrect answer is selected, this component will inform the user of this and give them another chance to answer the question. However, their score will not count this question as being answered correctly. At certain "critical points," this component will choose different directions in the plot based on whether the question at the critical point was answered correctly. After the user has proceeded through a set number of questions, they will be directed to the ending scene component.
*/
function displayQuestionEvent(questionId) {
  return Event("displayQuestionEvent", {questionId: questionId});
}

function answerSelectedEvent(questionId, selectedOptionIndex) {
  return Event("answerSelectedEvent", {questionId: questionId, selectedOptionIndex: selectedOptionIndex});
}

function correctAnswerMessageEvent() {
  return Event("correctAnswerMessageEvent");
}

function incorrectAnswerMessageEvent() {
  return Event("incorrectAnswerMessageEvent");
}

ctx.bthread('Handle game sequence component interactions', 'phase.gameSequence', function (phase) {
  const questions = ['q1', 'q2', 'q3', 'q4']; // List of question IDs
  let currentQuestionIndex = 0;
  let correctAnswers = 0;

  while (currentQuestionIndex < questions.length) {
    let currentQuestion = ctx.getEntityById(questions[currentQuestionIndex]);
    sync({request: [displayQuestionEvent(currentQuestion.id)]});

    let answerEvent = sync({waitFor: [anyEventNameWithData("answerSelectedEvent", {questionId: currentQuestion.id})]});
    if (answerEvent.data.selectedOptionIndex === currentQuestion.rightOptionIndex) {
      sync({request: [correctAnswerMessageEvent()]});
      correctAnswers++;
      currentQuestionIndex++; // Move to the next question
    } else {
      sync({request: [incorrectAnswerMessageEvent()]});
      // Give another chance but do not increment the correctAnswers or currentQuestionIndex
    }

    // Check for critical points and decide the plot direction
    if (currentQuestionIndex == 2 && correctAnswers < 2) { // Example critical point logic
      // Change direction in the plot based on performance
    }

    // If all questions are done, move to the ending scene
    if (currentQuestionIndex >= questions.length) {
      sync({request: [changePhaseEvent('ending_scene')]});
    }
  }
});

