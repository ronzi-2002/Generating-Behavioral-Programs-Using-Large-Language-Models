/*
There are rooms. each room has a type(bedroom, kitchen and so on), some rooms have a tap.
*/
function room(id, roomType, hasTap) {
    return ctx.Entity(id, 'room', {roomType: roomType, hasTap: hasTap})
}
/*
Needed queries:
  1. room with tap
  2. kitchen
*/
ctx.registerQuery('room.withTap', entity => entity.type == 'room' && entity.hasTap);

ctx.registerQuery('room.kitchen', entity => entity.type == 'room' && entity.roomType == 'kitchen');
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
            sync({requestOne: [pourHotWaterEvent(room.id)]});
        }
    }
});
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
            sync({requestOne: [pourColdWaterEvent(room.id)]});
        }
    }
});
/*
Do not perform two consecutive pouring actions of the same type in kitchens
*/
ctx.bthread('Do not perform two consecutive pouring actions of the same type in kitchens', 'room.kitchen', function (kitchen) {
    let lastEvent = null;
    while (true) {
        let event = sync({waitFor: [pourHotWaterEvent(kitchen.id), pourColdWaterEvent(kitchen.id)], block: lastEvent});
        lastEvent = event;
    }
});
/*
No water can be poured after an emergency button is pressed
*/
function emergencyButtonPressedEvent() {
    return Event("emergencyButtonPressedEvent");
}

ctx.bthread('Block water pouring after emergency button is pressed', function () {
    sync({waitFor: [emergencyButtonPressedEvent()]});
    sync({block: [anyEventWithData(pourHotWaterEvent), anyEventWithData(pourColdWaterEvent)]});
});
