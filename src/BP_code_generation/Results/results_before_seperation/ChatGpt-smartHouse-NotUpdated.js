/**
House: The main entity representing the house.
Room: Individual spaces within the house such as living room, kitchen, bedroom, etc. Each have their "occupied" status and co2 level.
Light: A type of actuator used to control lighting in the house. each light has its brightness level and room id.
Thermostat: A device for controlling the temperature within the house. each thermostat has its temperature level and room id.
Security Camera: A device for monitoring and recording video for security purposes. each camera has its resolution and room id.
Door Lock: An actuator controlling access to the house or specific rooms. each door lock has its status (locked/unlocked) and room id.
Window: A component of the house that can be opened or closed. each window has its status (open/closed) and room id.
Blinds: Window coverings that can be adjusted to control light and privacy. each blind has its position (open/closed) and room id.
Appliance: Household devices such as refrigerators, ovens, washing machines, etc. each appliance has its applianceType, status (on/off) and room id.
Alarm System: A system designed to alert users to potential security breaches or emergencies. the has its status (active/inactive).
Water System: A system designed that controls the waterFlawOf the house. Has its status (active/inactive).*/
function House(id) {
    return ctx.Entity(id, 'House', {});
}

function Room(id, occupied, co2Level) {
    return ctx.Entity(id, 'Room', {occupied: occupied, co2Level: co2Level});
}

function Light(id, brightness, roomId) {
    return ctx.Entity(id, 'Light', {brightness: brightness, roomId: roomId});
}

function Thermostat(id, temperature, roomId) {
    return ctx.Entity(id, 'Thermostat', {temperature: temperature, roomId: roomId});
}

function SecurityCamera(id, resolution, roomId) {
    return ctx.Entity(id, 'SecurityCamera', {resolution: resolution, roomId: roomId});
}

function DoorLock(id, status, roomId) {
    return ctx.Entity(id, 'DoorLock', {status: status, roomId: roomId});
}

function Window(id, status, roomId) {
    return ctx.Entity(id, 'Window', {status: status, roomId: roomId});
}

function Blinds(id, position, roomId) {
    return ctx.Entity(id, 'Blinds', {position: position, roomId: roomId});
}

function Appliance(id, applianceType, status, roomId) {
    return ctx.Entity(id, 'Appliance', {applianceType: applianceType, status: status, roomId: roomId});
}

function AlarmSystem(id, status) {
    return ctx.Entity(id, 'AlarmSystem', {status: status});
}
function WaterSystem(id, status) { 
    return ctx.Entity(id, 'WaterSystem', {status: status}); 
}
/**

needed queries:
    Room
    Occupied Room
    Unoccupied Room
    Restricted Area
    exterior_door - a door of a living room
    unoccupied house - all rooms are unoccupied 
    LightsOn
    LightsOff
    ThermostatInOccupiedRoom
    ThermostatInUnoccupiedRoom
    SecurityCameraActive
    LockedDoor
    UnlockedDoor
    OpenWindow
    ClosedWindow
    OpenBlinds
    ClosedBlinds
    ActiveAppliance
    InactiveAppliance
    ActiveAlarmSystem
    InactiveAlarmSystem
    ActiveWaterSystem
    InactiveWaterSystem
 */



ctx.registerQuery('Room', entity => entity.type == 'Room');

ctx.registerQuery('OccupiedRoom', entity => entity.type == 'Room' && entity.occupied);

ctx.registerQuery('UnoccupiedRoom', entity => entity.type == 'Room' && !entity.occupied);

ctx.registerQuery('RestrictedArea', entity => entity.type == 'Room' && entity.restricted);

ctx.registerQuery('exterior_door', entity => entity.type == 'DoorLock' && entity.roomId == 'livingRoom');

ctx.registerQuery('unoccupied house', entities => entities.filter(entity => entity.type == 'Room').every(room => !room.occupied));

ctx.registerQuery('LightsOn', entity => entity.type == 'Light' && entity.brightness > 0);

