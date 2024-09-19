/*
coffee machines: { country of origin, state, offered beverages}.
In our case we have two coffee machines, one Italian and one British. both start in idle state and offer coffee. The Italian machine offers coffee and cappuccino, while the British machine offers coffee and tea.
*/
function coffeeMachine(id, countryOfOrigin, state, offeredBeverages) {
    return ctx.Entity(id, 'coffeeMachine', {countryOfOrigin: countryOfOrigin, state: state, offeredBeverages: offeredBeverages})
}

ctx.populateContext([
    coffeeMachine('machine1', 'Italian', 'idle', ['coffee', 'cappuccino']),
    coffeeMachine('machine2', 'British', 'idle', ['coffee', 'tea'])
])
/*
Needed queries:
    1. coffeeMachine
    2. British machine
    3. Italian machine
*/
ctx.registerQuery('coffeeMachine', entity => entity.type == 'coffeeMachine');

ctx.registerQuery('coffeeMachine.British', entity => entity.type == 'coffeeMachine' && entity.countryOfOrigin == 'British');

ctx.registerQuery('coffeeMachine.Italian', entity => entity.type == 'coffeeMachine' && entity.countryOfOrigin == 'Italian');
/*
After inserting a suitable coin, the user shall choose a beverage and select the amount of sugar. (My addition from here)Afterward, the machine shall deliver the beverage
*/
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

ctx.bthread('Handle beverage selection and delivery', 'coffeeMachine', function (machine) {
    while (true) {
        sync({waitFor: [insertCoinEvent(machine.id)]});
        let beverageSelection = sync({waitFor: [anyEventNameWithData("selectBeverageEvent", {machineId: machine.id})]});
        let sugarSelection = sync({waitFor: [anyEventNameWithData("selectSugarEvent", {machineId: machine.id})]});
        sync({request: [deliverBeverageEvent(machine.id, beverageSelection.data.beverage)]});
    }
});
/*
A ringtone possibly has to be played after beverage delivery. 
*/
function playRingtoneEvent(machineId) {
    return Event("playRingtoneEvent", {machineId: machineId});
}

ctx.bthread('Play ringtone after beverage delivery', 'coffeeMachine', function (machine) {
    while (true) {
        sync({waitFor: [anyEventNameWithData("deliverBeverageEvent", {machineId: machine.id})]});
        sync({request: [playRingtoneEvent(machine.id)]});
    }
});
/*
After the beverage is taken, the machine returns idle.
*/
function beverageTakenEvent(machineId) {
    return Event("beverageTakenEvent", {machineId: machineId});
}

ctx.registerEffect('beverageTakenEvent', function (data) {
    let machine = ctx.getEntityById(data.machineId);
    machine.state = 'idle';
});

ctx.bthread('Return machine to idle after beverage is taken', 'coffeeMachine', function (machine) {
    while (true) {
        sync({waitFor: [beverageTakenEvent(machine.id)]});
    }
});
/*
The British market excludes any ringtone.
*/
ctx.bthread('Block ringtone for British machines', 'coffeeMachine.British', function (machine) {
    sync({block: [playRingtoneEvent(machine.id)]});
});
