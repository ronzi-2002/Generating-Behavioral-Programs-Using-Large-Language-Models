/*
system_variables: v_season(s_Heat, s_Cool, s_Off), v_Fan(s_Fan_On,s_Fan_Off), v_target_Temp,  MIN_TEMP=5, MAX_TEMP=35, v_curr_temp, v_MainState(s_Operate, s_Exit, s_Program), idle_time. 
There is one entity that describes the system variables. default values: v_season(s_off), v_Fan(s_Fan_Off), v_target_Temp=20, v_curr_temp=20, v_MainState(s_Operate), idle_time=0, MIN_TEMP=5, MAX_TEMP=35. 

*/
function systemVariables(id, v_season, v_Fan, v_target_Temp, v_curr_temp, v_MainState, idle_time, MIN_TEMP, MAX_TEMP) {
    return ctx.Entity(id, 'systemVariables', {
        v_season: v_season,
        v_Fan: v_Fan,
        v_target_Temp: v_target_Temp,
        v_curr_temp: v_curr_temp,
        v_MainState: v_MainState,
        idle_time: idle_time,
        MIN_TEMP: MIN_TEMP,
        MAX_TEMP: MAX_TEMP
    });
}

ctx.populateContext([systemVariables('sys1', 's_Off', 's_Fan_Off', 20, 20, 's_Operate', 0, 5, 35)]);
/*
program: programId(integer between 1 and 8). ii_WeekDay, i_Time and i_Temp, where i_WeekDay corresponds to a specific week day chosen from {MONDAY, TUESDAY, …, FRIDAY}, i_time corresponds to 24hr based day-time specifying the beginning of the time period (e.g. 2020) and i_Temp corresponds to the target temperature provided in degrees Celsius. The value of i_Temp. There are 8 programs(id from 1 to 8) which are all Monday, 8000, 20. 
*/

function program(programId, i_WeekDay, i_Time, i_Temp) {
    return ctx.Entity(programId, 'program', {
        i_WeekDay: i_WeekDay,
        i_Time: i_Time,
        i_Temp: i_Temp
    });
}

ctx.populateContext([
    program(1, 'MONDAY', 8000, 20),
    program(2, 'MONDAY', 8000, 20),
    program(3, 'MONDAY', 8000, 20),
    program(4, 'MONDAY', 8000, 20),
    program(5, 'MONDAY', 8000, 20),
    program(6, 'MONDAY', 8000, 20),
    program(7, 'MONDAY', 8000, 20),
    program(8, 'MONDAY', 8000, 20),
]);

/*
External Data: This entity holds the data about the world, specifically the current weekday, hour. start with Monday as current day, ,and 8000 as hour
*/
function externalData(id, currentWeekday, currentHour) {
    return ctx.Entity(id, 'externalData', {
        currentWeekday: currentWeekday,
        currentHour: currentHour
    });
}

ctx.populateContext([
    externalData('externalData1', 'MONDAY', 8000)
]);
/*
Needed Queries:
    1. program
    2. cooling mode =  fan_on and s_cool season
    3. Heating mode = fan_on and s_heat season   
    4. off mode = fan_off and s_off season
    

*/
ctx.registerQuery('program', entity => entity.type == 'program');
ctx.registerQuery('cooling_mode', entity => entity.type == 'systemVariables' && entity.v_Fan == 's_Fan_On' && entity.v_season == 's_Cool');
ctx.registerQuery('heating_mode', entity => entity.type == 'systemVariables' && entity.v_Fan == 's_Fan_On' && entity.v_season == 's_Heat');
ctx.registerQuery('off_mode', entity => entity.type == 'systemVariables' && entity.v_Fan == 's_Fan_Off' && entity.v_season == 's_Off');
/*
Enter to view program: upon pressing the button View Programs in UI01, this operation causes the system to enter to its s_Program state and the value of the variable idle_Time to be set to its initial value
*/
// Questions:
// 1. What events are needed?
//    - An event to handle the button press for viewing programs.
//    - An event to update the system state to s_Program and reset the idle time.
//    Names:
//    - viewProgramsButtonPressedEvent
//    - enterProgramStateEvent

