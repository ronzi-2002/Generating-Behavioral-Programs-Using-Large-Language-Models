

import os
import time
import openai
from openai import OpenAI
from dotenv import load_dotenv
from src.BP_code_generation.post_process import post_process
from enum import Enum
import src.UI_code_generation.exctracting_events as exctracting_events
import re
class Methodology(Enum):
    STANDARD = "standard"
    PREPROCESS_AS_PART_OF_PROMPT = "preprocess_as_part_of_prompt"
    PREPROCESS_AS_PART_BEFORE_PROMPT = "preprocess_as_part_before_prompt"

class InstructionPhase(Enum):
    ENTITY_INSTRUCTIONS = "Entity INSTRUCTIONS:"
    QUERY_INSTRUCTIONS = "Query INSTRUCTIONS:"
    BEHAVIOR_INSTRUCTIONS = "Behavior INSTRUCTIONS:"
    ORIGINAL_REQUIREMENTS = "Original Requirements:"

class BehaviorInstructionType(Enum):
    Basic = os.getcwd() + "/src/BP_code_generation/Instructions/All_Behavior_Instructions/1Basic Behavior Bot instructions"
    BasicPlus = os.getcwd() + "/src/BP_code_generation/Instructions/All_Behavior_Instructions/2BasicPlus Behavior Bot instructions"
    BasicPlus_NoExamples = os.getcwd() + "/src/BP_code_generation/Instructions/All_Behavior_Instructions/2BasicPlus Behavior Bot instructions NoEXAMPLES"
    DSL = os.getcwd() + "/src/BP_code_generation/Instructions/All_Behavior_Instructions/3DSLs Behavior Bot instructions"
    DSL_Isolated= os.getcwd() + "/src/BP_code_generation/Instructions/All_Behavior_Instructions/3_5DSLs and isolation Behavior Bot instructions"
    Analysis = os.getcwd() + "/src/BP_code_generation/Instructions/All_Behavior_Instructions/4Analysis Behavior Bot instructions"
    # Default = os.getcwd() + "/src/BP_code_generation/Instructions/Behavior Bot Instructions"
    Default = BasicPlus_NoExamples
