/*
There are rooms. each room has a type(bedroom, kitchen and so on), some rooms have a tap.

*/
function room(id, roomType, hasTap) {
    return ctx.Entity(id, 'room', {roomType: roomType, hasTap: hasTap});
}

/*
Needed queries:
  1. room
  2. room with tap
  3. kitchen

*/
ctx.registerQuery('room', entity => entity.type == 'room');
ctx.registerQuery('room.withTap', entity => entity.type == 'room' && entity.hasTap);
ctx.registerQuery('kitchen', entity => entity.type == 'room' && entity.roomType == 'kitchen');

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
In kitchens, allow pouring water only in the following order: C, C, H, C, C, H, and so on, where C represents cold water and H represents hot water.
*/
/*
In kitchens, allow pouring water only in the following order: C, C, H, C, C, H, and so on, where C represents cold water and H represents hot water.
*/
// To enforce the specific order of pouring water in kitchens (C, C, H, C, C, H, and so on), you can create a behavioral thread that manages the sequence of water pouring events based on the room type being a kitchen. Here's how you can implement this:
// 

ctx.bthread('Enforce water pouring order in kitchens', 'kitchen', function (kitchen) {
    while (true) {
        // First pour cold water twice
        sync({waitFor: [pourColdWaterEvent(kitchen.id)]});
        sync({waitFor: [pourColdWaterEvent(kitchen.id)]});
        
        // Then pour hot water once
        sync({waitFor: [pourHotWaterEvent(kitchen.id)]});
    }
});

// 
// This behavioral thread waits for two cold water pouring events followed by one hot water pouring event in a loop. It ensures that in kitchens, water is poured in the sequence C, C, H repeatedly. This thread will only be active for entities that are identified as kitchens, ensuring that the rule applies specifically to those rooms.
// To enforce the specific order of pouring water in kitchens (C, C, H, C, C, H, and so on), you can create a behavioral thread that manages the sequence of water pouring events based on the room type being a kitchen. Here's how you can implement this:
// 

ctx.bthread('Enforce water pouring order in kitchens', 'kitchen', function (kitchen) {
    while (true) {
        // First pour cold water twice
        sync({waitFor: [pourColdWaterEvent(kitchen.id)]});
        sync({waitFor: [pourColdWaterEvent(kitchen.id)]});
        
        // Then pour hot water once
        sync({waitFor: [pourHotWaterEvent(kitchen.id)]});
    }
});

// 
// This behavioral thread waits for two cold water pouring events followed by one hot water pouring event in a loop. It ensures that in kitchens, water is poured in the sequence C, C, H repeatedly. This thread will only be active for entities that are identified as kitchens, ensuring that the rule applies specifically to those rooms.
/*
In kitchens, allow pouring water only in the following order: C, C, H, C, C, H, and so on, where C represents cold water and H represents hot water.
*/
// To enforce the specific order of pouring water in kitchens (C, C, H, C, C, H, and so on), you can create a behavioral thread that manages the sequence of water pouring events based on the room type being a kitchen. Here's how you can implement this:
// 

ctx.bthread('Enforce water pouring order in kitchens', 'kitchen', function (kitchen) {
    while (true) {
        // First pour cold water twice
        sync({waitFor: [pourColdWaterEvent(kitchen.id)]});
        sync({waitFor: [pourColdWaterEvent(kitchen.id)]});
        
        // Then pour hot water once
        sync({waitFor: [pourHotWaterEvent(kitchen.id)]});
    }
});

// 
// This behavioral thread waits for two cold water pouring events followed by one hot water pouring event in a loop. It ensures that in kitchens, water is poured in the sequence C, C, H repeatedly. This thread will only be active for entities that are identified as kitchens, ensuring that the rule applies specifically to those rooms.
/*
No water can be poured after an emergency button is pressed

*/
function emergencyButtonPressedEvent() {
    return Event("emergencyButtonPressedEvent");
}

ctx.bthread('Block water pouring after emergency button is pressed', function () {
    sync({waitFor: [emergencyButtonPressedEvent()]});
    sync({block: [anyEventNameWithData("pourHotWaterEvent"), anyEventNameWithData("pourColdWaterEvent")]});
});