// 2. Do they already exist?
//    - No, these events do not exist and need to be declared.

// Event Declarations
function viewProgramsButtonPressedEvent() {
    return Event("viewProgramsButtonPressedEvent");
}

function enterProgramStateEvent() {
    return Event("enterProgramStateEvent");
}

// Registering the effect for entering program state and resetting idle time
ctx.registerEffect('enterProgramStateEvent', function (data) {
    let systemVariables = ctx.getEntityById('sys1');
    systemVariables.v_MainState = 's_Program';
    systemVariables.idle_time = 0;
});

// Behavioral thread to handle the view programs button press
ctx.bthread('Enter to view program', function () {
    while (true) {
        sync({waitFor: [viewProgramsButtonPressedEvent()]});
        sync({request: [enterProgramStateEvent()]});
    }
});
/*

## A Summary of existing events ## 
            1. viewProgramsButtonPressedEvent()
            2. enterProgramStateEvent() - has an effect:
                        ctx.registerEffect('enterProgramStateEvent', function (data) {
                            let systemVariables = ctx.getEntityById('sys1');
                            systemVariables.v_MainState = 's_Program';
                            systemVariables.idle_time = 0;
                        });
/*
Enter to background mode: upon pressing the button Enter Background Mode, this operation  causes the system to enter to s_Exit state.
*/
// Questions:
// 1. What events are needed?
//    - An event for pressing the "Enter Background Mode" button.
//    - An event to change the system state to s_Exit.
// 2. Do they already exist?
//    - No, these events do not exist in the provided list of existing events.

// Event Declarations:
function enterBackgroundModeButtonPressedEvent() {
    return Event("enterBackgroundModeButtonPressedEvent");
}

function enterExitStateEvent() {
    return Event("enterExitStateEvent");
}

// Registering the effect for the event that changes the system state to s_Exit
ctx.registerEffect('enterExitStateEvent', function (data) {
    let systemVariables = ctx.getEntityById('sys1');
    systemVariables.v_MainState = 's_Exit';
    systemVariables.idle_time = 0;
});

// Behavioral thread to handle the transition to background mode
ctx.bthread('Enter to background mode', function () {
    while (true) {
        sync({waitFor: [enterBackgroundModeButtonPressedEvent()]});
        sync({request: [enterExitStateEvent()]});
    }
});
/*
## A Summary of existing events ## 
            1. viewProgramsButtonPressedEvent()
            2. enterProgramStateEvent() - has an effect:
                        ctx.registerEffect('enterProgramStateEvent', function (data) {
                            let systemVariables = ctx.getEntityById('sys1');
                            systemVariables.v_MainState = 's_Program';
                            systemVariables.idle_time = 0;
                        });
            3. enterBackgroundModeButtonPressedEvent()
            4. enterExitStateEvent() - has an effect:
                        ctx.registerEffect('enterExitStateEvent', function (data) {
                            let systemVariables = ctx.getEntityById('sys1');
                            systemVariables.v_MainState = 's_Exit';
                            systemVariables.idle_time = 0;
                        });


*/

/*
Display program details: Given a valid program identifier (1≤programID≤8), this operation shall display the values for the weekday, time, and temperature corresponding to the program identifier on the screen.
*/

/* 
1. What events are needed?
   - An event to request displaying program details based on a given program ID.
   - An event to actually display the details on the screen.

   Event Names:
   - requestDisplayProgramDetailsEvent(programId)
   - displayProgramDetailsEvent(weekday, time, temperature)

2. Do they already exist?
   - No, these events do not exist in the provided list of existing events.
*/

// Event Declaration for requesting to display program details
function requestDisplayProgramDetailsEvent(programId) {
    return Event("requestDisplayProgramDetailsEvent", {programId: programId});
}

