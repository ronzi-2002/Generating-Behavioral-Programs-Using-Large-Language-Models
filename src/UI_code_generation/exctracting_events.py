import re
import json
def extract_Queries(file_path= None, code=None):
    #Queries are declared in the form of ctx.registerQuery('light', entity => entity.type == 'lightBulb');
    queries = []
    query_regex = re.compile(r'ctx.registerQuery\("([^"]+)"(?:, *{([^}]*)})?\)')
    if file_path:
        with open(file_path, 'r') as file:
            code = file.read()
    for line in code.splitlines():
        match = query_regex.search(line)
        if match:
            query_name = match.group(1)
            queries.append({query_name})
    query_names = re.findall(r"ctx\.registerQuery\('([^']+)'", code)

    return query_names

def extract_events(file_path= None, code=None):
    events = []
    
    # Regular expressions to match events
    event_regex = re.compile(r'Event\("([^"]+)"(?:, *{([^}]*)})?\)')
    request_regex = re.compile(r'sync\(\{request:\s*\[([^\]]+)\]\}\)')
    wait_for_regex = re.compile(r'sync\(\{waitFor:\s*\[([^\]]+)\]\}\)')
    any_event_with_data_regex = re.compile(r'anyEventNameWithData\("([^"]+)"(?:, *{([^}]*)})?\)')
    #requested events might be in the form of RequestAllEvents([EventA(),EventB()])
    request_all_events_regex = re.compile(r'RequestAllEvents\(\[([^\]]+)\]\)')
    #request_regex is or of request_all_events_regex and request_regex
    # request_regex = re.compile(r'sync\(\{request:\s*\[([^\]]+)\]\}\)|RequestAllEvents\(\[([^\]]+)\]\)')

    if file_path:
        with open(file_path, 'r') as file:
            code = file.read()
    
    # Find all events
    for line in code.splitlines():
        match = event_regex.search(line)
        if match:
            event_name = match.group(1)
            parameters = match.group(2)
            param_dict = {}
            if parameters:
                # Split parameters and convert them to a dictionary
                params = parameters.split(',')
                for param in params:
                    key, value = param.split(':')
                    param_dict[key.strip()] = value.strip()
            events.append({'EventName': event_name, 'parameters': param_dict, 'requested': False, 'waitedFor': False})

    # Find all requested events
    for request_match in request_regex.findall(code):
        #EventA() -> EventA
        requestedEvents = request_match.split(',')#if 2 were requested, then requestedEvents = ['EventA()', 'EventB()']
        # for event_match in event_regex.findall(request_match):
        #     event_name = event_match[0]
        for event_name in requestedEvents:
            event_name = event_name.split('(')[0].strip()
            for event in events:
                if event['EventName'] == event_name:
                    event['requested'] = True

    # Find all waitedFor events
    for wait_for_match in wait_for_regex.findall(code):
        waitedEvents = wait_for_match.split(',')
        # for event_match in event_regex.findall(wait_for_match):
        #     event_name = event_match[0]
        for event_name in waitedEvents:
            event_name = event_name.split('(')[0].strip()
            for event in events:
                if event['EventName'] == event_name:
                    event['waitedFor'] = True
                    break

    # Find all waitedFor anyEventNameWithData events
    for match in any_event_with_data_regex.findall(code):
        event_name = match[0]
        for event in events:
            if event['EventName'] == event_name:
                event['waitedFor'] = True

    # Find all requested events using RequestAllEvents
    for request_match in request_all_events_regex.findall(code):
        #EventA() -> EventA
        requestedEvents = request_match.split(',')#if 2 were requested, then requestedEvents = ['EventA()', 'EventB()']
        # for event_match in event_regex.findall(request_match):
        #     event_name = event_match[0]
        for event_name in requestedEvents:
            event_name = event_name.split('(')[0].strip()
            for event in events:
                if event['EventName'] == event_name:
                    event['requested'] = True
    return events


def get_division_by_status(events):
    waitedEvents = []
    requestedEvents = []
    requestedAndWaitedEvents = []
    for event in events:
        if event['waitedFor'] and event['requested']:
            requestedAndWaitedEvents.append(event)
        elif event['waitedFor']:
            waitedEvents.append(event)
        elif event['requested']:
            requestedEvents.append(event)
    return waitedEvents, requestedEvents, requestedAndWaitedEvents
