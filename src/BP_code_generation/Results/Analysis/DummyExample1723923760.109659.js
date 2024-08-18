//There is a smart light bulb(which can be on and off)
function smartLightBulb(id, on) {
    return ctx.Entity(id, 'smartLightBulb', {on: on})
}

ctx.populateContext([smartLightBulb('smartLightBulb1', false)])
/*
Needed queries:
 1. light
 2. light On
*/
ctx.registerQuery('light', entity => entity.type == 'smartLightBulb');

ctx.registerQuery('lightOn', entity => entity.type == 'smartLightBulb' && entity.on == true);
/*
When motion is detected, the light bulb turns on

 Make sure it obeys your 8 response steps
*/
// #### Analysis of the Requirement: "When motion is detected, the light bulb turns on"
// 
// 1. **Events**:
//    - Needed: `motionDetectedEvent`, `turnOnLightEvent`
//    - Already declared: None
// 
// 2. **Effects**:
//    - `turnOnLightEvent` affects the `smartLightBulb` entity by setting `on` to `true`.
// 
// 3. **Bthread Context**:
//    - No specific query needed as the requirement applies to any light bulb when motion is detected.
// 
// 4. **Requesting Events**:
//    - Use `sync({request:})` to request `turnOnLightEvent` after detecting motion.
// 
// 5. **Referring to Event without knowing its exact data**:
//    - Not applicable here as we know the specific light bulb ID.
// 
// 6. **Time Aspect**:
//    - No time aspect involved in this requirement.
// 
// 7. **Infinite Loop Handling**:
//    - Break the infinite loop by waiting for `motionDetectedEvent`.
// 
// 8. **Comments and Event Declaration**:
//    - Declare the events without additional comments.
// 
// #### Implementation:
// 

// Event Declarations
function motionDetectedEvent() {
    return Event("motionDetected");
}

function turnOnLightEvent(lightId) {
    return Event("turnOnLight", {lightId: lightId});
}

// Registering Effects
ctx.registerEffect('turnOnLight', function (data) {
    let light = ctx.getEntityById(data.lightId);
    light.on = true;
});

// Behavioral Thread
ctx.bthread('Turn on light when motion is detected', 'light', function (light) {
    while (true) {
        sync({waitFor: [motionDetectedEvent()]});
        sync({request: [turnOnLightEvent(light.id)]});
    }
});

/*
While the light bulb is on, the doors cannot be opened

 Make sure it obeys your 8 response steps
*/
// #### Analysis of the Requirement: "While the light bulb is on, the doors cannot be opened"
// 
// 1. **Events**:
//    - Needed: `openDoorEvent`
//    - Already declared: None (assuming from previous context)
// 
// 2. **Effects**:
//    - No direct effects are needed since we are blocking an event, not requesting one.
// 
// 3. **Bthread Context**:
//    - Specific context: The requirement applies specifically when the light bulb is on.
//    - Query used: `lightOn`
// 
// 4. **Requesting Events**:
//    - Not applicable as we are blocking an event, not requesting.
// 
// 5. **Referring to Event without knowing its exact data**:
//    - Use `anyEventNameWithData` to block any `openDoorEvent` regardless of specific door data.
// 
// 6. **Time Aspect**:
//    - No time aspect involved in this requirement.
// 
// 7. **Infinite Loop Handling**:
//    - Break the infinite loop by waiting for the light to turn off.
// 
// 8. **Comments and Event Declaration**:
//    - Declare the events without additional comments.
// 
// #### Implementation:
// 

// Event Declarations
function openDoorEvent(doorId) {
    return Event("openDoor", {doorId: doorId});
}

// Behavioral Thread
ctx.bthread('Doors cannot be opened while light is on', 'lightOn', function (light) {
    while (true) {
        sync({block: [anyEventNameWithData("openDoor")]});
    }
});

/*
Light bulb turns off after 5 minutes

 Make sure it obeys your 8 response steps
*/
// #### Analysis of the Requirement: "Light bulb turns off after 5 minutes"
// 
// 1. **Events**:
//    - Needed: `turnOffLightEvent`
//    - Already declared: None
// 
// 2. **Effects**:
//    - `turnOffLightEvent` affects the `smartLightBulb` entity by setting `on` to `false`.
// 
// 3. **Bthread Context**:
//    - Specific context: The requirement applies specifically when the light bulb is on.
//    - Query used: `lightOn`
// 
// 4. **Requesting Events**:
//    - Use `sync({request:})` to request `turnOffLightEvent` after 5 minutes.
// 
// 5. **Referring to Event without knowing its exact data**:
//    - Not applicable here as we know the specific light bulb ID.
// 
// 6. **Time Aspect**:
//    - The action is dependent on the actual hour (5 minutes from the time the bthread starts).
//    - Use `TimeToBe` to handle the 5-minute duration.
// 
// 7. **Infinite Loop Handling**:
//    - Break the infinite loop by waiting for `turnOffLightEvent`.
// 
// 8. **Comments and Event Declaration**:
//    - Declare the events without additional comments.
// 
// #### Implementation:
// 

// Event Declarations
function turnOffLightEvent(lightId) {
    return Event("turnOffLight", {lightId: lightId});
}

// Registering Effects
ctx.registerEffect('turnOffLight', function (data) {
    let light = ctx.getEntityById(data.lightId);
    light.on = false;
});

// Behavioral Thread
ctx.bthread('Turn off light after 5 minutes', 'lightOn', function (light) {
    while (true) {
        let waitTill = new Date().getTime() + 300000; // 5 minutes in milliseconds
        sync({waitFor: [TimeToBe(new Date(waitTill).getHours(), new Date(waitTill).getMinutes())]});
        sync({request: [turnOffLightEvent(light.id)]});
    }
});