// Event Declaration for displaying program details
function displayProgramDetailsEvent(weekday, time, temperature) {
    return Event("displayProgramDetailsEvent", {weekday: weekday, time: time, temperature: temperature});
}

// Bthread to handle the display of program details
ctx.bthread('Display program details', 'program', function (program) {
    while (true) {
        let reqEvent = sync({waitFor: [anyEventNameWithData("requestDisplayProgramDetailsEvent", {programId: program.id})]});
        sync({request: [displayProgramDetailsEvent(program.i_WeekDay, program.i_Time, program.i_Temp)]});
    }
});


/*
## A Summary of existing events ## 
            1. viewProgramsButtonPressedEvent()
            2. enterProgramStateEvent() - has an effect:
                        ctx.registerEffect('enterProgramStateEvent', function (data) {
                            let systemVariables = ctx.getEntityById('sys1');
                            systemVariables.v_MainState = 's_Program';
                            systemVariables.idle_time = 0;
                        });
            3. enterBackgroundModeButtonPressedEvent()
            4. enterExitStateEvent() - has an effect:
                        ctx.registerEffect('enterExitStateEvent', function (data) {
                            let systemVariables = ctx.getEntityById('sys1');
                            systemVariables.v_MainState = 's_Exit';
                            systemVariables.idle_time = 0;
                        });
            5. requestDisplayProgramDetailsEvent(programId)
            6. displayProgramDetailsEvent(weekday, time, temperature)



/*
After displaying the values of the program, the system shall allow the user to modify these values. 
*/
/*

1. What events are needed?
   - An event to request modification of program values.
   - An event to confirm the modification of program values.
   - An effect to apply the modifications to the program entity.

   Event Names:
   - requestModifyProgramValuesEvent(programId, newWeekday, newTime, newTemp)
   - confirmModifyProgramValuesEvent(programId, newWeekday, newTime, newTemp)

2. Do they already exist?
   - No, these events do not exist in the provided list of existing events.


// Event Declarations
function requestModifyProgramValuesEvent(programId, newWeekday, newTime, newTemp) {
    return Event("requestModifyProgramValuesEvent", { programId, newWeekday, newTime, newTemp });
}

function confirmModifyProgramValuesEvent(programId, newWeekday, newTime, newTemp) {
    return Event("confirmModifyProgramValuesEvent", { programId, newWeekday, newTime, newTemp });
}

// Registering the effect for the confirm event
ctx.registerEffect('confirmModifyProgramValuesEvent', function (data) {
    let program = ctx.getEntityById(data.programId);
    program.i_WeekDay = data.newWeekday;
    program.i_Time = data.newTime;
    program.i_Temp = data.newTemp;
});

// Behavioral Thread
ctx.bthread('Allow user to modify program values', 'program', function (program) {
    while (true) {
        let modifyEvent = sync({waitFor: [requestModifyProgramValuesEvent(program.id)]});
        sync({request: [confirmModifyProgramValuesEvent(program.id, modifyEvent.data.newWeekday, modifyEvent.data.newTime, modifyEvent.data.newTemp)]});
    }
});

User: requestModifyProgramValuesEvent called without all parameters in let modifyEvent = sync({waitFor: [requestModifyProgramValuesEvent(program.id)]});.

Provide a full corrected implementation, without additional explanation.
*/
// Event Declarations
function requestModifyProgramValuesEvent(programId, newWeekday, newTime, newTemp) {
    return Event("requestModifyProgramValuesEvent", { programId, newWeekday, newTime, newTemp });
}

function confirmModifyProgramValuesEvent(programId, newWeekday, newTime, newTemp) {
    return Event("confirmModifyProgramValuesEvent", { programId, newWeekday, newTime, newTemp });
}

// Registering the effect for the confirm event
ctx.registerEffect('confirmModifyProgramValuesEvent', function (data) {
    let program = ctx.getEntityById(data.programId);
    program.i_WeekDay = data.newWeekday;
    program.i_Time = data.newTime;
    program.i_Temp = data.newTemp;
});

