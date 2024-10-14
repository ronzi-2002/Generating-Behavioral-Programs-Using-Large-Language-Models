//Handle external events
bthread('Handle external events', function () {
  let event = null;
  while (true) {
    bp.log.setLevel("Fine");
    // bp.log.info("Waiting for external event");
    event = sync({waitFor: bp.all});
    if (event.name === 'ExternalEvent') {
      //The event is external, it is a json object with the following structures: name and data, trigger the event
      
      bp.log.info("External event received: " + event.data);
      let obj = JSON.parse(event.data);
      let eventName = obj.name;
      if(eventName === "getEntityByIdEvent")
      {
        let obj = JSON.parse(event.data);
        let entityId = obj.data.entityId;
        let requestId = obj.data.requestId;

        let entity = ctx.getEntityById(entityId);
        sync({request: [Event("getEntityByIdResponse", {entity: JSON.stringify(entity), requestId: requestId})]});
      }
      else {
        let eventData = obj.data;
        if (eventData === undefined) {
          sync({request: [Event(eventName)]});
        } else
          {
            sync({request: [Event(eventName, eventData)]});
          }

        }
    }

  }
});

bthread('handleGetEntityByIdEvent', function () {
  while (true) {
    let ev = sync({waitFor: EventSet("getEntityByIdEvent", function (e) { return e.name === "getEntityByIdEvent"; })});
    let entityId = ev.data.entityId;
    let requestId = ev.data.requestId;
    let entity = ctx.getEntityById(entityId);
    sync({request: [Event("getEntityByIdResponse", {entity: JSON.stringify(entity), requestId: requestId})]});
  }
});

function anyEventNameWithData(eventName, data) {

  return EventSet(eventName, function (e) {
    if (data === undefined || data === null || Object.keys(data).length === 0) {
      return e.name === eventName;
    }
    //for each <key, value> in data, check if the event has the same key and value
    for (let [key, value] of Object.entries(data)) {
      //if the event does not have the key
      if(!e.data)
        return false;
      try {
        if (!e.data.hasOwnProperty(key)) {
          return false;
        }
      }
        catch (e) {
            return false;
        }

      if (e.data[key] !== value) {
        return false;
      }
    }
    return e.name === eventName// && e.data === data;//TODO: check if this is the correct way to compare objects, maybe use JSON.stringify or compare each field
  });
}
function getEntitiesByType(type) {
  //entity => entity.type == 'phase' && entity.currentComponent == 'ending_scene');
  let query = (type) => {
    return entity => entity.type == type;
  }
  return ctx.runQuery(query(type));
}

function Sleep(milliseconds) {
  for (let i = 0; i < milliseconds/60000; i++) {
    sync({waitFor: Event("MinutePassed")});
  }
}
let metaData15679= {};
metaData15679["simulatedTime"]= new Date().getTime();
bp.store.put("metaData15679", metaData15679);
function TimeToBe(hour, minute) {
  //The time is given by the real time, we need to adapt it to the simulated time
  //We will get the difference between the real time and the simulated time and add it to the time to be
  let realTime = new Date().getTime();
  const metaData15679 = bp.store.get("metaData15679");
  let simulatedTime = metaData15679["simulatedTime"];
  let timeToBe = new Date();
  timeToBe.setHours(hour);
  timeToBe.setMinutes(minute);
  let timeToBeInMilliseconds = timeToBe.getTime();
  let difference = timeToBeInMilliseconds - realTime;
  let newTimeToBe = simulatedTime + difference;
  let newDate = new Date(newTimeToBe);
  let newHour = newDate.getHours();
  let newMinute = newDate.getMinutes();
  
  hour = newHour;
  minute = newMinute;

  // bp.log.info("Time to be: " + hour + ":" + minute);
  return Event("TimeToBe", hour+":"+minute);
}

bthread('Time management', function () {
  const timeEventSet = EventSet("TimeToBe", function (e) {
    return e.name === "TimeToBe";
  });
  while (true) {
    let ev= sync({waitFor: timeEventSet});
    let time = ev.data;
    let timeArray = time.split(":");
    let hour = timeArray[0];
    let minute = timeArray[1];
    // bp.log.info("Time to be: " + hour + ":" + minute);
    let date = new Date();
    date.setHours(hour);
    date.setMinutes(minute);
    const metaData15679 = bp.store.get("metaData15679");

    metaData15679["simulatedTime"] = date.getTime(); 

  }
});

const __INTERNAL_HELPERS = {
  anyOrderExec: function(event) {
      bthread("AnyOrder-exec", function () {
          sync({
              request: event
          });
      });
  }
};
function RequestAllEvents() {
  if (arguments.length === 0) return;
  let args = Array.prototype.slice.call(arguments);
  if (Array.isArray(arguments[0])) {
      args = arguments[0];
      if (args.length === 0) return;
  }
  for (let idx in args) {
      __INTERNAL_HELPERS.anyOrderExec(args[idx]);
  }

  waitForAll(args);
}



function waitForAll() {
  if (arguments.length === 0) return;
  let waitedFor = Array.prototype.slice.call(arguments);
  if (waitedFor.length === 0) return;
  if (Array.isArray(arguments[0])) {
      waitedFor = arguments[0].slice();
  }

  let e = null;
  let wfe = null;
  while (waitedFor.length > 0) {
      // e = waitFor(bp.eventSets.all);
      e = sync({waitFor: bp.eventSets.all});
      wfe = null;
      for (let idx = waitedFor.length - 1; idx >= 0; idx--) {
          wfe = waitedFor[idx];
          if (wfe.contains(e)) {
              waitedFor.splice(idx, 1);
          }
          wfe = null;
      }
      if (waitedFor.length === 0) {
          return e;
      }
      e = null;
      wfe = null;
  }
}

bthread("Handle UI Delays", function () {
  let event = null;
  let events = sync({waitFor: anyEventNameWithData("UI_Init")});
  //Events.data is a string, splited by commas we need a list
  bp.log.info("Sleeping after events: " + events.data);
  let eventNames = events.data.split(",");
  let eventsToWaitFor = EventSet("UI_Related_Events", function (e) {
    return eventNames.includes(e.name);
  });
  while (true) {
    event = sync({waitFor: eventsToWaitFor});
    //Now wait for 0.5 seconds using JAVA
    java.lang.Thread.sleep(500);

  }
});

