/*
House: The main entity representing the house. Holding the rooms, the alarm and water systems.
Room: Individual spaces within the house such as living room, kitchen, bedroom, etc. Each have their "occupied" status, temperature and co2 level. 
Light: A type of actuator used to control lighting in the house. each light has its brightness level.
Thermostat: A device for controlling the temperature within the house. each thermostat has its target temperature level.
Security Camera: A device for monitoring and recording video for security purposes. each camera has its resolution, status(on/off). 
Door Lock: An actuator controlling access to the house or specific rooms. each door lock has its status (locked/unlocked).
Window: A component of the house that can be opened or closed. each window has its status (open/closed).
Blinds: Window coverings that can be adjusted to control light and privacy. each blind has its position (open/closed).
Alarm System: A system designed to alert users to potential security breaches or emergencies. the has its status (active/inactive).
Water System: A system designed that controls the waterFlawOf the house. Has its status (active/inactive).
External Temperature: Holds the external temperature
Each room also holds an array of( lights, thermostat, security cameras, doorlocks, windows, blinds)*/


function House(id, rooms, alarmSystem, waterSystem) {
    return ctx.Entity(id, 'House', {rooms: rooms, alarmSystem: alarmSystem, waterSystem: waterSystem});
}

function Room(id, occupied, temperature, co2Level, lights, thermostat, securityCameras, doorLocks, windows, blinds) {
    return ctx.Entity(id, 'Room', {occupied: occupied, temperature: temperature, co2Level: co2Level, lights: lights, thermostat: thermostat, securityCameras: securityCameras, doorLocks: doorLocks, windows: windows, blinds: blinds});
}

function Light(id, brightness) {
    return ctx.Entity(id, 'Light', {brightness: brightness});
}

function Thermostat(id, targetTemperature) {
    return ctx.Entity(id, 'Thermostat', {targetTemperature: targetTemperature});
}

function SecurityCamera(id, resolution, status) {
    return ctx.Entity(id, 'SecurityCamera', {resolution: resolution, status: status});
}

function DoorLock(id, status) {
    return ctx.Entity(id, 'DoorLock', {status: status});
}

function Window(id, status) {
    return ctx.Entity(id, 'Window', {status: status});
}

function Blinds(id, position) {
    return ctx.Entity(id, 'Blinds', {position: position});
}

function AlarmSystem(id, status) {
    return ctx.Entity(id, 'AlarmSystem', {status: status});
}

function WaterSystem(id, status) {
    return ctx.Entity(id, 'WaterSystem', {status: status});
}

function ExternalTemperature(id, temperature) {
    return ctx.Entity(id, 'ExternalTemperature', {temperature: temperature});
}

/*
needed queries:
    Room
    Occupied Room
    Unoccupied Room
    Restricted Area
    Living Room  
    unoccupied house - all rooms are unoccupied 
*/

ctx.registerQuery('Room', entity => entity.type == 'Room');

ctx.registerQuery('OccupiedRoom', entity => entity.type == 'Room' && entity.occupied == true);

ctx.registerQuery('UnoccupiedRoom', entity => entity.type == 'Room' && entity.occupied == false);

ctx.registerQuery('RestrictedArea', entity => entity.type == 'Room' && entity.restricted == true);

ctx.registerQuery('LivingRoom', entity => entity.type == 'Room' && entity.subtype == 'Living Room');

ctx.registerQuery('UnoccupiedHouse', house => house.type == 'House' && house.rooms.every(room => room.occupied == false));

//The system shall automatically adjust the lighting to 300 lux when occupancy is detected in a room 

// 1. Time Aspect:
// No time aspect involved.

// 2. Multiple Events:
// No multiple events requested at once.

// 3. Effects:
// Yes, there is an effect involved. The brightness level of the light needs to be set to 300 lux.
// Relevant entity: Light
// Event with effect: setLightBrightnessEvent

// 4. Bthread Context:
// Specific context applies to occupied rooms.
// Query used: OccupiedRoom