// Behavioral Thread
ctx.bthread('Allow user to modify program values', 'program', function (program) {
    while (true) {
        let modifyEvent = sync({waitFor: [anyEventNameWithData("requestModifyProgramValuesEvent", {programId: program.id})]});
        sync({request: [confirmModifyProgramValuesEvent(program.id, modifyEvent.data.newWeekday, modifyEvent.data.newTime, modifyEvent.data.newTemp)]});
    }
});

/*
## A Summary of existing events ## 
            1. viewProgramsButtonPressedEvent()
            2. enterProgramStateEvent() - has an effect:
                        ctx.registerEffect('enterProgramStateEvent', function (data) {
                            let systemVariables = ctx.getEntityById('sys1');
                            systemVariables.v_MainState = 's_Program';
                            systemVariables.idle_time = 0;
                        });
            3. enterBackgroundModeButtonPressedEvent()
            4. enterExitStateEvent() - has an effect:
                        ctx.registerEffect('enterExitStateEvent', function (data) {
                            let systemVariables = ctx.getEntityById('sys1');
                            systemVariables.v_MainState = 's_Exit';
                            systemVariables.idle_time = 0;
                        });
            5. requestDisplayProgramDetailsEvent(programId)
            6. displayProgramDetailsEvent(weekday, time, temperature)
            7. requestModifyProgramValuesEvent(programId, newWeekday, newTime, newTemp)
            8. confirmModifyProgramValuesEvent(programId, newWeekday, newTime, newTemp) - has an effect:
                        ctx.registerEffect('confirmModifyProgramValuesEvent', function (data) {
                            let program = ctx.getEntityById(data.programId);
                            program.i_WeekDay = data.newWeekday;
                            program.i_Time = data.newTime;
                            program.i_Temp = data.newTemp;
                        });


*/
//!Ron: I added a currentProgram query from here
/*
Display next program: upon pressing the Next button in UI02 and given the value of the current program identifier this operation displays the next program. 
*/


/* 
1. What events are needed?
   - An event to signal the pressing of the "Next" button.
   - An event to request the display of the next program details.
   - An event to display the next program details.

2. Do they already exist?
   - No existing event for the "Next" button press.
   - No existing event specifically for requesting the display of the next program.
   - The event to display program details exists: displayProgramDetailsEvent(weekday, time, temperature).
*/

// Event Declaration for pressing the "Next" button
function nextButtonPressedEvent() {
    return Event("nextButtonPressedEvent");
}

// Event Declaration for requesting the display of the next program
function requestDisplayNextProgramEvent(currentProgramId) {
    return Event("requestDisplayNextProgramEvent", {currentProgramId: currentProgramId});
}