ctx.registerQuery('LightsOff', entity => entity.type == 'Light' && entity.brightness == 0);

ctx.registerQuery('ThermostatInOccupiedRoom', entity => entity.type == 'Thermostat' && ctx.getEntityById(entity.roomId).occupied);

ctx.registerQuery('ThermostatInUnoccupiedRoom', entity => entity.type == 'Thermostat' && !ctx.getEntityById(entity.roomId).occupied);

ctx.registerQuery('SecurityCameraActive', entity => entity.type == 'SecurityCamera' && entity.active);

ctx.registerQuery('LockedDoor', entity => entity.type == 'DoorLock' && entity.status == 'locked');

ctx.registerQuery('UnlockedDoor', entity => entity.type == 'DoorLock' && entity.status == 'unlocked');

ctx.registerQuery('OpenWindow', entity => entity.type == 'Window' && entity.status == 'open');

ctx.registerQuery('ClosedWindow', entity => entity.type == 'Window' && entity.status == 'closed');

ctx.registerQuery('OpenBlinds', entity => entity.type == 'Blinds' && entity.position == 'open');

ctx.registerQuery('ClosedBlinds', entity => entity.type == 'Blinds' && entity.position == 'closed');

ctx.registerQuery('ActiveAppliance', entity => entity.type == 'Appliance' && entity.status == 'on');

ctx.registerQuery('InactiveAppliance', entity => entity.type == 'Appliance' && entity.status == 'off');

ctx.registerQuery('ActiveAlarmSystem', entity => entity.type == 'AlarmSystem' && entity.status == 'active');

ctx.registerQuery('InactiveAlarmSystem', entity => entity.type == 'AlarmSystem' && entity.status == 'inactive');

ctx.registerQuery('ActiveWaterSystem', entity => entity.type == 'WaterSystem' && entity.status == 'active'); 

ctx.registerQuery('InactiveWaterSystem', entity => entity.type == 'WaterSystem' && entity.status == 'inactive');
        
/**
The system shall automatically adjust the lighting to 300 lux when occupancy is detected in a room 
and turn off lights when the room is unoccupied for 10 minutes.
 */

function adjustLightingEvent(roomId, brightnessLevel) {
    return Event("adjustLighting", {roomId: roomId, brightnessLevel: brightnessLevel});
}

ctx.registerEffect('adjustLighting', function (data) {
    let light = ctx.getEntities('Light').find(light => light.roomId === data.roomId);
    light.brightnessLevel = data.brightnessLevel;
});

ctx.bthread('Adjust lighting on occupancy', 'OccupiedRoom', function (room) {
    sync({request: [adjustLightingEvent(room.id, 300)]});
});

ctx.bthread('Turn off lights after 10 minutes of unoccupancy', 'UnoccupiedRoom', function (room) {
    Sleep(600000); // Wait for 10 minutes
    sync({request: [adjustLightingEvent(room.id, 0)]});
});

/**
 The system shall set the thermostat to 22°C (72°F) 
 when a room is occupied and adjust to 18°C (64°F) when unoccupied.
 */

function setThermostatEvent(roomId, temperature) {
    return Event("setThermostat", {roomId: roomId, temperature: temperature});
}

ctx.registerEffect('setThermostat', function (data) {
    let thermostat = ctx.getEntities('Thermostat').find(thermostat => thermostat.roomId === data.roomId);
    thermostat.temperature = data.temperature;
});

ctx.bthread('Set thermostat to 22°C when room is occupied', 'OccupiedRoom', function (room) {
    sync({request: [setThermostatEvent(room.id, 22)]});
});

ctx.bthread('Adjust thermostat to 18°C when room is unoccupied', 'UnoccupiedRoom', function (room) {
    sync({request: [setThermostatEvent(room.id, 18)]});
});


/**
 The system shall activate security cameras to record in 1080p resolution when 
 motion is detected in restricted areas between 10 PM and 6 AM.
*/

