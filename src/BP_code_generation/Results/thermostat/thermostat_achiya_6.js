//Link: https://platform.openai.com/playground/p/CJ0NcdPk4hFHOXHXp8pBztT1?mode=chat
/*
System. Includes all thermostat related system variables: v_season (s_Heat, s_Cool, s_Off),
v_Fan (s_Fan_On, s_Fan_Off), v_target_Temp, MIN_TEMP=5, MAX_TEMP=35, v_curr_temp,
v_MainState (s_Operate, s_Exit, s_Program), idle_time. Default values: s_Off, s_Fan_Off,
v_target_Temp=20, v_curr_temp=20, s_Operate, idle_time=0
*/
function System(id, v_season='s_Off', v_Fan='s_Fan_Off', v_target_Temp=20, v_curr_temp=20, v_MainState='s_Operate', idle_time=0) {
    return ctx.Entity(id, 'System', {
        v_season: v_season,
        v_Fan: v_Fan,
        v_target_Temp: v_target_Temp,
        MIN_TEMP: 5,
        MAX_TEMP: 35,
        v_curr_temp: v_curr_temp,
        v_MainState: v_MainState,
        idle_time: idle_time
    });
}

ctx.populateContext([System('system1')]);
/*
Program. The system has configurable temperature-control programs, each has the following data: programId (1, ..., 8), ii_WeekDay (MONDAY, ..., FRIDAY), i_Time (representing the time period beginning) and i_Temp (representing to the target temperature in Celsius). By default, there are 8 programs (id from 1 to 8), which are all Monday, 1000, 20.
*/

function Program(programId, ii_WeekDay='MONDAY', i_Time=1000, i_Temp=20) {
    return ctx.Entity(programId, 'Program', {
        programId: programId,
        ii_WeekDay: ii_WeekDay,
        i_Time: i_Time,
        i_Temp: i_Temp
    });
}

ctx.populateContext([
    Program(1), Program(2), Program(3), Program(4),
    Program(5), Program(6), Program(7), Program(8)
]);

/*

External Data. External information, including the current weekday and hour. Defaults with Monday as current day, and 1000 as hour. 
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

ctx.registerQuery('coolingMode', entity => entity.type == 'System' && entity.v_Fan == 's_Fan_On' && entity.v_season == 's_Cool');

ctx.registerQuery('heatingMode', entity => entity.type == 'System' && entity.v_Fan == 's_Fan_On' && entity.v_season == 's_Heat');

ctx.registerQuery('offMode', entity => entity.type == 'System' && entity.v_Fan == 's_Fan_Off' && entity.v_season == 's_Off');

/*
Enter to view program: upon pressing the button View Programs in UI01, this operation causes the system to enter its s_Program state and the value of the variable idle_Time to be set to its initial value.
*/
function viewProgramsEvent() {
    return Event("viewProgramsEvent");
}

function enterProgramStateEvent() {
    return Event("enterProgramStateEvent");
}

ctx.registerEffect('enterProgramStateEvent', function (data) {
    let system = ctx.getEntityById('system1');
    system.v_MainState = 's_Program';
    system.idle_time = 0;
});

ctx.bthread('Enter to view program', function () {
    while (true) {
        sync({waitFor: [viewProgramsEvent()]});
        sync({requestOne: [enterProgramStateEvent()]});
    }
});
/*
Enter to background mode: upon pressing the button Enter Background Mode, this operation causes the system to enter the s_Exit state, minimize UI01, and suspend the system to a background mode.
*/
function enterBackgroundModeEvent() {
    return Event("enterBackgroundModeEvent");
}

function minimizeUIEvent() {
    return Event("minimizeUIEvent");
}

function suspendSystemEvent() {
    return Event("suspendSystemEvent");
}

ctx.registerEffect('enterBackgroundModeEvent', function (data) {
    let system = ctx.getEntityById('system1');
    system.v_MainState = 's_Exit';
});

ctx.bthread('Enter to background mode', function () {
    while (true) {
        sync({waitFor: [enterBackgroundModeEvent()]});
        sync({requestAll: [minimizeUIEvent(), suspendSystemEvent()]});
    }
});
/*
Display program: Given a valid program identifier (1≤programID≤8), this operation shall display the values for the weekday, time, and temperature corresponding to the program identifier on the screen.
*/

