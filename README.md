# The End-to-End System for Generating Code from Natural Language Instructions

 For using our system, run the UseSystem.py file in the main directory. 
 The system supports:
1. Generating code from natural language instructions
   1. Generating BP code from a requirements document (Please look at the examples in [RequirementDocs](src/BP_code_generation/RequirementDocs))
   2. Generating UI code from a requirements document(+and bp code)**
   3. Setting your API key for the OpenAI API(You can also set the API key manually in .env file)
2. Running the generated code
   1. Running the code in the backend
   2. Running a default frontend(Generated on the fly) for the code together with the backend
   3. Running a specific frontend for the code together with the backend
        
**Not supported yet    



# In the Src Folder

## BP_code_generation
The directory contains 3 directories:


1. Instructions: Contains 3 instruction files for the different phases
2. RequirementDocs: Contains requirements formatted for our process(dividing the 3 phases)
3. Results: Contains results generated using these instructions

In addition, there are 2 python files, that are used to generate the code from the instructions. You dont need to run them, as the UseSystem.py file will run them for you.

* V11 is a more tested version of the instructions, and the results are more accurate
* V13 is the latest version of the instructions, it supports non-context based instructions, seems to be more accurate, but needs more testing


## main_client_server_java:
The files inside this directory support the client-server model with BP. A BP program runs in the backend, sending events from the BP program and receiving events from the client, passing them to the BP program.
For each BP program, there is a corresponding "frontend" consisting of a HTML. 

Once again, you dont need to run these files, as the UseSystem.py file will run them for you.

    



    