// 5. Waiting for Event:
// Waiting for a specific event indicating occupancy detection.

//Implementation
function setLightBrightnessEvent(lightId, brightness) {
    return Event("setLightBrightnessEvent", {lightId: lightId, brightness: brightness});
}

ctx.registerEffect('setLightBrightnessEvent', function (data) {
    let light = ctx.getEntityById(data.lightId);
    light.brightness = data.brightness;
});

ctx.bthread('Adjust lighting to 300 lux when occupancy is detected', 'OccupiedRoom', function (room) {
    room.lights.forEach(light => {
        sync({request: [setLightBrightnessEvent(light.id, 300)]});
    });
});

//turn off lights when the room is unoccupied for 10 minutes.

// 1. Time Aspect:
//    Yes, the duration of one of the queries (Unoccupied Room for 10 minutes).
//    Action: Use TIME inside the bthread.

// 2. Many Events Requested at Once:
//    No, only one type of event (turn off lights) is requested multiple times.
//    Action: Use RequestAllEvents if all lights need to be turned off simultaneously.

// 3. Effects:
//    Yes, changing the brightness of lights (turning off lights).
//    Relevant Entity: Light.
//    Event with Effect: setLightBrightnessEvent.
//    Action: Register effect for setLightBrightnessEvent.

// 4. Bthread Context:
//    Specific context: Unoccupied Room.
//    Action: Use the 'UnoccupiedRoom' query.

// 5. Waiting for:
//    Waiting for a specific time condition (10 minutes of unoccupancy).
//    Action: Use TimeToBe function.

// 6. Loop Sync:
//    Yes, the loop will meet the sync condition of waiting for 10 minutes unoccupancy.
//    Action: Ensure sync is within the loop.

// 7. Needed Events:
//    Needed Events: setLightBrightnessEvent.
//    Don't Declare the Events: setLightBrightnessEvent because it already exists.

// Implementation
ctx.bthread('Turn off lights when the room is unoccupied for 10 minutes', 'UnoccupiedRoom', function (room) {
    while (true) {
        let waitTill = new Date().getTime() + 600000; // 10 minutes
        sync({waitFor: [TimeToBe(new Date(waitTill).getHours(), new Date(waitTill).getMinutes())]});
        let EventsToRequest = room.lights.map(light => setLightBrightnessEvent(light.id, 0));
        RequestAllEvents(EventsToRequest);
    }
});

//when motion is detected in restricted areas between 10 PM and 6 AM,  the system shall activate security cameras to record in 1080p resolution.

// 1. Time Aspect:
//    Yes, action is dependent on the actual hour (between 10 PM and 6 AM).
// 2. Many Events Requested:
//    No, only one event type is requested multiple times for different entities.
// 3. Effects:
//    Yes, changing the status of security cameras to record at 1080p resolution. Relevant entity: SecurityCamera. Event with effect: setCameraRecordingEvent.
// 4. Bthread Context:
//    RestrictedArea - the requirement specifically mentions "restricted areas".
// 5. Waiting for:
//    A specific event (motion detected in restricted areas).
// 6. Loop Sync:
//    Yes, the loop will wait for the motion detection event each time.
// 7. Needed Events:
//    Needed Events: setCameraRecordingEvent. Don't Declare the Events: none, as setCameraRecordingEvent does not exist.

// Implementation
function setCameraRecordingEvent(cameraId, resolution) {
    return Event("setCameraRecordingEvent", {cameraId: cameraId, resolution: resolution});
}

ctx.registerEffect('setCameraRecordingEvent', function (data) {
    let camera = ctx.getEntityById(data.cameraId);
    camera.resolution = data.resolution;
    camera.status = 'on'; // Assuming 'on' means recording
});