class MyOpenAIApi:
    def __init__(self, model= "gpt-4-turbo-2024-04-09",api_key=None, instructions= None, temp=0.5, post_process_function=None):#todo add temperature actual default, max_tokens, top_p, frequency_penalty, presence_penalty, stop, and other parameters
        self.api_key = api_key
        self.client = openai
        self.openai = openai

        #check if env file exists
        if not os.path.exists('.env'):
            print("No .env file found, please create one in the root directory of the project")
            print("The .env file should contain the following:")
            print("OPENAI_API_KEY=your_openai_api_key")
            print("OPENAI_ORGANIZATION=your_openai_organization(optional)")
        load_dotenv('.env')
        
        #check if organization is in the env file
        if os.getenv("OPENAI_ORGANIZATION"):
            self.client= OpenAI(organization= os.getenv("OPENAI_ORGANIZATION"), api_key=os.getenv("OPENAI_API_KEY"))
        else:
            self.client= OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        self.history = []
        self.model = model
        self.instructions = instructions
        if self.instructions:
            self.set_instructions(self.instructions)
        # if temp:
        self.temp = temp
        self.post_process_function = post_process_function
        self.History_For_Output  = []
    
    def static_post_process(self,last_resp):
        """
        this is a very simple post process, it does not require any interaction with the model. It simply replaces static strings in the response with other strings.:
        1. ctx.getEntitiesByType -> getEntitiesByType *we remove the ctx. part and allow the model to use it with ctx as all similar functions are used with ctx  
        """
        # print("last_resp before", last_resp)
        if "ctx.getEntitiesByType" in last_resp:
            last_resp = last_resp.replace("ctx.getEntitiesByType", "getEntitiesByType")

        # # ctx.bthread('bthreadName',[],function(){...});-> bthread('bthreadName',function(){...});
        # #this is relavent only when the array is empty
        # # Regular expression to match ctx.bthread with an empty array
        # pattern = r"ctx\.bthread\('([^']+)'\,\s*\[\]\,\s*function\(\)\{"
    
        # # Replace the matched pattern with the desired format
        # processed_code = re.sub(pattern, r"bthread('\1', function(){", last_resp)
        # print("last_resp after", processed_code)
    
        # return processed_code

  

        return last_resp
    
    def reset_history(self):
        self.history = []
    def chat_with_gpt(self,message):
        """
        Sends a message to the GPT-3.5-turbo model for chat-based completion and returns the generated response. Notice that the model is stateless and does not store any context from previous messages.

        Parameters:
        message (str): The message to be sent to the model.

        Returns:
        str: The generated response from the model.
        Example:
        # Example conversation
        print("You: Hi, how are you?")
        print("ChatGPT:", chat_with_gpt("Hi, how are you?"))
        print("You: What is the capital of France?")
        print("ChatGPT:", chat_with_gpt("What is the capital of France?"))
        print("You: What was my last message?")
        print("ChatGPT:", chat_with_gpt("What was my last message?")) #will print: "I do not have the ability to access your messages as I am programmed to respect user privacy and confidentiality."
        """
        response = self.client.chat.completions.create(
            model=self.model,  # You can use any model you prefer
            messages=self.history + [
                {"role": "user", "content": message}
            ],
            temperature = self.temp
        )
        return self.static_post_process( response.choices[0].message.content)
    
    def chat_with_gpt_cumulative(self,new_message, method=Methodology.STANDARD, behavior_instructions_type = BehaviorInstructionType.Basic, demoMode = False):
        """
        Chat with GPT-3.5-turbo model using OpenAI API.

        Args:
            new_message (str): The new message to be sent to the model.
            history (list): List of previous messages exchanged between user and assistant. 

        Returns:
            tuple: A tuple containing the assistant's response and the updated history.Remever to update your history after each call to this function, so that the model can keep track of the conversation.
        Example:
        history = []
        print("You: Hi, how are you?")
        response, history = chat_with_gpt_cumulative("Hi, how are you?", history)
        print("ChatGPT:", response)
        print("You: What is the capital of France?")
        response, history = chat_with_gpt_cumulative("What is the capital of France?", history)
        print("ChatGPT:", response)
        print("You: What was my last message?")
        response, history = chat_with_gpt_cumulative("What was my last message?", history)
        print("ChatGPT:", response)#will print: "What is the capital of France?"
        """
        if method == Methodology.STANDARD:
            if behavior_instructions_type == BehaviorInstructionType.DSL_Isolated:
                # For these instructions, each requirement is a standalone. However, we need to update the instructions themself, adding existing requirements.
                allEvents= exctracting_events.extract_events(code=self.export_to_code(exportToFile=False))
                instructions = ""
                with open(behavior_instructions_type.value, "r") as file:
                    instructions = file.read()
                #In the file, there is a line that says "<add the existing events here>"
                #Add existing events in the format of
                #-EventA(parameters)
                #-EventB(parameters)
                #and so on
                if len(allEvents) == 0:
                    #delete the line that starts with "Existing Events that were defined before:" 
                    lines = instructions.split("\n")
                    for i, line in enumerate(lines):
                        if line.startswith("Existing Events that were defined before:"):
                            del lines[i]
                            break
                    instructions = "\n".join(lines)
                else:
                    instructions = "\n\n\n"+instructions.replace("Existing Events that were defined before(you can use them without declaring them again):", "Existing Events that were defined before(you can use them without declaring them again):\n"+ "\n".join([f"-{event['EventName']}({','.join(list(event['parameters'].keys()))})" for event in allEvents]))
                self.set_instructions(instructions)
                #Now after we handled the instructions, we need to call the model,
                self.history.append({"role": "user", "content": new_message})
                self.History_For_Output.append({"role": "user", "content": new_message})

                demo_response= ""
                response = self.client.chat.completions.create(#TODO this was commented for offline mode
                    model=self.model,  # You can use any model you prefer
                    messages=self.history,
                    temperature = self.temp
                )
                with open("simulation_text_ui", "r") as file:
                    demo_response = file.read() 
                response_to_return = response.choices[0].message.content

                #we add the response to the original history but not the processed one
                self.History_For_Output.append({"role": "assistant", "content": self.static_post_process(response_to_return)})
                #we remove the last user message, 
                self.history.pop(-1)
                return self.static_post_process( response_to_return)


            elif behavior_instructions_type == BehaviorInstructionType.Analysis:
                #in this case, we need to add a simple string to the requirement.
                # this will result the analysis to appear in the assistant's response. 
                #TODO this analysis and the added string will appear in the history. We can(should) remove it after the response is generated(as done in the second methodology)
                new_message += "\n\n Make sure it obeys your 8 response steps"
            self.history.append({"role": "user", "content": new_message})
            self.History_For_Output.append({"role": "user", "content": new_message})
            demo_response= "DEMO RESPONSE FOR TESTING"
            if not demoMode:
                response = self.client.chat.completions.create(#TODO uncomment this
                    model=self.model,  # You can use any model you prefer
                    messages=self.history,
                    temperature = self.temp
                )
                response_to_return = response.choices[0].message.content
            else:
                # with open("simulation_text_ui", "r") as file:
                #     demo_response = file.read() 
                response_to_return = demo_response

           

            #TODO figure out how to use post_process_function currently it is not used
            # if self.post_process_function:
            #     post_process_answer = self.post_process_function(js_code= self.export_to_code(exportToFile=False), last_resp=response.choices[0].message.content)
            #     if post_process_answer == "":#No corrections needed
            #         self.history.append({"role": "assistant", "content": response.choices[0].message.content})
            #         self.History_For_Output.append({"role": "assistant", "content": self.static_post_process( response.choices[0].message.content)})
            #     else:#TODO make sure it doesnt get stuck in the recursive loop
            #         self.history.append({"role": "assistant", "content": response.choices[0].message.content})
            #         self.History_For_Output.append({"role": "assistant", "content": self.static_post_process(response.choices[0].message.content)})
            #         new_response = self.chat_with_gpt_cumulative(post_process_answer)
            #         #pre last assistant message is the one that needs to be corrected
            #         self.history.pop(-3)
            #         #remove last user message
            #         self.history.pop(-2)
                    
            #         return new_response
            
            # else:
            self.history.append({"role": "assistant", "content": response_to_return})
            self.History_For_Output.append({"role": "assistant", "content": self.static_post_process( response_to_return)})
        elif method == Methodology.PREPROCESS_AS_PART_OF_PROMPT:
            allEvents= exctracting_events.extract_events(code=self.export_to_code(exportToFile=False))
            preProcessString = ""
            with open("src/BP_code_generation/Pre_Process_text.txt", "r") as file:
                preProcessString = file.read()
            #In the file, there is a line that says "<add the existing events here>(if there are no existing events, just write "No existing events")"
            #Add existing events in the format of
            #-EventA(parameters)
            #-EventB(parameters)
            #and so on
            if len(allEvents) == 0:
                #delete the line that starts with "###Which Events are needed?" and delete the two lines after it 
                lines = preProcessString.split("\n")
                for i, line in enumerate(lines):
                    if line.startswith("###Which Events are needed?"):
                        del lines[i:i+5]
                        break
                preProcessString = "\n".join(lines)
            else:
                preProcessString = "\n\n\n"+preProcessString.replace("<add the existing events here>(if there are no existing events, just write \"No existing events\")", "\n".join([f"-{event['EventName']}({','.join(list(event['parameters'].keys()))})" for event in allEvents]))
            
            #In the preProcessString, there is a line that says Is there a specific context for the asked bthread? which one of the queries is it(out of: ) . Give the exact name
            #add the existing queries in the parenthesis, in the format of queryA, queryB, queryC
            existingQueries = exctracting_events.extract_Queries(code=self.export_to_code(exportToFile=False))
            if len(existingQueries) == 0:#TODO
                pass
            else:
                preProcessString = preProcessString.replace("which one of the queries is it(out of: )", "which one of the queries is it(out of: "", ".join(existingQueries)+")")

            
            
            print(new_message + preProcessString)
            self.history.append({"role": "user", "content": new_message + preProcessString})
            self.History_For_Output.append({"role": "user", "content": new_message})
            response = self.client.chat.completions.create(
                model=self.model,  # You can use any model you prefer
                messages=self.history,
                temperature = self.temp
            )
            #Now we need to do 2 things, we need to change the user message to the original message, removing the preProcessString. In addition in the assistant message, we need to remove all text before /implementation
            self.history[-1]["content"] = new_message
            assistant_response = response.choices[0].message.content
            print("\n\n\n\n\n\n assistant_response", assistant_response)
            if assistant_response.startswith("```javascript"):
                assistant_response = assistant_response[13:]
                assistant_response = assistant_response[:-3]
            print("\n\n\n\n\n\n assistant_response after javascript", assistant_response)
            
            assistant_response = assistant_response[assistant_response.lower().find("implementation"):].replace("implementation", "").replace("Implementation", "")
            print("\n\n\n\n\n\n FINAL RESPONSE", assistant_response)

            self.history.append({"role": "assistant", "content": assistant_response})
            self.History_For_Output.append({"role": "assistant", "content": self.static_post_process(response.choices[0].message.content)})
            return self.static_post_process(response.choices[0].message.content)


            
            #add to the user message: 
        else: 
            print("Methodology not supported "+method)
            exit()
        # self.history.append({"role": "assistant", "content": response.choices[0].message.content})
        return self.static_post_process(response_to_return)
    def add_to_history_gptResponse(self, message):
        self.history.append({"role": "assistant", "content": message})
        self.History_For_Output.append({"role": "assistant", "content": message})
    def add_to_history_userMessage(self, message):
        self.history.append({"role": "user", "content": message})
        self.History_For_Output.append({"role": "user", "content": message})
    def set_instructions(self, instructions):
        #if the assistant already has a system message in the history, replace it with the new instructions
        if self.history and self.history[0]["role"] == "system":
            self.history[0]["content"] = instructions
        elif len(self.history) > 0:
            self.history.insert(0, {"role": "system", "content": instructions}) #TODO make sure it is the best to make it the first element
        else:
            self.history.append({"role": "system", "content": instructions})
    def export_to_code(self, directory=os.getcwd(), file_name=None,exportToFile=True, methodology=Methodology.STANDARD, behavior_instructions_type=BehaviorInstructionType.Basic, full_output_path = None):
        #create a js file, where each user message is in a comment, and the assistant's response as is.
        string_to_write = ""
        for i in range(len(self.History_For_Output)):
            string_to_write += self.get_pretty_response_string(i)
        if full_output_path:
            file = open(full_output_path, "w")
            file.write(string_to_write)
            file.close()
            print("code has been exported to " + full_output_path)
            return full_output_path
        #create a file in the same directory as the script and add a timestamp to the file name
        if exportToFile:
            if not file_name:
                file_name = "chat_history" + str(time.time()) + ".js"
            #if the directory does not exist, create it
            if not os.path.exists(directory):
                os.makedirs(directory)
            if not os.path.exists(directory +"/" + behavior_instructions_type.name):
                os.makedirs(directory +"/" + behavior_instructions_type.name)

            exportTo = directory +"/" + behavior_instructions_type.name + "/" + file_name
            file = open(exportTo, "w")
            file.write(string_to_write)
            file.close()
            print("code has been exported to " + exportTo)
            return exportTo
        return string_to_write
    def export_to_code_UI(self, directory=os.getcwd(), file_name=None,exportToFile=True):
        #create a js file, where each user message is in a comment, and the assistant's response as is.
        string_to_write = ""
        for i in range(len(self.History_For_Output)):
            string_to_write += self.get_pretty_response_string(i)
        
        #create a file in the same directory as the script and add a timestamp to the file name
        if exportToFile:
            if not file_name:
                file_name = "chat_history" + str(time.time()) + ".html"
            #if the directory does not exist, create it
            

            exportTo = directory + "/" + file_name
            file = open(exportTo, "w")
            file.write(string_to_write)
            file.close()
            print("code has been exported to " + exportTo)
            return exportTo
        return string_to_write
    def get_pretty_response_string_ui(self, response_index):
        message = self.History_For_Output[response_index]
        string_to_write = ""
        if message["role"] == "user":
            # if there are multiple lines in the message, use multiline comments
            # if "\n" in message["content"]:
            string_to_write += "/*\n"
            string_to_write += message["content"]
            string_to_write += "\n*/\n"
            # else:
            #     string_to_write += f"//{message['content']}\n"
        elif message["role"] == "assistant":
            assistant_response = message["content"]


            # string_to_write += f"{assistant_response}\n"
            # if ```javascript is in the response, comment everything that is not in the javascript code(between ```javascript and ```). it can appear in any line
            if assistant_response.startswith("```html"):
                    assistant_response = assistant_response[7:-4]#todo make sure its the correct indexes.
            string_to_write += f"{assistant_response}\n"
        return string_to_write
    
    def get_pretty_response_string(self, response_index):#TODO this is a bit weird, it is because the bot functions are not part of the class, I will fix it
        message = self.History_For_Output[response_index]
        string_to_write = ""
        if message["role"] == "user":
            # if there are multiple lines in the message, use multiline comments
            # if "\n" in message["content"]:
            string_to_write += "/*\n"
            string_to_write += message["content"]
            string_to_write += "\n*/\n"
            # else:
            #     string_to_write += f"//{message['content']}\n"
        elif message["role"] == "assistant":
            assistant_response = message["content"]


            # string_to_write += f"{assistant_response}\n"
            # if ```javascript is in the response, comment everything that is not in the javascript code(between ```javascript and ```). it can appear in any line
            if "```javascript" in message["content"]:
                lines = message["content"].split("\n")
                in_javascript_code = False
                for i, line in enumerate(lines):
                    if line.startswith("```javascript"):
                        in_javascript_code = True
                        lines[i] = "// "+line#This can also be removed totally
                        lines[i] = ""
                    elif line.startswith("```"):
                        in_javascript_code = False
                        lines[i] = "// "+line#This can also be removed totally
                        lines[i] = ""
                    elif not in_javascript_code:
                        lines[i] = f"// {line}" 
                        
                assistant_response = "\n".join(lines)   
            string_to_write += f"{assistant_response}\n"
        return string_to_write
    
        







