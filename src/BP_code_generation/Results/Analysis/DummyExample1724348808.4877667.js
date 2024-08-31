/*
There is a smart light bulb(which can be on and off)
*/
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
//    - **Affects Entity**: `smartLightBulb`
//    - **Effect**: Changes the `on` property of the `smartLightBulb` entity to `true`.
// 
// 3. **Bthread Context**:
//    - **Specific Context**: No specific context needed as the requirement applies to any light bulb when motion is detected.
//    - **Query Used**: `light`
// 
// 4. **Requesting Events**:
//    - **Method**: Use `sync({request:})` to request the `turnOnLightEvent` after detecting motion.
// 
// 5. **Referring to Event without Exact Data**:
//    - **Usage**: Not needed as we know the exact data (light bulb ID) from the query.
// 
// 6. **Time Aspect**:
//    - **Involved**: No time aspect involved in this requirement.
// 
// 7. **Loop Break Condition**:
//    - **Condition**: The loop will break by waiting for the `motionDetectedEvent`.
// 
// 8. **Comments and Event Naming**:
//    - **Implementation**: Directly use the event names as specified in the requirement without additional comments.
// 
// #### Implementation:
// 

function motionDetectedEvent() {
    return Event("motionDetected");
}

function turnOnLightEvent(lightId) {
    return Event("turnOnLight", {lightId: lightId});
}

ctx.registerEffect('turnOnLight', function (data) {
    let light = ctx.getEntityById(data.lightId);
    light.on = true;
});

ctx.bthread('When motion is detected, the light bulb turns on', 'light', function (light) {
    while (true) {
        sync({waitFor: [motionDetectedEvent()]});
        sync({request: [turnOnLightEvent(light.id)]});
    }
});

/*
While the light bulb is on, the house cant be exited

 Make sure it obeys your 8 response steps
*/
// #### Analysis of the Requirement: "While the light bulb is on, the house can't be exited"
// 
// 1. **Events**:
//    - **Needed**: `exitHouseEvent`
//    - **Already Declared**: None
//    - **Declare**: `exitHouseEvent` needs to be declared.
// 
// 2. **Effects**:
//    - **Event**: None
//    - **Affects Entity**: No direct effect on entities as this requirement involves blocking an action.
// 
// 3. **Bthread Context**:
//    - **Specific Context**: The requirement applies specifically when the light bulb is on.
//    - **Query Used**: `lightOn`
// 
// 4. **Requesting Events**:
//    - **Method**: Not applicable as we are blocking an event, not requesting.
// 
// 5. **Referring to Event without Exact Data**:
//    - **Usage**: Not needed as we are blocking the event for all houses.
// 
// 6. **Time Aspect**:
//    - **Involved**: No time aspect involved in this requirement.
// 
// 7. **Loop Break Condition**:
//    - **Condition**: The loop will continue as long as the light is on, and it will block the `exitHouseEvent`. It will break when the light is turned off, which is not handled within this bthread but by the light's state change.
// 
// 8. **Comments and Event Naming**:
//    - **Implementation**: Directly use the event names as specified in the requirement without additional comments.
// 
// #### Implementation:
// 

function exitHouseEvent() {
    return Event("exitHouse");
}

ctx.bthread('While the light bulb is on, the house can\'t be exited', 'lightOn', function (light) {
    while (true) {
        sync({block: [exitHouseEvent()]});
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
//    - **Affects Entity**: `smartLightBulb`
//    - **Effect**: Changes the `on` property of the `smartLightBulb` entity to `false`.
// 
// 3. **Bthread Context**:
//    - **Specific Context**: The requirement applies specifically when the light bulb is on.
//    - **Query Used**: `lightOn`
// 
// 4. **Requesting Events**:
//    - **Method**: Use `sync({request:})` to request the `turnOffLightEvent` after 5 minutes.
// 
// 5. **Referring to Event without Exact Data**:
//    - **Usage**: Not needed as we know the exact data (light bulb ID) from the query.
// 
// 6. **Time Aspect**:
//    - **Involved**: Yes, the event needs to happen in 5 minutes.
//    - **Case**: 6.3. Event needs to happen in <X> time.
// 
// 7. **Loop Break Condition**:
//    - **Condition**: The loop will break by waiting for the `TimeToBe` event.
// 
// 8. **Comments and Event Naming**:
//    - **Implementation**: Directly use the event names as specified in the requirement without additional comments.
// 
// #### Implementation:
// 

function turnOffLightEvent(lightId) {
    return Event("turnOffLight", {lightId: lightId});
}

ctx.registerEffect('turnOffLight', function (data) {
    let light = ctx.getEntityById(data.lightId);
    light.on = false;
});

ctx.bthread('Light bulb turns off after 5 minutes', 'lightOn', function (light) {
    while (true) {
        let waitTill = new Date().getTime() + 300000; // 5 minutes
        sync({waitFor: [TimeToBe(new Date(waitTill).getHours(), new Date(waitTill).getMinutes())]});
        sync({request: [turnOffLightEvent(light.id)]});
    }
});

/*
When user locks the house, The light bulb turns off and the user is notified

 Make sure it obeys your 8 response steps
*/
// #### Analysis of the Requirement: "When user locks the house, the light bulb turns off and the user is notified"
// 
// 1. **Events**:
//    - **Needed**: `houseLockedEvent`, `turnOffLightEvent`, `notifyUserEvent`
//    - **Already Declared**: `turnOffLightEvent` (from previous requirements)
//    - **Declare**: `houseLockedEvent` and `notifyUserEvent` need to be declared.
// 
// 2. **Effects**:
//    - **Event**: `turnOffLightEvent`
//    - **Affects Entity**: `smartLightBulb`
//    - **Effect**: Changes the `on` property of the `smartLightBulb` entity to `false`.
//    - **Event**: `notifyUserEvent`
//    - **Affects Entity**: None directly, assumed to send a notification to the user interface or system.
// 
// 3. **Bthread Context**:
//    - **Specific Context**: No specific context needed as the requirement applies globally to the house entity.
//    - **Query Used**: `house`
// 
// 4. **Requesting Events**:
//    - **Method**: Use `RequestAllEvents` to ensure both the light bulb is turned off and the user is notified simultaneously.
// 
// 5. **Referring to Event without Exact Data**:
//    - **Usage**: Not needed as we know the exact data (house ID) from the query.
// 
// 6. **Time Aspect**:
//    - **Involved**: No time aspect involved in this requirement.
// 
// 7. **Loop Break Condition**:
//    - **Condition**: The loop will break by waiting for the `houseLockedEvent`.
// 
// 8. **Comments and Event Naming**:
//    - **Implementation**: Directly use the event names as specified in the requirement without additional comments.
// 
// #### Implementation:
// 

function houseLockedEvent() {
    return Event("houseLocked");
}

function notifyUserEvent() {
    return Event("notifyUser");
}

ctx.bthread('When user locks the house, the light bulb turns off and the user is notified', 'house', function (house) {
    while (true) {
        sync({waitFor: [houseLockedEvent()]});
        RequestAllEvents([
            turnOffLightEvent(house.lightId), // Assuming house entity has a lightId property
            notifyUserEvent()
        ]);
    }
});