// Bthread to handle the display of the next program
ctx.bthread('Display next program upon pressing Next button', 'currentProgram', function (currentProgram) {
    while (true) {
        sync({waitFor: [nextButtonPressedEvent()]});
        
        let nextProgramId = currentProgram.id + 1;
        if (nextProgramId > 8) { // Assuming there are 8 programs and they loop around
            nextProgramId = 1;
        }
        
        let nextProgram = ctx.getEntityById(nextProgramId);
        sync({request: [requestDisplayNextProgramEvent(currentProgram.id)]});
        sync({request: [displayProgramDetailsEvent(nextProgram.i_WeekDay, nextProgram.i_Time, nextProgram.i_Temp)]});
    }
});
/*
## A Summary of existing events ## 
            1. viewProgramsButtonPressedEvent()
            2. enterProgramStateEvent() - has an effect:
                        ctx.registerEffect('enterProgramStateEvent', function (data) {
                            let systemVariables = ctx.getEntityById('sys1');
                            systemVariables.v_MainState = 's_Program';
                            systemVariables.idle_time = 0;
                        });
            3. enterBackgroundModeButtonPressedEvent()
            4. enterExitStateEvent() - has an effect:
                        ctx.registerEffect('enterExitStateEvent', function (data) {
                            let systemVariables = ctx.getEntityById('sys1');
                            systemVariables.v_MainState = 's_Exit';
                            systemVariables.idle_time = 0;
                        });
            5. requestDisplayProgramDetailsEvent(programId)
            6. displayProgramDetailsEvent(weekday, time, temperature)
            7. requestModifyProgramValuesEvent(programId, newWeekday, newTime, newTemp)
            8. confirmModifyProgramValuesEvent(programId, newWeekday, newTime, newTemp) - has an effect:
                        ctx.registerEffect('confirmModifyProgramValuesEvent', function (data) {
                            let program = ctx.getEntityById(data.programId);
                            program.i_WeekDay = data.newWeekday;
                            program.i_Time = data.newTime;
                            program.i_Temp = data.newTemp;
                        });
            9. nextButtonPressedEvent()
            10. requestDisplayNextProgramEvent(currentProgramId)
            
*/
/*
Display previous program: upon pressing the button Back in UI02 and given the value of current program, this operation displays the previous program. 
*/

/* Answering the questions before implementation:
   1. What events are needed?
      - An event to signal the pressing of the "Back" button.
      - An event to request the display of the previous program based on the current program ID.
      - An event to actually display the previous program details.

   2. Do they already exist?
      - The event to signal the pressing of a button similar to "Back" does not exist.
      - The event to request the display of program details exists as `requestDisplayProgramDetailsEvent(programId)`.
      - The event to display program details exists as `displayProgramDetailsEvent(weekday, time, temperature)`.
*/

// Declaring new events
function backButtonPressedEvent() {
    return Event("backButtonPressedEvent");
}

function requestDisplayPreviousProgramEvent(currentProgramId) {
    return Event("requestDisplayPreviousProgramEvent", {currentProgramId: currentProgramId});
}

// Registering the bthread for handling the display of the previous program
ctx.bthread('Display previous program on back button press', 'currentProgram', function (currentProgram) {
    while (true) {
        sync({waitFor: [backButtonPressedEvent()]});
        
        let previousProgramId = currentProgram.id - 1;
        if (previousProgramId < 1) {
            previousProgramId = 8; // Wrap around to the last program if the current is the first
        }
        
        sync({request: [requestDisplayPreviousProgramEvent(previousProgramId)]});
        let previousProgram = ctx.getEntityById(previousProgramId.toString());
        
        sync({request: [displayProgramDetailsEvent(previousProgram.i_WeekDay, previousProgram.i_Time, previousProgram.i_Temp)]});
    }
});
/*
## A Summary of existing events ## 
            1. viewProgramsButtonPressedEvent()
            2. enterProgramStateEvent() - has an effect:
                        ctx.registerEffect('enterProgramStateEvent', function (data) {
                            let systemVariables = ctx.getEntityById('sys1');
                            systemVariables.v_MainState = 's_Program';
                            systemVariables.idle_time = 0;
                        });
            3. enterBackgroundModeButtonPressedEvent()
            4. enterExitStateEvent() - has an effect:
                        ctx.registerEffect('enterExitStateEvent', function (data) {
                            let systemVariables = ctx.getEntityById('sys1');
                            systemVariables.v_MainState = 's_Exit';
                            systemVariables.idle_time = 0;
                        });
            5. requestDisplayProgramDetailsEvent(programId)
            6. displayProgramDetailsEvent(weekday, time, temperature)
            7. requestModifyProgramValuesEvent(programId, newWeekday, newTime, newTemp)
            8. confirmModifyProgramValuesEvent(programId, newWeekday, newTime, newTemp) - has an effect:
                        ctx.registerEffect('confirmModifyProgramValuesEvent', function (data) {
                            let program = ctx.getEntityById(data.programId);
                            program.i_WeekDay = data.newWeekday;
                            program.i_Time = data.newTime;
                            program.i_Temp = data.newTemp;
                        });
            9. nextButtonPressedEvent()
            10. requestDisplayNextProgramEvent(currentProgramId)
            11. backButtonPressedEvent()
            12. requestDisplayPreviousProgramEvent(currentProgramId)
*/
/*
Run program: upon pressing the Run Program button in UI02 given the current program and given the values of current weekday and time, this operation sets the varialbe v_target_Temp accordingly and returns to the main menu (update the temp If current time is as stated by the program). In addition, this operation shall change the system state back to s_Operate from s_Program.
*/
//Ron: changed "given the program id" to "given the current program" in the requirement(it still worked before but it asked for the program id, as stated in the requirement and thats a bit weird)