function displayProgramEvent(programId) {
    return Event("displayProgramEvent", {programId: programId});
}

function showProgramDetailsEvent(programId, weekday, time, temp) {
    return Event("showProgramDetailsEvent", {programId: programId, weekday: weekday, time: time, temp: temp});
}

ctx.bthread('Display program details', 'program', function (program) {
    while (true) {
        sync({waitFor: [anyEventWithData(displayProgramEvent, {programId: program.id})]});
        sync({requestOne: [showProgramDetailsEvent(program.id, program.i_WeekDay, program.i_Time, program.i_Temp)]});
    }
});


/*
Modify program: the system shall allow the user to modify the he values for weekday, time, and temperature.
*/
function modifyProgramEvent(programId, weekday, time, temp) {
    return Event("modifyProgramEvent", {programId: programId, weekday: weekday, time: time, temp: temp});
}

ctx.registerEffect('modifyProgramEvent', function (data) {
    let program = ctx.getEntityById(data.programId);
    program.i_WeekDay = data.weekday;
    program.i_Time = data.time;
    program.i_Temp = data.temp;
});

ctx.bthread('Modify program', 'program', function (program) {
    while (true) {
        sync({waitFor: [anyEventWithData(modifyProgramEvent, {programId: program.id})]});
    }
});

/*
Store programs: given a valid program identifier and valid values for weekday, time, and temperature, this operation causes the values to be stored in the system files.
*/
function storeProgramEvent(programId, weekday, time, temp) {
    return Event("storeProgramEvent", {programId: programId, weekday: weekday, time: time, temp: temp});
}

ctx.bthread('Store program values', 'program', function (program) {
    while (true) {
        sync({waitFor: [anyEventWithData(storeProgramEvent, {programId: program.id})]});
    }
});

/*
Display next program: upon pressing the Next button in UI02 and given the value of the current program identifier, this operation displays the next program.
*/

function nextProgramEvent(currentProgramId) {
    return Event("nextProgramEvent", {currentProgramId: currentProgramId});
}

function showNextProgramDetailsEvent(programId, weekday, time, temp) {
    return Event("showNextProgramDetailsEvent", {programId: programId, weekday: weekday, time: time, temp: temp});
}

ctx.bthread('Display next program', 'program', function (program) {
    while (true) {
        let event = sync({waitFor: [anyEventWithData(nextProgramEvent, {currentProgramId: program.id})]});
        let nextProgramId = (program.id % 8) + 1; // Cycle through program IDs 1 to 8
        let nextProgram = ctx.getEntityById(nextProgramId.toString());
        sync({requestOne: [showNextProgramDetailsEvent(nextProgram.id, nextProgram.i_WeekDay, nextProgram.i_Time, nextProgram.i_Temp)]});
    }
});


/*
Display previous program: upon pressing the Back button in UI02 and given the value of the current program, this operation displays the previous program.
*/

function previousProgramEvent(currentProgramId) {
    return Event("previousProgramEvent", {currentProgramId: currentProgramId});
}

function showPreviousProgramDetailsEvent(programId, weekday, time, temp) {
    return Event("showPreviousProgramDetailsEvent", {programId: programId, weekday: weekday, time: time, temp: temp});
}

ctx.bthread('Display previous program', 'program', function (program) {
    while (true) {
        let event = sync({waitFor: [anyEventWithData(previousProgramEvent, {currentProgramId: program.id})]});
        let previousProgramId = program.id - 1;
        if (previousProgramId < 1) {
            previousProgramId = 8; // Cycle back to the last program if the current is the first
        }
        let previousProgram = ctx.getEntityById(previousProgramId.toString());
        sync({requestOne: [showPreviousProgramDetailsEvent(previousProgram.id, previousProgram.i_WeekDay, previousProgram.i_Time, previousProgram.i_Temp)]});
    }
});
/*
Run program: upon pressing the Run Program button in UI02 given the program id and given the values of current weekday and time, this operation sets the variable v_target_Temp accordingly if the current time in external_data is as stated by the program. In addition, this operation shall return to the main menu and change the system state back to s_Operate from s_Program 
*/
function runProgramEvent(programId) {
    return Event("runProgramEvent", {programId: programId});
}

function setTargetTempEvent(temp) {
    return Event("setTargetTempEvent", {temp: temp});
}

function returnToMainMenuEvent() {
    return Event("returnToMainMenuEvent");
}

