/*
coffee machines: { country of origin, state, offered beverages}.
In our case we have two coffee machines, one Italian and one British. both start in idle state and offer coffee. The Italian machine offers coffee and cappuccino, while the British machine offers coffee and tea.
*/
function coffeeMachine(id, countryOfOrigin, state, offeredBeverages) {
  return ctx.Entity(id, 'coffeeMachine', {countryOfOrigin: countryOfOrigin, state: state, offeredBeverages: offeredBeverages});
}

ctx.populateContext([
  coffeeMachine('italianMachine1', 'Italy', 'idle', ['coffee', 'cappuccino']),
  coffeeMachine('britishMachine2', 'Britain', 'idle', ['coffee', 'tea'])
]);


/*
Needed queries:
    1. coffeeMachine
    2. British machine
    3. Italian machine

*/
ctx.registerQuery('coffeeMachine', entity => entity.type == 'coffeeMachine');

ctx.registerQuery('britishMachine', entity => entity.type == 'coffeeMachine' && entity.countryOfOrigin == 'Britain');

ctx.registerQuery('italianMachine', entity => entity.type == 'coffeeMachine' && entity.countryOfOrigin == 'Italy');
//After inserting a suitable coin, the user shall choose a beverage and select the amount of sugar. (My addition from here)Afterward, the machine shall deliver the beverage
function insertCoinEvent(machineId) {
  return Event("insertCoinEvent", {machineId: machineId});
}

function selectBeverageEvent(machineId, beverage) {
  return Event("selectBeverageEvent", {machineId: machineId, beverage: beverage});
}

function selectSugarEvent(machineId, sugarAmount) {
  return Event("selectSugarEvent", {machineId: machineId, sugarAmount: sugarAmount});
}

function deliverBeverageEvent(machineId, beverage) {
  return Event("deliverBeverageEvent", {machineId: machineId, beverage: beverage});
}

ctx.bthread('After inserting a suitable coin, the user shall choose a beverage and select the amount of sugar. Afterward, the machine shall deliver the beverage', 'coffeeMachine', function (machine) {
  while(true){
    sync({waitFor: [insertCoinEvent(machine.id)]});
    bp.log.setLevel("Fine");
    bp.log.info("Insert coin event received");
    let beverageSelection = sync({waitFor: [anyEventNameWithData("selectBeverageEvent", {machineId: machine.id})]}).data.beverage;
    sync({waitFor: [anyEventNameWithData("selectSugarEvent", {machineId: machine.id})]});
    sync({request: [deliverBeverageEvent(machine.id, beverageSelection)]});
  }
});
//A ringtone possibly has to be played after beverage delivery.
function playRingtoneEvent(machineId) {
  return Event("playRingtoneEvent", {machineId: machineId});
}

ctx.bthread('A ringtone possibly has to be played after beverage delivery', 'coffeeMachine', function (machine) {
  while(true){
    sync({waitFor: [anyEventNameWithData("deliverBeverageEvent", {machineId: machine.id})]});
    sync({request: [playRingtoneEvent(machine.id)]});
  }
});
//After the beverage is taken, the machine returns idle.
function beverageTakenEvent(machineId) {
  return Event("beverageTakenEvent", {machineId: machineId});
}

function returnToIdleEvent(machineId) {
  return Event("returnToIdleEvent", {machineId: machineId});
}

ctx.registerEffect('returnToIdleEvent', function (data) {
  let machine = ctx.getEntityById(data.machineId);
  machine.properties.state = 'idle';
});

ctx.bthread('After the beverage is taken, the machine returns idle', 'coffeeMachine', function (machine) {
  while(true){
    sync({waitFor: [beverageTakenEvent(machine.id)]});
    sync({request: [returnToIdleEvent(machine.id)]});
  }
});


//The British market requires tea and excludes any ringtone.
ctx.bthread('The British market requires tea and excludes any ringtone', 'britishMachine', function (machine) {
  while(true){
    sync({block: [playRingtoneEvent(machine.id)]});
  }
});