function runProgramEvent(programId) {
    return Event("runProgramEvent", {programId: programId});
}

function updateTargetTempEvent(programId, temp) {
    return Event("updateTargetTempEvent", {programId: programId, temp: temp});
}

function returnToMainMenuEvent() {
    return Event("returnToMainMenuEvent");
}

ctx.registerEffect('updateTargetTempEvent', function (data) {
    let systemVariables = ctx.getEntityById('sys1');
    let program = ctx.getEntityById(data.programId);
    let external = ctx.getEntityById('externalData1');

    if (external.currentWeekday === program.i_WeekDay && external.currentHour === program.i_Time) {
        systemVariables.v_target_Temp = data.temp;
    }
});

ctx.registerEffect('returnToMainMenuEvent', function (data) {
    let systemVariables = ctx.getEntityById('sys1');
    systemVariables.v_MainState = 's_Operate';
});

ctx.bthread('Run program and return to main menu', 'program', function (program) {
    while (true) {
        let event = sync({waitFor: [anyEventNameWithData("runProgramEvent", {programId: program.id})]});
        sync({request: [updateTargetTempEvent(program.id, program.i_Temp)]});
        sync({request: [returnToMainMenuEvent()]});
    }
});

/*
Change season: Upon changing the Season Switch position in UI01 this operation shall change the v_Season system variable to the corresponding stateID ( stateID ∈{s _ Heat,s _Cool,s _ Off}). 
*/
/*
function changeSeasonEvent(seasonStateId) {
    return Event("changeSeasonEvent", {seasonStateId: seasonStateId});
}

ctx.registerEffect('changeSeasonEvent', function (data) {
    let systemVariables = ctx.getEntityById('sys1');
    systemVariables.v_season = data.seasonStateId;
});

ctx.bthread('Change season', function () {
    while (true) {
        let event = sync({waitFor: [changeSeasonEvent()]});
    }
});

\\User: changeSeasonEvent called without all parameter. Provide a fixed code without any additional explanation.

*/
function changeSeasonEvent(seasonStateId) {
    return Event("changeSeasonEvent", {seasonStateId: seasonStateId});
}

ctx.registerEffect('changeSeasonEvent', function (data) {
    let systemVariables = ctx.getEntityById('sys1');
    systemVariables.v_season = data.seasonStateId;
});

ctx.bthread('Change season', function () {
    while (true) {
        let event = sync({waitFor: [anyEventNameWithData("changeSeasonEvent")]});
    }
});

/*
Switch fan state: checks the current fan state and based on the result, switches to the alternative state. Only two states are possible – {s_FanAuto, s_FanOn}. This operation shall be evoked when the Operator changes the Fan Switch position in UI01.
*/
/*
function switchFanStateEvent() {
    return Event("switchFanStateEvent");
}

function updateFanStateEvent(newState) {
    return Event("updateFanStateEvent", {newState: newState});
}

ctx.registerEffect('updateFanStateEvent', function (data) {
    let systemVariables = ctx.getEntityById('sys1');
    systemVariables.v_Fan = data.newState;
});

ctx.bthread('Switch fan state', 'systemVariables', function (systemVariables) {
    while (true) {
        sync({waitFor: [switchFanStateEvent()]});
        let newState = (systemVariables.v_Fan === 's_Fan_On') ? 's_Fan_Auto' : 's_Fan_On';
        sync({request: [updateFanStateEvent(newState)]});
    }
});

\\User: systemVariables query doesnt exist.
*/
function switchFanStateEvent() {
    return Event("switchFanStateEvent");
}

