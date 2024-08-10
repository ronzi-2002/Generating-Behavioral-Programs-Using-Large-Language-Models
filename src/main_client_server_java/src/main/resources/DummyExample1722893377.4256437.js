//There is a smart light bulb(which can be on and off)
function lightBulb(id, status) {
    return ctx.Entity(id, 'lightBulb', {status: status});
}

const lightBulb1 = lightBulb('lightBulb1', 'off');  
ctx.populateContext([lightBulb1]);
//There is a room with light bulbs
function room(id, lightBulbs) {
    return ctx.Entity(id, 'room', {lightBulbs: lightBulbs});
}
ctx.populateContext([room('room1', [lightBulb1])]);

/*
Needed queries:
 1. light
 2. light On
 3. room
*/
ctx.registerQuery('light', entity => entity.type == 'lightBulb');

ctx.registerQuery('lightOn', entity => entity.type == 'lightBulb' && entity.status == 'on');
ctx.registerQuery('room', entity => entity.type == 'room');
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

ctx.bthread('When motion is detected, the light bulb turns on', 'room', function (room) {
    while(true){
        sync({waitFor: [motionDetectedEvent()]});
        sync({request: [turnOnLightEvent(room.lightBulbs[0].id)]});
    }
});
// //While the light bulb is on, the door cannot be opened
// function openDoorEvent() {
//     return Event("openDoorEvent");
// }

// ctx.bthread('While the light bulb is on, the door cannot be opened', 'lightOn', function (lightOn) {
//     while(true){
//         sync({block: [openDoorEvent()]});
//     }
// });
// //Light bulb turns off after 5 minutes
// function turnOffLightEvent(lightBulbId) {
//     return Event("turnOffLightEvent", {lightBulbId: lightBulbId});
// }

// ctx.registerEffect('turnOffLightEvent', function (data) {
//     let lightBulb = ctx.getEntityById(data.lightBulbId);
//     lightBulb.status = 'off';
// });

// ctx.bthread('Light bulb turns off after 5 minutes', 'lightOn', function (lightOn) {
//     while(true){
//         Sleep(300000); // 5 minutes in milliseconds
//         sync({request: [turnOffLightEvent(lightOn.id)]});
//     }
// });