function activateCameraEvent(roomId, resolution) {
    return Event("activateCamera", {roomId: roomId, resolution: resolution});
}

ctx.registerEffect('activateCamera', function (data) {
    let camera = ctx.getEntities('SecurityCamera').find(camera => camera.roomId === data.roomId);
    camera.status = 'active';
    camera.resolution = data.resolution;
});

ctx.bthread('Activate security cameras in restricted areas at night on motion', 'RestrictedArea', function (room) {
    while (true) {
        sync({waitFor: [motionDetectedEvent(room.id)]});
        let currentTime = new Date();
        let currentHour = currentTime.getHours();
        if (currentHour >= 22 || currentHour < 6) {
            sync({request: [activateCameraEvent(room.id, 1080)]});
        }
    }
});

function motionDetectedEvent(roomId) {
    return Event("motionDetected", {roomId: roomId});
}



/*
The system shall automatically lock all exterior doors at 10 PM and unlock at 6 AM.
*/
function lockDoorEvent(roomId) {
    return Event("lockDoor", {roomId: roomId});
}

function unlockDoorEvent(roomId) {
    return Event("unlockDoor", {roomId: roomId});
}

ctx.registerEffect('lockDoor', function (data) {
    let door = ctx.getEntities('DoorLock').find(door => door.roomId === data.roomId);
    door.status = 'locked';
});

ctx.registerEffect('unlockDoor', function (data) {
    let door = ctx.getEntities('DoorLock').find(door => door.roomId === data.roomId);
    door.status = 'unlocked';
});

ctx.bthread('Automatically lock all exterior doors at 10 PM', 'exterior_door', function (door) {
    while (true) {
        let currentTime = new Date().getHours();
        if (currentTime === 22) {
            sync({request: [lockDoorEvent(door.id)]});
        }
        Sleep(3600000); // Check hourly
    }
});

ctx.bthread('Automatically unlock all exterior doors at 6 AM', 'exterior_door', function (door) {
    while (true) {
        let currentTime = new Date().getHours();
        if (currentTime === 6) {
            sync({request: [unlockDoorEvent(door.id)]});
        }
        Sleep(3600000); // Check hourly
    }
});

/*
The system shall lock doors when the house 
is detected to be unoccupied for more than 30 minutes.
*/
ctx.bthread('Lock doors when house is unoccupied for more than 30 minutes', 'unoccupied house', function () {
    Sleep(1800000); // Wait for 30 minutes
    let doors = ctx.getEntities('DoorLock');
    doors.forEach(door => {
        sync({request: [lockDoorEvent(door.id)]});
    });
});
/*
 The system shall close blinds when the internal temperature exceeds 24°C 
(75°F) and open them when it falls below 20°C (68°F).
*/
function closeBlindsEvent(roomId) {
    return Event("closeBlinds", {roomId: roomId});
}

function openBlindsEvent(roomId) {
    return Event("openBlinds", {roomId: roomId});
}

ctx.registerEffect('closeBlinds', function (data) {
    let blinds = ctx.getEntities('Blinds').find(blinds => blinds.roomId === data.roomId);
    blinds.position = 'closed';
});

ctx.registerEffect('openBlinds', function (data) {
    let blinds = ctx.getEntities('Blinds').find(blinds => blinds.roomId === data.roomId);
    blinds.position = 'open';
});

ctx.bthread('Close blinds when internal temperature exceeds 24°C', 'Thermostat', function (thermostat) {
    while (true) {
        if (thermostat.temperature > 24) {
            sync({request: [closeBlindsEvent(thermostat.roomId)]});
        }
        sync({waitFor: [setThermostatEvent(thermostat.roomId)]});
    }
});

ctx.bthread('Open blinds when internal temperature falls below 20°C', 'Thermostat', function (thermostat) {
    while (true) {
        if (thermostat.temperature < 20) {
            sync({request: [openBlindsEvent(thermostat.roomId)]});
        }
        sync({waitFor: [setThermostatEvent(thermostat.roomId)]});
    }
});

