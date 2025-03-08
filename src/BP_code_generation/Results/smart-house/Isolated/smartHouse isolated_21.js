//In this version, the the isolation is done by indicating all existing events in the instructions, as part of the steps.


/*
The house has three rooms: a bathroom, a kitchen, and a bedroom.
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
            sync({requestOne: [pourHotWaterEvent(roomWithTap.id)]});
        }
    }
});

/*
### Available functions you can use ###
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

ctx.bthread('Pour cold water three times when tap button is pressed', 'room.withTap', function (roomWithTap) {
    while (true) {
        sync({waitFor: [tapButtonPressedEvent(roomWithTap.id)]});
        for (let i = 0; i < 3; i++) {
            sync({requestOne: [pourColdWaterEvent(roomWithTap.id)]});
        }
    }
});
/*
### Available functions you can use ###
    Summary of existing events you can use if needed, without declaring them again.
     1. tapButtonPressedEvent(roomId)
     2. pourHotWaterEvent(roomId)
     3. pourColdWaterEvent(roomId)

*/
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
### Available functions you can use ###
    Summary of existing events you can use if needed, without declaring them again.
        1. tapButtonPressedEvent(roomId)
        2. pourHotWaterEvent(roomId)
        3. pourColdWaterEvent(roomId)
*/

//Additional requirements(1):
//Based on code above(1)
/*
No water can be poured after an tap button is pressed 
*/
ctx.bthread('Block pouring water after tap button is pressed', function () {
    while (true) {
        sync({waitFor: [anyEventWithData(tapButtonPressedEvent)]});
        sync({block: [anyEventWithData(pourHotWaterEvent), anyEventWithData(pourColdWaterEvent)]});
    }
});
//Based on code above(1)
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
//Based on code above(1)
/*
For each room with a motion sensor, turn the lights on once a motion is detected, and then off once it stops. 
*/
//To avoid 2 bthreads, added the key word "then", i think it is more accurate.
//Another way is a simple change in the instructions: 3. Implement the bthread (One at most).  Added the key word "One at most" to the instructions.
function motionDetectedEvent(roomId) {
    return Event("motionDetectedEvent", {roomId: roomId});
}

function motionStoppedEvent(roomId) {
    return Event("motionStoppedEvent", {roomId: roomId});
}

function turnLightsOnEvent(roomId) {
    return Event("turnLightsOnEvent", {roomId: roomId});
}

function turnLightsOffEvent(roomId) {
    return Event("turnLightsOffEvent", {roomId: roomId});
}

ctx.bthread('Turn lights on when motion is detected and off when it stops', 'room.withMotionSensor', function (room) {
    while (true) {
        sync({waitFor: [motionDetectedEvent(room.id)]});
        sync({requestOne: [turnLightsOnEvent(room.id)]});
        sync({waitFor: [motionStoppedEvent(room.id)]});
        sync({requestOne: [turnLightsOffEvent(room.id)]});
    }
});

//Modifying the "Do not perform two consecutive pouring..."

/*
In kitchens, dont allow pouring water in any other order then the next: C, C, H, C, C, H, and so on, where C represents cold water, and H represents hot water 
*/
ctx.bthread('Enforce water pouring order in kitchens', 'room.kitchen', function (kitchen) {
    while (true) {
        sync({waitFor: [pourColdWaterEvent(kitchen.id)], block: [pourHotWaterEvent(kitchen.id)]});
        sync({waitFor: [pourColdWaterEvent(kitchen.id)], block: [pourHotWaterEvent(kitchen.id)]});
        sync({waitFor: [pourHotWaterEvent(kitchen.id)], block: [pourColdWaterEvent(kitchen.id)]});
    }
});

//Based on code above(1)
/*
After pouring water from a tap in a kitchen 100 times, it should be cleaned
*/
function cleanTapEvent(roomId) {
    return Event("cleanTapEvent", { roomId: roomId });
}

ctx.bthread('Clean kitchen tap after 100 pours', 'room.kitchen', function (kitchen) {
    let count = 0;
    while (true) {
        sync({ waitFor: [pourHotWaterEvent(kitchen.id), pourColdWaterEvent(kitchen.id)] });
        count++;
        if (count >= 100) {
            sync({ requestOne: [cleanTapEvent(kitchen.id)] });
            count = 0; // Reset the count after cleaning
        }
    }
});