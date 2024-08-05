//Generated using v13.11.0

/*
coffee machines: { country of origin, state, offered beverages}.
In our case we have two coffee machines, one Italian and one British. both start in idle state and offer coffee. The Italian machine offers coffee and cappuccino, while the British machine offers coffee and tea.
*/
function coffeeMachine(id, countryOfOrigin, offeredBeverages) {
    return ctx.Entity(id, 'coffeeMachine', {
        countryOfOrigin: countryOfOrigin,
        state: 'idle',
        offeredBeverages: offeredBeverages
    });
}

ctx.populateContext([
    coffeeMachine('italianMachine1', 'Italian', ['coffee', 'cappuccino']),
    coffeeMachine('britishMachine1', 'British', ['coffee', 'tea'])
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

function chooseBeverageEvent(machineId, beverage) {
    return Event("chooseBeverageEvent", {machineId: machineId, beverage: beverage});
}

function selectSugarEvent(machineId, amount) {
    return Event("selectSugarEvent", {machineId: machineId, amount: amount});
}

function beverageDeliveredEvent(machineId, beverage) {
    return Event("beverageDeliveredEvent", {machineId: machineId, beverage: beverage});
}

ctx.bthread('After inserting a coin, user chooses a beverage and sugar, then machine delivers beverage', 'coffeeMachine', function (machine) {
    while(true){
        sync({waitFor: [insertCoinEvent(machine.id)]});
        let beverageChoice = sync({waitFor: anyEventNameWithData("chooseBeverageEvent", {machineId: machine.id})});
        sync({waitFor: anyEventNameWithData("selectSugarEvent", {machineId: machine.id})});
        sync({request: [beverageDeliveredEvent(machine.id, beverageChoice.data.beverage)]});
    }
});

//A ringtone possibly has to be played after beverage delivery. 
function playRingtoneEvent(machineId) {
    return Event("playRingtoneEvent", {machineId: machineId});
}

ctx.bthread('A ringtone possibly has to be played after beverage delivery', 'coffeeMachine', function (machine) {
    while(true){
        let event = sync({waitFor: anyEventNameWithData("beverageDeliveredEvent", {machineId: machine.id})});
        sync({request: [playRingtoneEvent(machine.id)]});
    }
});
//After the beverage is taken, the machine returns idle.
function beverageTakenEvent(machineId) {
    return Event("beverageTaken", {machineId: machineId});
}

function returnToIdleEvent(machineId) {
    return Event("returnToIdle", {machineId: machineId});
}

ctx.registerEffect('returnToIdle', function (data) {
    let machine = ctx.getEntityById(data.machineId);
    machine.state = 'idle';
});

ctx.bthread('After the beverage is taken, the machine returns idle', 'coffeeMachine', function (machine) {
    while(true){
        sync({waitFor: [beverageTakenEvent(machine.id)]});
        sync({request: [returnToIdleEvent(machine.id)]});
    }
});


//The British market excludes any ringtone.
ctx.bthread('The British market requires tea and excludes any ringtone', 'britishMachine', function (machine) {
    while(true){
        sync({block: [playRingtoneEvent(machine.id)]});
    }
});