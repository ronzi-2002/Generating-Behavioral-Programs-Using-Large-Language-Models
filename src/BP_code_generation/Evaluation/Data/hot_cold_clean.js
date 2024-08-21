/*
There are 3 rooms in the house one of each type. One bathroom, one kitchen and a bedroom(the master bedroom).
*/
function room(id,subtype) {
    return ctx.Entity(id, 'room', {subtype: subtype})
}
ctx.populateContext([room('bathroom1','bathroom'),room('kitchen1','kitchen'),room('masterBedroom1','bedroom')]);

/*
Needed queries:
  1. room
  2. kitchen
  3. bathroom
  4. room_with_tap - kitchen and bathroom 
*/
ctx.registerQuery('room', entity => entity.type == String('room'));
ctx.registerQuery('kitchen', entity => entity.type == String('room') && entity.subtype == String('kitchen'));
ctx.registerQuery('bathroom', entity => entity.type == String('room') && entity.subtype == String('bathroom'));
ctx.registerQuery('room_with_tap', entity => entity.type == String('room') && (entity.subtype == String('bathroom') || entity.subtype == String('kitchen')));
//BEHAVIOR REQUIREMENTS
/*
for each room with a tap, each time the button is pressed, pour hot water three times
*/

function buttonIsPressedEvent(roomId) {
    return Event("buttonIsPressedEvent", roomId)
}
function pourHotWaterEvent(roomId) {
    return Event("pourHotWaterEvent", roomId)
}

ctx.bthread('for each room with a tap, each time the button is pressed, pour hot water three times', 'room_with_tap', function (room) {
    while(true) {
        sync({waitFor: [buttonIsPressedEvent(room.id)]});
        for (let i = 0; i < 3; i++) {
            sync({request: [pourHotWaterEvent(room.id)]});
        }
    }
})
/*
for each room with a tap, after the first time the button is pressed, pour cold water three times
*/
function pourColdWaterEvent(roomId) {
    return Event("pourColdWaterEvent", roomId)
}
ctx.bthread('for each room with a tap, after the first time the button is pressed, pour cold water three times', 'room_with_tap', function (room) {
    sync({waitFor: [buttonIsPressedEvent(room.id)]});
    for (let i = 0; i < 3; i++) {
        sync({request: [pourColdWaterEvent(room.id)]});
    }
})


/*
For each kitchen — two pouring actions of the same type cannot be executed consecutively.starting with cold water
*/
ctx.bthread('For each kitchen — two pouring actions of the same type cannot be executed consecutively. starting with cold water', 'kitchen', function (kitchen) {
    while(true){
        sync({waitFor: [pourColdWaterEvent(kitchen.id)], block: [pourHotWaterEvent(kitchen.id)]});
        sync({waitFor: [pourHotWaterEvent(kitchen.id)], block: [pourColdWaterEvent(kitchen.id)]});
    }
});

/*
after a baby is put in the bathroom tub, cold/hot water cant be added
*/
function babyIsInTubEvent(roomId) {
    return Event("babyIsInTubEvent", roomId)
}
ctx.bthread('after a baby is put in the bathroom tub, cold/hot water cant be added', 'bathroom', function (bathroom) {
    sync({waitFor: [babyIsInTubEvent(bathroom.id)]});
    sync({block: [pourColdWaterEvent(bathroom.id), pourHotWaterEvent(bathroom.id)]});
});

