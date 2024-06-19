ifndef::env-github[:icons: font]
ifdef::env-github[]
:status:
:outfilesuffix: .adoc
:caution-caption: :fire:
:important-caption: :exclamation:
:note-caption: :page_with_curl:
:tip-caption: :bulb:
:warning-caption: :warning:
endif::[]

*In the Src Folder

# BP_code_generation
The directory contains folders for each stable version of instructions.
The Model used is gpt4-turbo with 0 temp
Each Folder(V<versionNumber>) is built out of 3 folders:
                                                    1. Instructions: Contains 3 instruction files for the different phases
                                                    2. RequirementDocs: Contains requirement formatted for our process(dividing the 3                                                            phases)
                                                    3. Results: Contains results generated using this version of instructions

# main_client_server_java:
The files inside this directory support the client-server model with BP. A BP program runs in the backend, sending events from the BP program and receiving events from the client, passing them to the BP program.
For each BP program, there is a corresponding "frontend" consisting of a HTML. 

To run the program, use the next steps:
    1. Run main_with_external (This is the file you will run to initiate the server and the bp program)
        *Before running use the variable of the system you want to run
    2. Open the HTML file(Directly in Chrome) of the BP program ran
*In any case you want to start over, you will need to restart the Backend(main_with_external), and then refresh your page

    


