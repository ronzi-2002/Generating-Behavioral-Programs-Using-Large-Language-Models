/*
There is a smart light bulb(which can be on and off)
*/
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
/*
When motion is detected, the light bulb turns on
*/
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

ctx.bthread('When motion is detected, the light bulb turns on', 'light', function (light) {
    while(true){
        sync({waitFor: [motionDetectedEvent()]});
        sync({request: [turnOnLightEvent(light.id)]});
    }
});
/*
While the light bulb is on, the house cant be exited
*/
function exitHouseEvent() {
    return Event("exitHouseEvent");
}

ctx.bthread('While the light bulb is on, the house can\'t be exited', 'lightOn', function (light) {
    while(true){
        sync({block: [exitHouseEvent()]});
    }
});
/*
Light bulb turns off after 5 minutes
*/
function turnOffLightEvent(lightId) {
    return Event("turnOffLightEvent", {lightId: lightId});
}

ctx.registerEffect('turnOffLightEvent', function (data) {
    let light = ctx.getEntityById(data.lightId);
    light.on = false;
});

ctx.bthread('Light bulb turns off after 5 minutes', 'lightOn', function (light) {
    while(true){
        sync({waitFor: [setTimeoutEvent(5 * 60 * 1000)]}); // Assuming setTimeoutEvent is a predefined event that waits for a specified time in milliseconds
        sync({request: [turnOffLightEvent(light.id)]});
    }
});
/*
When user locks the house, The light bulb turns off and the user is notified
*/
function lockHouseEvent() {
    return Event("lockHouseEvent");
}

function notifyUserEvent(message) {
    return Event("notifyUserEvent", {message: message});
}

ctx.bthread('When user locks the house, the light bulb turns off and the user is notified', 'light', function (light) {
    while(true){
        sync({waitFor: [lockHouseEvent()]});
        sync({request: [turnOffLightEvent(light.id), notifyUserEvent("The house is locked and the light is turned off.")]});
    }
});
