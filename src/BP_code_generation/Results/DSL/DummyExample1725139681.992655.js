/*
There is a smart light bulb(which can be on and off)
*/
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        #room {
            width: 400px;
            height: 400px;
            border: 1px solid black;
            position: relative;
        }
        .lightbulb {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            position: absolute;
        }
        .off {
            background-color: gray;
        }
        .on {
            background-color: yellow;
        }
        .person {
            width: 40px;
            height: 40px;
            background-color: blue;
            position: absolute;
        }
        #lock_button {
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div id="room">
        <div id="smartLightBulb1" class="lightbulb off" style="top: 20px; left: 20px;"></div>
        <div id="person" class="person" style="top: 180px; left: 180px;"></div>
    </div>
    <button id="lock_button">Lock House</button>

    <script>
        let socket = new WebSocket('ws://localhost:8001');

        socket.onmessage = function(eventMessage) {
            var event = JSON.parse(eventMessage.data);
            
            if (event.name === 'turnOnLightEvent') {
                document.getElementById(event.data.lightId).classList.remove('off');
                document.getElementById(event.data.lightId).classList.add('on');
            }
            
            if (event.name === 'turnOffLightEvent') {
                document.getElementById(event.data.lightId).classList.remove('on');
                document.getElementById(event.data.lightId).classList.add('off');
            }
            
            if (event.name === 'userNotifiedEvent') {
                alert("User notfied");
            }
        };

        document.getElementById('lock_button').addEventListener('click', function() {
            var lockEvent = {
                name: 'lockHouseEvent'
            };
            socket.send(JSON.stringify(lockEvent));
        });

        document.addEventListener('keydown', function(event) {
            var person = document.getElementById('person');
            var top = parseInt(person.style.top, 10);
            var left = parseInt(person.style.left, 10);

            if (event.key === 'ArrowUp') {
                person.style.top = (top - 10) + 'px';
            } else if (event.key === 'ArrowDown') {
                person.style.top = (top + 10) + 'px';
            } else if (event.key === 'ArrowLeft') {
                person.style.left = (left - 10) + 'px';
            } else if (event.key === 'ArrowRight') {
                person.style.left = (left + 10) + 'px';
            }

            var motionDetectedEvent = {
                name: 'motionDetectedEvent'
            };
            socket.send(JSON.stringify(motionDetectedEvent));
        });
    </script>
</body>
</html>
/*
Needed queries:
 1. light
 2. light On
*/
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        #room {
            width: 400px;
            height: 400px;
            border: 1px solid black;
            position: relative;
        }
        .lightbulb {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            position: absolute;
        }
        .off {
            background-color: gray;
        }
        .on {
            background-color: yellow;
        }
        .person {
            width: 40px;
            height: 40px;
            background-color: blue;
            position: absolute;
        }
        #lock_button {
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div id="room">
        <div id="smartLightBulb1" class="lightbulb off" style="top: 20px; left: 20px;"></div>
        <div id="person" class="person" style="top: 180px; left: 180px;"></div>
    </div>
    <button id="lock_button">Lock House</button>

    <script>
        let socket = new WebSocket('ws://localhost:8001');

        socket.onmessage = function(eventMessage) {
            var event = JSON.parse(eventMessage.data);
            
            if (event.name === 'turnOnLightEvent') {
                document.getElementById(event.data.lightId).classList.remove('off');
                document.getElementById(event.data.lightId).classList.add('on');
            }
            
            if (event.name === 'turnOffLightEvent') {
                document.getElementById(event.data.lightId).classList.remove('on');
                document.getElementById(event.data.lightId).classList.add('off');
            }
            
            if (event.name === 'userNotifiedEvent') {
                alert("User notfied");
            }
        };

        document.getElementById('lock_button').addEventListener('click', function() {
            var lockEvent = {
                name: 'lockHouseEvent'
            };
            socket.send(JSON.stringify(lockEvent));
        });

        document.addEventListener('keydown', function(event) {
            var person = document.getElementById('person');
            var top = parseInt(person.style.top, 10);
            var left = parseInt(person.style.left, 10);

            if (event.key === 'ArrowUp') {
                person.style.top = (top - 10) + 'px';
            } else if (event.key === 'ArrowDown') {
                person.style.top = (top + 10) + 'px';
            } else if (event.key === 'ArrowLeft') {
                person.style.left = (left - 10) + 'px';
            } else if (event.key === 'ArrowRight') {
                person.style.left = (left + 10) + 'px';
            }

            var motionDetectedEvent = {
                name: 'motionDetectedEvent'
            };
            socket.send(JSON.stringify(motionDetectedEvent));
        });
    </script>
