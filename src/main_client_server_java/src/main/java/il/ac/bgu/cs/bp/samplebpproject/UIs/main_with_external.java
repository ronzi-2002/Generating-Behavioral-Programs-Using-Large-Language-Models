package il.ac.bgu.cs.bp.samplebpproject.UIs;

import il.ac.bgu.cs.bp.bpjs.context.ContextBProgram;
import il.ac.bgu.cs.bp.bpjs.execution.BProgramRunner;
import il.ac.bgu.cs.bp.bpjs.model.BProgram;
import il.ac.bgu.cs.bp.samplebpproject.UIs.Server;
import il.ac.bgu.cs.bp.samplebpproject.UIs.ServerListner;

import java.io.IOException;
import java.util.List;

/**
 * Simple class running a BPjs program that selects "hello world" events.
 * @author michael
 */
public class main_with_external{
    static final String spaceFraction = "Space Fraction game V11.js";
    static final String handleExternalEvents = "HandleExternalEvents.js";
    static final String coffeeMachine = "coffeeMachineVer11.js";
    static final String tests = "Testing.js";
    public static void main(String[] args) throws InterruptedException, IOException {
        for (int i = 0; i < 1; i++) {


//            String [] files = new String[]{coffeeMachine,handleExternalEvents};
//            String [] files = new String[]{tests};
//            String [] files = new String[]{spaceFraction,handleExternalEvents};
            // String [] files = new String[]{spaceFraction,handleExternalEvents};
            // Create a list of files that the BPjs program will use
            List<String> filesList = new ArrayList<>();
            filesList.add("handleExternalEvents.js");
            Scanner scanner = new Scanner(System.in);
            System.out.print("Enter the name of the file(s) you want to run (separated by commas): ");
            String fileNames = scanner.nextLine();
            String[] fileNameArray = fileNames.split(",");
            filesList.addAll(Arrays.asList(fileNameArray));
            String[] files = filesList.toArray(new String[0]);

            




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
        }
    }
}