function updateFanStateEvent(newState) {
    return Event("updateFanStateEvent", {newState: newState});
}

ctx.registerEffect('updateFanStateEvent', function (data) {
    let systemVariables = ctx.getEntityById('sys1');
    systemVariables.v_Fan = data.newState;
});

ctx.bthread('Switch fan state', function () {
    while (true) {
        sync({waitFor: [switchFanStateEvent()]});
        let systemVariables = ctx.getEntityById('sys1');
        let newState = (systemVariables.v_Fan === 's_Fan_On') ? 's_Fan_Auto' : 's_Fan_On';
        sync({request: [updateFanStateEvent(newState)]});
    }
});

/*
Increase Temperature: allows the Operator to increase the value of v_target_Temp by one degree given that this value will not be above MAX_TEMP. This operation shall be evoked when the operator presses Temperature Up button in UI01.
*/

function increaseTemperatureEvent() {
    return Event("increaseTemperatureEvent");
}

function updateTemperatureEvent(newTemp) {
    return Event("updateTemperatureEvent", {newTemp: newTemp});
}

ctx.registerEffect('updateTemperatureEvent', function (data) {
    let systemVariables = ctx.getEntityById('sys1');
    if (data.newTemp <= systemVariables.MAX_TEMP) {
        systemVariables.v_target_Temp = data.newTemp;
    }
});

ctx.bthread('Increase temperature', function () {
    while (true) {
        sync({waitFor: [increaseTemperatureEvent()]});
        let systemVariables = ctx.getEntityById('sys1');
        let newTemp = systemVariables.v_target_Temp + 1;
        if (newTemp <= systemVariables.MAX_TEMP) {
            sync({request: [updateTemperatureEvent(newTemp)]});
        }
    }
});
/*
Decrease Temperature: allows the operator to decrease the value of v_target_Temp by one degree given that this value will not be less than MIN_TEMP. This operation shall be evoked when the Operator presses Temperature Down button in UI01. 
*/

function decreaseTemperatureEvent() {
    return Event("decreaseTemperatureEvent");
}

function updateTemperatureEvent(newTemp) {
    return Event("updateTemperatureEvent", {newTemp: newTemp});
}

ctx.registerEffect('updateTemperatureEvent', function (data) {
    let systemVariables = ctx.getEntityById('sys1');
    if (data.newTemp >= systemVariables.MIN_TEMP) {
        systemVariables.v_target_Temp = data.newTemp;
    }
});

ctx.bthread('Decrease temperature', function () {
    while (true) {
        sync({waitFor: [decreaseTemperatureEvent()]});
        let systemVariables = ctx.getEntityById('sys1');
        let newTemp = systemVariables.v_target_Temp - 1;
        if (newTemp >= systemVariables.MIN_TEMP) {
            sync({request: [updateTemperatureEvent(newTemp)]});
        }
    }
});

/*
Cooling Mode: If the season is set to "Cool" (v_season = s_Cool) and the fan is on (v_Fan = s_Fan_On), the system shall activate the cooling appliance, if the current temperature is higher than the target. The system shall deactivate the cooling appliance when the target temperature is hit.
*/
/*
function activateCoolingEvent() {
    return Event("activateCoolingEvent");
}

function deactivateCoolingEvent() {
    return Event("deactivateCoolingEvent");
}

ctx.bthread('Cooling Mode Activation', ['cooling_mode', 'externalData'], function (systemVariables, externalData) {
    while (true) {
        if (systemVariables.v_curr_temp > systemVariables.v_target_Temp) {
            sync({request: [activateCoolingEvent()]});
        } else {
            sync({request: [deactivateCoolingEvent()]});
        }
        sync({waitFor: [anyEventNameWithData("updateTemperatureEvent")]});
    }
});
\\User: externalData query doesnt exist, return fixed code, without explaining(dont introduce the query)
*/
function activateCoolingEvent() {
    return Event("activateCoolingEvent");
}

