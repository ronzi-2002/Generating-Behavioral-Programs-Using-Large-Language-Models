document.getElementById('start-button').addEventListener('click', function() {
  var gameData = {
    name: 'startGameEvent',
    data: 'game1'
  };
  socket.send(JSON.stringify(gameData));
});

document.getElementById('end-movie-button').addEventListener('click', function() {
  socket.send(JSON.stringify({
    name: 'endMovieEvent',
    data: 'game1'
  }));
});
var moviePlayer = document.getElementById('movie-player');

moviePlayer.addEventListener('ended', function() {
  socket.send(JSON.stringify({
    name: 'endMovieEvent',
    data: 'game1'
  }));
});
document.getElementById('go-to-website-button').addEventListener('click', function() {
  socket.send(JSON.stringify({
    name: 'buttonSelectEvent',
    data: {
      gameId: 'game1',
      buttonType: 'visitWeb'
    }
  }));
});

document.getElementById('start-game-button').addEventListener('click', function() {
  socket.send(JSON.stringify({
    name: 'buttonSelectEvent',
    data: {
      gameId: 'game1',
      buttonType: 'startGame'
    }
  }));
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
        gameId: 'game1',
        questionId: document.getElementById('question').textContent,
        selectedOption: index
      }
    };
    socket.send(JSON.stringify(answerData));
  });
});

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

  if (eventData.name === 'startMovieEvent') {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('movie-screen').style.display = 'block';
    document.getElementById('movie-player').play();
  }
  if (eventData.name === 'changePhaseEvent')
  {
    console.log(eventData.data.newPhase);
  }
  if (eventData.name === 'changePhaseEvent' && eventData.data.newPhase === 'main menu') {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('movie-screen').style.display = 'none';
    //stop the movie
    document.getElementById('movie-player').pause();
    document.getElementById('main-menu-screen').style.display = 'block';
  }
  if (eventData.name === 'changePhaseEvent' && eventData.data.newPhase === 'game sequence') {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('movie-screen').style.display = 'none';
    document.getElementById('main-menu-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
  }
  if (eventData.name === 'displayQuestionEvent') {
    var questionId = eventData.data.questionId;
    document.getElementById('question').textContent = questionId;
  }
  if (eventData.name === 'changePhaseEvent' && eventData.data.newPhase === 'ending scene') {
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