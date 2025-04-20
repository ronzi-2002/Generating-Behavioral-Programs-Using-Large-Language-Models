import subprocess
import time
import src.UI_code_generation.exctracting_events as exctracting_events
import src.BP_code_generation.myOpenAiApi as myOpenAiApi
import UI_code_generation.generateDefaultHtml as generateDefaultHtml 
import threading
DEBUG_MODE = False
class MenuItem:
    def __init__(self, name, function):
        self.name = name
        self.function = function

class Menu:
    def __init__(self,name):
        self.menu_items = []
        self.name = name
        


    def add_item(self, name, function):
        item = MenuItem(name, function)
        self.menu_items.append(item)

    def display(self):
        print(f"Menu: {self.name}")
        for index, item in enumerate(self.menu_items):
            print(f"    {index + 1}. {item.name}")

    def select_item(self, index):
        if index == "M":
            return MainMenu()
        #if int is not a number, print invalid menu item
        try:
            index = int(index)
        except:
            print("Invalid menu item!")
            return self
        if index >= 1 and index <= len(self.menu_items):
            item = self.menu_items[index - 1]
            return item.function()
        else:
            print("Invalid menu item!")
            return self

class MainMenu(Menu):
    def __init__(self):
        super().__init__("Main Menu")
        self.add_item("Use BPLLM Menu", lambda: BPLLMMenu())
        self.add_item("Run BPProgram Menu", lambda: BPProgramMenu())
class EditBPProgramMenu(Menu):
    def __init__(self):
        super().__init__("Edit BPProgram Menu")
        #first we need to get the file name of the BPProgram
        self.file_path_of_Bp_Program = input("Enter the file path of the previously generated code: \n Notice that your file should be in the format that the requirements are between \\* and */: , as generated in the new versions\n")
        self.output_file_path = self.file_path_of_Bp_Program.replace(".js", "_EAt"+time.strftime("%Y%m%d-%H%M%S")+".js")#Edited At
        
        #copy the file to the output file, create the output file if it does not exist
        import os
        if not os.path.exists(self.output_file_path):
            open(self.output_file_path, "w").close()
        import shutil
        shutil.copy(self.file_path_of_Bp_Program, self.output_file_path)
        self.file_path_of_Bp_Program =self.output_file_path

        print("Your edits will be saved in ", self.output_file_path)
        self.add_item("add requirement", lambda: self.add_requirement())
        self.add_item("remove requirement", lambda: self.remove_requirement())
        self.add_item("Modify requirement", lambda: self.modify_requirement())
        self.add_item("Move to BPProgram Menu", lambda: BPProgramMenu(file_name=self.file_path_of_Bp_Program))
    def add_requirement(self):
        myOpenAiApi.add_requirement(self.file_path_of_Bp_Program, self.output_file_path)
        print("Requirement added successfully")
        return self
    def remove_requirement(self):
        myOpenAiApi.remove_requirement(self.file_path_of_Bp_Program, self.output_file_path)
        print("Requirement removed successfully")
        return self
    def modify_requirement(self):
        myOpenAiApi.modify_requirement(self.file_path_of_Bp_Program, self.output_file_path)
        print("Requirement modified successfully")
        return self
         
