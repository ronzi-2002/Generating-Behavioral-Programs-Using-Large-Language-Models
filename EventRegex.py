import re

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

# Test case
test_string = '''
function myFunction(param1, param2) {
    return Event(eventName);
}

function anotherFunction(p1) {
    return Event(someEvent, {parameter1: "value1", parameter2: "value2"});
}

function pourHotWaterEvent(roomId) {
    return Event("pourHotWaterEvent", {roomId: roomId});
}

'''

matches = regex.finditer(test_string)

for match in matches:
    print (match.group())
    print(f"Function Name: {match.group('funName')}")
    print(f"Parameters: {match.group('Parameters')}")
    print(f"Event Name: {match.group('eventName')}")
    print(f"Extra Params: {match.group('extraParams')}")
    print('-' * 40)

