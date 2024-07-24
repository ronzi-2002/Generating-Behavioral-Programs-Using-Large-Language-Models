document.getElementById('start-button').addEventListener('click', function() {
  var gameData = {
    name: 'startButtonClickEvent',
  };
  socket.send(JSON.stringify(gameData));
  document.getElementById('footerSent').textContent = "Sent: startButtonClickEvent";

});

document.getElementById('end-movie-button').addEventListener('click', function() {
  socket.send(JSON.stringify({
    name: 'mouseClickEvent',
  }));
  document.getElementById('footerSent').textContent = "Sent: mouseClickEvent";
});
var moviePlayer = document.getElementById('movie-player');

moviePlayer.addEventListener('ended', function() {
  socket.send(JSON.stringify({
    name: 'movieCompleteEvent',
  }));
    document.getElementById('footerSent').textContent = "Sent: movieCompleteEvent";
});
document.getElementById('go-to-website-button').addEventListener('click', function() {
  socket.send(JSON.stringify({
    name: 'denominatorsWebPageButtonEvent',
  }));
    document.getElementById('footerSent').textContent = "Sent: denominatorsWebPageButtonEvent";
});

document.getElementById('start-game-button').addEventListener('click', function() {
  socket.send(JSON.stringify({
    name: 'gameSequenceButtonEvent',
  }));
    document.getElementById('footerSent').textContent = "Sent: gameSequenceButtonEvent";
});
var optionButtons = [
  document.getElementById('option-1'),
  document.getElementById('option-2'),
  document.getElementById('option-3'),
  document.getElementById('option-4')
];

optionButtons.forEach(function(button, index) {
  button.addEventListener('click', function() {
    var answerData = {
      name: 'answerSelectedEvent',
      data: {
        questionId: currentQuestionId,
        selectedOptionIndex: index
      }
    };
    socket.send(JSON.stringify(answerData));
    document.getElementById('footerSent').textContent = "Sent: answerSelectedEvent, index:"+ index;
  });
});
var currentQuestionId = "q1";
// ... existing WebSocket code ...
function sendEvent(event) {
  fetch('http://localhost:8000/event', {
    method: 'POST',
    body: JSON.stringify(event)
  })
      .then(response => response.text())
      .then(data => console.log(data))
      .catch((error) => {
        console.error('Error:', error);
      });
}

var socket = new WebSocket('ws://localhost:8001');

socket.onopen = function(event) {
  console.log('Connected to WebSocket server');
};

socket.onmessage = function(event) {
  console.log('Received: ' + event.data);

  var eventData = JSON.parse(event.data);
  //print the event data
  console.log(eventData);
  //set the footer text to the event
  if (eventData.name != "getEntityByIdEventResponse" && eventData.name != "changePhaseEvent" && eventData.name != "startButtonClickEvent" && eventData.name != "startMovieEvent" && eventData.name != "mouseClickEvent" && eventData.name != "answerSelectedEvent") {
    //Show two last eventData.name
    // document.getElementById('footerRec').textContent = "Received: "+eventData.name;
    if (document.getElementById('footerRec').textContent.includes("Received:"))
      document.getElementById('footerRec').textContent = document.getElementById('footerRec').textContent + ", " + eventData.name;
    else
      document.getElementById('footerRec').textContent = "Received: " + eventData.name;

  }

  if (eventData.name === 'startMovieEvent') {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('movie-screen').style.display = 'block';
    document.getElementById('movie-player').play();
  }
  // if (eventData.name === 'changePhaseEvent')
  // {
  //   console.log(eventData.data.newPhase);
  // }
  if (eventData.name === 'changePhaseEvent' && eventData.data.newPhase === 'main_menu') {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('movie-screen').style.display = 'none';
    //stop the movie
    document.getElementById('movie-player').pause();
    document.getElementById('main-menu-screen').style.display = 'block';
  }
  if (eventData.name === 'changePhaseEvent' && eventData.data.newPhase === 'game_sequence') {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('movie-screen').style.display = 'none';
    document.getElementById('main-menu-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
  }
  if(eventData.name === "incorrectAnswerMessageEvent")
  {
    alert("Incorrect answer! Try again.");
  }

  if (eventData.name === 'displayQuestionEvent') {
    var questionId = eventData.data.questionId;
    var requestQuestionData = {
      name: 'getEntityByIdEvent',
      data: {
        entityId: questionId,
        //Random number to identify the request
        requestId: Math.floor(Math.random() * 1000)
      }
    };
    socket.send(JSON.stringify(requestQuestionData));
    // document.getElementById('question').textContent = questionId;
  }
  if(eventData.name === "getEntityByIdEventResponse")
  {
    var questionData = JSON.parse(eventData.data.entity);
    document.getElementById('question').textContent = questionData.content;
    //display the options
    var options = questionData.options;
    for (var i = 0; i < options.length; i++) {
      //Each option is a button
      optionButtons[i].textContent = options[i];
    }
    currentQuestionId = questionData.id;
  }
  if (eventData.name === 'changePhaseEvent' && eventData.data.newPhase === 'ending_scene') {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('movie-screen').style.display = 'none';
    document.getElementById('main-menu-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('end-screen').style.display = 'block';

  }
};



socket.onerror = function(error) {
  console.error('WebSocket Error: ' + error);
};

socket.onclose = function(event) {
  console.log('WebSocket connection closed');
};