ctx.bthread('Activate security cameras to record in 1080p when motion is detected in restricted areas between 10 PM and 6 AM', 'RestrictedArea', function (room) {
    while (true) {
        sync({waitFor: [motionDetectedEvent(room.id)]});
        let hour = new Date().getHours();
        if (hour >= 22 || hour < 6) {
            room.securityCameras.forEach(camera => {
                sync({request: [setCameraRecordingEvent(camera.id, 1080)]});
            });
        }
    }
});

//The system shall automatically lock all exterior doors at 10 PM and unlock at 6 AM.

// 1. Time Aspect:
//    Yes, waiting for a specific hour to request an event. Action: Use WaitFor[Time(Hour, Minute)] and then request.

// 2. Many Events Requested:
//    Yes, all need to happen (locking and unlocking all exterior doors). Action: Use RequestAll.

// 3. Effects:
//    Yes, changing the status of door locks. Relevant entity: DoorLock. Event with effect: lockDoorEvent, unlockDoorEvent.

// 4. Bthread Context:
//    No specific query needed. It applies globally to all exterior doors.

// 5. Waiting for:
//    No specific event or set of events to wait for, only time-based triggers.

// 6. Loop Sync:
//    Yes, the loop will meet the TimeToBe sync.

// 7. Needed Events:
//    Needed Events: lockDoorEvent, unlockDoorEvent. Don't Declare the Events: None, as they do not exist yet.

// Implementation
function lockDoorEvent(doorId) {
    return Event("lockDoorEvent", {doorId: doorId});
}

function unlockDoorEvent(doorId) {
    return Event("unlockDoorEvent", {doorId: doorId});
}

ctx.registerEffect('lockDoorEvent', function (data) {
    let door = ctx.getEntityById(data.doorId);
    door.status = 'locked';
});

ctx.registerEffect('unlockDoorEvent', function (data) {
    let door = ctx.getEntityById(data.doorId);
    door.status = 'unlocked';
});

ctx.bthread('Automatically lock all exterior doors at 10 PM and unlock at 6 AM', function () {
    while (true) {
        sync({waitFor: [TimeToBe(22, 0)]});
        let lockEvents = getEntitiesByType('DoorLock').map(door => lockDoorEvent(door.id));
        RequestAllEvents(lockEvents);

        sync({waitFor: [TimeToBe(6, 0)]});
        let unlockEvents = getEntitiesByType('DoorLock').map(door => unlockDoorEvent(door.id));
        RequestAllEvents(unlockEvents);
    }
});

//The system shall lock doors when the house is detected to be unoccupied for more than 30 minutes. 

// 1. Time Aspect:
//    The duration of one of the queries. Action: Use TIME inside the bthread.
// 2. Many Events Requested at Once:
//    All need to happen. Action: Use RequestAll.
// 3. Effects:
//    Locking doors changes the state of the door entity. Relevant entity: DoorLock. Event with effect: lockDoorEvent.
// 4. Bthread Context:
//    Applies to the whole house being unoccupied. Query: UnoccupiedHouse.
// 5. Waiting for:
//    A specific time duration. Action: Use TimeToBe.
// 6. Loop Sync:
//    The loop includes a sync that will surely meet - TimeToBe.
// 7. Needed Events:
//    Needed Events: lockDoorEvent. Don't Declare the Events: lockDoorEvent because it already exists.

// Implementation
ctx.bthread('Lock doors when the house is detected to be unoccupied for more than 30 minutes', 'UnoccupiedHouse', function (house) {
    while (true) {
        let waitTill = new Date().getTime() + 1800000; // 30 minutes
        sync({waitFor: [TimeToBe(new Date(waitTill).getHours(), new Date(waitTill).getMinutes())]});
        let lockEvents = house.rooms.flatMap(room => room.doorLocks.map(doorLock => lockDoorEvent(doorLock.id)));
        RequestAllEvents(lockEvents);
    }
});

// The system shall close blinds when the internal temperature exceeds 24°C (75°F) and open them when it falls below 20°C (68°F).

// 1. Is there a time aspect involved?
//    No time aspect related to duration or specific times is involved.