# client = openai.OpenAI()

# response = client.chat.completions.create(
#     model="gpt-3.5-turbo",
#     messages=[
#         {"role": "system", "content": "You are a helpful assistant."},
#         {"role": "user", "content": "Who won the world series in 2020?"},
#         {"role": "assistant", "content": "The Los Angeles Dodgers won the World Series in 2020."},
#         {"role": "user", "content": "Where was it played?"}
#     ]
# )


def example_for_usage():
    # Example conversation
    myOpenAIApi = MyOpenAIApi()
    print("You: Hi, how are you?")
    print("ChatGPT:", myOpenAIApi.chat_with_gpt("Hi, how are you?"))
    print("You: What is the capital of France?")
    print("ChatGPT:", myOpenAIApi.chat_with_gpt("What is the capital of France?"))
    print("You: What was my last message?")
    print("ChatGPT:", myOpenAIApi.chat_with_gpt("What was my last message?")) #will print: "I do not have the ability to access your messages as I am programmed to respect user privacy and confidentiality."
    
    print("You: Hi, how are you?")
    response = myOpenAIApi.chat_with_gpt_cumulative("Hi, how are you?")
    print("ChatGPT:", response)
    print("You: What is the capital of France?")
    response = myOpenAIApi.chat_with_gpt_cumulative("What is the capital of France?")
    print("ChatGPT:", response)
    print("You: What was my last message?")
    response = myOpenAIApi.chat_with_gpt_cumulative("What was my last message?")
    print("ChatGPT:", response)#will print: "What is the capital of France?"