</body>
</html>
/*
When motion is detected, the light bulb turns on
*/
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        #room {
            width: 400px;
            height: 400px;
            border: 1px solid black;
            position: relative;
        }
        .lightbulb {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            position: absolute;
        }
        .off {
            background-color: gray;
        }
        .on {
            background-color: yellow;
        }
        .person {
            width: 40px;
            height: 40px;
            background-color: blue;
            position: absolute;
        }
        #lock_button {
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div id="room">
        <div id="smartLightBulb1" class="lightbulb off" style="top: 20px; left: 20px;"></div>
        <div id="person" class="person" style="top: 180px; left: 180px;"></div>
    </div>
    <button id="lock_button">Lock House</button>

    <script>
        let socket = new WebSocket('ws://localhost:8001');

        socket.onmessage = function(eventMessage) {
            var event = JSON.parse(eventMessage.data);
            
            if (event.name === 'turnOnLightEvent') {
                document.getElementById(event.data.lightId).classList.remove('off');
                document.getElementById(event.data.lightId).classList.add('on');
            }
            
            if (event.name === 'turnOffLightEvent') {
                document.getElementById(event.data.lightId).classList.remove('on');
                document.getElementById(event.data.lightId).classList.add('off');
            }
            
            if (event.name === 'userNotifiedEvent') {
                alert("User notfied");
            }
        };

        document.getElementById('lock_button').addEventListener('click', function() {
            var lockEvent = {
                name: 'lockHouseEvent'
            };
            socket.send(JSON.stringify(lockEvent));
        });

        document.addEventListener('keydown', function(event) {
            var person = document.getElementById('person');
            var top = parseInt(person.style.top, 10);
            var left = parseInt(person.style.left, 10);

            if (event.key === 'ArrowUp') {
                person.style.top = (top - 10) + 'px';
            } else if (event.key === 'ArrowDown') {
                person.style.top = (top + 10) + 'px';
            } else if (event.key === 'ArrowLeft') {
                person.style.left = (left - 10) + 'px';
            } else if (event.key === 'ArrowRight') {
                person.style.left = (left + 10) + 'px';
            }

            var motionDetectedEvent = {
                name: 'motionDetectedEvent'
            };
            socket.send(JSON.stringify(motionDetectedEvent));
        });
    </script>
</body>
</html>
/*
While the light bulb is on, the house cant be exited
*/
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        #room {
            width: 400px;
            height: 400px;
            border: 1px solid black;
            position: relative;
        }
        .lightbulb {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            position: absolute;
        }
        .off {
            background-color: gray;
        }
        .on {
            background-color: yellow;
        }
        .person {
            width: 40px;
            height: 40px;
            background-color: blue;
            position: absolute;
        }
        #lock_button {
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div id="room">
        <div id="smartLightBulb1" class="lightbulb off" style="top: 20px; left: 20px;"></div>
        <div id="person" class="person" style="top: 180px; left: 180px;"></div>
    </div>
    <button id="lock_button">Lock House</button>

    <script>
        let socket = new WebSocket('ws://localhost:8001');

        socket.onmessage = function(eventMessage) {
            var event = JSON.parse(eventMessage.data);
            
            if (event.name === 'turnOnLightEvent') {
                document.getElementById(event.data.lightId).classList.remove('off');
                document.getElementById(event.data.lightId).classList.add('on');
            }
            
            if (event.name === 'turnOffLightEvent') {
                document.getElementById(event.data.lightId).classList.remove('on');
                document.getElementById(event.data.lightId).classList.add('off');
            }
            
            if (event.name === 'userNotifiedEvent') {
                alert("User notfied");
            }
        };

        document.getElementById('lock_button').addEventListener('click', function() {
            var lockEvent = {
                name: 'lockHouseEvent'
            };
            socket.send(JSON.stringify(lockEvent));
        });

        document.addEventListener('keydown', function(event) {
            var person = document.getElementById('person');
            var top = parseInt(person.style.top, 10);
            var left = parseInt(person.style.left, 10);

            if (event.key === 'ArrowUp') {
                person.style.top = (top - 10) + 'px';
            } else if (event.key === 'ArrowDown') {
                person.style.top = (top + 10) + 'px';
            } else if (event.key === 'ArrowLeft') {
                person.style.left = (left - 10) + 'px';
            } else if (event.key === 'ArrowRight') {
                person.style.left = (left + 10) + 'px';
            }

            var motionDetectedEvent = {
                name: 'motionDetectedEvent'
            };
            socket.send(JSON.stringify(motionDetectedEvent));
        });
    </script>