// 2. Are there many events requested at once?
//    No, events are requested one at a time based on temperature conditions.

// 3. Effects:
//    Yes, effects are involved to change the blinds' position.
//    Relevant entities: Blinds
//    Event with effect: setBlindsPositionEvent

// 4. Bthread Context:
//    The context is specific to each room as temperature conditions are checked per room.
//    Query used: Room

// 5. Are you waiting for a specific event or set of events?
//    No specific event is waited for; the bthread reacts to temperature changes.

// 6. Does Your Loop have some sync it will surely meet?
//    The loop will continuously check temperature, no specific sync event is required.

// 7. Which Events are needed?
//    Needed Events: setBlindsPositionEvent
//    Don't Declare the Events: None, setBlindsPositionEvent needs to be declared.

// Implementation
function setBlindsPositionEvent(blindId, position) {
    return Event("setBlindsPositionEvent", {blindId: blindId, position: position});
}

ctx.registerEffect('setBlindsPositionEvent', function (data) {
    let blind = ctx.getEntityById(data.blindId);
    blind.position = data.position;
});

ctx.bthread('Automatically adjust blinds based on room temperature', 'Room', function (room) {
    while (true) {
        if (room.temperature > 24) {
            room.blinds.forEach(blind => {
                sync({request: [setBlindsPositionEvent(blind.id, 'closed')]});
            });
        } else if (room.temperature < 20) {
            room.blinds.forEach(blind => {
                sync({request: [setBlindsPositionEvent(blind.id, 'open')]});
            });
        }
    }
});

//Windows shall be opened if the indoor CO2 level exceeds 1000 ppm and the external temperature is between 15°C (59°F) and 25°C (77°F).

// 1. Time Aspect:
//    No specific time duration or event length is involved. The requirement is dependent on the actual hour and CO2 level condition.
//    Action: Check the external temperature condition within the bthread after the CO2 level condition is met.

// 2. Many Events Requested:
//    Only one type of event (opening windows) is requested, but it applies to multiple windows.
//    Action: Use RequestAll for all windows in the room.

// 3. Effects:
//    The state of the window (open/closed) is changed, which is an existing entity.
//    Event with effect: setOpenWindowEvent.
//    Action: Register effect for setOpenWindowEvent.

// 4. Bthread Context:
//    The context is specific to rooms due to the CO2 level condition.
//    Action: Use the 'Room' query.

// 5. Waiting for:
//    Waiting for a condition on data (CO2 level exceeds 1000 ppm).
//    Action: Use anyEventNameWithData for CO2 level condition.

// 6. Loop Sync:
//    The loop will sync on the condition of CO2 level and time check.
//    Action: Ensure sync points are conditional and valid.

// 7. Needed Events:
//    Needed Events: setOpenWindowEvent.
//    Don't Declare the Events: None of the needed events exist.
//    Action: Declare setOpenWindowEvent with parameters.

//Implementation
function setOpenWindowEvent(windowId, status) {
    return Event("setOpenWindowEvent", {windowId: windowId, status: status});
}

ctx.registerEffect('setOpenWindowEvent', function (data) {
    let window = ctx.getEntityById(data.windowId);
    window.status = data.status;
});

ctx.bthread('Open windows if indoor CO2 level exceeds 1000 ppm and external temperature is between 15�C and 25�C', 'Room', function (room) {
    while (true) {
        sync({waitFor: anyEventNameWithData("CO2LevelChangedEvent", {roomId: room.id, level: (level) => level > 1000})});
        let externalTemp = ctx.getEntityById('externalTemperature').temperature;
        if (externalTemp >= 15 && externalTemp <= 25) {
            let openWindowEvents = room.windows.map(window => setOpenWindowEvent(window.id, 'open'));
            RequestAllEvents(openWindowEvents);
        }
    }
});

//The system shall shut off the water supply and notify the user if a water leak is detected for more than 30 seconds in any room.

