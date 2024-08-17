package il.ac.bgu.cs.bp.samplebpproject.UIs;

import il.ac.bgu.cs.bp.bpjs.model.BEvent;
import il.ac.bgu.cs.bp.bpjs.model.BProgram;
import netscape.javascript.JSObject;
import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;

import javax.json.*;
import java.io.InputStream;
import java.io.StringReader;
import java.net.InetSocketAddress;
import java.util.*;

import javax.json.Json;
import javax.script.Invocable;
import javax.script.ScriptContext;
import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.HashMap;


public class Server {
    private WebSocketServer webSocketServer;
    private Set<WebSocket> connections = Collections.synchronizedSet(new HashSet<>());

    public Server(BProgram bProgram) {
        ScriptEngineManager manager = new ScriptEngineManager();
        ScriptEngine engine = manager.getEngineByName("JavaScript");
        webSocketServer = new WebSocketServer(new InetSocketAddress(8001)) {
            @Override
            public void onOpen(WebSocket conn, ClientHandshake handshake) {
                connections.add(conn);
            }

            @Override
            public void onClose(WebSocket conn, int code, String reason, boolean remote) {
                connections.remove(conn);
            }

            @Override
            public void onMessage(WebSocket conn, String message) {
                // Convert the message string to a JSON object
                System.out.println("Received message: " + message);
                JsonObject json;
                try (JsonReader reader = Json.createReader(new StringReader(message))) {
                    json = reader.readObject();
                } catch (Exception e) {
                    e.printStackTrace();
                    System.out.println("Invalid JSON: " + message);
                    return;
                }

//                BEvent bpEvent = jsonToBEvent(json);
                // BEvent bpEvent = new BEvent("ExternalEvent", json);
                // bProgram.enqueueExternalEvent(bpEvent);
                
                // read script file
                try {
//                engine.eval(Files.newBufferedReader(Paths.get("C:\\Users\\Ron Ziskind\\IdeaProjects\\StateMapperForBpRon\\src\\main\\resources\\HandleExternalEvents.js"), StandardCharsets.UTF_8));
                    engine.eval("function jsonize(event) {print (event);let obj = JSON.parse(event);return obj;}");

                    Invocable inv = (Invocable) engine;
                    // call function from script file
                    Object result = inv.invokeFunction("jsonize", json.get("data"));
                    System.out.println(result);
                    bProgram.enqueueExternalEvent(new BEvent(json.getString("name"), result));
                }
                catch (Exception e)
                {
                    System.out.println(e);
                }
            }

            @Override
            public void onError(WebSocket conn, Exception ex) {
                ex.printStackTrace();
            }

            @Override
            public void onStart() {
                System.out.println("WebSocket Server started!");
            }
        };
        webSocketServer.start();
    }

    public void sendMessage(String message) {
        for (WebSocket conn : connections) {
            conn.send(message);
        }
    }


    // Helper method to parse JSON from input stream
    private static JsonObject parseJson(InputStream is) {
        try (JsonReader reader = Json.createReader(is)) {
            return reader.readObject();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
    private BEvent jsonToBEvent(JsonObject json){
        //if data is not provided, return an empty string
        if (!json.containsKey("data")) {
            return new BEvent(json.getString("name"));
        }
        //if data is an object, return the object
        //The json file is of the form {"name": "event_name", "data": {"key1": "value1", "key2": "value2", ...}}
        if (json.get("data") instanceof JsonObject) {
            return new BEvent(json.getString("name"), (json.getJsonObject("data")));
//            return new BEvent(json.getString("name"), JmapToJS_Object(json.getJsonObject("data")));
        }
        //TODO value might be a string, number, or boolean
        return new BEvent(json.getString("name"), json.getString("data"));
    }

    private Object JmapToJS_Object(JsonObject jMap){
        //given a Jmap ({J_Map gameId->"game1",buttonType->"startGame"})  return a JS_Object ({gameId:"game1",buttonType:"startGame"})

        StringBuilder jsObject = new StringBuilder("{");

        for (Map.Entry<String, JsonValue> entry : jMap.entrySet()) {
            jsObject.append(entry.getKey())
                    .append(":\"")
                    .append(entry.getValue().toString())
                    .append("\",");
        }

        // Remove the trailing comma
        if (jsObject.length() > 1) {
            jsObject.setLength(jsObject.length() - 1);
        }

        jsObject.append("}");
        return jsObject.toString();

    }
    public String bEventToJson(BEvent bpEvent) {
        if (bpEvent.maybeData == null) {
            JsonObject json = Json.createObjectBuilder()
                    .add("name", bpEvent.name)
                    .build();
            return json.toString();
        }
        //if data is primitive, return the data
        if (bpEvent.maybeData instanceof String) {
            JsonObject json = Json.createObjectBuilder()
                    .add("name", bpEvent.name)
                    .add("data", (String) bpEvent.maybeData)
                    .build();
            return json.toString();
        }
        if (bpEvent.maybeData instanceof Number) {
            JsonObject json = Json.createObjectBuilder()
                    .add("name", bpEvent.name)
                    .add("data", (Integer) bpEvent.maybeData)
                    .build();
            return json.toString();
        }
        if (bpEvent.maybeData instanceof Boolean) {
            JsonObject json = Json.createObjectBuilder()
                    .add("name", bpEvent.name)
                    .add("data", (Boolean) bpEvent.maybeData)
                    .build();
            return json.toString();
        }
        //if data is an object, return the object
        JsonObjectBuilder jsonObjectBuilder = Json.createObjectBuilder();
        for (Map.Entry<String, Object> entry : ((Map<String,Object> )bpEvent.maybeData).entrySet()) {
            Object value = entry.getValue();
            if (value instanceof String) {
                jsonObjectBuilder.add(entry.getKey(), (String) value);
            } else if (value instanceof Integer) {
                jsonObjectBuilder.add(entry.getKey(), (Integer) value);
            } else if (value instanceof Boolean) {
                jsonObjectBuilder.add(entry.getKey(), (Boolean) value);
            } else {
                if(value != null)
                    jsonObjectBuilder.add(entry.getKey(), value.toString());
            }
//            else {
//                // Handle other data types if necessary
//                throw new IllegalArgumentException("Unsupported data type: " + value.getClass());
//            }
        }
        JsonObject jsonObject = jsonObjectBuilder.build();

        // Convert JsonObject to JSON string
        String jsonString = jsonObject.toString();
        JsonObject json = Json.createObjectBuilder()
                .add("name", bpEvent.name)
                .add("data", jsonObject)
                .build();
        return json.toString();


    }
}