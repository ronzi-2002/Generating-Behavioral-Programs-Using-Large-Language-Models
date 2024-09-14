package il.ac.bgu.cs.bp.samplebpproject.UIs;


import il.ac.bgu.cs.bp.bpjs.analysis.DfsBProgramVerifier;
import il.ac.bgu.cs.bp.bpjs.analysis.listeners.PrintDfsVerifierListener;
import il.ac.bgu.cs.bp.bpjs.context.ContextBProgram;
import il.ac.bgu.cs.bp.bpjs.execution.BProgramRunner;
import il.ac.bgu.cs.bp.bpjs.execution.listeners.PrintBProgramRunnerListener;
import il.ac.bgu.cs.bp.bpjs.model.BProgram;
import il.ac.bgu.cs.bp.bpjs.model.eventselection.PrioritizedBSyncEventSelectionStrategy;
import il.ac.bgu.cs.bp.statespacemapper.SpaceMapperCliRunner;
import il.ac.bgu.cs.bp.statespacemapper.StateSpaceMapper;
import il.ac.bgu.cs.bp.statespacemapper.jgrapht.exports.DotExporter;
import il.ac.bgu.cs.bp.statespacemapper.jgrapht.exports.Exporter;
import org.jgrapht.nio.DefaultAttribute;

