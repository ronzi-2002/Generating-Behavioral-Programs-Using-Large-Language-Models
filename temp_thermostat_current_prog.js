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
program: programId(integer between 1 and 8). ii_WeekDay, i_Time. i_Temp and is_curr_prog, where i_WeekDay corresponds to a specific week day chosen from {MONDAY, TUESDAY, …, FRIDAY}, i_time corresponds to 24hr based day-time specifying the beginning of the time period (e.g. 2020) and i_Temp corresponds to the target temperature provided in degrees Celsius. The value of i_Temp. There are 8 programs(id from 1 to 8) which are all Monday, 8000, 20.  

The first program, is set as the current program.
*/

function program(id, i_WeekDay, i_Time, i_Temp, is_curr_prog) {
    return ctx.Entity(id, 'program', {
        i_WeekDay: i_WeekDay,
        i_Time: i_Time,
        i_Temp: i_Temp,
        is_curr_prog: is_curr_prog
    });
}

ctx.populateContext([
    program(1, 'MONDAY', 8000, 20, true),
    program(2, 'MONDAY', 8000, 20, false),
    program(3, 'MONDAY', 8000, 20, false),
    program(4, 'MONDAY', 8000, 20, false),
    program(5, 'MONDAY', 8000, 20, false),
    program(6, 'MONDAY', 8000, 20, false),
    program(7, 'MONDAY', 8000, 20, false),
    program(8, 'MONDAY', 8000, 20, false)
]);

/*
External Data: This entity holds the data about the world, specifically the current weekday, hour. start with Monday as current day, ,and 8000 as hour
*/
function externalData(id, current_weekday, hour) {
    return ctx.Entity(id, 'externalData', {
        current_weekday: current_weekday,
        hour: hour
    });
}

ctx.populateContext([externalData('ext1', 'MONDAY', 8000)]);
/*
Needed Queries: 
    1. program 
    2. current program
    3. cooling mode =  fan_on and s_cool season 
    4. Heating mode = fan_on and s_heat season    
    5. off mode = fan_off and s_off season
   
*/
ctx.registerQuery('program', entity => entity.type == 'program');

ctx.registerQuery('currentProgram', entity => entity.type == 'program' && entity.is_curr_prog == true);

ctx.registerQuery('coolingMode', entity => entity.type == 'systemVariables' && entity.v_Fan == 's_Fan_On' && entity.v_season == 's_Cool');

ctx.registerQuery('heatingMode', entity => entity.type == 'systemVariables' && entity.v_Fan == 's_Fan_On' && entity.v_season == 's_Heat');

ctx.registerQuery('offMode', entity => entity.type == 'systemVariables' && entity.v_Fan == 's_Fan_Off' && entity.v_season == 's_Off');
/*
Enter to view program: upon pressing the button View Programs in UI01, this operation causes the system to enter to its s_Program state and the value of the variable idle_Time to be set to its initial value
*/

function viewProgramsEvent() {
    return Event("viewProgramsEvent");
}

function enterProgramModeEvent() {
    return Event("enterProgramModeEvent");
}

ctx.registerEffect('enterProgramModeEvent', function (data) {
    let systemVariables = ctx.getEntityById('sys1');
    systemVariables.v_MainState = 's_Program';
    systemVariables.idle_time = 0;
});

ctx.bthread('Enter to view program', function () {
    while (true) {
        sync({waitFor: [viewProgramsEvent()]});
        sync({request: [enterProgramModeEvent()]});
    }
});
/*
Enter to background mode: upon pressing the button Enter Background Mode, this operation  causes the system to enter to s_Exit state.
*/
function enterBackgroundModeEvent() {
    return Event("enterBackgroundModeEvent");
}

function switchToExitStateEvent() {
    return Event("switchToExitStateEvent");
}

ctx.registerEffect('switchToExitStateEvent', function (data) {
    let systemVariables = ctx.getEntityById('sys1');
    systemVariables.v_MainState = 's_Exit';
});

ctx.bthread('Enter to background mode', function () {
    while (true) {
        sync({waitFor: [enterBackgroundModeEvent()]});
        sync({request: [switchToExitStateEvent()]});
    }
});
/*
Display program details: Given a valid program identifier (1≤programID≤8), this operation shall display the values for the weekday, time, and temperature corresponding to the program identifier on the screen.
*/

function displayProgramDetailsEvent(programId) {
    return Event("displayProgramDetailsEvent", {programId: programId});
}

function showProgramDetailsOnScreenEvent(weekday, time, temperature) {
    return Event("showProgramDetailsOnScreenEvent", {weekday: weekday, time: time, temperature: temperature});
}

