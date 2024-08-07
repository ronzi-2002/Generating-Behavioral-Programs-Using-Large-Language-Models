

import os
import time
import openai
from openai import OpenAI
from dotenv import load_dotenv
from src.BP_code_generation.post_process import post_process


class MyOpenAIApi:
    def __init__(self, model= "gpt-3.5-turbo",api_key=None, instructions= None, temp=0.5, post_process_function=None):#todo add temperature actual default, max_tokens, top_p, frequency_penalty, presence_penalty, stop, and other parameters
        self.api_key = api_key
        self.client = openai
        self.openai = openai

        load_dotenv('.env')
        self.client= OpenAI(organization="org-SkD8EMnX3k2DEFdeuNiRGeDR",api_key=os.getenv("OPENAI_API_KEY"))
        # self.client= OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.history = []
        self.model = model
        self.instructions = instructions
        if self.instructions:
            self.set_instructions(self.instructions)
        # if temp:
        self.temp = temp
        self.post_process_function = post_process_function
    
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
            messages=[
                {"role": "user", "content": message}
            ],
            temperature = self.temp
        )
        return response.choices[0].message.content
    
    def chat_with_gpt_cumulative(self,new_message):
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
        self.history.append({"role": "user", "content": new_message})
        response = self.client.chat.completions.create(
            model=self.model,  # You can use any model you prefer
            messages=self.history,
            temperature = self.temp
        )
        if self.post_process_function:
            post_process_answer = self.post_process_function(response.choices[0].message.content)
            if post_process_answer != None:
                pass#some work needs to be done here before returning the response and updating the history
        post_process_answer = post_process(js_code= self.export_to_code(exportToFile=False), last_resp=response.choices[0].message.content)
        if post_process_answer == "":#No corrections needed
            self.history.append({"role": "assistant", "content": response.choices[0].message.content})
        else:
            self.history.append({"role": "assistant", "content": response.choices[0].message.content})

            new_response = self.chat_with_gpt_cumulative(post_process_answer)
            #pre last assistant message is the one that needs to be corrected
            self.history.pop(-3)
            #remove last user message
            self.history.pop(-2)
            
            return new_response
        # self.history.append({"role": "assistant", "content": response.choices[0].message.content})
        return response.choices[0].message.content
    def add_to_history_gptResponse(self, message):
        self.history.append({"role": "assistant", "content": message})
    def add_to_history_userMessage(self, message):
        self.history.append({"role": "user", "content": message})
    def set_instructions(self, instructions):
        #if the assistant already has a system message in the history, replace it with the new instructions
        if self.history and self.history[0]["role"] == "system":
            self.history[0]["content"] = instructions
        elif len(self.history) > 0:
            self.history[0] = {"role": "system", "content": instructions}#TODO make sure it is the best to make it the first element
        else:
            self.history.append({"role": "system", "content": instructions})
    def export_to_code(self, directory=os.getcwd(), file_name=None,exportToFile=True):
        #create a js file, where each user message is in a comment, and the assistant's response as is.
        string_to_write = ""
        for message in self.history:
            if message["role"] == "user":
                # if there are multiple lines in the message, use multiline comments
                if "\n" in message["content"]:
                    string_to_write += "/*\n"
                    string_to_write += message["content"]
                    string_to_write += "\n*/\n"
                else:
                    string_to_write += f"//{message['content']}\n"
            elif message["role"] == "assistant":
                assistant_response = message["content"]
                #if begins with ```javascript, remove it and the ``` at the end
                if assistant_response.startswith("```javascript"):
                    assistant_response = assistant_response[13:]
                    assistant_response = assistant_response[:-3]

                string_to_write += f"{assistant_response}\n"
        
        #create a file in the same directory as the script and add a timestamp to the file name
        if exportToFile:
            if not file_name:
                xfile_name = "chat_history" + str(time.time()) + ".js"
            #if the directory does not exist, create it
            if not os.path.exists(directory):
                os.makedirs(directory)


            file = open(directory +"/" + file_name, "w")
            file.write(string_to_write)
            file.close()
            print("code has been exported to " + directory +"/" + file_name)
            return directory +"/" + file_name
        return string_to_write
    def get_pretty_response_string(self, response_index):#TODO this is a bit weird, it is because the bot functions are not part of the class, I will fix it
        string_to_write = ""
        response = self.history[response_index]
        if response["role"] == "user":
            # if there are multiple lines in the message, use multiline comments
            if "\n" in response["content"]:
                string_to_write += "/*\n"
                string_to_write += response["content"]
                string_to_write += "\n*/\n"
            else:
                string_to_write += f"//{response['content']}\n"
        elif response["role"] == "assistant":
            assistant_response = response["content"]
            #if begins with ```javascript, remove it and the ``` at the end
            if assistant_response.startswith("```javascript"):
                assistant_response = assistant_response[13:]
                assistant_response = assistant_response[:-3]

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
    myOpenAIApi = MyOpenAIApi(model="gpt-4-turbo", instructions=instructions, temp=0)
    while True:
        input_message = input("You: ")
        if input_message == "exit":
            break
        response = myOpenAIApi.chat_with_gpt_cumulative(input_message)
        print("ChatGPT:", response)
    myOpenAIApi.export_to_code()