import java.io.IOException;
import java.text.MessageFormat;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class GraphGenerator extends SpaceMapperCliRunner {
    public static void main(String[] args) throws Exception {
        var main = new GraphGenerator();
        BProgram bprog;
        String name;
        // Optional<SampleDomain> sampleDomain = Optional.empty();
        System.out.println("// start");

        // load a bprogram of a sample domain
    /*sampleDomain = Optional.of(SampleDomain.HotCold);
    bprog = loadSampleDomain(sampleDomain.get());
    name = sampleDomain.get().name;*/

        // alternatively, load a bprogram from resources
//        var resources = args.length == 0 ? new String[]{"person_game_codex_bp.js"} : args;
//        var resources = args.length == 0 ? new String[]{"HelloBPjsWorld.js"} : args;
//        var resources = args.length == 0 ? new String[]{"Space Fraction game.js"} : args;
//        var resources = args.length == 0 ? new String[]{"coffeeMachineVer10.js"} : args;
//        var resources = args.length == 0 ? new String[]{"Space Fraction Article Graph.js"} : args;
        var resources = args.length == 0 ? new String[]{"smartHouse_Paper.js", "HandleExternalEvents.js"} : args;
//        var resources = args.length == 0 ? new String[]{"Examples For Article.js"} : args;
//    var resources = args.length == 0 ? new String[]{"HotCold/bl.js","HotCold/dal.js"} : args;

        bprog = new ContextBProgram(resources);
        name = bprog.getName();
        // You can use a different EventSelectionStrategy, for example:
        var prioirty = new PrioritizedBSyncEventSelectionStrategy();
        prioirty.setDefaultPriority(0);
        bprog.setEventSelectionStrategy(prioirty);

        // run the program:
//    main.runProgram(bprog, sampleDomain);

        // verify the program:
//    main.verifyProgram(bprog, sampleDomain);

        // map the state space of the program:
        var mapper = new StateSpaceMapper(bprog, name);
//        mapper.setMaxTraceLength(6);


        var res = mapper.mapSpace();
        mapper.setAttributeProviderSetter(exp -> {
            exp.setVerbose(true);
            var provider = exp.getVertexAttributeProvider();
            var edgeProvider = exp.getEdgeAttributeProvider();
            if (exp instanceof DotExporter) {
                exp.setEdgeAttributeProvider(e -> {
                    var map = edgeProvider.apply(e);
//                    map.put("label", DefaultAttribute.createAttribute(extractPlayerAndCell(e.getEvent().toString())));//FOR TTT
//                    map.put("label", DefaultAttribute.createAttribute(extractEventAndData(e.getEvent().toString())));
//                    map.put("label", DefaultAttribute.createAttribute(extractEdgeDataForSpaceFractionGame(extractEventAndData(e.getEvent().toString()))));
                    map.put("label", DefaultAttribute.createAttribute(extractEventAndData(e.getEvent().toString()).replace("JS_Obj", "")));
                    return map;
                });
                exp.setVertexAttributeProvider(v -> {
                    var map = provider.apply(v);
                    map.put("shape", DefaultAttribute.createAttribute("box"));
                    map.remove("bthreads");
                   map.remove("statements");
                    map.put("label", DefaultAttribute.createAttribute(exp.getSanitizerProvider().apply(exp.getStore(v.bpss))));
                    var store = DefaultAttribute.createAttribute(exp.getSanitizerProvider().apply(exp.getStore(v.bpss)));
                    String storeString = store.toString();

//                      storeString=forTTT(storeString);

                    map.put("label", DefaultAttribute.createAttribute(extractMetaData(storeString)));//For store


//                    System.out.println(storeString);
                    return map;
                });

            }
        });
        Exporter exp = new DotExporter(res);


    /*var provider = exp.getVertexAttributeProvider();
    exp.setVertexAttributeProvider(v -> {
      var map = provider.apply(v);
      map.putAll(Map.of(
              "store", DefaultAttribute.createAttribute(exp.getSanitizerProvider().apply(exp.getStore(v.bpss))),
              ));
    });*/

        // write the graph to files:
        mapper.exportSpace(exp);

        // Generates a compressed file with all possible paths. Could be huge.
//    mapper.writeCompressedPaths(name + ".csv", null, map, "exports");

        System.out.println("// done");
    }

    public static String extractEdgeDataForSpaceFractionGame(String input) {
        return input.replace("{JS_Obj gameId:\"game1\",", "").replace("}", "").replace(".0", "");
    }

    public static String extractEventAndData(String input) {


        // Define the regex pattern
        String pattern = "\\[BEvent name:(.*?) data:(.*?)\\]";

        // Create a Pattern object
        Pattern regexPattern = Pattern.compile(pattern);

        // Create a Matcher object
        Matcher matcher = regexPattern.matcher(input);
        if (matcher.find()) {
            // Extract event name and data from the groups
            String eventName = matcher.group(1);
            String eventData = matcher.group(2);

            // Print the results
            return MessageFormat.format("{0}({1})", eventName.replace("Event", ""), eventData);
        } else {
            //maybe there is no data in the event
            // Define the regex pattern
            pattern = "\\[BEvent name:(.*?)\\]";
            regexPattern = Pattern.compile(pattern);
            matcher = regexPattern.matcher(input);
            if (matcher.find()) {
                // Extract event name and data from the groups
                String eventName = matcher.group(1);

                // Print the results
                return MessageFormat.format("{0}()", eventName.replace("Event", ""));
            }
        }
        return "";
    }

    public static String extractMetaData(String input) {


        String pattern = "\\{metaData,(.*?)\\},\\{";

        // Create a Pattern object
        Pattern regexPattern = Pattern.compile(pattern);

        // Create a Matcher object
        Matcher matcher = regexPattern.matcher(input);

        // Find the first match
        if (matcher.find()) {
            // Extract the value of metaData from the first group
            String metaDataValue = matcher.group(1);
            metaDataValue = metaDataValue.replaceAll("(?<=\\d)\\.\\d+", "");


            // Print the result
            return metaDataValue;
        } else {
            return "";
        }
    }


public static String forTTT(String storeString) {
        storeString = storeString.replace("CTX.Entity:", "");
        //remove the content of type:(its value also, its between commas)
        storeString = storeString.replaceAll(" type:.*?,", "").replaceAll("id:.*?,", "");
        //remove [ ] { }
//                    storeString=storeString.replaceAll("[\\[\\]{}]", "");
        //remove the visualBoard: prefix
        storeString = representBoard(storeString);
        return storeString;
    }

    public static String extractPlayerAndCell(String input) {
        // Define the regular expression patterns for different event names
        String markPattern = "\\[BEvent name:mark data:\\{JS_Obj player:\\{JS_Obj id:\"([^\"]*)\"}, cell:\\{JS_Obj i:(\\d+\\.\\d+), j:(\\d+\\.\\d+)}}]";
        String winPattern = "\\[BEvent name:win data:\\{JS_Obj player:\"([^\"]*)\"}]";

        // Create Pattern objects and match them against the input string
        Pattern markRegex = Pattern.compile(markPattern);
        Pattern winRegex = Pattern.compile(winPattern);
        Matcher markMatcher = markRegex.matcher(input);
        Matcher winMatcher = winRegex.matcher(input);

        // Check if the pattern matches the input string
        if (markMatcher.find()) {
            String player = markMatcher.group(1);
            String cell = markMatcher.group(2);

            // Concatenate the player and cell values
            return player + "(" + cell.replace(".", ",") + ")";
        } else if (winMatcher.find()) {
            String player = winMatcher.group(1);

            // Check if the player is "X" and return the corresponding message
            if (player.equals("X")) {
                return player + " won";
            }
            if (player.equals("O")) {
                return player + " won";
            }
        }

        // Return the original string if no match is found or event name is not "win"
        return input;
    }

    public static String representBoard(String storeString) {
        storeString = storeString.replaceAll("visualBoard,", " ");
//                    remove the first [{ and the last }]
        storeString = storeString.substring(3, storeString.length() - 2);
        storeString = storeString.replaceAll("JS_Array ", "");
        String[] result = processElements(extractInnerBrackets(storeString));
//                    for (String element : result) {
//                        System.out.println(element);
//                    }
        storeString = arrayToString(result);
        //remove '
        storeString = storeString.replaceAll("'", "");
        storeString = storeString.replaceAll("\\|", "");


        return storeString;
    }

    public static String[] extractInnerBrackets(String input) {
        List<String> innerBrackets = new ArrayList<>();
        int start = input.indexOf("[");
        int end = input.lastIndexOf("]");
        String innerPart = input.substring(start + 1, end);

        int bracketCount = 0;
        int startIndex = 0;
        for (int i = 0; i < innerPart.length(); i++) {
            char c = innerPart.charAt(i);
            if (c == '[') {
                bracketCount++;
            } else if (c == ']') {
                bracketCount--;
                if (bracketCount == 0) {
                    innerBrackets.add(innerPart.substring(startIndex, i + 1));
                    startIndex = i + 2;
                }
            }
        }

        return innerBrackets.toArray(new String[0]);
    }


public static String[] processElements(String[] elements) {
        List<String> processedElements = new ArrayList<>();
        for (String element : elements) {
            //remove the first | if starts with it:
            if (element.startsWith("| ")) {
                element = element.substring(1);
            }
            //remove all from the shape <number>:
            element = element.replaceAll("\\d:", "");
            //trim the element from both sides:
            //remove [ ]
            element = element.replaceAll("[\\[\\]]", "");
            element = element.trim();
            processedElements.add(element);
        }
        return processedElements.toArray(new String[0]);
    }

    public static String arrayToString(String[] array) {
        StringBuilder sb = new StringBuilder();
//        sb.append("[");
        for (int i = 0; i < array.length; i++) {
            sb.append(array[i]);
            if (i != array.length - 1) {
                sb.append("\n");
            }
        }
//        sb.append("]");
        return sb.toString();
    }

//     private static BProgram loadSampleDomain(SampleDomain domain) {
//         var bprog = new ContextBProgram(domain.getResourcesNames());
//         domain.initializeBProg(bprog);
//         return bprog;
//     }

//     private void verifyProgram(BProgram bprog, Optional<SampleDomain> sampleDomain) {
//         sampleDomain.ifPresent(sample -> {
//             try {
//                 sample.addVerificationResources(bprog);
//             } catch (IOException e) {
//                 throw new RuntimeException(e);
//             }
//         });
//         var vfr = new DfsBProgramVerifier();
//         vfr.setMaxTraceLength(2000);
//         vfr.setProgressListener(new PrintDfsVerifierListener());
//         vfr.setIterationCountGap(100);
// //    vfr.setDebugMode(true);
//         try {
//             var res = vfr.verify(bprog);
//             System.out.println(MessageFormat.format(
//                     "States = {0}\n" +
//                             "Edges = {1}\n" +
//                             "Time = {2}",
//                     res.getScannedStatesCount(), res.getScannedEdgesCount(), res.getTimeMillies()));
//             if (res.isViolationFound())
//                 System.out.println(MessageFormat.format("Found violation: {0}", res.getViolation().get()));
//             else
//                 System.out.println("No violation found");
//         } catch (Exception e) {
//             e.printStackTrace();
//             System.exit(1);
//         }
//     }

//     private static void runProgram(BProgram bprog, Optional<SampleDomain> sampleDomain) {
//         var rnr = new BProgramRunner(bprog);
//         sampleDomain.ifPresentOrElse(
//                 sample -> sample.initializeRunner(rnr), () -> rnr.addListener(new PrintBProgramRunnerListener()));
//         rnr.run();
//     }
}