ctx.bthread('Display program details', 'program', function (program) {
    while (true) {
        let event = sync({waitFor: [anyEventNameWithData("displayProgramDetailsEvent", {programId: program.id})]});
        sync({request: [showProgramDetailsOnScreenEvent(program.i_WeekDay, program.i_Time, program.i_Temp)]});
    }
});

/*
After displaying the values of the program, the system shall allow the user to modify these values. 
*/

/*
SOmetimes:
function modifyProgramEvent(programId, newWeekday, newTime, newTemp) {
    return Event("modifyProgramEvent", {programId: programId, newWeekday: newWeekday, newTime: newTime, newTemp: newTemp});
}

ctx.registerEffect('modifyProgramEvent', function (data) {
    let program = ctx.getEntityById(data.programId);
    program.i_WeekDay = data.newWeekday;
    program.i_Time = data.newTime;
    program.i_Temp = data.newTemp;
});

ctx.bthread('Allow user to modify program values', 'program', function (program) {
    while (true) {
        sync({waitFor: [modifyProgramEvent(program.id, any, any, any)]});
    }
});

Compilation error at:  sync({waitFor: [modifyProgramEvent(program.id, any, any, any)]});
Provide a corrected implementation, without additional explanation.

ctx.bthread('Allow user to modify program values', 'program', function (program) {
    while (true) {
        let event = sync({waitFor: [anyEventNameWithData("modifyProgramEvent", {programId: program.id})]});
    }
});
*/
function modifyProgramDetailsEvent(programId, weekday, time, temperature) {
    return Event("modifyProgramDetailsEvent", {programId: programId, weekday: weekday, time: time, temperature: temperature});
}

ctx.registerEffect('modifyProgramDetailsEvent', function (data) {
    let program = ctx.getEntityById(data.programId);
    program.i_WeekDay = data.weekday;
    program.i_Time = data.time;
    program.i_Temp = data.temperature;
});

ctx.bthread('Allow modification of program details after display', 'program', function (program) {
    while (true) {
        sync({waitFor: [showProgramDetailsOnScreenEvent(program.i_WeekDay, program.i_Time, program.i_Temp)]});
        let event = sync({waitFor: [anyEventNameWithData("modifyProgramDetailsEvent", {programId: program.id})]});
        // Effect to modify the program details is automatically handled by the registered effect
    }
});

//A potential bthread for modifying the program

/*
Display next program: upon pressing the Next button in UI02 and given the value of the current program identifier this operation displays the next program. 
*/

function nextProgramEvent(currentProgramId) {
    return Event("nextProgramEvent", {currentProgramId: currentProgramId});
}

function displayNextProgramEvent(weekday, time, temperature) {
    return Event("displayNextProgramEvent", {weekday: weekday, time: time, temperature: temperature});
}

ctx.bthread('Display next program', 'program', function (program) {
    while (true) {
        let event = sync({waitFor: [anyEventNameWithData("nextProgramEvent", {currentProgramId: program.id})]});
        let nextProgramId = (program.id % 8) + 1; // Cycle through program IDs 1 to 8
        let nextProgram = ctx.getEntityById(nextProgramId);
        sync({request: [displayNextProgramEvent(nextProgram.i_WeekDay, nextProgram.i_Time, nextProgram.i_Temp)]});
    }
});

/*
Display previous program: upon pressing the button Back in UI02 and given the value of current program, this operation displays the previous program. 
*/

function previousProgramEvent(currentProgramId) {
    return Event("previousProgramEvent", {currentProgramId: currentProgramId});
}

function displayPreviousProgramEvent(weekday, time, temperature) {
    return Event("displayPreviousProgramEvent", {weekday: weekday, time: time, temperature: temperature});
}

ctx.bthread('Display previous program', 'program', function (program) {
    while (true) {
        let event = sync({waitFor: [anyEventNameWithData("previousProgramEvent", {currentProgramId: program.id})]});
        let previousProgramId = program.id === 1 ? 8 : program.id - 1; // Cycle through program IDs 1 to 8, wrapping around
        let previousProgram = ctx.getEntityById(previousProgramId);
        sync({request: [displayPreviousProgramEvent(previousProgram.i_WeekDay, previousProgram.i_Time, previousProgram.i_Temp)]});
    }
});

/*
Run program: upon pressing the Run Program button in UI02 given the program id and given the values of current weekday and time, this operation sets the varialbe v_target_Temp accordingly and returns to the main menu (update the temp If current time is as stated by the program). In addition, this operation shall change the system state back to s_Operate from s_Program. 
*/
//TODO: changed the requirement a bit. Make sure its okay.
function runProgramEvent(programId) {
    return Event("runProgramEvent", {programId: programId});
}