def bot_usage_interactive(instructions= None, instructions_file_path=None):
    if instructions_file_path:
        with open(instructions_file_path, "r") as file:
            instructions = file.read()
    # print(instructions)
    myOpenAIApi = MyOpenAIApi(model="gpt-4-turbo-2024-04-09", instructions=instructions, temp=0)
    while True:
        input_message = input("You: ")
        if input_message == "exit":
            break
        response = myOpenAIApi.chat_with_gpt_cumulative(input_message)
        print("ChatGPT:", response)
    myOpenAIApi.export_to_code()

def bot_usage_from_array(instructions= None, entity_instructions_file_path=None,query_instructions_file_path=None,behavior_instructions_file_path=None,inputs_array=None, output_directory=None, file_name=None, methodology=Methodology.STANDARD, behavior_instructions_type=BehaviorInstructionType.Basic, entityAndQueriesCache=[]):
    temp_file= open("temp_file","w")# in case you want to see it updated in real time in a file https://superuser.com/questions/274961/how-to-automatically-reload-modified-files-in-notepad (dont forget to turn monitoring on)
    current_instruction = None
    if entity_instructions_file_path:
        with open(entity_instructions_file_path, "r") as file:
            instructions = file.read()
    # print(instructions)
    myOpenAIApi = MyOpenAIApi(model="gpt-4-turbo-2024-04-09", instructions=instructions, temp=0)
    for input_message in inputs_array:
        if input_message in ["" , "\n"]:
            continue
        if input_message == "Entity INSTRUCTIONS:":
            with open(entity_instructions_file_path, "r") as file:
                instructions = file.read()
            myOpenAIApi.set_instructions(instructions)
            current_instruction = InstructionPhase.ENTITY_INSTRUCTIONS
            continue
        elif input_message == "Query INSTRUCTIONS:":
            with open(query_instructions_file_path, "r") as file:
                instructions = file.read()
            myOpenAIApi.set_instructions(instructions)
            current_instruction = InstructionPhase.QUERY_INSTRUCTIONS
            continue
        elif input_message == "Behavior INSTRUCTIONS:":
            if entityAndQueriesCache == []:
                #we need to set the cache
                entityAndQueriesCache = myOpenAIApi.history.copy()
            else:
                #we need to reset the history to the point where the entity and queries instructions were set
                myOpenAIApi.history = entityAndQueriesCache.copy()
                myOpenAIApi.History_For_Output = entityAndQueriesCache.copy()

            with open(behavior_instructions_file_path, "r") as file:
                instructions = file.read()
            myOpenAIApi.set_instructions(instructions)
            current_instruction = InstructionPhase.BEHAVIOR_INSTRUCTIONS
            continue
        elif input_message == "Original Requirements:":
            current_instruction = InstructionPhase.ORIGINAL_REQUIREMENTS
            break
        temp_file.write("\\\\" + input_message)
        

        if current_instruction == InstructionPhase.BEHAVIOR_INSTRUCTIONS:
            response = myOpenAIApi.chat_with_gpt_cumulative(input_message, method=methodology, behavior_instructions_type=behavior_instructions_type)
        else:
            if entityAndQueriesCache != []:
                continue#this is to avoid reprocessing the same entity and queries instructions
            response = myOpenAIApi.chat_with_gpt_cumulative(input_message)
        print("ChatGPT:", response)

        temp_file.write(myOpenAIApi.get_pretty_response_string(-1))
        temp_file.write("\n")
        temp_file.flush()
    if output_directory:
        currTime = time.time()
        generated_code_path = myOpenAIApi.export_to_code(directory=output_directory, file_name=file_name + str(currTime)+".js",methodology=methodology,behavior_instructions_type=behavior_instructions_type)
    else:
       generated_code_path= myOpenAIApi.export_to_code()
    return entityAndQueriesCache, generated_code_path
