# The End-to-End System for Generating Code from Natural Language Instructions

 For using our system, run the UseSystem.py file in the main directory. 
 The system supports:
1. Generating code from natural language instructions
   1. Generating BP code from a requirements document (Please look at the examples in [RequirementDocs](src/BP_code_generation/RequirementDocs))
      1. Many options are available for the behavior instructions, see  [Instruction Options](src/BP_code_generation/Instructions/All_Behavior_instructions)
   2. Generating BP code from additional requirements, based on existing BP code
   3. Generating UI code from a requirements document(+and bp code). 
      1. If ran after bp code generation, the UI code can be generated based on the bp code.
      2. After running the UI code generation, you can run the generated code with its backend, by moving to the second menu(as will offered)
   4. Setting your API key for the OpenAI API(You can also set the API key manually in .env file)
2. Running the generated code
   1. Running the code in the backend
   2. Running a default frontend(Generated on the fly) for the code together with the backend. Notice that this frontend also indicates the status of the connection (at the bottom of the page). If connection isn't successful, try and refresh the page. 
   3. Running a specific frontend for the code together with the backend


*To use the GUI, you must have a default browser on your os. For example, to set chrome you can refer to the following link: https://answers.microsoft.com/en-us/windows/forum/all/how-do-i-get-chrome-back-to-being-my-default/57d2d70c-a5fc-49b9-b93f-6abd6ccbb9c0
If no GUI opened although you declared a default browser, or you want to avoid that, just copy-paste the path you're given(when running the GUI option) to the browser*



*To add new resource file, you must have maven installed on your system, to allow compilation of the new resource file. You can refer to the following link: https://maven.apache.org/download.cgi , after downloading the maven, make sure to set it in the environment variables.*




# In the Src Folder

## BP_code_generation
The directory contains 3 directories:


1. Instructions: Contains 3 instruction files for the different phases
   1. All_Behavior_instructions: Contains all the variations of behavior instructions for the bot.
   2. RequirementDocs: Contains requirements formatted for our process(dividing the 3 phases)
   3. Results: Contains results generated using these instructions, divided into subdirectories based on the instructions used.
   4. Evaluation: Contains the datasets used for evaluation(and a txt file where it nicely formatted), the excel files with the results and the code used for evaluation.
      *To run evaluation_experiment, you will might need to run "python -m src.BP_code_generation.Evaluation.evaluation_experiment" 


In addition, there are 2 python files, that are used to generate the code from the instructions. You dont need to run them, as the UseSystem.py file will run them for you.


## main_client_server_java:
The files inside this directory support the client-server model with BP. A BP program runs in the backend, sending events from the BP program and receiving events from the client, passing them to the BP program.
For each BP program, there is a corresponding "frontend" consisting of a HTML. 

Once again, you dont need to run these files, as the UseSystem.py file will run them for you.

## UI_code_generation
The directory contains some helper files for generating the UI code. You can find the UI instructions there


    


