import re

def extract_functions_and_calls_from_file(file_path, output_file_path):
    with open(file_path, 'r') as file:
        js_code = file.read()
    return extract_functions_and_calls(js_code, output_file_path)

def extract_functions_and_calls(js_code, output_file_path=None,search_for_calls_string=None):
    # Regular expression to match function declarations
    func_pattern = r'function\s+(\w+)\s*\((.*?)\)\s*{'
    
    # Regular expression to match function calls
    call_pattern = r'[\(\{,\[]+(\w+)\s*\((.*?)\);'
    call_pattern = r'[({\[]*\b(\w+)\s*\(([^()]*)\)\s*'
    
    # Add the search_for_calls_string to the js_code
    if search_for_calls_string:#TODO this should be the responsibility of the caller, move this to the caller
        js_code += "\n" + search_for_calls_string
    # Find all matches for function declarations in the JavaScript code
    func_matches = re.findall(func_pattern, js_code, re.MULTILINE | re.DOTALL)
    
    # Create a dictionary to store function names and their argument counts
    functions_dict = {}
    
    # Iterate over function declarations and populate the dictionary
    for match in func_matches:
        function_name = match[0]
        arguments = match[1]
        # Count the number of arguments
        num_args = len(re.findall(r'\w+', arguments))
        # Add function name and number of arguments to the dictionary
        functions_dict[function_name] = [num_args, arguments]
    
    # Find all matches for function calls in the JavaScript code
    if search_for_calls_string:
        call_matches = re.findall(call_pattern, search_for_calls_string, re.MULTILINE | re.DOTALL)
    else:
        call_matches = re.findall(call_pattern, js_code, re.MULTILINE | re.DOTALL)
    
    # Create a list to store calls with insufficient arguments
    calls_with_insufficient_args = []
    return_message = ""
    # Iterate over function calls and check if the number of arguments is insufficient
    for match in call_matches:
        function_name = match[0]
        arguments = match[1]
        # Count the number of arguments in the call
        num_args_in_call = len(match[1].split(','))
        # Check if the function exists in the dictionary
        if function_name in functions_dict:
            # Get the expected number of arguments for the function
            expected_num_args = functions_dict[function_name][0]
            needed_arguments = functions_dict[function_name][1]
            # Compare the number of arguments in the call with the expected number
            if num_args_in_call < expected_num_args:
                calls_with_insufficient_args.append((function_name, num_args_in_call))
                #now switch the match to a new string in the `js_code` 
                print (f"You used {function_name} without providing all needed arguments, use an eventSet instead, and provide your new answer instead of the last one")
                return_message = return_message + "\n" + f"You used {function_name} without providing all needed arguments, use an eventSet instead, and provide your new answer instead of the last one"
    
    return functions_dict, calls_with_insufficient_args, return_message

def post_process(js_code, last_resp):
    # Extract functions and their argument counts, and find calls with insufficient arguments
    functions_dict, calls_with_insufficient_args,ret_mes = extract_functions_and_calls(js_code,search_for_calls_string= last_resp)
    return ret_mes
# Example usage:
if __name__ == "__main__":
    #print current working directory
    # Read JavaScript code from a file
    js_file_path= 'src/main/BotInstructions/v_10/Results/our_coffee_machine1715735640.5073185'
    output_file_path = js_file_path.replace('.js', '_afterPostProcess.js')

    # Extract functions and their argument counts, and find calls with insufficient arguments
    functions_dict, calls_with_insufficient_args,ret_mes = extract_functions_and_calls_from_file(js_file_path, output_file_path)

    # Print the dictionary of functions
    print("Functions and their argument counts:")
    for func_name, arg_count in functions_dict.items():
        print(f"{func_name}: {arg_count} argument(s)")

    # Print calls with insufficient arguments
    print("\nCalls with insufficient arguments:")
    for func_name, num_args_in_call in calls_with_insufficient_args:
        print(f"Function '{func_name}' called with {num_args_in_call} argument(s), expected {functions_dict[func_name]} argument(s).")