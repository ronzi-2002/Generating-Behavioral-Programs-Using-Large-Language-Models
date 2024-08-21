/*
There are 4 stadiums in the city. Two football stadium, one basketball stadium and a tennis stadium.
*/
function stadium(id,subtype) {
    return ctx.Entity(id, 'stadium', {subtype: subtype})
}
ctx.populateContext([stadium('football1','football'),stadium('football2','football'),stadium('basketball1','basketball'),stadium('tennis1','tennis')]);

/*
Needed queries:
1. stadium
2. outdoor_stadium
*/
ctx.registerQuery('stadium', entity => entity.type == String('stadium'));
ctx.registerQuery('outdoor_stadium', entity => entity.type == String('stadium') && (entity.subtype == String('football') || entity.subtype == String('tennis')));
//BEHAVIOR REQUIREMENTS
/*
Stadium lights turn on right after sunset starts
*/
function sunsetStartEvent() {
    return Event("sunsetStartEvent")
}
function turnOnStadiumLightsEvent(stadiumId) {
    return Event("turnOnStadiumLightsEvent", stadiumId)
}

ctx.bthread('Stadium lights turn on right after sunset starts', 'stadium', function (stadium) {
    while(true) {
        sync({waitFor: [sunsetStartEvent()]});
        sync({request: [turnOnStadiumLightsEvent(stadium.id)]});
    }
});

/*
Stadium lights turn off after a game played in the stadium finishes
*/

function gameFinishedEvent(stadiumId) {
    return Event("gameFinishedEvent", stadiumId)
}
function turnOffStadiumLightsEvent(stadiumId) {
    return Event("turnOffStadiumLightsEvent", stadiumId)
}
ctx.bthread('Stadium lights turn off after a game played in the stadium finishes', 'stadium', function (stadium) {
    while(true) {
        sync({waitFor: [gameFinishedEvent(stadium.id)]});
        sync({request: [turnOffStadiumLightsEvent(stadium.id)]});
    }
});



/*
Lights cant be turned off until they were turned on and vice versa. All stadium lights are off at first(default)
*/
ctx.bthread('Lights cant be turned off until they were turned on and vice versa. All stadium lights are off at first(default)', 'stadium', function (stadium) {
    while(true) {
        sync({waitFor: [turnOnStadiumLightsEvent(stadium.id)], block: [turnOffStadiumLightsEvent(stadium.id)]});
        sync({waitFor: [turnOffStadiumLightsEvent(stadium.id)], block: [turnOnStadiumLightsEvent(stadium.id)]});
    }
});

/*
After a stadium is sent to destruction, no action can be performed on it ever again, including the destruction of it
*/
function destroyStadiumEvent(stadiumId) {
    return Event("destroyStadiumEvent", stadiumId)
}
ctx.bthread('After a stadium is sent to destruction, no action can be performed on it ever again, including the destruction of it', 'stadium', function (stadium) {
    sync({waitFor: [destroyStadiumEvent(stadium.id)]});
    sync({block: [cleanStadiumEvent(stadium.id), turnOnStadiumLightsEvent(stadium.id), turnOffStadiumLightsEvent(stadium.id), destroyStadiumEvent(stadium.id)]});
});



//Requirement:For outdoor stadiums (football and tennis), lights can not be turned on before the sunset starts.
//Output:
ctx.bthread('For outdoor stadiums (football and tennis), lights can not be turned on before the sunset starts', 'outdoor_stadium', function (stadium) {
        sync({waitFor: [sunsetStartEvent()], block: [turnOnStadiumLightsEvent(stadium.id)]});
});

