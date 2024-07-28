import src.UI_code_generation.exctracting_events as exctracting_events
import generateDefultHtml 
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
        super().__init__("BPLLM Menu. Still in development")

class BPProgramMenu(Menu):
    def __init__(self):
        #At first get the user to select a file
        import os
        optionalFiles = os.listdir("src/main_client_server_java/src/main/resources")
        file_name = input("Enter the bpSystem name(or enter h to get all optional files): ")
        while file_name == "h" or not file_name in optionalFiles:
            print("Optional files: ")
            #print all the files in src\main_client_server_java\src\main\resources
            print(os.listdir("src/main_client_server_java/src/main/resources"))
            file_name = input("Enter the file name: ")
        #check if there is a gui for this file. The gui file should be named the same as the file with .html instead of .js 
        self.GUIFile = "DefaultGUI_"+file_name.replace(".js", ".html")
        optionalFiles = os.listdir("src/main_client_server_java/src/main/UI_Resources")
        if file_name.replace(".js", ".html") in optionalFiles:
            self.GUIFile = str(os.getcwd())+"/src/main_client_server_java/src/main/UI_Resources/"+file_name.replace(".js", ".html")
        else:
            #We need to create a GUI file for this file
            file_path = str(os.getcwd()) + "/src/main_client_server_java/src/main/resources/" + file_name

            events = exctracting_events.extract_events(file_path)
            waitedEvents, requestedEvents, requestedAndWaitedEvents = exctracting_events.get_division_by_status(events)
            eventsForGUI= {}
            for event in waitedEvents:
                
                event_name = event['EventName']
                params_keys = event['parameters'].keys()
                #crete an array of the parameters
                params = []
                for key in params_keys:
                    params.append(str(key))

                eventsForGUI[event_name] = params            #create the GUI file
            generateDefultHtml.generate(eventsForGUI, self.GUIFile)


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

        os.system(f"java -jar src\\main_client_server_java\\target\\DesignlessProgramming-0.6-DEV.uber.jar {file_name}")
        #if there is a GUI system, open 
    def run_BPProgramWithGUI(self, file_name):
        #open the GUI file in the chrome browser
        # Create a separate thread to run the BPProgram
        import os
        os.system("mvn package -P\"uber-jar\" -f src/main_client_server_java/pom.xml")

        import threading
        bp_thread = threading.Thread(target=self.run_BPProgram, args=(file_name,False))
        bp_thread.start()
        import webbrowser

        webbrowser.open(self.GUIFile)
        print("Opening GUI in browser\n\n\n\n\n\n\nn\n\n\n")




def main():
    current_menu = MainMenu()
    while True:
        current_menu.display()
        choice = input("Enter menu item number: ")
        if choice == "q":
            break
        ret_val = current_menu.select_item(int(choice))
        #if ret_val is a menu, then we need to update current_menu
        if isinstance(ret_val, Menu):
            current_menu = ret_val

if __name__ == "__main__":
    main()