</body>
</html>
/*
Light bulb turns off after 5 minutes
*/
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        #room {
            width: 400px;
            height: 400px;
            border: 1px solid black;
            position: relative;
        }
        .lightbulb {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            position: absolute;
        }
        .off {
            background-color: gray;
        }
        .on {
            background-color: yellow;
        }
        .person {
            width: 40px;
            height: 40px;
            background-color: blue;
            position: absolute;
        }
        #lock_button {
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div id="room">
        <div id="smartLightBulb1" class="lightbulb off" style="top: 20px; left: 20px;"></div>
        <div id="person" class="person" style="top: 180px; left: 180px;"></div>
    </div>
    <button id="lock_button">Lock House</button>

    <script>
        let socket = new WebSocket('ws://localhost:8001');

        socket.onmessage = function(eventMessage) {
            var event = JSON.parse(eventMessage.data);
            
            if (event.name === 'turnOnLightEvent') {
                document.getElementById(event.data.lightId).classList.remove('off');
                document.getElementById(event.data.lightId).classList.add('on');
            }
            
            if (event.name === 'turnOffLightEvent') {
                document.getElementById(event.data.lightId).classList.remove('on');
                document.getElementById(event.data.lightId).classList.add('off');
            }
            
            if (event.name === 'userNotifiedEvent') {
                alert("User notfied");
            }
        };

        document.getElementById('lock_button').addEventListener('click', function() {
            var lockEvent = {
                name: 'lockHouseEvent'
            };
            socket.send(JSON.stringify(lockEvent));
        });

        document.addEventListener('keydown', function(event) {
            var person = document.getElementById('person');
            var top = parseInt(person.style.top, 10);
            var left = parseInt(person.style.left, 10);

            if (event.key === 'ArrowUp') {
                person.style.top = (top - 10) + 'px';
            } else if (event.key === 'ArrowDown') {
                person.style.top = (top + 10) + 'px';
            } else if (event.key === 'ArrowLeft') {
                person.style.left = (left - 10) + 'px';
            } else if (event.key === 'ArrowRight') {
                person.style.left = (left + 10) + 'px';
            }

            var motionDetectedEvent = {
                name: 'motionDetectedEvent'
            };
            socket.send(JSON.stringify(motionDetectedEvent));
        });
    </script>
</body>
</html>
/*
When user locks the house, The light bulb turns off and the user is notified
*/
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        #room {
            width: 400px;
            height: 400px;
            border: 1px solid black;
            position: relative;
        }
        .lightbulb {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            position: absolute;
        }
        .off {
            background-color: gray;
        }
        .on {
            background-color: yellow;
        }
        .person {
            width: 40px;
            height: 40px;
            background-color: blue;
            position: absolute;
        }
        #lock_button {
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div id="room">
        <div id="smartLightBulb1" class="lightbulb off" style="top: 20px; left: 20px;"></div>
        <div id="person" class="person" style="top: 180px; left: 180px;"></div>
    </div>
    <button id="lock_button">Lock House</button>

    <script>
        let socket = new WebSocket('ws://localhost:8001');

        socket.onmessage = function(eventMessage) {
            var event = JSON.parse(eventMessage.data);
            
            if (event.name === 'turnOnLightEvent') {
                document.getElementById(event.data.lightId).classList.remove('off');
                document.getElementById(event.data.lightId).classList.add('on');
            }
            
            if (event.name === 'turnOffLightEvent') {
                document.getElementById(event.data.lightId).classList.remove('on');
                document.getElementById(event.data.lightId).classList.add('off');
            }
            
            if (event.name === 'userNotifiedEvent') {
                alert("User notfied");
            }
        };

        document.getElementById('lock_button').addEventListener('click', function() {
            var lockEvent = {
                name: 'lockHouseEvent'
            };
            socket.send(JSON.stringify(lockEvent));
        });

        document.addEventListener('keydown', function(event) {
            var person = document.getElementById('person');
            var top = parseInt(person.style.top, 10);
            var left = parseInt(person.style.left, 10);

            if (event.key === 'ArrowUp') {
                person.style.top = (top - 10) + 'px';
            } else if (event.key === 'ArrowDown') {
                person.style.top = (top + 10) + 'px';
            } else if (event.key === 'ArrowLeft') {
                person.style.left = (left - 10) + 'px';
            } else if (event.key === 'ArrowRight') {
                person.style.left = (left + 10) + 'px';
            }

            var motionDetectedEvent = {
                name: 'motionDetectedEvent'
            };
            socket.send(JSON.stringify(motionDetectedEvent));
        });
    </script>
</body>
</html>
