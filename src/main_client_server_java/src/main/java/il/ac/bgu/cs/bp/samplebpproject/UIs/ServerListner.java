package il.ac.bgu.cs.bp.samplebpproject.UIs;


//
// Source code recreated from a .class file by IntelliJ IDEA
// (powered by FernFlower decompiler)
//



import il.ac.bgu.cs.bp.bpjs.exceptions.BPjsRuntimeException;
import il.ac.bgu.cs.bp.bpjs.execution.listeners.BProgramRunnerListener;
import il.ac.bgu.cs.bp.bpjs.model.BEvent;
import il.ac.bgu.cs.bp.bpjs.model.BProgram;
import il.ac.bgu.cs.bp.bpjs.model.BThreadSyncSnapshot;
import il.ac.bgu.cs.bp.bpjs.model.SafetyViolationTag;
import java.io.PrintStream;
import org.mozilla.javascript.RhinoException;
import org.mozilla.javascript.ScriptStackElement;
import java.io.IOException;
import java.net.ServerSocket;
import java.net.Socket;



public class ServerListner implements BProgramRunnerListener {
    private final PrintStream out;
    private ServerSocket serverSocket;
    private Socket clientSocket;
    private BProgram bProgram;
    private Server server;

    public ServerListner(PrintStream aStream) {
        this.out = aStream;
        //initiate the server
//        startListening(8080);

    }

    public ServerListner() {
        this(System.out);
//        startListening(8080);
    }
    public ServerListner(Server s) {
        this(System.out);
        this.server = s;
    }

    public Socket startListening(int port) {
        try {
            System.out.println("starting server");
            serverSocket = new ServerSocket(port);
            System.out.println("Opened server");
            clientSocket = serverSocket.accept();
            System.out.println("Client connected");
            // Handle client connection and events here
            //print clients message
            return clientSocket;

        } catch (IOException e) {
            e.printStackTrace();
            System.out.println("error server");
        }
        return null;
    }

    public void stopListening() {
        try {
            if (clientSocket != null) {
                clientSocket.close();
            }
            if (serverSocket != null) {
                serverSocket.close();
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public void starting(BProgram bp) {
        this.out.println("---:" + bp.getName() + " Starting");
    }

    public void started(BProgram bp) {
        this.out.println("---:" + bp.getName() + " Started");
        this.bProgram= bp;
    }

    public void ended(BProgram bp) {
        this.out.println("---:" + bp.getName() + " Ended");
    }

    public void halted(BProgram bp) {
        this.out.println("---:" + bp.getName() + " Halted");
    }

    public void assertionFailed(BProgram bp, SafetyViolationTag theFailedAssertion) {
        PrintStream var10000 = this.out;
        String var10001 = bp.getName();
        var10000.println("---:" + var10001 + " " + theFailedAssertion.getMessage());
    }

    public void eventSelected(BProgram bp, BEvent theEvent) {
        PrintStream var10000 = this.out;
        String var10001 = bp.getName();
        if(theEvent.name.equals("ExternalEvent")){
            return  ;
        }
        var10000.println(" --:" + var10001 + " Event " + theEvent.toString());
        if (this.server != null) {
            this.server.sendMessage(server.bEventToJson(theEvent).toString());
        }
    }

    public void superstepDone(BProgram bp) {
        this.out.println("---:" + bp.getName() + " No Event Selected");
    }

    public void bthreadAdded(BProgram bp, BThreadSyncSnapshot theBThread) {
        PrintStream var10000 = this.out;
        String var10001 = bp.getName();
        var10000.println("  -:" + var10001 + " Added " + theBThread.getName());
    }

    public void bthreadRemoved(BProgram bp, BThreadSyncSnapshot theBThread) {
        PrintStream var10000 = this.out;
        String var10001 = bp.getName();
        var10000.println("  -:" + var10001 + " Removed " + theBThread.getName());
    }

    public void bthreadDone(BProgram bp, BThreadSyncSnapshot theBThread) {
        PrintStream var10000 = this.out;
        String var10001 = bp.getName();
        var10000.println("  -:" + var10001 + " Done " + theBThread.getName());
    }

    public void error(BProgram bp, Exception ex) {
        this.out.println("/!\\ Error during run: " + ex.getMessage());
        if (ex instanceof BPjsRuntimeException) {
            BPjsRuntimeException bre = (BPjsRuntimeException)ex;
            Throwable cz = bre.getCause();
            if (cz instanceof RhinoException) {
                RhinoException rh = (RhinoException)cz;
                PrintStream var10000 = this.out;
                String var10001 = rh.details();
                var10000.println("  " + var10001 + " at: " + rh.sourceName() + ":" + rh.lineNumber());
                StringBuilder sb = new StringBuilder();
                ScriptStackElement[] var7 = rh.getScriptStack();
                int var8 = var7.length;

                for(int var9 = 0; var9 < var8; ++var9) {
                    ScriptStackElement emt = var7[var9];
                    emt.renderMozillaStyle(sb);
                }

                this.out.println(sb.toString());
            }
        } else {
            ex.printStackTrace(this.out);
        }

    }
}