// 1. Time Aspect:
//    The length(in time) of an event.
//    Action: Declare a new specific event(name the event) and don't use Time for this manner.

// 2. Many Events Requested:
//    All need to happen.
//    Action: Use RequestAll.

// 3. Effects:
//    Yes, there are effects involved with events.
//    Relevant Entities: WaterSystem.
//    Event with effect: shutOffWaterSupplyEvent.
//    Action: Register effect for the requested event.

// 4. Bthread Context:
//    No specific query needed.
//    Action: Use a general context as it applies to any room.

// 5. Waiting for:
//    An event without the exact data.
//    Action: Use anyEventNameWithData specifying only the data you know.

// 6. Loop Sync:
//    Yes, the loop has a sync it will surely meet.
//    Action: Ensure there is a sync in the loop.

// 7. Needed Events:
//    Needed Events: waterLeakDetectedFor30SecondsEvent, shutOffWaterSupplyEvent, notifyUserEvent.
//    Don't Declare the Events: None, all are new.
//    Action: Declare new events as needed.

// Implementation
function waterLeakDetectedFor30SecondsEvent(roomId) {
    return Event("waterLeakDetectedFor30SecondsEvent", {roomId: roomId});
}

function shutOffWaterSupplyEvent() {
    return Event("shutOffWaterSupplyEvent");
}

function notifyUserEvent(message) {
    return Event("notifyUserEvent", {message: message});
}

ctx.registerEffect('shutOffWaterSupplyEvent', function (data) {
    let waterSystem = ctx.getEntityByType('WaterSystem');
    waterSystem.status = 'inactive';
});

ctx.bthread('Shut off water supply and notify user if a water leak is detected for more than 30 seconds in any room','room', function () {
    while (true) {
        let event = sync({waitFor: [waterLeakDetectedFor30SecondsEvent(roomId)]})
        RequestAllEvents([
            shutOffWaterSupplyEvent(),
            notifyUserEvent("Water leak detected in room " + roomId + ". Water supply has been shut off.")
        ]);
    }
});

//The system shall immediately alert the user via mobile app and trigger house-wide alarms if smoke is detected at concentrations above 150 ppm.

// 1. Time Aspect:
//    No specific time aspect related to duration or specific hour requirements.
// 2. Many Events Requested:
//    Yes, multiple events need to happen (alert and alarm trigger).
//    Action: use RequestAll.
// 3. Effects:
//    No effects are needed as no state change of existing entities is specified.
// 4. Bthread Context:
//    No specific query needed as it applies globally whenever the condition is met.
// 5. Waiting for:
//    A specific event with a condition on data (smoke concentration above 150 ppm).
//    Action: use anyEventNameWithData.
// 6. Loop Sync:
//    The loop will meet a sync condition as it waits for a specific event.
// 7. Needed Events:
//    Needed Events: smokeDetectedEvent, alertUserEvent, triggerHouseWideAlarmsEvent.
//    Don't Declare the Events: None of these events exist yet.

// Implementation
function smokeDetectedEvent(concentration) {
    return Event("smokeDetectedEvent", {concentration: concentration});
}

function alertUserEvent(message) {
    return Event("alertUserEvent", {message: message});
}

function triggerHouseWideAlarmsEvent() {
    return Event("triggerHouseWideAlarmsEvent");
}

ctx.bthread('Alert user and trigger alarms if smoke is detected above 150 ppm', function () {
    while (true) {
        let event = sync({waitFor: [anyEventNameWithData("smokeDetectedEvent", {concentration: (concentration) => concentration > 150})]});
        RequestAllEvents([
            alertUserEvent("High smoke concentration detected: " + event.data.concentration + " ppm"),
            triggerHouseWideAlarmsEvent()
        ]);
    }
});

//The system shall send notifications and trigger alarms if an unauthorized entry is detected between 10 PM and 6 AM, or when the house is unoccupied.