class BPLLMMenu(Menu):
    def __init__(self):
        super().__init__("BPLLM Menu")
        self.file_path_of_last_generated_code = None
        self.add_item("Generate BP Code For Requirement Doc", lambda: self.generate_BP_code())
        # self.add_item("Generate BP Code- additional requirements", lambda: self.generate_Additional_BP_code())
        self.add_item("Edit Existing BP Code", lambda: EditBPProgramMenu())
        self.add_item("Set OpenAI API Key", lambda: self.set_openai_api_key())
        self.add_item("Generate UI Code", lambda: self.generate_UI_code())
    def generate_BP_code(self):
        self.file_path_of_last_generated_code = myOpenAiApi.main()[0]
        #if item does not exist, add it
        if not any(item.name == "Move to BPProgram Menu With Generated Code" for item in self.menu_items):
            self.add_item("Move to BPProgram Menu With Generated Code", lambda: BPProgramMenu(file_name=self.file_path_of_last_generated_code))
        return self
    def generate_Additional_BP_code(self):
        #first, we need the some previously generated code file
        file_path = input("Enter the file path of the previously generated code: \n Notice that your file should be in the format that the requirements are between \\* and */: , as generated in the new versions\n")
        history = myOpenAiApi.additional_requirements_generation(file_path)
        # print("history: ", history)
        #export the history to a file
        if DEBUG_MODE:
            with open("History.txt", "w") as file:
                for line in history:
                    file.write(str(line) + "\n")
        
    def generate_UI_code(self):
        #whould we generate the UI code for the last generated code?
        if self.file_path_of_last_generated_code != None:
            choice = input("Do you want to generate the UI code for the last generated code? (y/n): ")
            if choice == "y":
                path = self.file_path_of_last_generated_code
            else:
                path = input("Enter the path of the BP code file: ")
        else:
            path = input("Enter the path of the BP code file: ")
            
        self.file_path_of_last_generated_code = path
        instructions = self.generate_instructions_for_UI_generation(path)

        #Now we need the UI requirements
        UI_requirements_path = input("Enter the file path of the UI requirements or enter D to use the default dummy UI requirements: ")
        if UI_requirements_path == "D":
            UI_requirements_path = "UI_example_requirements"
        #generate the UI code, practically, we just need to call the api.
        UI_code_path = myOpenAiApi.generate_UI_code(instructions,UI_requirements_path, "src/main_client_server_java/src/main/UI_Resources", path.split("/")[-1].split("\\")[-1])
        print("ui code exported to ", UI_code_path)
        if not any(item.name == "Move to BPProgram Menu With Generated" for item in self.menu_items):
            self.add_item("Move to BPProgram Menu With Generated Code", lambda: BPProgramMenu(file_name=self.file_path_of_last_generated_code))
        
        return self




    def generate_instructions_for_UI_generation(self, BP_code_file_path):
        ui_base_instructions_path = "src/UI_code_generation/instruction_template"
        ui_instructions =""
        with open(ui_base_instructions_path, "r") as file:
            ui_instructions = file.read()
        #generate the instructions for the UI code generation
        #first, we need to extract the events from the BP code file
        events = exctracting_events.extract_events(BP_code_file_path)
        waitedEvents, requestedEvents, requestedAndWaitedEvents = exctracting_events.get_division_by_status(events)
        #in the file, under "###Events You need to send:" we need to add the events that are waited
        #"\n".join([f"-{event['EventName']}({','.join(list(event['parameters'].keys()))})" for event in allEvents]))
        if len(waitedEvents) == 0:
            ui_instructions = ui_instructions.replace("###Events You need to send:", "###Events You need to send:\n" + "*There are no events you can send")
        else:
            ui_instructions = ui_instructions.replace("###Events You need to send:", "###Events You need to send:\n"+"\n".join([f"-{event['EventName']}({','.join(list(event['parameters'].keys()))})" for event in waitedEvents]))
        #in the file, under "###Events you need to listen/react to and cant never send:"
        if len(requestedEvents) == 0:
            ui_instructions = ui_instructions.replace("###Events you need to listen/react to and cant never send:", "###Events you need to listen/react to and cant never send:\n" + "*There are no events you can listen to and cant never send")
        else:
            ui_instructions = ui_instructions.replace("###Events you need to listen/react to and cant never send:", "###Events you need to listen/react to and cant never send:\n"+"\n".join([f"-{event['EventName']}({','.join(list(event['parameters'].keys()))})" for event in requestedEvents]))
        #in the file, under "Additional events you can refer to, you can both wait to receive them from the backend or send them yourself:"
        if len(requestedAndWaitedEvents) == 0:
            ui_instructions = ui_instructions.replace("Additional events you can refer to, you can both wait to receive them from the backend or send them yourself:", "")
        else:
            ui_instructions = ui_instructions.replace("Additional events you can refer to, you can both wait to receive them from the backend or send them yourself:", "Additional events you can refer to, you can both wait to receive them from the backend or send them yourself:\n"+"\n".join([f"-{event['EventName']}({','.join(list(event['parameters'].keys()))})" for event in requestedAndWaitedEvents]))
        #Handeling Entities:
        entities_with_instances = exctracting_events.extract_entitiesAndInstances(BP_code_file_path)
        # Output the results
        entity_instances = ""
        for entity, details in entities_with_instances.items():
            # print(f"Entity: {entity}")
            # print(f"  Fields: {details['fields']}")
            # print(f"  Instances:")
            # for instance in details['instances']:
            #     print(f"    - {instance}")
            entity_instances += f"Entity: {entity}\n"
            entity_instances += f"  Fields: {details['fields']}\n"
            entity_instances += f"  Instances:\n"
            for instance in details['instances']:
                entity_instances += f"    - {instance}\n"

        ui_instructions = ui_instructions.replace("### Entities:", "### Entities:\n" + entity_instances)

        
        #save to some temporary file for debugging
        if DEBUG_MODE:
            with open("temp_instructions.txt", "w") as file:
                file.write(ui_instructions)
        return ui_instructions

         
    def set_openai_api_key(self):
        key = input("Enter your OpenAI API key: ")
        #switch the value of the key in the .env file
        #if env file does not exist, create it
        try:
            with open(".env", "r") as file:
                lines = file.readlines()
            with open(".env", "w") as file:
                for line in lines:
                    if line.startswith("OPENAI_API_KEY="):
                        file.write(f"OPENAI_API_KEY={key}\n")
                    else:
                        file.write(line)
        except:
            with open(".env", "w") as file:
                file.write(f"OPENAI_API_KEY={key}\n")

        print("API key has been set successfully")
        return self