function updateTargetTempEvent(newTemp) {
    return Event("updateTargetTempEvent", {newTemp: newTemp});
}

function returnToMainMenuEvent() {
    return Event("returnToMainMenuEvent");
}

ctx.registerEffect('updateTargetTempEvent', function (data) {
    let systemVariables = ctx.getEntityById('sys1');
    systemVariables.v_target_Temp = data.newTemp;
});

ctx.registerEffect('returnToMainMenuEvent', function (data) {
    let systemVariables = ctx.getEntityById('sys1');
    systemVariables.v_MainState = 's_Operate';
});

ctx.bthread('Run program and update temperature', ['program', 'externalData'], function (program, externalData) {
    while (true) {
        let event = sync({waitFor: [anyEventNameWithData("runProgramEvent", {programId: program.id})]});
        if (externalData.current_weekday === program.i_WeekDay && externalData.hour === program.i_Time) {
            sync({request: [updateTargetTempEvent(program.i_Temp)]});
        }
        sync({request: [returnToMainMenuEvent()]});
    }
});

/*
Change season: Upon changing the Season Switch position in UI01 this operation shall change the v_Season system variable to the corresponding stateID ( stateID ∈{s _ Heat,s _Cool,s _ Off}). 
*/

function changeSeasonEvent(newSeason) {
    return Event("changeSeasonEvent", {newSeason: newSeason});
}

ctx.registerEffect('changeSeasonEvent', function (data) {
    let systemVariables = ctx.getEntityById('sys1');
    systemVariables.v_season = data.newSeason;
});

/*
Switch fan state: checks the current fan state and based on the result, switches to the alternative state. Only two states are possible – {s_FanAuto, s_FanOn}. This operation shall be evoked when the Operator changes the Fan Switch position in UI01.
*/

/*
function switchFanStateEvent() {
    return Event("switchFanStateEvent");
}

function setFanStateEvent(newState) {
    return Event("setFanStateEvent", {newState: newState});
}

ctx.registerEffect('setFanStateEvent', function (data) {
    let systemVariables = ctx.getEntityById('sys1');
    systemVariables.v_Fan = data.newState;
});

ctx.bthread('Switch fan state', 'systemVariables', function (systemVariables) {
    while (true) {
        sync({waitFor: [switchFanStateEvent()]});
        let newState = systemVariables.v_Fan === 's_Fan_On' ? 's_Fan_Auto' : 's_Fan_On';
        sync({request: [setFanStateEvent(newState)]});
    }
});

/User: systemVariables query doesnt exist. Provide a new implemenation(dont introduce the query)
*/
function switchFanStateEvent() {
    return Event("switchFanStateEvent");
}

function setFanStateEvent(newState) {
    return Event("setFanStateEvent", {newState: newState});
}

ctx.registerEffect('setFanStateEvent', function (data) {
    let systemVariables = ctx.getEntityById('sys1');
    systemVariables.v_Fan = data.newState === 's_Fan_On' ? 's_Fan_Auto' : 's_Fan_On';
});