#incase your inputs are in a file, notice this limits each input to one line
def file_to_array(file_path):
    # an input can be more than one line, it is just that each input is separated by blank line
    inputs_array = []
    with open(file_path, "r") as file:
        input_message = ""
        for line in file:
            if line == "\n":
                inputs_array.append(input_message)
                input_message = ""
            else:
                input_message += line
        if input_message:
            inputs_array.append(input_message)
    #if last char is new line, remove it
    inputs_array = [input_message[:-1] if (len(input_message)>0 and input_message[-1] == "\n") else input_message for input_message in inputs_array]
    return inputs_array




def main():
    instructions_file_path = os.getcwd() + "/src/main/BotInstructions/v_10/Bot Instructions"


    # operation_mode = input("Enter 1 for interactive mode, 2 for array mode")
    operation_mode = "2"
    if operation_mode == "1":
        print("Currently not supported")
        # bot_usage_interactive(instructions_file_path=instructions_file_path)

    else:

        
        # ask user for the file name or use the default one
        requirements_file_path = input("Enter the requirements file path(or enter: D for default, H for optional examples): ")

        if requirements_file_path == "D":
            requirements_file_name = "DummyExample"
            # src\main\BotInstructions\Requirements\coffee_machine
            requirements_file_path = os.getcwd() + "/src/BP_code_generation/RequirementDocs/" + requirements_file_name
        elif requirements_file_path == "H":
            print("Optional files: ")
            #print all the files in src\main_client_server_java\src\main\resources
            optionalFiles = os.listdir("src/BP_code_generation/RequirementDocs")
            for index, file in enumerate(optionalFiles):
                print(f"    {index + 1}. {file}")
            requirements_file_name = input("Enter the file name or its index: ")
            try:
                #if the user entered the index, get the file name
                requirements_file_name = int(requirements_file_name)
                requirements_file_name = optionalFiles[requirements_file_name - 1]
                requirements_file_path = os.getcwd() + "/src/BP_code_generation/RequirementDocs/" + requirements_file_name

            except:
                requirements_file_path = os.getcwd() + "/src/BP_code_generation/RequirementDocs/" + requirements_file_name

        else:
            requirements_file_name = requirements_file_path.split("/")[-1].split("\\")[-1]
        req_array = file_to_array(requirements_file_path)

        print(req_array)
        entity_instructions_file_path = os.getcwd() + "/src/BP_code_generation/Instructions/Entity Bot Instructions"
        query_instructions_file_path = os.getcwd() + "/src/BP_code_generation/Instructions/Query Bot Instructions"
        behavior_instructions_file_path = os.getcwd() + "/src/BP_code_generation/Instructions/Behavior Bot Instructions"
        # methodology = input("Select generation methodology: Enter 1 for standard, 2 for preprocess as part of prompt, 3 for preprocess as part before prompt")
        methodology = "1"
        methodologies = []
        if methodology == "1":
            methodology = Methodology.STANDARD
            methodologies.append(Methodology.STANDARD)
        elif methodology == "2":
            methodology = Methodology.PREPROCESS_AS_PART_OF_PROMPT
            methodologies.append(Methodology.PREPROCESS_AS_PART_OF_PROMPT)
        elif methodology == "3":
            methodology = Methodology.PREPROCESS_AS_PART_BEFORE_PROMPT
            methodologies.append(Methodology.PREPROCESS_AS_PART_BEFORE_PROMPT)
        else:#try all(currently only first 2 are supported)
            methodologies.append(Methodology.STANDARD)
            methodologies.append(Methodology.PREPROCESS_AS_PART_OF_PROMPT)

        behavior_instructions_types = select_behavior_instructions_type()
        retVal = []
        entityAndQueriesCache=[]
        #for every combination of methodology and behavior_instructions_type
        for methodology, behavior_instructions_type in [(methodology, behavior_instructions_type) for methodology in methodologies for behavior_instructions_type in behavior_instructions_types]:

            behavior_instructions_file_path = behavior_instructions_type.value
            # print("behavior_instructions_file_path", behavior_instructions_file_path)   
            # retVal.append(behavior_instructions_file_path)
            
            entityAndQueriesCache, generated_code_path =  bot_usage_from_array(entity_instructions_file_path=entity_instructions_file_path, inputs_array=req_array, output_directory=os.getcwd() + "/src/BP_code_generation"+"/Results", file_name=requirements_file_name, query_instructions_file_path=query_instructions_file_path, behavior_instructions_file_path=behavior_instructions_file_path, methodology=methodology, behavior_instructions_type=behavior_instructions_type, entityAndQueriesCache=entityAndQueriesCache)
            retVal.append(generated_code_path)
        return retVal

