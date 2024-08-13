/*
coffee machines: { country of origin, state, offered beverages}.
In our case we have two coffee machines, one Italian and one British. both start in idle state and offer coffee. The Italian machine offers coffee and cappuccino, while the British machine offers coffee and tea.
*/
function coffeeMachine(id, countryOfOrigin) {
    return ctx.Entity(id, 'coffeeMachine', {
        countryOfOrigin: countryOfOrigin,
        state: 'idle',
        offeredBeverages: []
    });
}

ctx.populateContext([
    coffeeMachine('italianMachine', 'Italian').extend({offeredBeverages: ['coffee', 'cappuccino']}),
    coffeeMachine('britishMachine', 'British').extend({offeredBeverages: ['coffee', 'tea']})
]);
/*
Needed queries:
    1. coffeeMachine
    2. British machine
    3. Italian machine
*/
ctx.registerQuery('coffeeMachine', entity => entity.type == 'coffeeMachine');

ctx.registerQuery('britishMachine', entity => entity.type == 'coffeeMachine' && entity.countryOfOrigin == 'British');

ctx.registerQuery('italianMachine', entity => entity.type == 'coffeeMachine' && entity.countryOfOrigin == 'Italian');
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

ctx.bthread('After inserting a coin, user selects beverage and sugar, then machine delivers beverage', 'coffeeMachine', function (machine) {
    while(true){
        sync({waitFor: [insertCoinEvent(machine.id)]});
        let beverageSelection = sync({waitFor: [anyEventNameWithData("selectBeverageEvent", {machineId: machine.id})]});
        sync({waitFor: [anyEventNameWithData("selectSugarEvent", {machineId: machine.id})]});
        sync({request: [deliverBeverageEvent(machine.id, beverageSelection.data.beverage)]});
    }
});
//A ringtone possibly has to be played after beverage delivery. 
function playRingtoneEvent(machineId) {
    return Event("playRingtoneEvent", {machineId: machineId});
}

ctx.bthread('Play ringtone after beverage delivery', 'coffeeMachine', function (machine) {
    while(true){
        sync({waitFor: [deliverBeverageEvent(machine.id)]});
        sync({request: [playRingtoneEvent(machine.id)]});
    }
});
//After the beverage is taken, the machine returns idle.
function beverageTakenEvent(machineId) {
    return Event("beverageTakenEvent", {machineId: machineId});
}

ctx.bthread('Return machine to idle after beverage is taken', 'coffeeMachine', function (machine) {
    while(true){
        sync({waitFor: [beverageTakenEvent(machine.id)]});
        machine.state = 'idle';
    }
});
//The British market requires tea and excludes any ringtone.
ctx.bthread('Exclude ringtone for British machines', 'britishMachine', function (machine) {
    sync({block: [playRingtoneEvent(machine.id)]});
});
