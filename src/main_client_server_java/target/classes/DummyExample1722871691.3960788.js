//There is a smart light bulb(which can be on and off)
function lightBulb(id, status) {
    return ctx.Entity(id, 'lightBulb', {status: status});
}

ctx.populateContext([lightBulb('lightBulb1', 'off')]);
/*
Needed queries:
 1. light
 2. light On
*/
ctx.registerQuery('light', entity => entity.type == 'lightBulb');

ctx.registerQuery('lightOn', entity => entity.type == 'lightBulb' && entity.status == 'on');
//When motion is detected, the light bulb turns on
function motionDetectedEvent() {
    return Event("motionDetectedEvent");
}

function turnOnLightEvent(lightBulbId) {
    return Event("turnOnLightEvent", {lightBulbId: lightBulbId});
}

ctx.registerEffect('turnOnLightEvent', function (data) {
    let lightBulb = ctx.getEntityById(data.lightBulbId);
    lightBulb.status = 'on';
});

ctx.bthread('When motion is detected, the light bulb turns on', 'light', function (light) {
    while(true){
        sync({waitFor: [motionDetectedEvent()]});
        sync({request: [turnOnLightEvent(light.id)]});
    }
});
//While the light bulb is on, the house cannot be exited
function exitHouseEvent() {
    return Event("exitHouseEvent");
}

ctx.bthread('While the light bulb is on, the house cannot be exited', 'lightOn', function (light) {
    while(true){
        sync({block: [exitHouseEvent()]});
    }
});