def loadPreviousHistory(file_path_of_generated_code):
        #we will read the file, then we will set the history accordingly
    with open(file_path_of_generated_code, "r") as file:
        lines = file.readlines()
    history = []
    #user messages are in comments/**/, assistant messages are in the code, both can be multi-lined
    user_message = ""
    assistant_message = ""
    isUser = False
    for line in lines:
        if line.startswith("/*"):
            isUser = True
            if assistant_message:
                history.append({"role": "assistant", "content": assistant_message})
                assistant_message = ""
            # user_message = line
        elif line.startswith("*/"):
            isUser = False
            history.append({"role": "user", "content": user_message})
            user_message = ""
        elif isUser:
            user_message += line
        else:
            assistant_message += line
    if assistant_message:
        history.append({"role": "assistant", "content": assistant_message})
    return history

def select_behavior_instructions_type(allowAll = True):
    behavior_instructions_type = input("\n\n\Select behavior instructions type: \n1 for Basic, \n2 for BasicPlus(recommended), \n2.5 for BasicPlus without examples(recommended), \n3 for DSL, \n3.5 for DSL_Isolated, \n4 for Analysis, \n5 for Default, \n6 for all \n see readme for more information\n your choice:")
    behavior_instructions_types = []
    while True:
        behavior_instructions_type = input("\n\n\Select behavior instructions type: \n1 for Basic, \n2 for BasicPlus(recommended), \n2.5 for BasicPlus without examples(recommended), \n3 for DSL, \n3.5 for DSL_Isolated, \n4 for Analysis, \n5 for Default, \n6 for all \n see readme for more information\n your choice:")
        if behavior_instructions_type == "1":
            behavior_instructions_types = [BehaviorInstructionType.Basic]
            break
        elif behavior_instructions_type == "2":
            behavior_instructions_types = [BehaviorInstructionType.BasicPlus]
            break
        elif behavior_instructions_type == "2.5":
            behavior_instructions_types = [BehaviorInstructionType.BasicPlus_NoExamples]
            break
        elif behavior_instructions_type == "3":
            behavior_instructions_types = [BehaviorInstructionType.DSL]
            break
        elif behavior_instructions_type == "3.5":
            behavior_instructions_types = [BehaviorInstructionType.DSL_Isolated]
            break
        elif behavior_instructions_type == "4":
            behavior_instructions_types = [BehaviorInstructionType.Analysis]
            break
        elif behavior_instructions_type == "5":
            behavior_instructions_types = [BehaviorInstructionType.Default]
            break
        elif behavior_instructions_type == "6":
            if allowAll:
                behavior_instructions_types = [BehaviorInstructionType.Basic, BehaviorInstructionType.BasicPlus, BehaviorInstructionType.DSL, BehaviorInstructionType.DSL_Isolated, BehaviorInstructionType.Analysis]
                break
            else:
                print("Using more than one behavior instructions type is not allowed in this case")

        else:
            print("Invalid option. Please try again.")
    return behavior_instructions_types

