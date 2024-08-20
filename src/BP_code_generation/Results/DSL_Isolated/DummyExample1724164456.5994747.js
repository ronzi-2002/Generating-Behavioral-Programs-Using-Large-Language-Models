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

ctx.bthread('When motion is detected, the light bulb turns on', 'light', function (light) {
    while(true){
        sync({waitFor: [motionDetectedEvent()]});
        sync({request: [turnOnLightEvent(light.id)]});
    }
});
//While the light bulb is on, the doors cannot be opened
function openDoorEvent(doorId) {
    return Event("openDoorEvent", {doorId: doorId});
}

ctx.bthread('While the light bulb is on, doors cannot be opened', 'lightOn', function (light) {
    while(true){
        sync({block: [anyEventNameWithData("openDoorEvent")]});
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
        let waitTill = new Date().getTime() + 300000; // 5 minutes
        sync({waitFor: [TimeToBe(new Date(waitTill).getHours(), new Date(waitTill).getMinutes())]});
        sync({request: [turnOffLightEvent(light.id)]});
    }
});
//After door is opened, The light bulb turns on and the user is notified
function doorOpenedEvent(doorId) {
    return Event("doorOpenedEvent", {doorId: doorId});
}

function turnOnLightEvent(lightId) {
    return Event("turnOnLightEvent", {lightId: lightId});
}

function userNotifiedEvent() {
    return Event("userNotifiedEvent");
}

ctx.bthread('After door is opened, turn on the light bulb and notify the user', 'light', function (light) {
    while(true){
        sync({waitFor: [openDoorEvent(light.id)]});
        RequestAllEvents([turnOnLightEvent(light.id), userNotifiedEvent()]);
    }
});