def bot_usage_from_array(instructions= None, entity_instructions_file_path=None,query_instructions_file_path=None,behavior_instructions_file_path=None,inputs_array=None, output_directory=None, file_name=None):
    # Example conversation
    temp_file= open("temp_file","w")# in case you want to see it updated in real time in a file https://superuser.com/questions/274961/how-to-automatically-reload-modified-files-in-notepad (dont forget to turn monitoring on)
    if entity_instructions_file_path:
        with open(entity_instructions_file_path, "r") as file:
            instructions = file.read()
    # print(instructions)
    myOpenAIApi = MyOpenAIApi(model="gpt-4-turbo", instructions=instructions, temp=0)
    ambiguity_test = False
    for input_message in inputs_array:
        if input_message in ["" , "\n"]:
            continue
        if ambiguity_test:
            print("Ambiguity Test")
            temp_file.write("Ambiguity Test\n")

            print("You: ", input_message)

            for i in range(5):
                temp_file.write("//" + input_message + "\n")
                response = myOpenAIApi.chat_with_gpt_cumulative(input_message)
                print("ChatGPT:", response)
                # temp_file.write("You: " + input_message + "\n")
                temp_file.write(myOpenAIApi.get_pretty_response_string(-1))
                #remove the last response
                myOpenAIApi.history.pop(-1)
                temp_file.write("\n")
                temp_file.flush()
            myOpenAIApi.history.pop(-1)#remove the last user message
            continue

        # if input_message in ["" , "\n"]:
        #     continue
        if input_message == "Entity INSTRUCTIONS:":
            with open(entity_instructions_file_path, "r") as file:
                instructions = file.read()
            myOpenAIApi.set_instructions(instructions)
            continue
        elif input_message == "Query INSTRUCTIONS:":
            with open(query_instructions_file_path, "r") as file:
                instructions = file.read()
            myOpenAIApi.set_instructions(instructions)
            continue
        elif input_message == "Behavior INSTRUCTIONS:":
            with open(behavior_instructions_file_path, "r") as file:
                instructions = file.read()
            myOpenAIApi.set_instructions(instructions)
            continue
        elif input_message == "Original Requirements:":
            break
        elif input_message == "Ambiguity Test:":
            ambiguity_test = True
            continue    
        temp_file.write("\\\\" + input_message)
        response = myOpenAIApi.chat_with_gpt_cumulative(input_message)
        print("ChatGPT:", response)

        temp_file.write(myOpenAIApi.get_pretty_response_string(-1))
        temp_file.write("\n")
        temp_file.flush()
    if output_directory:
        currTime = time.time()
        generated_code_path = myOpenAIApi.export_to_code(directory=output_directory, file_name=file_name + str(currTime)+".js")
        if ambiguity_test:
            
            #copy temp file to the output directory+file_name+Amb
            temp_file.close()
            with open("temp_file", "r") as file:
                instructions = file.read()
                with open(output_directory + "/" + file_name + str(currTime) + "Amb", "w") as file:
                    file.write(instructions)



    else:
       generated_code_path= myOpenAIApi.export_to_code()
    return generated_code_path
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

