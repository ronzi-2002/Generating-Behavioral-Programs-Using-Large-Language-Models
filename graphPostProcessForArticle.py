# Ask the user for the input file path
input_file_path = input("Enter the input file path: ")

# Open the input file
with open(input_file_path, 'r') as file:
    text = file.read()

# Replace all occurrences of '\"' with an empty string
new_text = text.replace('\\"', '\'')
new_text = new_text.replace('shape=\"box\"', 'shape=\"point\"')
# Perform further operations on the modified text if needed
# ...

# Print the modified text
print(new_text)
# Create the updated file path
updated_file_path = input_file_path.replace('.txt', '_updated.txt')

# Write the modified text to the updated file
with open(updated_file_path, 'w') as file:
    file.write(new_text)

# Print the path of the updated file
print("Updated file path:", updated_file_path)