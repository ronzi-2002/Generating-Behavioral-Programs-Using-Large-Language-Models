//There is a smart light bulb(which can be on and off)
function smartLightBulb(id, on) {
    return ctx.Entity(id, 'smartLightBulb', {on: on})
}

ctx.populateContext([smartLightBulb('smartLightBulb1', false)])
/*
Needed queries:
 1. light
 2. light On
*/
ctx.registerQuery('light', entity => entity.type == 'smartLightBulb');

ctx.registerQuery('lightOn', entity => entity.type == 'smartLightBulb' && entity.on == true);
//When motion is detected, the light bulb turns on
function motionDetectedEvent() {
    return Event("motionDetectedEvent");
}

function turnOnLightEvent(lightId) {
    return Event("turnOnLightEvent", {lightId: lightId});
}

ctx.registerEffect('turnOnLightEvent', function (data) {
    let light = ctx.getEntityById(data.lightId);
    light.on = true;
});

ctx.bthread('Turn on light when motion is detected', 'light', function (light) {
    while(true){
        sync({waitFor: [motionDetectedEvent()]});
        sync({request: [turnOnLightEvent(light.id)]});
    }
});
//While the light bulb is on, the house cant be exited
function exitHouseEvent() {
    return Event("exitHouseEvent");
}

ctx.bthread('Block exiting house while light is on', 'lightOn', function (light) {
    while(true){
        sync({block: [exitHouseEvent()]});
    }
});
//Light bulb turns off after 5 minutes
function turnOffLightEvent(lightId) {
    return Event("turnOffLightEvent", {lightId: lightId});
}

ctx.registerEffect('turnOffLightEvent', function (data) {
    let light = ctx.getEntityById(data.lightId);
    light.on = false;
});

ctx.bthread('Turn off light after 5 minutes', 'lightOn', function (light) {
    while(true){
        sync({waitFor: [setTimeoutEvent(300000)]}); // 300000 milliseconds = 5 minutes
        sync({request: [turnOffLightEvent(light.id)]});
    }
});
//When the house is entered, The light bulb turns on and the user is notified
function houseEnteredEvent() {
    return Event("houseEnteredEvent");
}

function notifyUserEvent() {
    return Event("notifyUserEvent");
}

ctx.bthread('Turn on light and notify user when house is entered', 'light', function (light) {
    while(true){
        sync({waitFor: [houseEnteredEvent()]});
        sync({request: [turnOnLightEvent(light.id), notifyUserEvent()]});
    }
});
