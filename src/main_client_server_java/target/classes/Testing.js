function selectSugarEvent(machineId, sugarAmount) {
    return Event("selectSugarEvent", {machineId: machineId, sugarAmount: sugarAmount});
}
function eventA() {
    return Event("eventA");
}
function eventB() {
    return Event("eventB");
}


bthread('A ringtone possibly has to be played after beverage delivery', function (machine) {
    // while(true){
    //     sync({waitFor: [anyEventNameWithData("deliverBeverageEvent", {machineId: machine.id})]});

    sync({request: [eventA()], request: [eventB()]});
    sync({request: [eventB()], request: [eventA()]});
    // }
});