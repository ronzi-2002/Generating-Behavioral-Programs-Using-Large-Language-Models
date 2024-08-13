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
    return ctx.Entity(id, 'Room', {
        occupied: occupied,
        temperature: temperature,
        co2Level: co2Level,
        lights: lights,
        thermostat: thermostat,
        securityCameras: securityCameras,
        doorLocks: doorLocks,
        windows: windows,
        blinds: blinds
    });
}

function Light(id, brightnessLevel) {
    return ctx.Entity(id, 'Light', {brightnessLevel: brightnessLevel});
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

ctx.registerQuery('OccupiedRoom', entity => entity.type == 'Room' && entity.occupied === true);

ctx.registerQuery('UnoccupiedRoom', entity => entity.type == 'Room' && entity.occupied === false);

ctx.registerQuery('RestrictedArea', entity => entity.type == 'Room' && entity.restricted === true);

ctx.registerQuery('LivingRoom', entity => entity.type == 'Room' && entity.subtype === 'Living Room');

ctx.registerQuery('UnoccupiedHouse', house => house.type == 'House' && house.rooms.every(room => room.occupied === false));

//The system shall automatically adjust the lighting to 300 lux when occupancy is detected in a room 

function adjustLightingEvent(lightId, brightness) {
    return Event("adjustLightingEvent", {lightId: lightId, brightness: brightness});
}

ctx.registerEffect('adjustLightingEvent', function (data) {
    let light = ctx.getEntityById(data.lightId);
    light.brightnessLevel = data.brightness;
});

ctx.bthread('Automatically adjust lighting to 300 lux when occupancy is detected', 'OccupiedRoom', function (room) {
    room.lights.forEach(light => {
        sync({request: [adjustLightingEvent(light.id, 300)]});
    });
});

//turn off lights when the room is unoccupied for 10 minutes.

function turnOffLightEvent(lightId) {
    return Event("turnOffLightEvent", {lightId: lightId});
}

ctx.registerEffect('turnOffLightEvent', function (data) {
    let light = ctx.getEntityById(data.lightId);
    light.brightnessLevel = 0;
});

ctx.bthread('Turn off lights when the room is unoccupied for 10 minutes', 'UnoccupiedRoom', function (room) {
    let waitTill = new Date().getTime() + 600000; // 10 minutes
    sync({waitFor: [TimeToBe(new Date(waitTill).getHours(), new Date(waitTill).getMinutes())]});
    room.lights.forEach(light => {
        sync({request: [turnOffLightEvent(light.id)]});
    });
});

//when motion is detected in restricted areas between 10 PM and 6 AM,  the system shall activate security cameras to record in 1080p resolution.

function motionDetectedEvent(roomId) {
    return Event("motionDetectedEvent", {roomId: roomId});
}

function activateCameraRecordingEvent(cameraId, resolution) {
    return Event("activateCameraRecordingEvent", {cameraId: cameraId, resolution: resolution});
}

ctx.registerEffect('activateCameraRecordingEvent', function (data) {
    let camera = ctx.getEntityById(data.cameraId);
    camera.status = 'on';
    camera.resolution = data.resolution;
});

ctx.bthread('Activate security cameras to record in 1080p when motion is detected in restricted areas between 10 PM and 6 AM', 'RestrictedArea', function (room) {
    while (true) {
        sync({waitFor: [motionDetectedEvent(room.id)]});
        let currentHour = new Date().getHours();
        if (currentHour >= 22 || currentHour < 6) {
            room.securityCameras.forEach(camera => {
                sync({request: [activateCameraRecordingEvent(camera.id, 1080)]});
            });
        }
    }
});

//The system shall automatically lock all living room doors at 10 PM and unlock at 6 AM.

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

ctx.bthread('Automatically lock all exterior doors at 10 PM and unlock at 6 AM', 'LivingRoom', function (room) {
    while (true) {
        sync({waitFor: [TimeToBe(22, 0)]});
            room.doorLocks.forEach(doorLock => {
                    sync({request: [lockDoorEvent(doorLock.id)]});
            });
        sync({waitFor: [TimeToBe(6, 0)]});
            room.doorLocks.forEach(doorLock => {
                    sync({request: [unlockDoorEvent(doorLock.id)]});
            });
    }
});

//The system shall lock doors when the house is detected to be unoccupied for more than 30 minutes. 

function lockDoorEvent(doorId) {
    return Event("lockDoorEvent", {doorId: doorId});
}

ctx.registerEffect('lockDoorEvent', function (data) {
    let door = ctx.getEntityById(data.doorId);
    door.status = 'locked';
});

ctx.bthread('Lock doors when the house is detected to be unoccupied for more than 30 minutes', 'UnoccupiedHouse', function (house) {
    let waitTill = new Date().getTime() + 1800000; // 30 minutes
    sync({waitFor: [TimeToBe(new Date(waitTill).getHours(), new Date(waitTill).getMinutes())]});
    house.rooms.forEach(room => {
        room.doorLocks.forEach(doorLock => {
            sync({request: [lockDoorEvent(doorLock.id)]});
        });
    });
});

// The system shall close blinds when the internal temperature exceeds 24°C (75°F) and open them when it falls below 20°C (68°F).

function closeBlindsEvent(blindId) {
    return Event("closeBlindsEvent", {blindId: blindId});
}

function openBlindsEvent(blindId) {
    return Event("openBlindsEvent", {blindId: blindId});
}

ctx.registerEffect('closeBlindsEvent', function (data) {
    let blind = ctx.getEntityById(data.blindId);
    blind.position = 'closed';
});

ctx.registerEffect('openBlindsEvent', function (data) {
    let blind = ctx.getEntityById(data.blindId);
    blind.position = 'open';
});

ctx.bthread('Close blinds when internal temperature exceeds 24�C and open them when it falls below 20�C', 'Room', function (room) {
    while (true) {
        if (room.temperature > 24) {
            room.blinds.forEach(blind => {
                sync({request: [closeBlindsEvent(blind.id)]});
            });
        } else if (room.temperature < 20) {
            room.blinds.forEach(blind => {
                sync({request: [openBlindsEvent(blind.id)]});
            });
        }
    }
});

//Windows shall be opened if the indoor CO2 level exceeds 1000 ppm and the external temperature is between 15°C (59°F) and 25°C (77°F).

function openWindowEvent(windowId) {
    return Event("openWindowEvent", {windowId: windowId});
}

ctx.registerEffect('openWindowEvent', function (data) {
    let window = ctx.getEntityById(data.windowId);
    window.status = 'open';
});

ctx.bthread('Open windows if indoor CO2 level exceeds 1000 ppm and external temperature is between 15�C and 25�C', 'Room', function (room) {
    let externalTemp = ctx.getEntityByType('ExternalTemperature');
    if (room.co2Level > 1000 && externalTemp.temperature >= 15 && externalTemp.temperature <= 25) {
        room.windows.forEach(window => {
            sync({request: [openWindowEvent(window.id)]});
        });
    }
});

//The system shall shut off the water supply and notify the user if a water leak is detected for more than 30 seconds in any room.

function waterLeakDetectedEvent(roomId) {
    return Event("waterLeakDetectedEvent", {roomId: roomId});
}

function shutOffWaterEvent(waterSystemId) {
    return Event("shutOffWaterEvent", {waterSystemId: waterSystemId});
}

function notifyUserEvent(message) {
    return Event("notifyUserEvent", {message: message});
}

ctx.registerEffect('shutOffWaterEvent', function (data) {
    let waterSystem = ctx.getEntityById(data.waterSystemId);
    waterSystem.status = 'inactive';
});

ctx.bthread('Shut off the water supply and notify the user if a water leak is detected for more than 30 seconds', 'Room', function (room) {
    sync({waitFor: [waterLeakDetectedEvent(room.id)]});
    let waitTill = new Date().getTime() + 30000; // 30 seconds
    let event = sync({waitFor: [TimeToBe(new Date(waitTill).getHours(), new Date(waitTill).getMinutes()), waterLeakDetectedEvent(room.id)]});
    if (event.name === "TimeToBe") {
        let house = ctx.getEntitiesByType('House')[0]; // Assuming there is one house entity
        sync({request: [shutOffWaterEvent(house.waterSystem.id), notifyUserEvent("Water leak detected in room " + room.id + ". Water supply has been shut off.")]});
    }
});

//The system shall immediately alert the user via mobile app and trigger house-wide alarms if smoke is detected at concentrations above 150 ppm.

function smokeDetectedEvent(roomId, concentration) {
    return Event("smokeDetectedEvent", {roomId: roomId, concentration: concentration});
}

function alertUserEvent(message) {
    return Event("alertUserEvent", {message: message});
}

function triggerAlarmEvent(alarmSystemId) {
    return Event("triggerAlarmEvent", {alarmSystemId: alarmSystemId});
}

ctx.registerEffect('triggerAlarmEvent', function (data) {
    let alarmSystem = ctx.getEntityById(data.alarmSystemId);
    alarmSystem.status = 'active';
});

ctx.bthread('Alert user and trigger house-wide alarms if smoke is detected above 150 ppm', 'Room', function (room) {
    sync({waitFor: anyEventNameWithData("smokeDetectedEvent", {roomId: room.id, concentration: (concentration) => concentration > 150})});
    let house = ctx.getEntitiesByType('House')[0]; // Assuming there is one house entity
    RequestAllEvents([
        alertUserEvent("Smoke detected at high concentration in room " + room.id + ". Immediate action required!"),
        triggerAlarmEvent(house.alarmSystem.id)
    ]);
});

//The system shall send notifications and trigger alarms if an unauthorized entry is detected between 10 PM and 6 AM, or when the house is unoccupied.

function unauthorizedEntryDetectedEvent(roomId) {
    return Event("unauthorizedEntryDetectedEvent", {roomId: roomId});
}

function sendNotificationEvent(message) {
    return Event("sendNotificationEvent", {message: message});
}

function triggerAlarmEvent(alarmSystemId) {
    return Event("triggerAlarmEvent", {alarmSystemId: alarmSystemId});
}

ctx.registerEffect('triggerAlarmEvent', function (data) {
    let alarmSystem = ctx.getEntityById(data.alarmSystemId);
    alarmSystem.status = 'active';
});

ctx.bthread('Send notifications and trigger alarms if unauthorized entry is detected between 10 PM and 6 AM, or when the house is unoccupied', 'House', function (house) {
    while (true) {
        sync({waitFor: [unauthorizedEntryDetectedEvent()]});
        let currentHour = new Date().getHours();
        if (currentHour >= 22 || currentHour < 6 || house.rooms.every(room => !room.occupied)) {
            RequestAllEvents([
                sendNotificationEvent("Unauthorized entry detected. Security alert!"),
                triggerAlarmEvent(house.alarmSystem.id)
            ]);
        }
    }
});

//The system shall notify emergency services in case of  a fire detected for 5 seconds, and provide real-time updates to the user.

function fireDetectedEvent(roomId) {
    return Event("fireDetectedEvent", {roomId: roomId});
}

function notifyEmergencyServicesEvent(message) {
    return Event("notifyEmergencyServicesEvent", {message: message});
}

function updateRealTimeToUserEvent(message) {
    return Event("updateRealTimeToUserEvent", {message: message});
}

ctx.bthread('Notify emergency services and provide real-time updates to the user if fire is detected for 5 seconds', 'Room', function (room) {
    sync({waitFor: [fireDetectedEvent(room.id)]});
    let waitTill = new Date().getTime() + 5000; // 5 seconds
    let event = sync({waitFor: [TimeToBe(new Date(waitTill).getHours(), new Date(waitTill).getMinutes()), fireDetectedEvent(room.id)]});
    if (event.name === "TimeToBe") {
        RequestAllEvents([
            notifyEmergencyServicesEvent("Fire detected in room " + room.id + ". Immediate emergency response required."),
            updateRealTimeToUserEvent("Fire detected in room " + room.id + ". Emergency services have been alerted.")
        ]);
    }
});

//The system shall use motion and heat sensors to detect room occupancy. When motion or heat are detected, the room is considered occupied

function motionDetectedEvent(roomId) {
    return Event("motionDetectedEvent", {roomId: roomId});
}

function heatDetectedEvent(roomId) {
    return Event("heatDetectedEvent", {roomId: roomId});
}

ctx.registerEffect('setRoomOccupied', function (data) {
    let room = ctx.getEntityById(data.roomId);
    room.occupied = true;
});

ctx.bthread('Set room as occupied when motion or heat are detected', 'Room', function (room) {
    sync({waitFor: [motionDetectedEvent(room.id), heatDetectedEvent(room.id)]});
    sync({request: [Event("setRoomOccupied", {roomId: room.id})]});
});

//The room is considered unoccupied if no motion was detected for 5 minutes

function noMotionDetectedEvent(roomId) {
    return Event("noMotionDetectedEvent", {roomId: roomId});
}

ctx.registerEffect('setRoomUnoccupied', function (data) {
    let room = ctx.getEntityById(data.roomId);
    room.occupied = false;
});

ctx.bthread('Set room as unoccupied if no motion is detected for 5 minutes', 'Room', function (room) {
    let waitTill = new Date().getTime() + 300000; // 5 minutes
    let event = sync({waitFor: [TimeToBe(new Date(waitTill).getHours(), new Date(waitTill).getMinutes()), noMotionDetectedEvent(room.id)]});
    if (event.name === "TimeToBe") {
        sync({request: [Event("setRoomUnoccupied", {roomId: room.id})]});
    }
});

//The system shall allow users to request different lighting scenes in any room, reading will turn lights to 500 lux, movie night will turn lights to 150 lux

function requestLightingSceneEvent(roomId, scene) {
    return Event("requestLightingSceneEvent", {roomId: roomId, scene: scene});
}

function adjustLightingEvent(lightId, brightness) {
    return Event("adjustLightingEvent", {lightId: lightId, brightness: brightness});
}

ctx.registerEffect('adjustLightingEvent', function (data) {
    let light = ctx.getEntityById(data.lightId);
    light.brightnessLevel = data.brightness;
});

ctx.bthread('Allow users to request different lighting scenes in any room', 'Room', function (room) {
    while (true) {
        let event = sync({waitFor: [requestLightingSceneEvent(room.id)]});
        let brightness = 0;
        if (event.data.scene === 'reading') {
            brightness = 500;
        } else if (event.data.scene === 'movie night') {
            brightness = 150;
        }
        room.lights.forEach(light => {
            sync({request: [adjustLightingEvent(light.id, brightness)]});
        });
    }
});

