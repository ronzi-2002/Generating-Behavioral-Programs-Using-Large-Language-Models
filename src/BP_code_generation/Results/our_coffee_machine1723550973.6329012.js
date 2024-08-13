/*
coffee machines: { country of origin, state, offered beverages}.
In our case we have two coffee machines, one Italian and one British. both start in idle state and offer coffee. The Italian machine offers coffee and cappuccino, while the British machine offers coffee and tea.
*/
function coffeeMachine(id, countryOfOrigin, state, offeredBeverages) {
    return ctx.Entity(id, 'coffeeMachine', {countryOfOrigin: countryOfOrigin, state: state, offeredBeverages: offeredBeverages});
}

ctx.populateContext([
    coffeeMachine('italianCoffeeMachine', 'Italian', 'idle', ['coffee', 'cappuccino']),
    coffeeMachine('britishCoffeeMachine', 'British', 'idle', ['coffee', 'tea'])
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
// Yes, multiple events are requested at once, and all need to happen.

// 3. Effects:
// Yes, there is an effect involved. The state of the coffee machine changes to 'delivering'.
// Relevant entity: coffeeMachine
// Event with effect: deliverBeverageEvent

// 4. Bthread Context:
// Applies to all coffee machines. Query used: coffeeMachine

// 5. Waiting for:
// Waiting for a specific event with exact data (coin inserted and beverage selected).

//Implementation

function insertCoinEvent(machineId) {
    return Event("insertCoinEvent", {machineId: machineId});
}

function selectBeverageEvent(machineId, beverage, sugarAmount) {
    return Event("selectBeverageEvent", {machineId: machineId, beverage: beverage, sugarAmount: sugarAmount});
}

function deliverBeverageEvent(machineId, beverage) {
    return Event("deliverBeverageEvent", {machineId: machineId, beverage: beverage});
}

ctx.registerEffect('deliverBeverageEvent', function (data) {
    let machine = ctx.getEntityById(data.machineId);
    machine.state = 'delivering';
    // Assuming the state will be reset by another event or mechanism not described here.
});

ctx.bthread('After inserting a suitable coin, user selects beverage and sugar, then machine delivers beverage', 'coffeeMachine', function (machine) {
    while (true) {
        sync({waitFor: [insertCoinEvent(machine.id)]});
        let selection = sync({waitFor: [selectBeverageEvent(machine.id, any, any)]});
        RequestAllEvents([deliverBeverageEvent(machine.id, selection.data.beverage)]);
    }
});

//A ringtone possibly has to be played after beverage delivery. 

// 1. Time Aspect:
// No time aspect involved.

// 2. Multiple Events:
// Only one event is requested after another event, no simultaneous events.

// 3. Effects:
// No effects on entities are required for playing a ringtone.

// 4. Bthread Context:
// Applies to all coffee machines. Query used: coffeeMachine.

// 5. Waiting for:
// Waiting for a specific event (deliverBeverageEvent).

// 6. Loop Sync:
// The loop has a sync that it will surely meet (waitFor deliverBeverageEvent).

// 7. Needed Events:
// Needed Events: playRingtoneEvent. Don't Declare the Events: insertCoinEvent, selectBeverageEvent, deliverBeverageEvent because they already exist.

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
//    Yes, effect involved to change the state of an entity.
//    Relevant entity: coffeeMachine.
//    Event with effect: beverageTakenEvent.

// 4. Bthread Context:
//    Applies to all coffee machines.
//    Query used: coffeeMachine.

// 5. Waiting for:
//    Waiting for a specific event.

// 6. Loop Sync:
//    Loop has a sync that it will surely meet.

// 7. Needed Events:
//    Needed Events: beverageTakenEvent.
//    Don't Declare the Events: None, because beverageTakenEvent does not exist.

//Implementation
function beverageTakenEvent(machineId) {
    return Event("beverageTakenEvent", {machineId: machineId});
}

ctx.registerEffect('beverageTakenEvent', function (data) {
    let machine = ctx.getEntityById(data.machineId);
    machine.state = 'idle';
});

ctx.bthread('After the beverage is taken, the machine returns to idle', 'coffeeMachine', function (machine) {
    while (true) {
        sync({waitFor: [beverageTakenEvent(machine.id)]});
    }
});

//The British market excludes any ringtone.

// 1. Time Aspect:
//    No time aspect involved.

// 2. Many Events Requested at Once:
//    No multiple events requested simultaneously.

// 3. Effects:
//    No effects involved as no state change of entities is required by the events.

// 4. Bthread Context:
//    Specific context for British machines. Query used: BritishMachine

// 5. Waiting for:
//    Waiting for a specific event: deliverBeverageEvent

// 6. Loop Sync:
//    The loop has a sync that it will surely meet: waitFor deliverBeverageEvent.

// 7. Needed Events:
//    Needed Events: playRingtoneEvent. Don't Declare the Events: playRingtoneEvent because it already exists.

// Implementation
ctx.bthread('Exclude ringtone for British machines after beverage delivery', 'BritishMachine', function (machine) {
    while (true) {
        sync({waitFor: [deliverBeverageEvent(machine.id)]});
        // No ringtone played for British machines, intentionally empty to meet the requirement.
    }
});

