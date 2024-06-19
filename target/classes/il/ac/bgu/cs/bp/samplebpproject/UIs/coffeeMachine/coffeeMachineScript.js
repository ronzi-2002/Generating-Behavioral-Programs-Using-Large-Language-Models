function selectCoffee(coffeeType, machineId) {

  const displayElement = document.getElementById('display' + machineId.slice(-1));
  const sugarContainer = document.getElementById('sugar-container' + machineId.slice(-1));

  displayElement.textContent = 'You selected: ' + coffeeType;
  socket.send(JSON.stringify({
    name: 'selectBeverageEvent',
    data: {
      machineId: machineId,
      beverage: coffeeType
    }
  }));
  sugarContainer.style.display = 'block';  // Show the sugar level controls
  updateSugarLevel(machineId);  // Update the sugar level on beverage selection
}

function updateSugarLevel(machineId) {
  const sugarValue = document.getElementById('sugar' + machineId.slice(-1)).value;
  const sugarLevelDisplay = document.getElementById('sugar-level-display' + machineId.slice(-1));
  sugarLevelDisplay.textContent = sugarValue;
}
function insertCoin(machineId) {
  //The animation works only if the machineId is machine1 for some reason
  const animationElement = document.getElementById('coin-animation' + machineId.slice(-1));
  animationElement.style.opacity = 1;  // Make the coin visible
  animationElement.style.top = '5px';  // Move the coin upwards to the slot receiver
  socket.send(JSON.stringify({
    name: 'insertCoinEvent',
    data: {
      machineId: machineId
    }
  }));



}

function startPouring(machineId) {
  const pourElement = document.getElementById('pouring-coffee' + machineId.slice(-1));
  pourElement.style.height = '100px';  // Simulate coffee pouring

  // Reset after animation completes
  setTimeout(function() {
    pourElement.style.height = '0';  // Reset pouring animation
    updateDisplayAfterPour(machineId);
  }, 1500);  // Enough time to show pouring coffee
}

function updateDisplayAfterPour(machineId) {
  const displayElement = document.getElementById('display' + machineId.slice(-1));
  displayElement.textContent = 'Enjoy your coffee!';
}

var cupImage = document.getElementById('coffee-cup-2');

cupImage.addEventListener('click', function() {
  cupImage.style.display = 'none';
  document.getElementById('display').textContent = 'Enjoy your beverage!';
});

document.getElementById('confirm-sugar-level-button1').addEventListener('click', function() {
  var sugarContainer = document.getElementById('sugar-container1');
  sugarContainer.style.display = 'none';  // Hide the sugar level controls
  socket.send(JSON.stringify({
    name: 'selectSugarEvent',
    data: {
      machineId: 'italianMachine1',
      sugarAmount: document.getElementById('sugar1').value
    }
  }));
} );

document.getElementById('confirm-sugar-level-button2').addEventListener('click', function() {
  var sugarContainer = document.getElementById('sugar-container2');
  sugarContainer.style.display = 'none';  // Hide the sugar level controls
  socket.send(JSON.stringify({
    name: 'selectSugarEvent',
    data: {
      machineId: 'britishMachine2',
      sugarAmount: document.getElementById('sugar2').value
    }
  }));
} );


var socket = new WebSocket('ws://localhost:8001');

socket.onopen = function(event) {
  console.log('Connected to WebSocket server');
};

socket.onmessage = function(event) {
  console.log('Received: ' + event.data);

  var Bevent = JSON.parse(event.data);
  //print the event data
  console.log(Bevent);
  if(Bevent.name === 'deliverBeverageEvent') {
    // Start pouring animation after coin animation
    setTimeout(function() {
      // animationElement.style.opacity = 0;
      // animationElement.style.top = '20px';
      startPouring(Bevent.data.machineId);
    }, 500);  // Ensures the timing matches the CSS transition


  }
  if(Bevent.name === 'playRingtoneEvent') {
    // Play ringtone after pouring coffee
    var rinEl= document.getElementById('ringtone');
    // console.log(rinEl);
    rinEl.play();
  }

}



