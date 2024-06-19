//Handle external events
ctx.bthread('Handle external events', function () {
  let event = null;
  while (true) {
    event = sync({waitFor: bp.all});
    if (event.name === 'ExternalEvent') {
      //The event is external, it is a json object with the following structures: name and data, trigger the event
      bp.log.setLevel("Fine");
      bp.log.info("External event received: " + event.data);
      let obj = JSON.parse(event.data);
      let eventName = obj.name;
      if(eventName === "getEntityByIdEvent")
      {
        let obj = JSON.parse(event.data);
        let entityId = obj.data.entityId;
        let requestId = obj.data.requestId;
        let entity = ctx.getEntityById(entityId);
        sync({request: [Event("getEntityByIdEventResponse", {entity: JSON.stringify(entity), requestId: requestId})]});
      }
      else {
        let eventData = obj.data;
        if (eventData === undefined) {
          sync({request: [Event(eventName)]});
        } else
          sync({request: [Event(eventName, eventData)]});
      }
    }

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
      // if (!e.data.hasOwnProperty(key)) {
      //   return false;
      // }

      if (e.data[key] !== value) {
        return false;
      }
    }
    return e.name === eventName// && e.data === data;//TODO: check if this is the correct way to compare objects, maybe use JSON.stringify or compare each field
  });
}