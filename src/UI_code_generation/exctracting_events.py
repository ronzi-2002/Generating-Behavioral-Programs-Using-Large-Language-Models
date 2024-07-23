import re
import json

def extract_events(file_path):
    events = []
    
    # Regular expressions to match events
    event_regex = re.compile(r'Event\("([^"]+)"(?:, *{([^}]*)})?\)')
    request_regex = re.compile(r'sync\(\{request:\s*\[([^\]]+)\]\}\)')
    wait_for_regex = re.compile(r'sync\(\{waitFor:\s*\[([^\]]+)\]\}\)')
    any_event_with_data_regex = re.compile(r'anyEventNameWithData\("([^"]+)"(?:, *{([^}]*)})?\)')

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
            requestedEvents = request_match.split(',')
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

    return events

# Example usage



# os.getcwd() + "/src/main/BotInstructions/v_13/Entity Bot Instructions"
file_path = 'src\main\BotInstructions\\v_13\Results\space_fraction.js'
# file_path = 'EventsTemplate.js'
file_path =file_path.replace('\\', '/')
events = extract_events(file_path)
print(json.dumps(events, indent=4))
#given the events array, create three arrays, one for only waited events, one for only requested events, and one for both requested and waited events.
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
#print all waited events
print("Waited events:")
for event in waitedEvents:
    print(event['EventName'], event['parameters'])

print("\n\n")
#print all requested events
print("Requested events:")
for event in requestedEvents:
    print(event['EventName'], event['parameters'])

print("\n\n")
#print all requested and waited events
print("Requested and waited events:")
for event in requestedAndWaitedEvents:
    print(event['EventName'], event['parameters'])

print("\n\n")
#print all events and their parameters
print("All events:")
for event in events:
    print(event['EventName'], event['parameters'])