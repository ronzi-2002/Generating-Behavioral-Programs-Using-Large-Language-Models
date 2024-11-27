/*
he house has three rooms: a bathroom, a kitchen, and a bedroom.
*/
function room(id, roomType) {
    return ctx.Entity(id, 'room', {roomType: roomType});
}

ctx.populateContext([
    room('room1', 'bathroom'),
    room('room2', 'kitchen'),
    room('room3', 'bedroom')
]);
/*
Needed queries: 
       1. Room with a tap - kitchen and bathrooms have taps
       2. Kitchen

*/
ctx.registerQuery('room.withTap', entity => entity.type == 'room' && (entity.roomType == 'kitchen' || entity.roomType == 'bathroom'));
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

ctx.bthread('Pour hot water three times when tap button is pressed', 'room.withTap', function (roomWithTap) {
    while (true) {
        sync({waitFor: [tapButtonPressedEvent(roomWithTap.id)]});
        for (let i = 0; i < 3; i++) {
            sync({request: [pourHotWaterEvent(roomWithTap.id)]});
        }
    }
});
/*
For each room with a tap, when the tap's button is pressed, pour cold water three times.
*/
function pourColdWaterEvent(roomId) {
    return Event("pourColdWaterEvent", {roomId: roomId});
}

ctx.bthread('Pour cold water three times when tap button is pressed', 'room.withTap', function (roomWithTap) {
    while (true) {
        sync({waitFor: [tapButtonPressedEvent(roomWithTap.id)]});
        for (let i = 0; i < 3; i++) {
            sync({request: [pourColdWaterEvent(roomWithTap.id)]});
        }
    }
});
/*
Do not perform two consecutive pouring actions of the same type in kitchens
*/
ctx.bthread('Do not perform two consecutive pouring actions of the same type in kitchens', 'room.kitchen', function (kitchen) {
    let lastEvent = null;
    while (true) {
        lastEvent = sync({waitFor: [pourHotWaterEvent(kitchen.id), pourColdWaterEvent(kitchen.id)], block: lastEvent});
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


//Additional requirements(1):

//Based on code above(1)
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

//Modifying the "Do not perform two consecutive pouring..."

/*
In kitchens, allow pouring water only in the following order: C, C, H, C, C, H, and so on, where C represents cold water, and H represents hot water
*/
ctx.bthread('Enforce water pouring order in kitchens', 'room.kitchen', function (kitchen) {
    while (true) {
        sync({waitFor: [pourColdWaterEvent(kitchen.id)], block: [pourHotWaterEvent(kitchen.id)]});
        sync({waitFor: [pourColdWaterEvent(kitchen.id)], block: [pourHotWaterEvent(kitchen.id)]});
        sync({waitFor: [pourHotWaterEvent(kitchen.id)], block: [pourColdWaterEvent(kitchen.id)]});
    }
});
/*
After pouring water from a tap in a kitchen 100 times, it should be cleaned
*/
function cleanTapEvent(roomId) {
    return Event("cleanTapEvent", {roomId: roomId});
}

ctx.bthread('Clean tap after 100 pours in a kitchen', 'room.kitchen', function (kitchen) {
    let pourCount = 0;
    while (true) {
        sync({waitFor: [pourHotWaterEvent(kitchen.id), pourColdWaterEvent(kitchen.id)]});
        pourCount++;
        if (pourCount >= 100) {
            sync({request: [cleanTapEvent(kitchen.id)]});
            pourCount = 0; // Reset the counter after cleaning
        }
    }
});