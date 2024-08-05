//There is a smart light bulb(which can be on and off)
function lightBulb(id) {
    return ctx.Entity(id, 'lightBulb', {isOn: false});
}
ctx.populateContext([lightBulb('lightBulb1', 'off')]);

/*
Needed queries:
 1. light
 2. light On
*/
ctx.registerQuery('light', entity => entity.type == 'lightBulb');

ctx.registerQuery('lightOn', entity => entity.type == 'lightBulb' && entity.isOn);
//When motion is detected, the light bulb turns on
function motionDetectedEvent() {
    return Event("motionDetectedEvent");
}

function turnOnLightEvent(lightBulbId) {
    return Event("turnOnLightEvent", {lightBulbId: lightBulbId});
}

ctx.registerEffect('turnOnLightEvent', function (data) {
    let lightBulb = ctx.getEntityById(data.lightBulbId);
    lightBulb.isOn = true;
});

ctx.bthread('When motion is detected, the light bulb turns on', 'light', function (light) {
    while(true){
        sync({waitFor: [motionDetectedEvent()]});
        sync({request: [turnOnLightEvent(light.id)]});
    }
});
//While the light bulb is on, the door cannot be opened
function openDoorEvent() {
    return Event("openDoorEvent");
}

ctx.bthread('While the light bulb is on, the door cannot be opened', 'lightOn', function (light) {
    while(true){
        sync({block: [openDoorEvent()]});
    }
});