/*
Windows shall be opened if the indoor CO2 level exceeds 1000 ppm
and the external temperature is between 15°C (59°F) and 25°C (77°F).
*/

function openWindowEvent(roomId) {
    return Event("openWindow", {roomId: roomId});
}

ctx.registerEffect('openWindow', function (data) {
    let window = ctx.getEntities('Window').find(window => window.roomId === data.roomId);
    window.status = 'open';
});

ctx.bthread('Open windows for high CO2 levels and suitable external temperature', 'Room', function (room) {
    while (true) {
        let externalTemperature = ctx.getExternalTemperature(); // Assuming this function exists to fetch external temperature
        if (room.co2Level > 1000 && externalTemperature >= 15 && externalTemperature <= 25) {
            sync({request: [openWindowEvent(room.id)]});
        }
        sync({waitFor: [co2LevelChangeEvent(room.id), externalTemperatureChangeEvent()]});
    }
});

function co2LevelChangeEvent(roomId) {
    return Event("co2LevelChange", {roomId: roomId});
}

function externalTemperatureChangeEvent() {
    return Event("externalTemperatureChange");
}



/*
The system shall shut off the water supply and then notify the user if a 
water leak is detected for more than 30 seconds (given checks every second) in any room.

*/

function shutOffWaterEvent() {
    return Event("shutOffWater");
}

function notifyUserEvent(message) {
    return Event("notifyUser", {message: message});
}
ctx.registerEffect('shutOffWater', function () {
    let waterSystem = ctx.getEntities('WaterSystem')[0]; // Assuming there's only one water system entity
    waterSystem.status = 'inactive';
});



ctx.bthread('Shut off water and notify user on water leak detected for more than 30 seconds', 'Room', function (room) {
    while (true) {
        sync({waitFor: [waterLeakDetectedEvent(room.id)]});
        let count = 0;
        while (count < 30) {
            Sleep(1000); // Check every second
            let currentEvent = sync({waitFor: [waterLeakDetectedEvent(room.id), waterLeakResolvedEvent(room.id)]});
            if (currentEvent.name === 'waterLeakResolved') {
                break;
            }
            count++;
        }
        if (count >= 30) {
            sync({request: [shutOffWaterEvent()]});
            sync({request: [notifyUserEvent("Water leak detected for more than 30 seconds in room " + room.id)]});
        }
    }
});



function waterLeakDetectedEvent(roomId) {
    return Event("waterLeakDetected", {roomId: roomId});
}

function waterLeakResolvedEvent(roomId) {
    return Event("waterLeakResolved", {roomId: roomId});
}

function waterLeakDetectedEvent(roomId) {
    return Event("waterLeakDetected", {roomId: roomId});
}

function waterLeakStoppedEvent(roomId) {
    return Event("waterLeakStopped", {roomId: roomId});
}
/*
!Option1 with timeout option in instructions:
function shutOffWaterEvent() {
    return Event("shutOffWater");
}

function notifyUserEvent(message) {
    return Event("notifyUser", {message: message});
}

ctx.registerEffect('shutOffWater', function () {
    let waterSystem = ctx.getEntities('WaterSystem')[0]; // Assuming there is one water system entity
    waterSystem.status = 'inactive';
});

ctx.bthread('Shut off water supply and notify user on water leak detection', 'Room', function (room) {
    while (true) {
        let leakDetected = false;
        for (let i = 0; i < 30; i++) {
            let event = sync({waitFor: [waterLeakDetectedEvent(room.id)], timeout: 1000});
            if (event == null) {
                break;
            }
            leakDetected = true;
        }
        if (leakDetected) {
            sync({request: [shutOffWaterEvent()]});
            sync({request: [notifyUserEvent("Water leak detected in room " + room.id + ". Water supply has been shut off.")]});
        }
    }
});

function waterLeakDetectedEvent(roomId) {
    return Event("waterLeakDetected", {roomId: roomId});
}
*/

