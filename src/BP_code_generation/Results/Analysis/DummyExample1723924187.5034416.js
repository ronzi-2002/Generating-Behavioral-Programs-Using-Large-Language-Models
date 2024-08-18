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
//    - **Needed**: `motionDetectedEvent`, `turnOnLightEvent`
//    - **Already Declared**: None
//    - **Declare**: Both events need to be declared.
// 
// 2. **Effects**:
//    - **Event**: `turnOnLightEvent`
//    - **Entity Affected**: `smartLightBulb`
//    - **Effect**: Change the `on` property of the `smartLightBulb` entity to `true`.
// 
// 3. **Bthread Context**:
//    - **Specific Context**: No specific context needed as the requirement applies to any light bulb.
//    - **Query Used**: `light`
// 
// 4. **Requesting Events**:
//    - **Method**: Use `sync({request:})` to request the `turnOnLightEvent` after detecting motion.
// 
// 5. **Referring to Event without Exact Data**:
//    - **Usage**: Not needed in this case as we will know which light bulb to turn on based on the motion detected near it.
// 
// 6. **Time Aspect**:
//    - **Involvement**: No time aspect involved in this requirement.
// 
// 7. **Infinite Loop Handling**:
//    - **Break the Infinite Loop**: By waiting for `motionDetectedEvent`.
// 
// 8. **Event Declaration and Usage**:
//    - **No Comments Needed**: Just declare and use the events as per the requirement.
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

// Registering the effect of turning on the light
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
//    - **Needed**: `doorOpenEvent`
//    - **Already Declared**: None
//    - **Declare**: `doorOpenEvent` needs to be declared.
// 
// 2. **Effects**:
//    - **Event**: None
//    - **Entity Affected**: None
//    - **Effect**: No direct effect on entities, as this requirement involves blocking an action.
// 
// 3. **Bthread Context**:
//    - **Specific Context**: The requirement applies specifically when the light bulb is on.
//    - **Query Used**: `lightOn`
// 
// 4. **Requesting Events**:
//    - **Method**: Not applicable as we are blocking an event, not requesting.
// 
// 5. **Referring to Event without Exact Data**:
//    - **Usage**: Use `anyEventNameWithData` to block any door opening event, regardless of specific door data.
// 
// 6. **Time Aspect**:
//    - **Involvement**: No time aspect involved in this requirement.
// 
// 7. **Infinite Loop Handling**:
//    - **Break the Infinite Loop**: By waiting for the light to turn off.
// 
// 8. **Event Declaration and Usage**:
//    - **No Comments Needed**: Just declare and use the events as per the requirement.
// 
// #### Implementation:
// 

// Event Declarations
function doorOpenEvent(doorId) {
    return Event("doorOpen", {doorId: doorId});
}

// Behavioral Thread
ctx.bthread('Doors cannot be opened while the light is on', 'lightOn', function (light) {
    while (true) {
        sync({block: [anyEventNameWithData("doorOpen")]});
        // This will break the loop when the light is turned off, hence allowing doors to be opened again
        sync({waitFor: [turnOffLightEvent(light.id)]});
    }
});

/*
Light bulb turns off after 5 minutes

 Make sure it obeys your 8 response steps
*/
// #### Analysis of the Requirement: "Light bulb turns off after 5 minutes"
// 
// 1. **Events**:
//    - **Needed**: `turnOffLightEvent`
//    - **Already Declared**: None
//    - **Declare**: `turnOffLightEvent` needs to be declared.
// 
// 2. **Effects**:
//    - **Event**: `turnOffLightEvent`
//    - **Entity Affected**: `smartLightBulb`
//    - **Effect**: Change the `on` property of the `smartLightBulb` entity to `false`.
// 
// 3. **Bthread Context**:
//    - **Specific Context**: The requirement applies specifically when the light bulb is on.
//    - **Query Used**: `lightOn`
// 
// 4. **Requesting Events**:
//    - **Method**: Use `sync({request:})` to request the `turnOffLightEvent` after 5 minutes.
// 
// 5. **Referring to Event without Exact Data**:
//    - **Usage**: Not needed in this case as we will know which light bulb to turn off based on the context.
// 
// 6. **Time Aspect**:
//    - **Involvement**: Yes, there is a time aspect involved.
//    - **Case**: 6.1 The duration of one of the queries (light being on for 5 minutes).
//    - **Action**: Use `TimeToBe` inside the bthread with the query.
// 
// 7. **Infinite Loop Handling**:
//    - **Break the Infinite Loop**: By waiting for the `turnOffLightEvent`.
// 
// 8. **Event Declaration and Usage**:
//    - **No Comments Needed**: Just declare and use the events as per the requirement.
// 
// #### Implementation:
// 

// Event Declarations
function turnOffLightEvent(lightId) {
    return Event("turnOffLight", {lightId: lightId});
}

// Registering the effect of turning off the light
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

/*
After door is opened, The light bulb turns on and the user is notified

 Make sure it obeys your 8 response steps
*/
// #### Analysis of the Requirement: "After door is opened, the light bulb turns on and the user is notified"
// 
// 1. **Events**:
//    - **Needed**: `doorOpenedEvent`, `turnOnLightEvent`, `notifyUserEvent`
//    - **Already Declared**: `doorOpenedEvent` and `turnOnLightEvent` are assumed to be declared from previous contexts.
//    - **Declare**: `notifyUserEvent` needs to be declared.
// 
// 2. **Effects**:
//    - **Event**: `turnOnLightEvent` (already handled in previous requirements)
//    - **Entity Affected**: `smartLightBulb`
//    - **Effect**: Change the `on` property of the `smartLightBulb` entity to `true`.
// 
// 3. **Bthread Context**:
//    - **Specific Context**: No specific context needed as the requirement applies to any door and light bulb.
//    - **Query Used**: No specific query needed.
// 
// 4. **Requesting Events**:
//    - **Method**: Use `RequestAllEvents` to ensure both the light turns on and the user is notified simultaneously after the door is opened.
// 
// 5. **Referring to Event without Exact Data**:
//    - **Usage**: Not needed in this case as we will know which light bulb to turn on and which user to notify based on the door opened.
// 
// 6. **Time Aspect**:
//    - **Involvement**: No time aspect involved in this requirement.
// 
// 7. **Infinite Loop Handling**:
//    - **Break the Infinite Loop**: By waiting for `doorOpenedEvent`.
// 
// 8. **Event Declaration and Usage**:
//    - **No Comments Needed**: Just declare and use the events as per the requirement.
// 
// #### Implementation:
// 

// Event Declarations
function notifyUserEvent(userId) {
    return Event("notifyUser", {userId: userId});
}

// Assuming doorOpenedEvent and turnOnLightEvent are already declared

// Behavioral Thread
ctx.bthread('After door is opened, turn on light and notify user', function () {
    while (true) {
        let doorEvent = sync({waitFor: [anyEventNameWithData("doorOpened")]});
        let doorId = doorEvent.data.doorId; // Assuming door event has doorId
        let lightId = 'smartLightBulb1'; // Assuming we know which light to turn on
        let userId = 'user1'; // Assuming we know which user to notify
        RequestAllEvents([
            turnOnLightEvent(lightId),
            notifyUserEvent(userId)
        ]);
    }
});

