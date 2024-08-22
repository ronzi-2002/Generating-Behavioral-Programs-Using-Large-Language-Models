/*
coffee machines: { country of origin, state, offered beverages}.
In our case we have two coffee machines, one Italian and one British. both start in idle state and offer coffee. The Italian machine offers coffee and cappuccino, while the British machine offers coffee and tea.
*/
function coffeeMachine(id, countryOfOrigin, state, offeredBeverages) {
    return ctx.Entity(id, 'coffeeMachine', {countryOfOrigin: countryOfOrigin, state: state, offeredBeverages: offeredBeverages});
}

ctx.populateContext([
    coffeeMachine('italianMachine', 'Italian', 'idle', ['coffee', 'cappuccino']),
    coffeeMachine('britishMachine', 'British', 'idle', ['coffee', 'tea'])
]);
/*
Needed queries:
    1. coffeeMachine
    2. British machine
    3. Italian machine
*/
ctx.registerQuery('coffeeMachine', entity => entity.type == 'coffeeMachine');

ctx.registerQuery('BritishMachine', entity => entity.type == 'coffeeMachine' && entity.countryOfOrigin == 'British');

ctx.registerQuery('ItalianMachine', entity => entity.type == 'coffeeMachine' && entity.countryOfOrigin == 'Italian');
//After inserting a suitable coin, the user shall choose a beverage and select the amount of sugar. (My addition from here)Afterward, the machine shall deliver the beverage

// 1. Time Aspect:
// No time aspect involved.

// 2. Multiple Events Requested:
// Yes, multiple events are requested sequentially.

// 3. Effects:
// Yes, the state of the coffee machine changes to 'delivering' and then back to 'idle'.
// Relevant entity: coffeeMachine
// Event with effect: deliverBeverageEvent

// 4. Bthread Context:
// Applies to all coffee machines.
// Query used: coffeeMachine

// 5. Waiting for Events:
// Specific events: insertCoinEvent, selectBeverageEvent, selectSugarEvent

//Implementation

function insertCoinEvent(machineId) {
    return Event("insertCoinEvent", {machineId: machineId});
}

function selectBeverageEvent(machineId, beverage) {
    return Event("selectBeverageEvent", {machineId: machineId, beverage: beverage});
}

function selectSugarEvent(machineId, sugarAmount) {
    return Event("selectSugarEvent", {machineId: machineId, sugarAmount: sugarAmount});
}

function deliverBeverageEvent(machineId) {
    return Event("deliverBeverageEvent", {machineId: machineId});
}

ctx.registerEffect('deliverBeverageEvent', function (data) {
    let machine = ctx.getEntityById(data.machineId);
    machine.state = 'idle'; // Assuming the machine returns to idle after delivering
});

ctx.bthread('After inserting a suitable coin, user chooses beverage and sugar, then machine delivers beverage', 'coffeeMachine', function (machine) {
    while (true) {
        sync({waitFor: [insertCoinEvent(machine.id)]});
        sync({waitFor: [selectBeverageEvent(machine.id)]});
        sync({waitFor: [selectSugarEvent(machine.id)]});
        machine.state = 'delivering'; // Change state to delivering before the actual delivery
        sync({request: [deliverBeverageEvent(machine.id)]});
    }
});

//A ringtone possibly has to be played after beverage delivery. 

// 1. Time Aspect:
// No time aspect involved.

// 2. Many Events Requested at Once:
// No multiple events requested simultaneously.

// 3. Effects:
// No effects involved as no state change of entities is specified.

// 4. Bthread Context:
// Applies to all coffee machines. Query used: coffeeMachine.

// 5. Waiting for:
// Waiting for a specific event: deliverBeverageEvent.

// 6. Loop Sync:
// The loop has a sync that it will surely meet: deliverBeverageEvent.

// 7. Needed Events:
// Needed Events: playRingtoneEvent. Don't Declare the Events: insertCoinEvent, selectBeverageEvent, selectSugarEvent, deliverBeverageEvent because they already exist.

//Implementation
function playRingtoneEvent(machineId) {
    return Event("playRingtoneEvent", {machineId: machineId});
}

ctx.bthread('Play ringtone after beverage delivery', 'coffeeMachine', function (machine) {
    while (true) {
        sync({waitFor: [deliverBeverageEvent(machine.id)]});
        sync({request: [playRingtoneEvent(machine.id)]});
    }
});

//After the beverage is taken, the machine returns idle.

// 1. Time Aspect:
//    No time aspect involved.

// 2. Many Events Requested at Once:
//    No multiple events requested at once.

// 3. Effects:
//    Yes, effect involved. Relevant entity: coffeeMachine. Event with effect: returnToIdleEvent.

// 4. Bthread Context:
//    Specific context: coffeeMachine.

// 5. Waiting for:
//    A specific event: beverageTakenEvent.

// 6. Loop Sync:
//    Loop has a sync that it will surely meet.

// 7. Needed Events:
//    Needed Events: beverageTakenEvent, returnToIdleEvent. Don't Declare the Events: None.

// Implementation
function beverageTakenEvent(machineId) {
    return Event("beverageTakenEvent", {machineId: machineId});
}

function returnToIdleEvent(machineId) {
    return Event("returnToIdleEvent", {machineId: machineId});
}

ctx.registerEffect('returnToIdleEvent', function (data) {
    let machine = ctx.getEntityById(data.machineId);
    machine.state = 'idle';
});

ctx.bthread('After the beverage is taken, the machine returns to idle', 'coffeeMachine', function (machine) {
    while (true) {
        sync({waitFor: [beverageTakenEvent(machine.id)]});
        sync({request: [returnToIdleEvent(machine.id)]});
    }
});

//The British market requires tea and excludes any ringtone.

// 1. Time Aspect:
// No time aspect involved.

// 2. Many Events Requested at Once:
// No multiple events requested at once.

// 3. Effects:
// No effects involved as no state change of entities is specified.

// 4. Bthread Context:
// Specific context for British machines. Query: BritishMachine

// 5. Waiting for:
// Waiting for a specific event: deliverBeverageEvent

// 6. Loop Sync:
// The loop has a sync that it will surely meet: waitFor deliverBeverageEvent.

// 7. Needed Events:
// Needed Events: None. Don't Declare the Events: deliverBeverageEvent because it already exists.

// Implementation
ctx.bthread('British market requires tea and excludes any ringtone', 'BritishMachine', function (machine) {
    while (true) {
        sync({waitFor: [deliverBeverageEvent(machine.id)]});
        // No ringtone is played, nothing else is requested or waited for.
    }
});