if __name__ == "__main__":
    instructions_file_path = "v_3//Bot Instructions"
    instructions_file_path = os.getcwd() + "/src/main/BotInstructions/v_10/Bot Instructions"


    operation_mode = input("Enter 1 for interactive mode, 2 for array mode")
    if operation_mode == "1":
        bot_usage_interactive(instructions_file_path=instructions_file_path)

    else:
        # example_array = ["//Requirement, There are 3 workers. One manager named Steve and 2 cashiers, Emma and Mark. Steve has 10 years of seniority, Emma has 3 and Mark has 5 "
        #                 , "//Requirement: Workers with more than 4 years of experience have a \"senior tag\"", "//Requirement: Senior Workers are recive a 100 dollar check when the day ends, while the others recive a 50 dollar one",
        #                 "//Requirement: After the closing store ring  is rang turn store system off",
        #                 "Workers cant checkout before the system turns off"]
        req_array = ["There are 3 workers. One manager named Steve and 2 cashiers, Emma and Mark. Steve has 10 years of seniority, Emma has 3 and Mark has 5 "
                , "Workers with more than 4 years of experience have a \"senior tag\"", "Senior Workers are recive a 100 dollar check when the day ends, while the others recive a 50 dollar one",
                "After the closing store ring  is rang turn store system off",
                "Workers cant checkout before the system turns off"]
        
        # ask user for the file name or use the default one
        requirements_file_path = input("Enter the requirements file path(or enter D for default): ")
        if requirements_file_path == "D":
            requirements_file_name = "DummyExample"
            # src\main\BotInstructions\Requirements\coffee_machine
            req_array = file_to_array(os.getcwd() + "/src/main/BotInstructions/v_13/Requirements/" + requirements_file_name)
        else:
            requirements_file_name = requirements_file_path.split("/")[-1]
            req_array = file_to_array(requirements_file_path)

        print(req_array)
        entity_instructions_file_path = os.getcwd() + "/src/main/BotInstructions/v_13/Entity Bot Instructions"
        query_instructions_file_path = os.getcwd() + "/src/main/BotInstructions/v_13/Query Bot Instructions"
        behavior_instructions_file_path = os.getcwd() + "/src/main/BotInstructions/v_13/Behavior Bot Instructions"
        bot_usage_from_array(entity_instructions_file_path=entity_instructions_file_path, inputs_array=req_array, output_directory=os.path.dirname(entity_instructions_file_path)+"/Results", file_name=requirements_file_name, query_instructions_file_path=query_instructions_file_path, behavior_instructions_file_path=behavior_instructions_file_path)




def main():
    instructions_file_path = os.getcwd() + "/src/main/BotInstructions/v_10/Bot Instructions"


    operation_mode = input("Enter 1 for interactive mode, 2 for array mode")
    if operation_mode == "1":
        print("Currently not supported")
        # bot_usage_interactive(instructions_file_path=instructions_file_path)

    else:
        # example_array = ["//Requirement, There are 3 workers. One manager named Steve and 2 cashiers, Emma and Mark. Steve has 10 years of seniority, Emma has 3 and Mark has 5 "
        #                 , "//Requirement: Workers with more than 4 years of experience have a \"senior tag\"", "//Requirement: Senior Workers are recive a 100 dollar check when the day ends, while the others recive a 50 dollar one",
        #                 "//Requirement: After the closing store ring  is rang turn store system off",
        #                 "Workers cant checkout before the system turns off"]
        req_array = ["There are 3 workers. One manager named Steve and 2 cashiers, Emma and Mark. Steve has 10 years of seniority, Emma has 3 and Mark has 5 "
                , "Workers with more than 4 years of experience have a \"senior tag\"", "Senior Workers are recive a 100 dollar check when the day ends, while the others recive a 50 dollar one",
                "After the closing store ring  is rang turn store system off",
                "Workers cant checkout before the system turns off"]
        
        # ask user for the file name or use the default one
        requirements_file_path = input("Enter the requirements file path(or enter D for default): ")
        if requirements_file_path == "D":
            requirements_file_name = "DummyExample"
            # src\main\BotInstructions\Requirements\coffee_machine
            req_array = file_to_array(os.getcwd() + "/src/BP_code_generation/RequirementDocs/" + requirements_file_name)
        else:
            requirements_file_name = requirements_file_path.split("/")[-1]
            req_array = file_to_array(requirements_file_path)

        print(req_array)
        entity_instructions_file_path = os.getcwd() + "/src/BP_code_generation/Instructions/Entity Bot Instructions"
        query_instructions_file_path = os.getcwd() + "/src/BP_code_generation/Instructions/Query Bot Instructions"
        behavior_instructions_file_path = os.getcwd() + "/src/BP_code_generation/Instructions/Behavior Bot Instructions"
        return bot_usage_from_array(entity_instructions_file_path=entity_instructions_file_path, inputs_array=req_array, output_directory=os.getcwd() + "/src/BP_code_generation"+"/Results", file_name=requirements_file_name, query_instructions_file_path=query_instructions_file_path, behavior_instructions_file_path=behavior_instructions_file_path)

if __name__ == "__main__":
    main()