# Example usage
def extract_constructor_functionAndEvents(file_path= None, code=None):
    pattern = r"""
    function\s+         # 'function' keyword followed by one or more spaces
    (?P<funName>\w+)\s* # Function name (captured as 'funName'), followed by optional spaces
    \(\s*               # Opening parenthesis with optional spaces
    (?P<Parameters>[^)]*)\s*  # Capture parameters inside parentheses (captured as 'Parameters')
    \)\s*\{             # Closing parenthesis, optional spaces, and opening curly brace
    \s*return\s+        # 'return' keyword followed by one or more spaces
    Event\s*\(\s*"      # 'Event("' with optional spaces and a double quote
    (?P<eventName>\w+)\s*"  # Event name inside double quotes (captured as 'eventName')
    (?:,\s*\{(?P<extraParams>.*?)\})?\s* # Optional parameters inside the curly braces (captured as 'extraParams')
    \)\s*;              # Closing parenthesis and semicolon
    \s*\}               # Closing curly brace
    """
    
    regex = re.compile(pattern, re.VERBOSE)

    if file_path:
        with open(file_path, 'r') as file:
            code = file.read()


    matches = regex.finditer(code)
    events = []
    for match in matches:
        # print (match.group())
        # print(f"Function Name: {match.group('funName')}")
        # print(f"Parameters: {match.group('Parameters')}")
        # print(f"Event Name: {match.group('eventName')}")
        # print(f"Extra Params: {match.group('extraParams')}")
        # print('-' * 40)
        events.append({
            'FunctionName': match.group('funName'),
            'Parameters': match.group('Parameters'),
            'EventName': match.group('eventName'),
            'ExtraParams': match.group('extraParams'),
            'FullMatch': match.group()
        })

    return events
if __name__ == "__main__":

    # os.getcwd() + "/src/main/BotInstructions/v_13/Entity Bot Instructions"
    file_path = 'src\main\BotInstructions\\v_13\Results\space_fraction.js'
    # file_path = 'EventsTemplate.js'
    file_path =file_path.replace('\\', '/')

    text = """
    ctx.registerQuery('light', entity => entity.type == 'lightBulb');
    ctx.registerQuery('lightOn', entity => entity.type == 'lightBulb' && entity.status == 'on');
    function EventA(door) {
        return Event("EventA", {door: door});
    }
    function motionDetectedEvent() {
    return Event("motionDetectedEvent");
    }   
    function turnOnLightEvent(lightBulbId) {
    return Event("turnOnLightEvent", {lightBulbId: lightBulbId});
}

    """
    # print(extract_Queries(code=text))
    # print(extract_events(code=text))
    # events = extract_events(code=  text)
    # print([','.join(list(event['parameters'].keys())) for event in events])
    file_path = "C:/Users/Ron Ziskind/Desktop/thesis/Generating-Behavioral-Programs-Using-Large-Language-Models/src/BP_code_generation/Results/DSL/DummyExample1724348711.6088707.js"
    events = extract_events(file_path=file_path)
    print(json.dumps(events, indent=4))



    # events = extract_events(file_path)
    # print(json.dumps(events, indent=4))
    # #given the events array, create three arrays, one for only waited events, one for only requested events, and one for both requested and waited events.
    # waitedEvents, requestedEvents, requestedAndWaitedEvents = get_division_by_status(events)
    # #print all waited events
    # print("Waited events:")
    # for event in waitedEvents:
    #     print(event['EventName'], event['parameters'])

    # print("\n\n")
    # #print all requested events
    # print("Requested events:")
    # for event in requestedEvents:
    #     print(event['EventName'], event['parameters'])

    # print("\n\n")
    # #print all requested and waited events
    # print("Requested and waited events:")
    # for event in requestedAndWaitedEvents:
    #     print(event['EventName'], event['parameters'])

    # print("\n\n")
    # #print all events and their parameters
    # print("All events:")
    # for event in events:
    #     print(event['EventName'], event['parameters'])