ctx.registerEffect('setTargetTempEvent', function (data) {
    let system = ctx.getEntityById('system1');
    system.v_target_Temp = data.temp;
});

ctx.registerEffect('returnToMainMenuEvent', function (data) {
    let system = ctx.getEntityById('system1');
    system.v_MainState = 's_Operate';
});

ctx.bthread('Run program and set temperature', 'program', function (program) {
    while (true) {
        sync({waitFor: [anyEventWithData(runProgramEvent, {programId: program.id})]});
        let external = ctx.getEntityById('externalData1');
        if (external.currentWeekday === program.i_WeekDay && external.currentHour === program.i_Time) {
            sync({requestOne: [setTargetTempEvent(program.i_Temp)]});
        }
        sync({requestOne: [returnToMainMenuEvent()]});
    }
});

/*
Change season: Upon changing the Season Switch position in UI01, this operation shall change the v_Season system variable to the corresponding stateID.
*/
/*
function changeSeasonEvent(seasonStateId) {
    return Event("changeSeasonEvent", {seasonStateId: seasonStateId});
}

ctx.registerEffect('changeSeasonEvent', function (data) {
    let system = ctx.getEntityById('system1');
    system.v_season = data.seasonStateId;
});

ctx.bthread('Change season', function () {
    while (true) {
        let event = sync({waitFor: [changeSeasonEvent()]});
    }
});

------------------------------------------------------------
User: changeSeasonEvent() called without all parameters in  let event = sync({waitFor: [changeSeasonEvent()]});
Provide a full new corrected implementation(including declarations), without additional explanation.
*/
function changeSeasonEvent(seasonStateId) {
    return Event("changeSeasonEvent", {seasonStateId: seasonStateId});
}

ctx.registerEffect('changeSeasonEvent', function (data) {
    let system = ctx.getEntityById('system1');
    system.v_season = data.seasonStateId;
});

ctx.bthread('Change season', function () {
    while (true) {
        let event = sync({waitFor: [anyEventWithData(changeSeasonEvent)]});
    }
});

/*
Switch fan state: checks the current fan state and based on the result, switches to the alternative state. Only two states are possible – {s_FanAuto, s_FanOn}. This operation shall be evoked when the Operator changes the Fan Switch position in UI01.
*/

function switchFanStateEvent() {
    return Event("switchFanStateEvent");
}

function setFanStateEvent(fanState) {
    return Event("setFanStateEvent", {fanState: fanState});
}

ctx.registerEffect('setFanStateEvent', function (data) {
    let system = ctx.getEntityById('system1');
    system.v_Fan = data.fanState;
});

ctx.bthread('Switch fan state', function () {
    while (true) {
        sync({waitFor: [switchFanStateEvent()]});
        let system = ctx.getEntityById('system1');
        let newState = (system.v_Fan === 's_Fan_On') ? 's_FanAuto' : 's_Fan_On';
        sync({requestOne: [setFanStateEvent(newState)]});
    }
});
/*
Increase Temperature: allows the Operator to increase the value of v_target_Temp by one degree given that this value will not be above MAX_TEMP. This operation shall be evoked when the operator presses Temperature Up button in UI01.
*/

function increaseTemperatureEvent() {
    return Event("increaseTemperatureEvent");
}

function setIncreasedTemperatureEvent() {
    return Event("setIncreasedTemperatureEvent");
}

ctx.registerEffect('setIncreasedTemperatureEvent', function (data) {
    let system = ctx.getEntityById('system1');
    if (system.v_target_Temp < system.MAX_TEMP) {
        system.v_target_Temp += 1;
    }
});

ctx.bthread('Increase temperature', function () {
    while (true) {
        sync({waitFor: [increaseTemperatureEvent()]});
        sync({requestOne: [setIncreasedTemperatureEvent()]});
    }
});

/*
Decrease Temperature: allows the operator to decrease the value of v_target_Temp by one degree given that this value will not be less than MIN_TEMP. This operation shall be evoked when the Operator presses Temperature Down button in UI01. 
*/

function decreaseTemperatureEvent() {
    return Event("decreaseTemperatureEvent");
}

function setDecreasedTemperatureEvent() {
    return Event("setDecreasedTemperatureEvent");
}

ctx.registerEffect('setDecreasedTemperatureEvent', function (data) {
    let system = ctx.getEntityById('system1');
    if (system.v_target_Temp > system.MIN_TEMP) {
        system.v_target_Temp -= 1;
    }
});

