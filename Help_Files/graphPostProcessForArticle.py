import re
def fix_dot_file(input_file, output_file):
    # Open the input .dot file and read its entire content
    with open(input_file, 'r') as file:
        content = file.read()

    # Dictionary to store edges and their labels
    edges = {}

    # Regular expression pattern to match edges with labels (multi-line and single-line)
    edge_pattern = re.compile(r'(\d+ -> \d+)\s*\[\s*label\s*=\s*"(.*?)"\s*\];', re.DOTALL)

    # Function to process each match
    def process_match(match):
        edge = match.group(1).strip()  # The edge (e.g., "1 -> 1")
        label = match.group(2).strip()  # The label (e.g., "tapButtonPressed roomId: 'kitchen1'")
        
        # If the edge already exists, append the new label
        if edge in edges:
            edges[edge].append(label)
        else:
            edges[edge] = [label]

        # Return an empty string to remove the matched part from content
        return ''

    # Replace edges with labels by processing each match
    new_content = edge_pattern.sub(process_match, content)

    # Now rebuild the edges with combined labels
    for edge, labels in edges.items():
        combined_label = '\\n'.join(labels)  # Join labels with newline
        new_edge = f'{edge} [ label="{combined_label}" ];\n'
        new_content += new_edge

    # Write the modified content back to the output file
    with open(output_file, 'w') as file:
        file.write(new_content)

    print(f"File has been processed and saved as {output_file}.")


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

# fix_dot_file(updated_file_path, updated_file_path)
# Print the path of the updated file
print("Updated file path:", updated_file_path)