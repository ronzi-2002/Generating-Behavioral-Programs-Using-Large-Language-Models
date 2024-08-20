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
// 1. **Events:**
//    - Needed: `motionDetectedEvent`, `turnOnLightEvent`
//    - Already declared: None
// 
// 2. **Effects:**
//    - `turnOnLightEvent` affects the `smartLightBulb` entity by setting `on` to `true`.
// 
// 3. **Bthread Context:**
//    - No specific query needed as the requirement applies to any light bulb when motion is detected.
// 
// 4. **Requesting Events:**
//    - Only `turnOnLightEvent` needs to be requested after `motionDetectedEvent` is detected.
// 
// 5. **Referring to Event without knowing its exact data:**
//    - No, we know the exact data (light bulb ID) as it will be derived from the context.
// 
// 6. **Time Aspect:**
//    - No time aspect involved in this requirement.
// 
// 7. **Loop Break Condition:**
//    - Break the infinite loop by waiting for `motionDetectedEvent`.
// 
// 8. **Comments and Event Declarations:**
//    - Events will be declared without additional comments.
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

// 
// This implementation ensures that when motion is detected, the light bulb turns on. The effect is registered to change the state of the light bulb entity, and the bthread runs for each light bulb entity, waiting for motion detection and then requesting the light to turn on.
/*
While the light bulb is on, the house cant be exited

 Make sure it obeys your 8 response steps
*/
// #### Analysis of the Requirement: "While the light bulb is on, the house can't be exited"
// 
// 1. **Events:**
//    - Needed: `exitHouseEvent`
//    - Already declared: None
// 
// 2. **Effects:**
//    - No direct effects on entities are needed for blocking an event.
// 
// 3. **Bthread Context:**
//    - Specific context: The requirement applies specifically when the light bulb is on.
//    - Query used: `lightOn`
// 
// 4. **Requesting Events:**
//    - No events need to be requested, only blocking is required.
// 
// 5. **Referring to Event without knowing its exact data:**
//    - Yes, we refer to `exitHouseEvent` without knowing the specific house data, so we use `anyEventNameWithData`.
// 
// 6. **Time Aspect:**
//    - No time aspect involved in this requirement.
// 
// 7. **Loop Break Condition:**
//    - No need to break the loop as the sync will wait for the light to turn off, which is a natural break.
// 
// 8. **Comments and Event Declarations:**
//    - Events will be declared without additional comments.
// 
// #### Implementation:
// 

// Event Declarations
function exitHouseEvent(houseId) {
    return Event("exitHouse", {houseId: houseId});
}

// Behavioral Thread
ctx.bthread('House cannot be exited while light is on', 'lightOn', function (light) {
    while (true) {
        sync({block: [anyEventNameWithData("exitHouse")]});
        sync({waitFor: [turnOffLightEvent(light.id)]}); // Assuming turnOffLightEvent is declared elsewhere
    }
});

// 
// This implementation ensures that while the light bulb is on, exiting the house is blocked. The bthread runs for each light bulb that is on, blocking the `exitHouseEvent` until the light is turned off. The `turnOffLightEvent` is assumed to be declared elsewhere, which would allow the house exit to be unblocked when the light turns off.
/*
Light bulb turns off after 5 minutes

 Make sure it obeys your 8 response steps
*/
// #### Analysis of the Requirement: "Light bulb turns off after 5 minutes"
// 
// 1. **Events:**
//    - Needed: `turnOffLightEvent`
//    - Already declared: None
// 
// 2. **Effects:**
//    - `turnOffLightEvent` affects the `smartLightBulb` entity by setting `on` to `false`.
// 
// 3. **Bthread Context:**
//    - Specific context: The requirement applies specifically when the light bulb is on.
//    - Query used: `lightOn`
// 
// 4. **Requesting Events:**
//    - Only `turnOffLightEvent` needs to be requested after a time delay.
// 
// 5. **Referring to Event without knowing its exact data:**
//    - No, we know the exact data (light bulb ID) as it will be derived from the context.
// 
// 6. **Time Aspect:**
//    - The action is dependent on a specific duration (5 minutes).
//    - Use `TimeToBe` to handle the 5-minute duration.
// 
// 7. **Loop Break Condition:**
//    - Break the infinite loop by waiting for `turnOffLightEvent`.
// 
// 8. **Comments and Event Declarations:**
//    - Events will be declared without additional comments.
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

// 
// This implementation ensures that the light bulb turns off after being on for 5 minutes. The effect is registered to change the state of the light bulb entity, and the bthread runs for each light bulb that is on, waiting for 5 minutes before requesting the light to turn off. The use of `TimeToBe` ensures that the event is triggered exactly after 5 minutes.
/*
When the house is entered, The light bulb turns on and the user is notified

 Make sure it obeys your 8 response steps
*/
// #### Analysis of the Requirement: "When the house is entered, the light bulb turns on and the user is notified"
// 
// 1. **Events:**
//    - Needed: `houseEnteredEvent`, `turnOnLightEvent`, `notifyUserEvent`
//    - Already declared: `turnOnLightEvent` (from previous requirements)
// 
// 2. **Effects:**
//    - `turnOnLightEvent` affects the `smartLightBulb` entity by setting `on` to `true`.
//    - `notifyUserEvent` does not affect any entities directly but is used for notification purposes.
// 
// 3. **Bthread Context:**
//    - No specific query needed as the requirement applies to any house entry event.
// 
// 4. **Requesting Events:**
//    - Both `turnOnLightEvent` and `notifyUserEvent` need to be requested simultaneously when the house is entered.
//    - Use `RequestAllEvents` to ensure both actions are executed.
// 
// 5. **Referring to Event without knowing its exact data:**
//    - Yes, we refer to `turnOnLightEvent` and `notifyUserEvent` without knowing the specific light bulb or user data, so we use `anyEventNameWithData`.
// 
// 6. **Time Aspect:**
//    - No time aspect involved in this requirement.
// 
// 7. **Loop Break Condition:**
//    - Break the infinite loop by waiting for `houseEnteredEvent`.
// 
// 8. **Comments and Event Declarations:**
//    - Events will be declared without additional comments.
// 
// #### Implementation:
// 

// Event Declarations
function houseEnteredEvent() {
    return Event("houseEntered");
}

function notifyUserEvent(userId) {
    return Event("notifyUser", {userId: userId});
}

// Behavioral Thread
ctx.bthread('When the house is entered, turn on the light and notify the user', 'house', function (house) {
    while (true) {
        sync({waitFor: [houseEnteredEvent()]});
        let EventsToRequest = [
            turnOnLightEvent(house.lightId), // Assuming each house has a lightId attribute
            notifyUserEvent(house.userId)    // Assuming each house has a userId attribute
        ];
        RequestAllEvents(EventsToRequest);
    }
});

// 
// This implementation ensures that when the house is entered, both the light bulb turns on and the user is notified. The `RequestAllEvents` function is used to guarantee that both events are requested and executed simultaneously. The bthread runs for each house entity, waiting for a house entry event and then requesting both the light to turn on and the user to be notified.
