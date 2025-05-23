events = {
    "selectMathUmbrellaButtonEvent": [],
    "userAnswerEvent": ['questionId', 'selectedOptionIndex'],
    "selectReturnToMainMenuEvent": [],
    "selectExitGameEvent": [],
    "submitNewQuestionEvent": ['questionId', 'content', 'options', 'rightOptionIndex'],
    "userClicksLinkEvent": ['linkUrl']
}
def generate(events, outputFilePath):
    html_template = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Event Selector</title>
        <style>
            .hidden {{
                display: none;
            }}
        </style>
    </head>
    <body>
        <div id="timeDisplay" style="text-align: center; font-size: 1.5em; margin-top: 10px;"></div>

        <h1>Event Selector</h1>
        <label for="eventSelector">Select Event:</label>
        <select id="eventSelector" onchange="updateParameters()">
            <option value="">--Select an Event--</option>
            {event_options}
        </select>

        <div id="parameters" class="hidden">
            <!-- Parameters will be dynamically added here -->
        </div>

        <button id="invokeButton" onclick="invokeEvent()">Invoke</button>
        <p id="resultLabel">Received: </p>
        <label id="statusLabel" style="position: fixed; bottom: 0;">Status: </label>


        <script>
            let socket = new WebSocket('ws://localhost:8001');
            //If connection failed, the server is not running yet. Try again every 1 second for 10 times.
            let connectionAttempts = 0;
            const interval = setInterval(() => {{
                if (socket.readyState === WebSocket.OPEN) {{
                    clearInterval(interval);
                }} else if (connectionAttempts >= 10) {{
                    clearInterval(interval);
                    alert('Failed to connect to the server. Please make sure the server is running.');
                }} else {{
                    connectionAttempts++;
                    socket = new WebSocket('ws://localhost:8001');
                }}
            }}, 1000);
        
            socket.onopen = function() {{
                console.log('WebSocket connection established');
                document.getElementById('statusLabel').innerHTML = 'Status: Connected';

            }};
            socket.onmessage = function(eventMessage) {{
                const event = JSON.parse(eventMessage.data);
                console.log('Received:', event);
                const resultLabel = document.getElementById('resultLabel');
                resultLabel.textContent += JSON.stringify(event) +"\\n";
                if (event.name === 'TimeToBe') {{
                    document.getElementById('timeDisplay').textContent = event.data;
                }}
            }};
            const eventParameters = {event_parameters};

            function updateParameters() {{
                const eventSelector = document.getElementById('eventSelector');
                const selectedEvent = eventSelector.value;
                const parametersDiv = document.getElementById('parameters');
                parametersDiv.innerHTML = '';

                if (eventParameters[selectedEvent]) {{
                    eventParameters[selectedEvent].forEach(param => {{
                        const label = document.createElement('label');
                        label.textContent = param + ": ";
                        const input = document.createElement('input');
                        input.type = 'text';
                        input.id = param;
                        parametersDiv.appendChild(label);
                        parametersDiv.appendChild(input);
                        parametersDiv.appendChild(document.createElement('br'));
                    }});
                    parametersDiv.classList.remove('hidden');
                }} else {{
                    parametersDiv.classList.add('hidden');
                }}
            }}
            
            function invokeEvent() {{
                const eventSelector = document.getElementById('eventSelector');
                const selectedEvent = eventSelector.value;
                if (!selectedEvent) {{
                    alert('Please select an event');
                    return;
                }}

                let params = {{}};
                if (eventParameters[selectedEvent]) {{
                    eventParameters[selectedEvent].forEach(param => {{
                        const value = document.getElementById(param).value;
                        if (!value) {{
                            alert(`Please fill in the parameter: ${{param}}`);
                            return;
                        }}
                        params[param] = value;
                    }});
                }}
                if (Object.keys(params).length === 0) {{
                socket.send(JSON.stringify({{ name: selectedEvent }}));
                console.log(selectedEvent);
                }}
                else{{
                    socket.send(JSON.stringify({{ name: selectedEvent, data: params }}));
                    console.log(`${{selectedEvent}} ${{JSON.stringify(params)}}`);
                }}
                
            }}
            socket.onerror = function(error) {{
            console.error('WebSocket Error: ' + error);
            document.getElementById('statusLabel').innerHTML = 'Status: Error, Try running the BP program again and refresh the page';
            }};

            socket.onclose = function(event) {{
                console.log('WebSocket connection closed');
                document.getElementById('statusLabel').innerHTML = 'Status: Disconnected';
            }};
       
        </script>
    </body>
    </html>
    """

    # Generate the options for the select element
    event_options = ""
    for event in events:
        event_options += f'<option value="{event}">{event}</option>\n'

    # Convert the events dictionary to a JSON-like string for JavaScript
    import json
    event_parameters = json.dumps(events)

    # Insert the dynamic content into the HTML template
    html_content = html_template.format(event_options=event_options, event_parameters=event_parameters)

    # Write the HTML content to a file
    # Ensure the file ex

    with open(outputFilePath, "w") as file:
        file.write(html_content)

    print("HTML file has been created successfully.")
    return outputFilePath


if __name__ == "__main__":
    import os
    file_path =str(os.getcwd()) + "/src/main_client_server_java/src/main/resources/" + "coffeeMachineVer11.js"
    generate(events,outputFilePath=file_path)
    