/*
!Ron: Option2: Another way to implement it is using timeout(and changing the requirement)

The system shall shut off the water supply and then notify the user if a 
water leak is detected twice in 30 seconds in any room.

function shutOffWaterEvent() {
    return Event("shutOffWater");
}

function notifyUserEvent(message) {
    return Event("notifyUser", {message: message});
}

ctx.registerEffect('shutOffWater', function () {
    let waterSystem = ctx.getEntities('WaterSystem')[0]; // Assuming there's only one water system entity
    waterSystem.status = 'inactive';
});

ctx.bthread('Shut off water supply and notify user on repeated water leak', [], function () {
    while (true) {
        sync({waitFor: [waterLeakDetectedEvent()]});
        let firstLeakTime = Date.now();
        sync({waitFor: [waterLeakDetectedEvent()], timeout: 30000});
        let secondLeakTime = Date.now();

        if (secondLeakTime - firstLeakTime <= 30000) { // Two leaks detected within 30 seconds
            sync({request: [shutOffWaterEvent()]});
            sync({request: [notifyUserEvent("Water leak detected twice within 30 seconds. Water supply has been shut off.")]});
        }
    }
});

function waterLeakDetectedEvent() {
    return Event("waterLeakDetected");
} 
*/


/*
The system shall immediately alert the user via mobile app and then trigger 
house-wide alarms if smoke is detected at concentrations above 150 ppm.
*/

function alertUserEvent(message) {
    return Event("alertUser", {message: message});
}

function triggerHouseAlarmEvent() {
    return Event("triggerHouseAlarm");
}

ctx.registerEffect('triggerHouseAlarm', function () {
    let alarmSystem = ctx.getEntities('AlarmSystem')[0]; // Assuming there's only one alarm system entity
    alarmSystem.status = 'active';
});

ctx.bthread('Alert user and trigger alarms on high smoke concentration', [], function () {
    while (true) {
        sync({waitFor: anyEventNameWithData("smokeDetected", {concentration: (concentration) => concentration > 150})});
        sync({request: [alertUserEvent("High smoke concentration detected. Please check the house immediately.")]});
        sync({request: [triggerHouseAlarmEvent()]});
    }
});
/*
The system shall send notifications and trigger alarms if an unauthorized entry is
 detected between 10 PM and 6 AM, or when the house is unoccupied.
*/
ctx.bthread('Send notifications and trigger alarms on unauthorized entry during night or when house is unoccupied', [], function () {
    while (true) {
        sync({waitFor: [unauthorizedEntryDetectedEvent()]});
        let currentTime = new Date().getHours();
        let houseUnoccupied = ctx.getEntities('Room').every(room => !room.occupied);

        if ((currentTime >= 22 || currentTime < 6) || houseUnoccupied) {
            sync({request: [sendNotificationEvent("Unauthorized entry detected. Immediate attention required."), triggerAlarmEvent()]});
        }
    }
});

function unauthorizedEntryDetectedEvent() {
    return Event("unauthorizedEntryDetected");
}

/*
The system shall notify emergency services in case of a fire 
detected by smoke detectors, and provide real-time updates to the user.
*/
ctx.bthread('Notify emergency services and provide updates to user on fire detection', [], function () {
    while (true) {
        sync({waitFor: [fireDetectedEvent()]});
        sync({request: [notifyEmergencyServicesEvent("Fire detected. Immediate assistance required.")]});
        sync({request: [sendUserUpdateEvent("Fire detected. Emergency services have been notified.")]});
    }
});

function fireDetectedEvent() {
    return Event("fireDetected");
}

function notifyEmergencyServicesEvent(message) {
    return Event("notifyEmergencyServices", {message: message});
}

function sendUserUpdateEvent(message) {
    return Event("sendUserUpdate", {message: message});
}


/*
The system shall use motion and heat sensors to detect room occupancy.
When motion or heat are detected, the room is considered occupied,
until there is no motion/heat detected for 5 checks in a row.
*/

