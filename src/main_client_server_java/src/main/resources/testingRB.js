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

ctx.bthread('When motion is detected, the light bulb turns on', 'light', function (light) {
    while(true){
        sync({waitFor: [motionDetectedEvent()]});
        sync({request: [Event("motionDetecte turnOnLightEvent(light.id)")]});
    }
});
//While the light bulb is on, the door cannot be opened
function openDoorEvent() {
    return Event("openDoorEvent");
}

bthread('While the light bulb is on, the door cannot be opened',function () {
    while(true){
        sync({block: [openDoorEvent()]});
    }
});

//Just a bthread that waits for openDoorEvent
ctx.bthread('Wait for openDoorEvent', function () {
    while(true){
        sync({waitFor: [openDoorEvent()]});
    }
});