function deactivateCoolingEvent() {
    return Event("deactivateCoolingEvent");
}

ctx.bthread('Cooling Mode Activation', 'cooling_mode', function (systemVariables) {
    while (true) {
        if (systemVariables.v_curr_temp > systemVariables.v_target_Temp) {
            sync({request: [activateCoolingEvent()]});
        } else {
            sync({request: [deactivateCoolingEvent()]});
        }
        sync({waitFor: [anyEventNameWithData("updateTemperatureEvent")]});
    }
});
/*
Heating Mode: If the season is set to "Heat" (v_season = s_Heat) and the fan is on (v_Fan = s_Fan_On), the system shall activate the heating appliance, if the current temperature is lower than the target. The system shall deactivate the heating appliance when the target temperature is hit.
*/  
function activateHeatingEvent() {
    return Event("activateHeatingEvent");
}

function deactivateHeatingEvent() {
    return Event("deactivateHeatingEvent");
}

ctx.bthread('Heating Mode Activation', 'heating_mode', function (systemVariables) {
    while (true) {
        if (systemVariables.v_curr_temp < systemVariables.v_target_Temp) {
            sync({request: [activateHeatingEvent()]});
        } else {
            sync({request: [deactivateHeatingEvent()]});
        }
        sync({waitFor: [anyEventNameWithData("updateTemperatureEvent")]});
    }
});
/*
Off Mode: If the season is set to "Off" (v_season = s_Off), or the fan is off (v_Fan = s_Fan_Off), no heating or cooling appliances can be activated.
*/
ctx.bthread('Block appliance activation in Off Mode', 'off_mode', function (systemVariables) {
    while (true) {
        sync({block: [activateCoolingEvent(), activateHeatingEvent()]});
    }
});
/*
Temperature Boundaries: The system shall ensure that the target temperature (v_target_Temp) remains within a valid range, between 5°C (MIN_TEMP) and 35°C (MAX_TEMP). If the temperature exceeds or falls below these limits, the system shall display a warning message and adjust the target temperature to remain within this range.
*/

function temperatureOutOfRangeEvent() {
    return Event("temperatureOutOfRangeEvent");
}

function adjustTemperatureEvent(adjustedTemp) {
    return Event("adjustTemperatureEvent", {adjustedTemp: adjustedTemp});
}

function displayWarningEvent(message) {
    return Event("displayWarningEvent", {message: message});
}


ctx.registerEffect('adjustTemperatureEvent', function (data) {
    let systemVariables = ctx.getEntityById('sys1');
    systemVariables.v_target_Temp = data.adjustedTemp;
});

ctx.bthread('Temperature Boundaries Enforcement', function () {
    while (true) {
        sync({waitFor: [temperatureOutOfRangeEvent()]});
        let systemVariables = ctx.getEntityById('sys1');
        let adjustedTemp = systemVariables.v_target_Temp;

        if (systemVariables.v_target_Temp < systemVariables.MIN_TEMP) {
            adjustedTemp = systemVariables.MIN_TEMP;
            sync({request: [displayWarningEvent("Temperature below minimum! Adjusting to " + adjustedTemp + "°C.")]});
        } else if (systemVariables.v_target_Temp > systemVariables.MAX_TEMP) {
            adjustedTemp = systemVariables.MAX_TEMP;
            sync({request: [displayWarningEvent("Temperature above maximum! Adjusting to " + adjustedTemp + "°C.")]});
        }

        sync({request: [adjustTemperatureEvent(adjustedTemp)]});
    }
});