class BPProgramMenu(Menu):
    def __init__(self, file_name = None):
        self.continue_event = threading.Event()
        #At first get the user to select a file
        import os
        optionalFiles = os.listdir("src/main_client_server_java/src/main/resources")
        if file_name == None:
            file_name = input("Enter the bpSystem name(or enter h to get all optional files currently in resources): ")
        #Check if file exists
        while file_name == "h" or (not file_name in optionalFiles and not os.path.isfile(file_name)): 
            print("Optional files: ")
            #print all the files in src\main_client_server_java\src\main\resources
            optionalFiles = os.listdir("src/main_client_server_java/src/main/resources")
            for index, file in enumerate(optionalFiles):
                print(f"    {index + 1}. {file}")
            file_name = input("Enter the file name or its index: ")
            try:
                file_name = int(file_name)
                file_name = optionalFiles[file_name - 1]
            except:
                pass
        if(not file_name in optionalFiles):#the file is not in the resources folder, copy it to the resources folder
            file_path = file_name
            #the file name is the last part of the path(can be a full path seperated by / or \\)
            file_name = file_name.split("/")[-1]
            file_name = file_name.split("\\")[-1]
            
             

            import shutil
            print(shutil.copy(file_path, "src/main_client_server_java/src/main/resources"))
        self.file_path_of_Bp_Program = "src/main_client_server_java/src/main/resources/" + file_name
        #check if there is a gui for this file. The gui file should be named the same as the file with .html instead of .js 
        self.GUIFile_path =str(os.getcwd())+ "/src/main_client_server_java/src/main/UI_Resources/DefaultGUI_"+file_name.replace(".js", ".html")
        optionalFiles = os.listdir("src/main_client_server_java/src/main/UI_Resources")
        if file_name.replace(".js", ".html") in optionalFiles:
            self.GUIFile_path = str(os.getcwd())+"/src/main_client_server_java/src/main/UI_Resources/"+file_name.replace(".js", ".html")
        elif  "DefaultGUI_"+file_name.replace(".js", ".html") in optionalFiles:
            self.GUIFile_path = str(os.getcwd())+"/src/main_client_server_java/src/main/UI_Resources/DefaultGUI_"+file_name.replace(".js", ".html")
        else:
            #We need to create a GUI file for this file
            file_path = str(os.getcwd()) + "/src/main_client_server_java/src/main/resources/" + file_name

            events = exctracting_events.extract_events(file_path)
            waitedEvents, requestedEvents, requestedAndWaitedEvents = exctracting_events.get_division_by_status(events)
            eventsForGUI= {}
            for event in waitedEvents + requestedAndWaitedEvents:
                
                event_name = event['EventName']
                params_keys = event['parameters'].keys()
                #crete an array of the parameters
                params = []
                for key in params_keys:
                    params.append(str(key))

                eventsForGUI[event_name] = params            #create the GUI file
            generateDefaultHtml.generate(eventsForGUI, self.GUIFile_path)


        file_name = self.generated_code_to_BP_engine_adapted(self.file_path_of_Bp_Program).split("/")[-1].split("\\")[-1]
        print("The file name is: ", file_name)
        self.isTimeInvolved = self.isTimeInvolved(file_name)
        super().__init__("BPProgram Menu For " + file_name)
        self.add_item("Run BPProgram With Server", lambda: self.run_BPProgram(file_name))
        self.add_item("Run BPProgram With GUI", lambda: self.run_BPProgramWithGUI(file_name))

        
        self.add_item("Generate Graph", lambda: self.generate_graph(file_name))
        self.add_item("Change File", lambda: BPProgramMenu)
    
    def generated_code_to_BP_engine_adapted(self,generated_code_path):
        '''
        We need to make a static post processing to the generated code to make it compatible with the BP engine.
        The BP engine does not support the following:
        1. The use of the 'requestOne' inside the sync. For example, the following code is not supported: sync({requestOne: [<list of events>]}); We need to change it to sync({request: [<list of events>]}).
        2. The use of the 'requestAll' inside the sync. For example, the following code is not supported: sync({requestAll: [<list of events>]}); We need to change it to 'RequestAll(<list of events>)'.
            *IF request all is asked together with block/wait we dont support it yet.
        *The function currently supports only if requestOne and requestAll are asked first in the sync. TODO: support if they are asked later in the sync.
        '''
        with open(generated_code_path, "r") as file:
            lines = file.readlines()
        for index, line in enumerate(lines):
            if "sync({requestOne:" in line:
                #replace the line
                lines[index] = line.replace("sync({requestOne:", "sync({request:")
            if "sync({requestAll:" in line:
                # Extract the list of events
                start_index = line.find("[")
                end_index = line.find("]") + 1
                events_list = line[start_index:end_index]
                # Replace the line with RequestAll
                lines[index] = f"RequestAll{events_list};\n"
        # Write the lines back to a new file
        adapted_file_path = generated_code_path.replace(".js", "_ABPE.js")#Adapted for BP engine
        with open(adapted_file_path, "w") as file:
            for line in lines:
                file.write(line)
        return adapted_file_path

    def run_BPProgram(self, file_name, compile = True, gui_file_path = None):
        #java -jar .\target\DesignlessProgrammin.jar
        import os
        if compile:
            #first check if you have maven installed
            if os.system("mvn package -P\"uber-jar\" -f src/main_client_server_java/pom.xml") == 0:
                print("Compiled successfully")
            else:
                print("Error in compiling the Java code")
                return
        if self.isTimeInvolved:
            speedFactor = input("You have time events in your file, do you want to speed up the time? (1 for normal speed, 60 for 60 times faster and so on): ")
            process = subprocess.Popen(f"java -jar src\\main_client_server_java\\target\\DesignlessProgramming-0.6-DEV.uber.jar -f {file_name} -t -s -speedFactor {speedFactor}", shell=True) 
        else:
            if gui_file_path == None:
                process = subprocess.Popen(f"java -jar src\\main_client_server_java\\target\\DesignlessProgramming-0.6-DEV.uber.jar -f {file_name} ", shell=True)
            else:#We need to understand what events are used in the ui.
                events = exctracting_events.extract_events(self.file_path_of_Bp_Program)
                event_names = [event['EventName'] for event in events]
                #check if the event is in the gui_file
                gui_code = open(gui_file_path, "r", encoding="utf-8").read()
                used_event_names = []
                for event_name in event_names:
                    if event_name in gui_code:
                        used_event_names.append(event_name)
                process = subprocess.Popen(f"java -jar src\\main_client_server_java\\target\\DesignlessProgramming-0.6-DEV.uber.jar -f {file_name} -e {','.join(used_event_names)}", shell=True)

        #if there is a GUI system, open 
    def run_BPProgramWithGUI(self, file_name):
        #open the GUI file in the chrome browser
        self.run_BPProgram(file_name, True, self.GUIFile_path)
        import webbrowser
        browsers = webbrowser._browsers.items()
        #if browsers is dict_items([]), empty. 
        webbrowser.get().open(self.GUIFile_path,2)
        # if not browsers:
        #     print("No browser found, please set a browser as the default browser")
        #     return
        # webbrowser.open(self.GUIFile_path,2)

        print(f"\n\n\nOpening GUI in browser\n in case the browser does not open, please open the file:\n {self.GUIFile_path}\n in a browser by clicking on it\n\n\n")
    

    def isTimeInvolved(self, file_name):#TODO this is a bit naive.
        #check if the file has a time event
        file_path = "src/main_client_server_java/src/main/resources/" + file_name
        #check if TimeToBe appears in the file
        with open(file_path, "r") as file:
            lines = file.readlines()
        for line in lines:  
            if "TimeToBe(" in line:
                return True
        return False

    def generate_graph(self, file_name):
        print("currently under fix, because of mvn problems with the StateSpaceMapper version")
        return
        import os
        #Before generating the graph, we need to ask the user if they want to add the external events
        choice = input("Do you want to add additional behavior/entity to the graph? (b for behavior, e for entity, else for none): ")
        if not (choice == "b" or choice == "e"):
            pass#nothing is needed to be done. before generating the graph
        else:
            self.output_file_path = self.file_path_of_Bp_Program.replace(".js", "_EAt"+time.strftime("%Y%m%d-%H%M%S")+".js")
        
            #copy the file to the output file, create the output file if it does not exist
            import os
            if not os.path.exists(self.output_file_path):
                open(self.output_file_path, "w").close()
            import shutil
            shutil.copy(self.file_path_of_Bp_Program, self.output_file_path)
            self.file_path_of_Bp_Program =self.output_file_path

            print("Your edits will be saved in ", self.output_file_path)
            print("This file will be used to generate the graph")
            while choice == "b" or choice == "e":
                if choice == "b":
                    myOpenAiApi.add_behavioral_requirement_for_graph_generation(self.file_path_of_Bp_Program, self.output_file_path)
                elif choice == "e":
                    myOpenAiApi.add_entity_requirement_for_graph_generation(self.file_path_of_Bp_Program, self.output_file_path)
                choice = input("Do you want to add additional behavior/entity to the graph? (b for behavior, e for entity, else for none): ")
            file_name = self.output_file_path.split("/")[-1].split("\\")[-1]



        fileDir = ""

        # Compile the Java code
        if os.system("mvn package -P\"uber-jar\" -f src/main_client_server_java/pomGraph.xml") == 0:
        # if True:  
            # Run the jar and capture output
            process = subprocess.Popen(
                f"java -jar src\\main_client_server_java\\target\\DesignlessProgramming-0.6-DEV.uber.jar \"{file_name}\" HandleExternalEvents.js",
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                universal_newlines=True
            )

            # Store the output and error
            stdout, stderr = process.communicate()
            if process.returncode == 0:
                print("Output:")
                print(stdout)  # Or store it in a variable for further use
                ##one of the line in the output is // Exporting space to: <fileDir>
                ##we need to extract the fileDir
                
                for line in stdout.split("\n"):
                    if "// Exporting space to: " in line:
                        fileDir = line.split("// Exporting space to: ")[1]
                        break
            else:
                print("Error:")
                print(stderr)
        else:
            print("Error in compiling the Java code")
        if fileDir == "":
            print("Error in exporting the graph")
            return self
        export_file_name = file_name + "+HandleExternalEvents.js.dot"
        full_export_file_path = fileDir+"/" + export_file_name 
        print (f"Graph exported to {full_export_file_path}")

        #open the graph in the browser
        import urllib.parse

        graphDot = open(full_export_file_path, "r").read()
        encoded_path = urllib.parse.quote(graphDot)
        graphUrl = f"https://dreampuf.github.io/GraphvizOnline/#{encoded_path}"
        print("If the browser does not open, please open the following link in the browser: ", graphUrl)
        import webbrowser
        webbrowser.open(graphUrl)
        return self
def main():
    current_menu = MainMenu()
    print("You Can Always Go Back To The Main Menu By Entering M")
    while True:
        current_menu.display()
        choice = input("Enter menu item number: ")
        if choice == "q":
            break
        ret_val = current_menu.select_item(choice)
        #if ret_val is a menu, then we need to update current_menu
        if isinstance(ret_val, Menu):
            current_menu = ret_val

if __name__ == "__main__":
    main()