function setRoomOccupiedEvent(roomId) {
    return Event("setRoomOccupied", {roomId: roomId});
}

function setRoomUnoccupiedEvent(roomId) {
    return Event("setRoomUnoccupied", {roomId: roomId});
}

ctx.registerEffect('setRoomOccupied', function (data) {
    let room = ctx.getEntityById(data.roomId);
    room.occupied = true;
});

ctx.registerEffect('setRoomUnoccupied', function (data) {
    let room = ctx.getEntityById(data.roomId);
    room.occupied = false;
});

ctx.bthread('Detect and update room occupancy based on motion and heat sensors', 'Room', function (room) {
    let noDetectionCount = 0;
    while (true) {
        let event = sync({waitFor: [motionDetectedEvent(room.id), heatDetectedEvent(room.id), noMotionOrHeatEvent(room.id)]});
        if (event.name === 'motionDetected' || event.name === 'heatDetected') {
            noDetectionCount = 0;
            sync({request: [setRoomOccupiedEvent(room.id)]});
        } else if (event.name === 'noMotionOrHeat') {
            noDetectionCount++;
            if (noDetectionCount >= 5) {
                sync({request: [setRoomUnoccupiedEvent(room.id)]});
                noDetectionCount = 0; // Reset count after setting room to unoccupied
            }
        }
    }
});

function motionDetectedEvent(roomId) {
    return Event("motionDetected", {roomId: roomId});
}

function heatDetectedEvent(roomId) {
    return Event("heatDetected", {roomId: roomId});
}

function noMotionOrHeatEvent(roomId) {
    return Event("noMotionOrHeat", {roomId: roomId});
}


/*
!ron: an additional alternative, using timeout:


Requirement: The system shall use motion and heat sensors to detect room occupancy. 
When motion or heat are detected, the room is considered occupied

ctx.registerEffect('updateRoomOccupancy', function (data) {
    let room = ctx.getEntityById(data.roomId);
    room.occupied = data.occupied;
});

ctx.bthread('Detect room occupancy using motion and heat sensors', 'Room', function (room) {
    while (true) {
        sync({waitFor: [motionDetectedEvent(room.id), heatDetectedEvent(room.id)]});
        sync({request: [roomOccupancyChangedEvent(room.id, true)]});
    }
});

function motionDetectedEvent(roomId) {
    return Event("motionDetected", {roomId: roomId});
}

function heatDetectedEvent(roomId) {
    return Event("heatDetected", {roomId: roomId});
}

function roomOccupancyChangedEvent(roomId, occupied) {
    return Event("roomOccupancyChanged", {roomId: roomId, occupied: occupied});
}


Requirement: If no motion or heat are detected for 5 minutes, 
the room is considered unoccupied

ctx.registerEffect('clearRoomOccupancy', function (data) {
    let room = ctx.getEntityById(data.roomId);
    room.occupied = false;
});

ctx.bthread('Set room as unoccupied if no motion or heat for 5 minutes', 'Room', function (room) {
    while (true) {
        let event = sync({waitFor: [motionDetectedEvent(room.id), heatDetectedEvent(room.id)], timeout: 300000}); // 5 minutes
        if (event == null) { // No motion or heat detected within 5 minutes
            sync({request: [clearRoomOccupancyEvent(room.id)]});
        }
    }
});

function clearRoomOccupancyEvent(roomId) {
    return Event("clearRoomOccupancy", {roomId: roomId});
}


!ron: when the requirement isnt splitted, it got confused with the timeout, when splitted it does work. In total, we see an advantage with splitting requirments:

Requirement: The system shall use motion and heat sensors to detect room occupancy. When motion or heat are detected, the room 
is considered occupied, until there is no motion/heat detected for 5 minutes in a row.

function setRoomOccupiedEvent(roomId) {
    return Event("setRoomOccupied", {roomId: roomId});
}

function setRoomUnoccupiedEvent(roomId) {
    return Event("setRoomUnoccupied", {roomId: roomId});
}

ctx.registerEffect('setRoomOccupied', function (data) {
    let room = ctx.getEntityById(data.roomId);
    room.occupied = true;
});

ctx.registerEffect('setRoomUnoccupied', function (data) {
    let room = ctx.getEntityById(data.roomId);
    room.occupied = false;
});

ctx.bthread('Detect and update room occupancy based on motion and heat', 'Room', function (room) {
    while (true) {
        sync({waitFor: [motionDetectedEvent(room.id), heatDetectedEvent(room.id)]});
        sync({request: [setRoomOccupiedEvent(room.id)]});
        let event = sync({waitFor: [noMotionEvent(room.id), noHeatEvent(room.id)], timeout: 300000}); // Wait for 5 minutes
        if (event == null) { // No motion/heat detected for 5 minutes
            sync({request: [setRoomUnoccupiedEvent(room.id)]});
        }
    }
});

function motionDetectedEvent(roomId) {
    return Event("motionDetected", {roomId: roomId});
}

function heatDetectedEvent(roomId) {
    return Event("heatDetected", {roomId: roomId});
}

function noMotionEvent(roomId) {
    return Event("noMotion", {roomId: roomId});
}

function noHeatEvent(roomId) {
    return Event("noHeat", {roomId: roomId});
}
*/