ctx.bthread('Decrease temperature', function () {
    while (true) {
        sync({waitFor: [decreaseTemperatureEvent()]});
        sync({requestOne: [setDecreasedTemperatureEvent()]});
    }
});

/*
Cooling Mode: while the season is set to “Cool” (v_season = s_Cool) and the fan is on (v_Fan = s_Fan_On), the system shall move to off mode when the current temperature is lower than the target one.
*/
function moveToOffModeEvent() {
    return Event("moveToOffModeEvent");
}

ctx.registerEffect('moveToOffModeEvent', function (data) {
    let system = ctx.getEntityById('system1');
    system.v_season = 's_Off';
    system.v_Fan = 's_Fan_Off';
});

ctx.bthread('Cooling mode to off mode', 'coolingMode', function (coolingMode) {
    while (true) {
        if (coolingMode.v_curr_temp < coolingMode.v_target_Temp) {
            sync({requestOne: [moveToOffModeEvent()]});
        }
    }
});

/*
Heating Mode: while the season is set to “Heat” (v_season = s_Heat) and the fan is on (v_Fan = s_Fan_On), the system shall move to off mode when the current temperature is higher than the target one.
*/
function moveToOffModeFromHeatEvent() {
    return Event("moveToOffModeFromHeatEvent");
}

ctx.registerEffect('moveToOffModeFromHeatEvent', function (data) {
    let system = ctx.getEntityById('system1');
    system.v_season = 's_Off';
    system.v_Fan = 's_Fan_Off';
});

ctx.bthread('Heating mode to off mode', 'heatingMode', function (heatingMode) {
    while (true) {
        if (heatingMode.v_curr_temp > heatingMode.v_target_Temp) {
            sync({requestOne: [moveToOffModeFromHeatEvent()]});
        }
    }
});
/*
Off Mode: if the season is set to “Off” (v_season = s_Off), and the fan is off (v_Fan = s_Fan_Off), if the current temperature is higher than the target one, the system shall move to heating mode, and if the current temperature is lower than the target one, the system shall move to cooling mode.
*/
function moveToHeatingModeEvent() {
    return Event("moveToHeatingModeEvent");
}

function moveToCoolingModeEvent() {
    return Event("moveToCoolingModeEvent");
}

ctx.registerEffect('moveToHeatingModeEvent', function (data) {
    let system = ctx.getEntityById('system1');
    system.v_season = 's_Heat';
    system.v_Fan = 's_Fan_On';
});

ctx.registerEffect('moveToCoolingModeEvent', function (data) {
    let system = ctx.getEntityById('system1');
    system.v_season = 's_Cool';
    system.v_Fan = 's_Fan_On';
});

ctx.bthread('Off mode temperature adjustments', 'offMode', function (offMode) {
    while (true) {
        if (offMode.v_curr_temp > offMode.v_target_Temp) {
            sync({requestOne: [moveToHeatingModeEvent()]});
        } else if (offMode.v_curr_temp < offMode.v_target_Temp) {
            sync({requestOne: [moveToCoolingModeEvent()]});
        }
    }
});
/*
Temperature Boundaries: The system shall ensure that the target temperature (v_target_Temp) remains within a valid range, between 5°C (MIN_TEMP) and 35°C (MAX_TEMP). If the temperature exceeds or falls below these limits, the system adjusts the target temperature to remain within this range.
*/
function adjustTemperatureWithinBoundsEvent() {
    return Event("adjustTemperatureWithinBoundsEvent");
}

ctx.registerEffect('adjustTemperatureWithinBoundsEvent', function (data) {
    let system = ctx.getEntityById('system1');
    if (system.v_target_Temp < system.MIN_TEMP) {
        system.v_target_Temp = system.MIN_TEMP;
    } else if (system.v_target_Temp > system.MAX_TEMP) {
        system.v_target_Temp = system.MAX_TEMP;
    }
});

ctx.bthread('Ensure target temperature is within boundaries', function () {
    while (true) {
        let system = ctx.getEntityById('system1');
        if (system.v_target_Temp < system.MIN_TEMP || system.v_target_Temp > system.MAX_TEMP) {
            sync({requestOne: [adjustTemperatureWithinBoundsEvent()]});
        }
    }
});