ctx.bthread('Switch fan state', function () {
    while (true) {
        sync({waitFor: [switchFanStateEvent()]});
        let systemVariables = ctx.getEntityById('sys1');
        let newState = systemVariables.v_Fan === 's_Fan_On' ? 's_Fan_Auto' : 's_Fan_On';
        sync({request: [setFanStateEvent(newState)]});
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
function activateCoolingApplianceEvent() {
    return Event("activateCoolingApplianceEvent");
}

function deactivateCoolingApplianceEvent() {
    return Event("deactivateCoolingApplianceEvent");
}

ctx.bthread('Cooling Mode Activation', 'coolingMode', function (systemVariables) {
    while (true) {
        if (systemVariables.v_curr_temp > systemVariables.v_target_Temp) {
            sync({request: [activateCoolingApplianceEvent()]});
        } else {
            sync({request: [deactivateCoolingApplianceEvent()]});
        }
    }
});

/*
Heating Mode: If the season is set to "Heat" (v_season = s_Heat) and the fan is on (v_Fan = s_Fan_On), the system shall activate the heating appliance, if the current temperature is lower than the target. The system shall deactivate the heating appliance when the target temperature is hit.
*/  
function activateHeatingApplianceEvent() {
    return Event("activateHeatingApplianceEvent");
}

function deactivateHeatingApplianceEvent() {
    return Event("deactivateHeatingApplianceEvent");
}

ctx.bthread('Heating Mode Activation', 'heatingMode', function (systemVariables) {
    while (true) {
        if (systemVariables.v_curr_temp < systemVariables.v_target_Temp) {
            sync({request: [activateHeatingApplianceEvent()]});
        } else {
            sync({request: [deactivateHeatingApplianceEvent()]});
        }
    }
});
/*
Off Mode: If the season is set to "Off" (v_season = s_Off), or the fan is off (v_Fan = s_Fan_Off), no heating or cooling appliances can be activated.
*/
function blockHeatingCoolingEvent() {
    return Event("blockHeatingCoolingEvent");
}

ctx.bthread('Off Mode - Block Heating and Cooling', 'offMode', function (systemVariables) {
    while (true) {
        sync({block: [activateHeatingApplianceEvent(), activateCoolingApplianceEvent()]});
    }
});
/*
Temperature Boundaries: The system shall ensure that the target temperature (v_target_Temp) remains within a valid range, between 5°C (MIN_TEMP) and 35°C (MAX_TEMP). If the temperature exceeds or falls below these limits, the system shall display a warning message and adjust the target temperature to remain within this range.
*/
function temperatureOutOfRangeEvent() {
    return Event("temperatureOutOfRangeEvent");
}

function displayWarningMessageEvent(message) {
    return Event("displayWarningMessageEvent", {message: message});
}

function adjustTemperatureEvent(newTemp) {
    return Event("adjustTemperatureEvent", {newTemp: newTemp});
}

ctx.registerEffect('adjustTemperatureEvent', function (data) {
    let systemVariables = ctx.getEntityById('sys1');
    systemVariables.v_target_Temp = data.newTemp;
});

ctx.bthread('Temperature Boundaries Enforcement', function () {
    while (true) {
        let systemVariables = ctx.getEntityById('sys1');
        if (systemVariables.v_target_Temp < systemVariables.MIN_TEMP || systemVariables.v_target_Temp > systemVariables.MAX_TEMP) {
            sync({request: [temperatureOutOfRangeEvent()]});
            let message = "Target temperature is out of range. Adjusting to a valid value.";
            sync({request: [displayWarningMessageEvent(message)]});
            let adjustedTemp = systemVariables.v_target_Temp < systemVariables.MIN_TEMP ? systemVariables.MIN_TEMP : systemVariables.MAX_TEMP;
            sync({request: [adjustTemperatureEvent(adjustedTemp)]});
        }
    }
});
/*
function temperatureOutOfRangeEvent() {
    return Event("temperatureOutOfRangeEvent");
}

function adjustTemperatureEvent(newTemp) {
    return Event("adjustTemperatureEvent", {newTemp: newTemp});
}

function displayWarningMessageEvent(message) {
    return Event("displayWarningMessageEvent", {message: message});
}

ctx.registerEffect('adjustTemperatureEvent', function (data) {
    let systemVariables = ctx.getEntityById('sys1');
    systemVariables.v_target_Temp = data.newTemp;
});

ctx.bthread('Temperature Boundaries Enforcement', function () {
    while (true) {
        let systemVariables = ctx.getEntityById('sys1');
        if (systemVariables.v_target_Temp < systemVariables.MIN_TEMP) {
            sync({request: [displayWarningMessageEvent("Temperature below minimum limit. Adjusting to MIN_TEMP."), adjustTemperatureEvent(systemVariables.MIN_TEMP)]});
        } else if (systemVariables.v_target_Temp > systemVariables.MAX_TEMP) {
            sync({request: [displayWarningMessageEvent("Temperature above maximum limit. Adjusting to MAX_TEMP."), adjustTemperatureEvent(systemVariables.MAX_TEMP)]});
        }
    }
});
*/

/*
After season is changed, the user is notified
*/


function seasonChangedNotificationEvent(message) {
    return Event("seasonChangedNotificationEvent", {message: message});
}

ctx.bthread('Notify user after season change', function () {
    while (true) {
        let event = sync({waitFor: [changeSeasonEvent()]});
        let newSeason = event.data.newSeason;
        let message = `Season changed to ${newSeason === 's_Heat' ? 'Heat' : newSeason === 's_Cool' ? 'Cool' : 'Off'}.`;
        sync({request: [seasonChangedNotificationEvent(message)]});
    }
});

//Use anyEventNameWithData

ctx.bthread('Notify user after season change', function () {
    while (true) {
        let event = sync({waitFor: [anyEventNameWithData("changeSeasonEvent", any)]});
        let newSeason = event.data.newSeason;
        let message = `Season changed to ${newSeason === 's_Heat' ? 'Heat' : newSeason === 's_Cool' ? 'Cool' : 'Off'}.`;
        sync({request: [seasonChangedNotificationEvent(message)]});
    }
});