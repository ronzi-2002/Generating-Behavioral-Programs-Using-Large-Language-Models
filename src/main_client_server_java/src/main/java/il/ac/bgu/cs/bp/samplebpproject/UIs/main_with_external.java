package il.ac.bgu.cs.bp.samplebpproject.UIs;

import il.ac.bgu.cs.bp.bpjs.context.ContextBProgram;
import il.ac.bgu.cs.bp.bpjs.execution.BProgramRunner;
import il.ac.bgu.cs.bp.bpjs.model.BProgram;
import il.ac.bgu.cs.bp.samplebpproject.UIs.Server;
import il.ac.bgu.cs.bp.samplebpproject.UIs.ServerListner;
import il.ac.bgu.cs.bp.bpjs.model.BEvent;

import java.io.IOException;
import java.util.List;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Scanner;

//For updating the time every hour
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Simple class running a BPjs program that selects "hello world" events.
 * @author michael
 */
public class main_with_external{
    static final String spaceFraction = "Space Fraction game V11.js";
    static final String handleExternalEvents = "HandleExternalEvents.js";
    static final String coffeeMachine = "coffeeMachineVer11.js";
    static final String tests = "Testing.js";

    //Optional arguments: 
    //  -f <file1>,<file2>,<file3>... -f is optional, if not given, the user will be asked to enter the names of the files he wants to run.
    //  -s means that a sleep function is used in the BPjs program, and we need to send "MinutePassed" events to the program every minute.
    //  -t means that the program will send a message to the client every hour.(when time(x) is used in the BPjs program)
    //  -speedFactor - the speed factor of the program. The default is 1.
    public static void main(String[] args) throws InterruptedException, IOException {
        List<String> filesList = new ArrayList<>();
        boolean sleep = false;
        boolean time = false;
        boolean files = false;
        long speedingFactor = 1;
        for (int i = 0; i < args.length; i++) {
            if (args[i].equals("-f")) {
                files = true;
                String[] fileNameArray = args[i + 1].split(",");
                filesList.addAll(Arrays.asList(fileNameArray));
            }
            if (args[i].equals("-s")) {
                sleep = true;
            }
            if (args[i].equals("-t")) {
                time = true;
            }
            if (args[i].equals("-speedFactor")) {
                speedingFactor = Long.parseLong(args[i + 1]);
            }
        }     
        final long finalSpeedingFactor = speedingFactor;   
        

        for (int i = 0; i < 1; i++) {


//            String [] files = new String[]{coffeeMachine,handleExternalEvents};
//            String [] files = new String[]{tests};
//            String [] files = new String[]{spaceFraction,handleExternalEvents};
            // String [] files = new String[]{spaceFraction,handleExternalEvents};
            // Create a list of files that the BPjs program will use
            // List<String> filesList = new ArrayList<>();
            filesList.add("HandleExternalEvents.js");
            //If no arguments are given, the user will be asked to enter the names of the files he wants to run.
            if (!files) {
                Scanner scanner = new Scanner(System.in);
                System.out.print("Enter the name of the file(s) you want to run (separated by commas): ");
                String fileNames = scanner.nextLine();
                String[] fileNameArray = fileNames.split(",");
                filesList.addAll(Arrays.asList(fileNameArray));
            } 
            

            




            final BProgram bprog = new ContextBProgram(filesList);

            bprog.setWaitForExternalEvents(true);//We allow external events, for reacting to the incoming events from the client to the server.
            BProgramRunner rnr = new BProgramRunner(bprog);

            Server server = new Server(bprog);//Starting a server(with a websocket) that listens to the incoming events from the client.
            ServerListner sl = new ServerListner(server);
            rnr.addListener(sl);//Listening to server event and sending them to the client

            Thread bpthread = new Thread(new Runnable() {
                @Override
                public void run() {
                    rnr.run();
                }
            });
            bpthread.start();//starting the BPjs program

            if (sleep){
                Thread timedEvents = new Thread(new Runnable() {
                    @Override
                    public void run() {
                        final long sleepingTime = 60000/finalSpeedingFactor;
                        while (true) {
                            try {
                                
                                Thread.sleep(sleepingTime);//sleep for 1 minute
                            } catch (InterruptedException e) {
                                e.printStackTrace();
                            }
                            bprog.enqueueExternalEvent(new BEvent("MinutePassed"));
                        }
                    }
                });
                timedEvents.start();
            }
            if(time){
                System.out.println("Hour now: " + LocalDateTime.now());
                //For updating the time every hour
                //Every time the hour changes, the server will send a message to the client.
                ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);

                Runnable logTask = () -> {
                    LocalDateTime now = LocalDateTime.now();
                    System.out.println("Hour changed: " + now);
                    bprog.enqueueExternalEvent(new BEvent("Hour Changed", now.getHour()));
                };

                long initialDelay = (computeInitialDelay())/finalSpeedingFactor; // initial delay of 1 hour
                long period = 1*3600/finalSpeedingFactor; // period of 1 hour in seconds
                
                scheduler.scheduleAtFixedRate(logTask, initialDelay, period, TimeUnit.SECONDS);
    

            }
        }
    }
    private static long computeInitialDelay() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime nextHour = now.plusHours(1).truncatedTo(ChronoUnit.HOURS);
        return ChronoUnit.SECONDS.between(now, nextHour);
    }
}