// 1. Time Aspect:
//    Yes, the action is dependent on the actual hour (between 10 PM and 6 AM).
//    Action: Check the time after an event using an if statement.

// 2. Many Events Requested:
//    Yes, notifications and alarms need to be triggered simultaneously.
//    Action: Use RequestAllEvents.

// 3. Effects:
//    No effects are involved as no state change of an entity is specified.

// 4. Bthread Context:
//    The context is global as it applies to the entire house, especially when unoccupied or during specific hours.
//    Action: No specific query needed.

// 5. Waiting for an Event:
//    Waiting for an unauthorized entry event, which is not yet declared.
//    Action: Declare a new event for unauthorized entry detection.

// 6. Loop Sync:
//    The loop will always meet the sync condition as it waits for the unauthorized entry event.
//    Action: Ensure there is a sync in the loop.

// 7. Needed Events:
//    Needed Events: unauthorizedEntryDetectedEvent.
//    Don't Declare the Events: alertUserEvent, triggerHouseWideAlarmsEvent because they already exist.

// Implementation
function unauthorizedEntryDetectedEvent() {
    return Event("unauthorizedEntryDetectedEvent");
}

ctx.bthread('Alert and trigger alarms if unauthorized entry is detected between 10 PM and 6 AM, or when the house is unoccupied', function () {
    while (true) {
        sync({waitFor: [unauthorizedEntryDetectedEvent()]});
        let hour = new Date().getHours();
        let houseUnoccupied = ctx.query('UnoccupiedHouse').length > 0;
        if (hour >= 22 || hour < 6 || houseUnoccupied) {
            RequestAllEvents([
                alertUserEvent("Unauthorized entry detected."),
                triggerHouseWideAlarmsEvent()
            ]);
        }
    }
});

//The system shall notify emergency services in case of  a fire detected for 5 seconds, and provide real-time updates to the user.

// 1. Time Aspect:
//    The length(in time) of an event.
//    Action: Declare a new specific event(name the event) and don't use Time for this manner.

// 2. Many Events Requested:
//    All need to happen.
//    Action: Use RequestAllEvents.

// 3. Effects:
//    No effects are involved as no state change of an entity is specified.

// 4. Bthread Context:
//    No specific query needed.
//    Action: Use a global context as it applies to any room.

// 5. Waiting for:
//    A specific event with a time condition.
//    Action: Use anyEventNameWithData for the event with a condition.

// 6. Loop Sync:
//    The loop includes a sync that will surely meet - waiting for a fire detected event.
//    Action: Ensure sync is present in the loop.

// 7. Needed Events:
//    Needed Events: fireDetectedFor5SecondsEvent.
//    Don't Declare the Events: None of the needed events exist.

// Implementation
function fireDetectedFor5SecondsEvent() {
    return Event("fireDetectedFor5SecondsEvent");
}

ctx.bthread('Notify emergency services and provide real-time updates if fire is detected for 5 seconds', function () {
    while (true) {
        sync({waitFor: [fireDetectedFor5SecondsEvent()]});
        RequestAllEvents([
            notifyUserEvent("Real-time update: Fire detected."),
            alertUserEvent("Emergency services have been notified due to fire detection.")
        ]);
    }
});

//The system shall use motion and heat sensors to detect room occupancy. When motion or heat are detected, the room is considered occupied

// 1. Time aspect:
//    No time aspect involved that requires specific time-based actions.

// 2. Many events requested at once:
//    No, only one event type is requested per detected condition (motion or heat).

// 3. Effects:
//    Yes, the occupancy status of the room needs to be updated.
//    Relevant entity: Room
//    Event with effect: setRoomOccupancyEvent

// 4. Bthread Context:
//    Specific context: Room
//    Query used: Room

// 5. Waiting for:
//    A set of events (motionDetectedEvent or heatDetectedEvent) without exact data values.

// 6. Loop sync:
//    The loop includes a sync that waits for motion or heat detection events.

