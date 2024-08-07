//There is a smart light bulb(which can be on and off)
function lightBulb(id) {
    return ctx.Entity(id, 'lightBulb', {isOn: false});
}
/*
Needed queries:
 2. lights On
*/
ctx.registerQuery('lightsOn', entity => entity.type == 'lightBulb' && entity.isOn);
//When motion is detected, the light bulb turns on
function motionDetectedEvent(lightBulbId) {
    return Event("motionDetectedEvent", {lightBulbId: lightBulbId});
}

function turnOnLightEvent(lightBulbId) {
    return Event("turnOnLightEvent", {lightBulbId: lightBulbId});
}

ctx.registerEffect('turnOnLightEvent', function (data) {
    let lightBulb = ctx.getEntityById(data.lightBulbId);
    lightBulb.isOn = true;
});

ctx.bthread('When motion is detected, the light bulb turns on', 'lightBulb', function (lightBulb) {
    while(true){
        sync({waitFor: [motionDetectedEvent(lightBulb.id)]});
        sync({request: [turnOnLightEvent(lightBulb.id)]});
    }
});
//While the light bulb is on, the house cannot be exited
function exitHouseEvent() {
    return Event("exitHouseEvent");
}

ctx.bthread('While the light bulb is on, the house cannot be exited', 'lightsOn', function (lightBulb) {
    while(true){
        sync({block: [exitHouseEvent()]});
    }
});
