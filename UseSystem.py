import subprocess
import src.UI_code_generation.exctracting_events as exctracting_events
import src.BP_code_generation.myOpenAiApi as myOpenAiApi
import generateDefultHtml 
import threading
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
class BPLLMMenu(Menu):
    def __init__(self):
        super().__init__("BPLLM Menu")
        self.file_path_of_last_generated_code = None
        self.add_item("Generate BP Code", lambda: self.generate_BP_code())
        self.add_item("Set OpenAI API Key", lambda: self.set_openai_api_key())
        self.add_item("Generate UI Code", lambda: print("Not implemented yet"))
    def generate_BP_code(self):
        self.file_path_of_last_generated_code = myOpenAiApi.main()[0]
        #if item does not exist, add it
        if not any(item.name == "Move to BPProgram Menu With Generated Code" for item in self.menu_items):
            self.add_item("Move to BPProgram Menu With Generated Code", lambda: BPProgramMenu(file_name=self.file_path_of_last_generated_code))
        return self

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
            generateDefultHtml.generate(eventsForGUI, self.GUIFile_path)

        self.isTimeInvolved = self.isTimeInvolved(file_name)
        super().__init__("BPProgram Menu For " + file_name)
        self.add_item("Run BPProgram With Server", lambda: self.run_BPProgram(file_name))
        self.add_item("Run BPProgram With GUI", lambda: self.run_BPProgramWithGUI(file_name))

        
        self.add_item("Generate Graph", lambda: print("Not implemented yet"))
        self.add_item("Change File", lambda: BPProgramMenu)

    def run_BPProgram(self, file_name, compile = True):
        #java -jar .\target\DesignlessProgrammin.jar
        import os
        if compile:
            os.system("mvn package -P\"uber-jar\" -f src/main_client_server_java/pom.xml")
        if self.isTimeInvolved:
            speedFactor = input("You have time events in your file, do you want to speed up the time? (1 for normal speed, 60 for 60 times faster and so on): ")
            process = subprocess.Popen(f"java -jar src\\main_client_server_java\\target\\DesignlessProgramming-0.6-DEV.uber.jar -f {file_name} -t -s -speedFactor {speedFactor}", shell=True) 
        else:
            process = subprocess.Popen(f"java -jar src\\main_client_server_java\\target\\DesignlessProgramming-0.6-DEV.uber.jar -f {file_name} ", shell=True)
        #if there is a GUI system, open 
    def run_BPProgramWithGUI(self, file_name):
        #open the GUI file in the chrome browser
        self.run_BPProgram(file_name, True)
        import webbrowser
       
        webbrowser.open(self.GUIFile_path)
        print("Opening GUI in browser\n\n\n\n\n\n\nn\n\n\n")
    

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