/*
The system shall allow users to activate different lighting scenes 
(e.g., reading at 500 lux, movie night at 150 lux)
*/

//! after a post process. At first it didnt have a scene parameter causing a conflict in line 709+710.
function requestLightingSceneEvent(roomId, scene) {
    return Event("requestLightingScene", {roomId: roomId, scene: scene});
}
function setLightingSceneEvent(roomId, scene, brightness) {
    return Event("setLightingScene", {roomId: roomId, scene: scene, brightness: brightness});
}
ctx.registerEffect('setLightingScene', function (data) {
    let lights = ctx.getEntities('Light').filter(light => light.roomId === data.roomId);
    lights.forEach(light => {
        light.brightness = data.brightness;
    });
});

ctx.bthread('Activate lighting scenes as per user request', 'Room', function (room) {
    while (true) {
        let event = sync({waitFor: [anyEventNameWithData("requestLightingScene", {roomId: room.id})]});
        switch (event.data.scene) {
            case 'reading':
                sync({request: [setLightingSceneEvent(room.id, 'reading', 500)]});
                break;
            case 'movie night':
                sync({request: [setLightingSceneEvent(room.id, 'movie night', 150)]});
                break;
            // Additional scenes can be added here
        }
    }
});

//! an alterntive:
/*
The system shall allow users to activate different lighting scenes in any room:
 1. reading will turn lights to  500 lux,
2. movie night will turn lights to 150 lux


*/
function setLightingSceneEvent(roomId, scene) {
    return Event("setLightingScene", {roomId: roomId, scene: scene});
}

ctx.registerEffect('setLightingScene', function (data) {
    let lights = ctx.getEntities('Light').filter(light => light.roomId === data.roomId);
    let brightness = 0;
    if (data.scene === 'reading') {
        brightness = 500;
    } else if (data.scene === 'movie night') {
        brightness = 150;
    }
    lights.forEach(light => {
        light.brightness = brightness;
    });
});

ctx.bthread('Activate lighting scenes in any room', 'Room', function (room) {
    while (true) {
        let event = sync({waitFor: [activateReadingSceneEvent(room.id), activateMovieNightSceneEvent(room.id)]});
        if (event.name === 'activateReadingScene') {
            sync({request: [setLightingSceneEvent(room.id, 'reading')]});
        } else if (event.name === 'activateMovieNightScene') {
            sync({request: [setLightingSceneEvent(room.id, 'movie night')]});
        }
    }
});

function activateReadingSceneEvent(roomId) {
    return Event("activateReadingScene", {roomId: roomId});
}

function activateMovieNightSceneEvent(roomId) {
    return Event("activateMovieNightScene", {roomId: roomId});
}