// 7. Needed Events:
//    Needed Events: setRoomOccupancyEvent, motionDetectedEvent, heatDetectedEvent.
//    Don't Declare the Events: None, all events need to be declared.

// Implementation
function setRoomOccupancyEvent(roomId, occupied) {
    return Event("setRoomOccupancyEvent", {roomId: roomId, occupied: occupied});
}

function motionDetectedEvent(roomId) {
    return Event("motionDetectedEvent", {roomId: roomId});
}

function heatDetectedEvent(roomId) {
    return Event("heatDetectedEvent", {roomId: roomId});
}

ctx.registerEffect('setRoomOccupancyEvent', function (data) {
    let room = ctx.getEntityById(data.roomId);
    room.occupied = data.occupied;
});

ctx.bthread('Detect room occupancy using motion and heat sensors', 'Room', function (room) {
    while (true) {
        let event = sync({waitFor: [motionDetectedEvent(room.id), heatDetectedEvent(room.id)]});
        sync({request: [setRoomOccupancyEvent(room.id, true)]});
    }
});

//The room is considered unoccupied if no motion was detected for 5 minutes

// 1. Time Aspect:
//    The duration of one of the queries (no motion detected for 5 minutes).
//    Action: Use TIME inside the bthread.

// 2. Many Events Requested at Once:
//    No, only one event is requested.
//    Action: Use regular sync({request:}).

// 3. Effects:
//    Yes, changing the occupancy status of a room.
//    Relevant entity: Room.
//    Event with effect: setRoomOccupancyEvent.
//    Action: Register effect for setRoomOccupancyEvent.

// 4. Bthread Context:
//    Specific context: UnoccupiedRoom.
//    Action: Use 'UnoccupiedRoom' query.

// 5. Waiting for:
//    A specific event with a time condition.
//    Action: Use TimeToBe for waiting 5 minutes without motion.

// 6. Loop Sync:
//    The loop includes a sync that will surely meet (TimeToBe).
//    Action: Ensure there's a sync that will be met.

// 7. Needed Events:
//    Needed Events: setRoomOccupancyEvent.
//    Don't Declare the Events: setRoomOccupancyEvent because it already exists.

// Implementation:
ctx.bthread('Set room as unoccupied if no motion is detected for 5 minutes', 'UnoccupiedRoom', function (room) {
    while (true) {
        let waitTill = new Date().getTime() + 300000; // 5 minutes
        sync({waitFor: [TimeToBe(new Date(waitTill).getHours(), new Date(waitTill).getMinutes())]});
        sync({request: [setRoomOccupancyEvent(room.id, false)]});
    }
});

//The system shall allow users to request different lighting scenes in any room, reading will turn lights to 500 lux, movie night will turn lights to 150 lux

// 1. Time Aspect:
//    No time aspect involved.

// 2. Multiple Events Request:
//    No multiple events requested at once.

// 3. Effects:
//    Yes, effect involved. The light's brightness needs to be updated. Event: adjustLightingEvent.

// 4. Bthread Context:
//    Context: Room. The behavior is directly related to the state of each room.

// 5. Event Type:
//    Waiting for a specific event (scene selection).

// 6. Loop Sync:
//    The loop includes a sync that will surely meet (scene selection event).

// 7. Needed Events:
//    Needed Events: setLightingSceneEvent. Don't Declare the Events: adjustLightingEvent because it already exists.

//implementation

function setLightingSceneEvent(roomId, scene) {
    return Event("setLightingSceneEvent", {roomId: roomId, scene: scene});
}

ctx.bthread('Allow users to activate different lighting scenes in any room', 'Room', function (room) {
    while (true) {
        let event = sync({waitFor: [setLightingSceneEvent(room.id)]});
        let brightness = (event.data.scene === 'reading') ? 500 : (event.data.scene === 'movie night') ? 150 : room.lights[0].brightness;
        room.lights.forEach(light => {
            sync({request: [adjustLightingEvent(light.id, brightness)]});
        });
    }
});
