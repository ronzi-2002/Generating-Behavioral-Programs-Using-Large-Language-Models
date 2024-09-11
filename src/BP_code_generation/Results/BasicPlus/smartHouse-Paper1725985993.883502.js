/*
There are rooms. each room has a type(bedroom, kitchen and so on) Some rooms have a light bulb, some have have a tap.
*/
function room(id, type, hasLightBulb, hasTap) {
    return ctx.Entity(id, 'room', {type: type, hasLightBulb: hasLightBulb, hasTap: hasTap})
}
/*
Needed queries:
  1. room
  2. room with tap
  3. kitchen
*/
ctx.registerQuery('room', entity => entity.type == 'room');

ctx.registerQuery('roomWithTap', entity => entity.type == 'room' && entity.hasTap);

ctx.registerQuery('kitchen', entity => entity.type == 'room' && entity.type == 'kitchen');
/*
For each room with a tap, when the tap's button is pressed, pour hot water three times.
*/
function tapButtonPressedEvent(roomId) {
    return Event("tapButtonPressedEvent", {roomId: roomId});
}

function pourHotWaterEvent(roomId) {
    return Event("pourHotWaterEvent", {roomId: roomId});
}

ctx.bthread('Pour hot water three times when tap button is pressed', 'roomWithTap', function (room) {
    while (true) {
        sync({waitFor: [tapButtonPressedEvent(room.id)]});
        for (let i = 0; i < 3; i++) {
            sync({request: [pourHotWaterEvent(room.id)]});
        }
    }
});
/*
For each room with a tap, when the tap's button is pressed, pour cold water three times.
*/
function pourColdWaterEvent(roomId) {
    return Event("pourColdWaterEvent", {roomId: roomId});
}

ctx.bthread('Pour cold water three times when tap button is pressed', 'roomWithTap', function (room) {
    while (true) {
        sync({waitFor: [tapButtonPressedEvent(room.id)]});
        for (let i = 0; i < 3; i++) {
            sync({request: [pourColdWaterEvent(room.id)]});
        }
    }
});
/*
Do not perform two consecutive pouring actions of the same type in kitchens, always allow cold water first
*/

ctx.bthread('Do not perform two consecutive pouring actions of the same type in kitchens, always allow cold water first', 'kitchen', function (kitchen) {
    while (true) {
        sync({waitFor: [pourColdWaterEvent(kitchen.id)], block: [pourHotWaterEvent(kitchen.id)]});
        sync({waitFor: [pourHotWaterEvent(kitchen.id)], block: [pourColdWaterEvent(kitchen.id)]});
    }
});

/*
No water can be poured after emergency button was pressed
*/
function emergencyButtonPressedEvent() {
    return Event("emergencyButtonPressedEvent");
}

ctx.bthread('Block pouring water after emergency button is pressed', function () {
    sync({waitFor: [emergencyButtonPressedEvent()]});
    sync({block: [anyEventNameWithData("pourHotWaterEvent"), anyEventNameWithData("pourColdWaterEvent")]});
});