def additional_requirements_generation(file_path_of_generated_code):
    history = loadPreviousHistory(file_path_of_generated_code)
    behavior_instructions_types = select_behavior_instructions_type()
    
    all_models= []
    for behavior_instructions_type in behavior_instructions_types:
        model = MyOpenAIApi(model="gpt-4-turbo-2024-04-09", temp=0)
        behavior_instructions_file_path = behavior_instructions_type.value
        model.history = history
        
        #add first value to be system instructions
        instructions = ""
        with open(behavior_instructions_file_path, "r") as file:
                instructions = file.read()

        model.history.insert(0, {"role": "system", "content": instructions})
        model.History_For_Output = history.copy()
        all_models.append(model)    

    #now that we have all the models, we can start the conversation
    choice= input("If you want the chat to be cumulative, enter 1, otherwise enter 2(each response will not consider your previous requirements, but will consider the file it is based on\n")
    print("You can exit the chat by typing exit\n")
    while True:
        input_message = input("Your Req: ")
        if input_message == "exit":
            break
        for model in all_models:
            if choice == "1":
                response = model.chat_with_gpt_cumulative(input_message)
            else:
                response = model.chat_with_gpt(input_message)
            print("ChatGPT:", response)

    # return history

def add_requirement(file_path_of_generated_code, output_file_path):
    history = loadPreviousHistory(file_path_of_generated_code)
    behavior_instructions_types = select_behavior_instructions_type()
    
    all_models= []
    for behavior_instructions_type in behavior_instructions_types:
        model = MyOpenAIApi(model="gpt-4-turbo-2024-04-09", temp=0)
        behavior_instructions_file_path = behavior_instructions_type.value
        model.history = history
        
        #add first value to be system instructions
        instructions = ""
        with open(behavior_instructions_file_path, "r") as file:
                instructions = file.read()

        model.history.insert(0, {"role": "system", "content": instructions})
        model.History_For_Output = history.copy()
        all_models.append(model)

    #now that we have all the models, we can start the conversation
    input_message = input("Your Req: ")
    for model in all_models:
        response = model.chat_with_gpt_cumulative(input_message, method=Methodology.STANDARD, behavior_instructions_type=behavior_instructions_type, demoMode=True)
        print("ChatGPT:", response)
    
    # return history
    #now we need to export the code
    for model in all_models:
        model.export_to_code(full_output_path=output_file_path)

