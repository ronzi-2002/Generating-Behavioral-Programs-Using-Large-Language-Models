/*
There are rooms. each room has a type(bedroom, kitchen and so on), some rooms have a tap and some rooms have a lightbulb.
*/
function room(id, roomType, hasTap, hasLightbulb) {
    return ctx.Entity(id, 'room', {roomType: roomType, hasTap: hasTap, hasLightbulb: hasLightbulb});
}
/*
Needed queries:
  1. room with tap
  2. kitchen
  3. room with lightbulb
*/
ctx.registerQuery('room.withTap', entity => entity.type == 'room' && entity.hasTap);
ctx.registerQuery('kitchen', entity => entity.type == 'room' && entity.roomType == 'kitchen');
ctx.registerQuery('room.WithLightBulb', entity => entity.type == 'room' && entity.hasLightbulb);
/*
For each room with a tap, when the tap's button is pressed, pour hot water three times.
*/
function tapButtonPressedEvent(roomId) {
    return Event("tapButtonPressedEvent", {roomId: roomId});
}

function pourHotWaterEvent(roomId) {
    return Event("pourHotWaterEvent", {roomId: roomId});
}

ctx.bthread('Pour hot water three times when tap button is pressed', 'room.withTap', function (room) {
    while (true) {
        sync({waitFor: [tapButtonPressedEvent(room.id)]});
        for (let i = 0; i < 3; i++) {
            sync({request: [pourHotWaterEvent(room.id)]});
        }
    }
});
/*
Summary of existing events you can use if needed, without declaring them again. 
1. tapButtonPressedEvent(roomId)
2. pourHotWaterEvent(roomId)
*/
/*
For each room with a tap, when the tap's button is pressed, pour cold water three times.
*/
function pourColdWaterEvent(roomId) {
    return Event("pourColdWaterEvent", {roomId: roomId});
}

ctx.bthread('Pour cold water three times when tap button is pressed', 'room.withTap', function (room) {
    while (true) {
        sync({waitFor: [tapButtonPressedEvent(room.id)]});
        for (let i = 0; i < 3; i++) {
            sync({request: [pourColdWaterEvent(room.id)]});
        }
    }
});
/*
Summary of existing events you can use if needed, without declaring them again.
1. tapButtonPressedEvent(roomId)
2. pourHotWaterEvent(roomId) 
3. pourColdWaterEvent(roomId)
/*
Do not perform two consecutive pouring actions of the same type in kitchens
*/
// ctx.bthread('Do not perform two consecutive pouring actions of the same type in kitchens', 'kitchen', function (kitchen) {
//     let lastEvent = [];
//     while (true) {
//         lastEvent = sync({waitFor: [pourHotWaterEvent(kitchen.id), pourColdWaterEvent(kitchen.id)], block: lastEvent});
//     }
// })
/*sometimes generated:(which also works)*/
ctx.bthread('Prevent consecutive same pouring actions in kitchens', 'kitchen', function (kitchen) {
    let lastEvent = null;
    while (true) {
        let event = sync({waitFor: [anyEventNameWithData("pourHotWaterEvent", {roomId: kitchen.id}), anyEventNameWithData("pourColdWaterEvent", {roomId: kitchen.id})], block: lastEvent});
        lastEvent = event.name === "pourHotWaterEvent" ? anyEventNameWithData("pourHotWaterEvent", {roomId: kitchen.id}) : anyEventNameWithData("pourColdWaterEvent", {roomId: kitchen.id});
    }
});


/*
No water can be poured after an emergency button is pressed
*/
function emergencyButtonPressedEvent() {
    return Event("emergencyButtonPressedEvent");
}

bthread('Block water pouring after emergency button is pressed', function () {
    sync({waitFor: [emergencyButtonPressedEvent()]});
    sync({block: [anyEventNameWithData("pourHotWaterEvent"), anyEventNameWithData("pourColdWaterEvent")]});
});
/*
For each room with a lightbulb, turn it on when motion is detected in the room.
*/
function motionDetectedEvent(roomId) {
    return Event("motionDetectedEvent", {roomId: roomId});
}

function turnOnLightEvent(roomId) {
    return Event("turnOnLightEvent", {roomId: roomId});
}

ctx.bthread('Turn on light when motion is detected', 'room.WithLightBulb', function (room) {
    while (true) {
        sync({waitFor: [motionDetectedEvent(room.id)]});
        sync({request: [turnOnLightEvent(room.id)]});
    }
});


//For graph purpose
ctx.populateContext([room('kitchen1', 'kitchen', true)]);

//press the emergency button
bthread('Press the emergency button', function () {
    sync({request: [emergencyButtonPressedEvent()]});
});

//press the tap button in the kitchen
bthread('Press the tap button in the kitchen', function () {
    sync({request: [tapButtonPressedEvent('kitchen1')]});
});