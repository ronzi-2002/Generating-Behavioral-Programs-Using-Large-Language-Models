/*
There are rooms. each room has a type(bedroom, kitchen and so on), some rooms have a tap.
*/
function room(id, type, hasTap) {
    return ctx.Entity(id, 'room', {type: type, hasTap: hasTap})
}
/*
Needed queries:
  1. room
  2. room with tap
  3. kitchen
*/
ctx.registerQuery('room', entity => entity.type == 'room');
ctx.registerQuery('room.withTap', entity => entity.type == 'room' && entity.hasTap);
ctx.registerQuery('kitchen', entity => entity.type == 'room' && entity.subtype == 'kitchen');
/*
For each room with a tap, when the tap's button is pressed, pour hot water three times.
*/
function tapButtonPressedEvent(roomId) {
    return Event("tapButtonPressed", {roomId: roomId});
}

function pourHotWaterEvent(roomId) {
    return Event("pourHotWater", {roomId: roomId});
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
For each room with a tap, when the tap's button is pressed, pour cold water three times.
*/
function pourColdWaterEvent(roomId) {
    return Event("pourColdWater", {roomId: roomId});
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
Do not perform two consecutive pouring actions of the same type in kitchens
*/
ctx.bthread('Do not perform two consecutive pouring actions of the same type in kitchens', 'kitchen', function (kitchen) {
    let lastEvent = null;
    while (true) {
        let event = sync({
            waitFor: [pourHotWaterEvent(kitchen.id), pourColdWaterEvent(kitchen.id)],
            block: lastEvent
        });
        lastEvent = event.name === 'pourHotWater' ? pourHotWaterEvent(kitchen.id) : pourColdWaterEvent(kitchen.id);
    }
});
/*
No water can be poured after an emergency button is pressed
*/
function emergencyButtonPressedEvent() {
    return Event("emergencyButtonPressed");
}

ctx.bthread('Block water pouring after emergency button is pressed', function () {
    sync({waitFor: [emergencyButtonPressedEvent()]});
    sync({block: [anyEventNameWithData("pourHotWater"), anyEventNameWithData("pourColdWater")]});
});
