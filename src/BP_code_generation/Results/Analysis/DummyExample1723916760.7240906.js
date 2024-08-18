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
/*
#### Response Steps Analysis:

1. **Events**:
   - Event needed: `motionDetectedEvent`.
   - Declare this event as it does not exist.

2. **Effects**:
   - The `motionDetectedEvent` affects the `smartLightBulb` entity by turning it on.

3. **Bthread Context**:
   - Specific context: This behavior applies to all light bulbs.
   - Query used: `light`.

4. **Requesting Events**:
   - Only one event is requested (`turnOnLightEvent`), no simultaneous requests.

5. **Referring to Event without knowing its exact data**:
   - Not applicable here as we know the specific light bulb data.

6. **Time Aspect**:
   - No time aspect involved in this requirement.

7. **Loop Break Condition**:
   - The loop will break by waiting for the `motionDetectedEvent`.

8. **Event Declaration without Comments**:
   - Declare `turnOnLightEvent` for turning on the light.

#### Implementation:
*/

```javascript
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

// Bthread
ctx.bthread('Turn on light when motion is detected', 'light', function (light) {
    while (true) {
        sync({waitFor: [motionDetectedEvent()]});
        sync({request: [turnOnLightEvent(light.id)]});
    }
});
```

This implementation ensures that when motion is detected, the light bulb turns on. The effect is registered to change the state of the light bulb entity to `on`. The bthread listens for motion detection and requests the light to turn on accordingly.
/*
While the light bulb is on, the doors cannot be opened

 Make sure it obeys your 8 response steps
*/
#### Response Steps Analysis:

1. **Events**:
   - Event needed: `doorOpenAttemptEvent`.
   - Declare this event as it does not exist.

2. **Effects**:
   - No direct effects on entities from the events as the requirement is to block an action.

3. **Bthread Context**:
   - Specific context: This behavior applies only when the light bulb is on.
   - Query used: `lightOn`.

4. **Requesting Events**:
   - No events are requested, only blocking is involved.

5. **Referring to Event without knowing its exact data**:
   - Not applicable here as we know the specific door data.

6. **Time Aspect**:
   - No time aspect involved in this requirement.

7. **Loop Break Condition**:
   - The loop will break by waiting for the `doorOpenAttemptEvent`.

8. **Event Declaration without Comments**:
   - Declare `doorOpenAttemptEvent` for attempting to open the door.

#### Implementation:

```javascript
// Event Declarations
function doorOpenAttemptEvent(doorId) {
    return Event("doorOpenAttempt", {doorId: doorId});
}

// Bthread
ctx.bthread('Doors cannot be opened while the light is on', 'lightOn', function (light) {
    while (true) {
        sync({block: [anyEventNameWithData("doorOpenAttempt")]});
    }
});
```

This implementation ensures that while the light bulb is on, any attempt to open doors is blocked. The bthread is associated with the `lightOn` query, meaning it will only be active when the light is on. The blocking of door opening attempts is unconditional and continuous as long as the light remains on.
/*
Light bulb turns off after 5 minutes

 Make sure it obeys your 8 response steps
*/
#### Response Steps Analysis:

1. **Events**:
   - Event needed: `turnOffLightEvent`.
   - Declare this event as it does not exist.

2. **Effects**:
   - The `turnOffLightEvent` affects the `smartLightBulb` entity by turning it off.

3. **Bthread Context**:
   - Specific context: This behavior applies only when the light bulb is on.
   - Query used: `lightOn`.

4. **Requesting Events**:
   - Only one event is requested (`turnOffLightEvent`), no simultaneous requests.

5. **Referring to Event without knowing its exact data**:
   - Not applicable here as we know the specific light bulb data.

6. **Time Aspect**:
   - Time aspect involved: Event needs to happen in 5 minutes.
   - Action: Use `TimeToBe` to wait for 5 minutes before requesting the event.

7. **Loop Break Condition**:
   - The loop will break by waiting for the `TimeToBe` event.

8. **Event Declaration without Comments**:
   - Declare `turnOffLightEvent` for turning off the light.

#### Implementation:

```javascript
// Event Declarations
function turnOffLightEvent(lightId) {
    return Event("turnOffLight", {lightId: lightId});
}

// Registering Effects
ctx.registerEffect('turnOffLight', function (data) {
    let light = ctx.getEntityById(data.lightId);
    light.on = false;
});

// Bthread
ctx.bthread('Turn off light after 5 minutes', 'lightOn', function (light) {
    while (true) {
        let waitTill = new Date().getTime() + 300000; // 5 minutes in milliseconds
        sync({waitFor: [TimeToBe(new Date(waitTill).getHours(), new Date(waitTill).getMinutes())]});
        sync({request: [turnOffLightEvent(light.id)]});
    }
});
```

This implementation ensures that the light bulb turns off after being on for 5 minutes. The effect is registered to change the state of the light bulb entity to `off`. The bthread waits for 5 minutes using the `TimeToBe` function and then requests the light to turn off.