def remove_requirement(file_path_of_generated_code, output_file_path):
    original_history = loadPreviousHistory(file_path_of_generated_code)
    #show the user a list of all his messages and ask him to select the one he wants to delete
    for i, message in enumerate(original_history):
        if message["role"] == "user":
            print(f"{i//2}. {message['content']}")
    choice = input("Enter the number of the message you want to delete:(Notice, it must be a behavioral one)")
    choice = int(choice)*2
    #In theory we can simply remove the user's message and the assistant's message that follows it
    #But we need to check that the assitant's message doesn't include a declaration of an event that was used in a later message
    history_after_choice = original_history[choice+2:]
    #we need to check if the assistant's message includes a declaration of an event(we assume that if Event() function is used, there is a declaration)
    events = exctracting_events.extract_constructor_functionAndEvents(code=original_history[choice+1]["content"])
    if events == []:
        #we can simply remove the user's message and the assistant's message that follows it
        history = original_history[:choice] + original_history[choice+2:]
    else: 
        #we need to check if the assistant's message includes a declaration of an event(we assume that if Event() function is used, there is a declaration)
        #if it does, we need to remove the user's message and the assistant's message that follows it, and all the messages that use the event
        #we will remove the messages that use the event by checking if the event is in the message
        for event in events:
            for i, message in enumerate(history_after_choice):
                if message["role"] == "assistant":
                    if (event["FunctionName"]+"(" in message["content"]) or ("anyEventNameWithData(\""+event["EventName"]+"\"" in message["content"]):#TODO this is a work around.
                        #we will append the function to this message
                        message["content"] = event["FullMatch"]+ "\n" + message["content"]
                        break
        history = original_history[:choice] + history_after_choice
    #now we need to export the code
    model = MyOpenAIApi(model="gpt-4-turbo-2024-04-09", temp=0)#TODO this is a weird work around
    model.history = history
    model.History_For_Output = history
    model.export_to_code(full_output_path=output_file_path)
                                       
                    


    
def generate_UI_code(instructions, ui_requirement_file_path, output_file_dir, output_file_name):
    #first we need to generate the code
    openai_api = MyOpenAIApi(instructions=instructions)
    #read the requirements file
    with open(ui_requirement_file_path, "r") as file:
        requirements = file.read()
    requirements_array = requirements.split("@@@@")
    #generate the code
    for requirement in requirements_array:
        openai_api.chat_with_gpt_cumulative(requirement, method=Methodology.STANDARD, behavior_instructions_type=BehaviorInstructionType.Basic)#using standard methodology and basic behavior instructions because they dont do any special processing(TODO there is a minimal post processing that is done in the standard methodology, change it to be by a boolean flag)
    #export the code
    # code_path = openai_api.export_to_code(...
    #todo the above is a bit of a problem because it doenst fit our current use case, we need to change it to a function called export_ui_code
    code_path = openai_api.export_to_code_UI(output_file_dir,output_file_name.replace(".js",".html"))
    return code_path
if __name__ == "__main__":
    main()