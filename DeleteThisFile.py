import re
from collections import defaultdict

# Sample input code as a string (you can load this from a file if needed)
code = '''
ctx.Entity(id, 'room', {roomType: roomType, hasTap: hasTap});
ctx.populateContext([room('kitchen1', 'kitchen', true), room('room1', 'bedroom', false), room('room2', 'living room', true)]);
'''

# Regular expression patterns


# Function to extract entities and their fields (including id)
def extract_entities(code):
    entity_pattern = r"ctx\.Entity\(\s*(\w+)\s*,\s*'(\w+)'\s*,\s*\{(.*?)\}\s*\);"

    entities = {}
    matches = re.findall(entity_pattern, code)
    for match in matches:
        entity_id, entity_name, fields = match
        field_pairs = [f.strip() for f in fields.split(',')]
        entity_fields = ['id'] + [pair.split(':')[0].strip() for pair in field_pairs]  # Add 'id' as the first field
        entities[entity_name] = {
            'id': entity_id,
            'fields': entity_fields,
            'instances': []
        }
    return entities

# Function to extract instances for each entity and store as a dictionary
def extract_instances(code, entities):
    instance_pattern = r"ctx\.populateContext\(\[(.*?)\]\);"
    instance_details_pattern = r"(\w+)\((.*?)\)"
    instance_matches = re.search(instance_pattern, code)
    if instance_matches:
        instances_str = instance_matches.group(1)
        instance_list = re.findall(instance_details_pattern, instances_str)
        for instance in instance_list:
            entity_name, params = instance
            param_values = [param.strip() for param in params.split(',')]
            if entity_name in entities:
                # Create a dictionary for each instance, mapping fields (including id) to values
                instance_dict = dict(zip(entities[entity_name]['fields'], param_values))
                entities[entity_name]['instances'].append(instance_dict)
    return entities

# Extract entities and instances
entities = extract_entities(code)
entities_with_instances = extract_instances(code, entities)

# Output the results
for entity, details in entities_with_instances.items():
    print(f"Entity: {entity}")
    print(f"  Fields: {details['fields']}")
    print(f"  Instances:")
    for instance in details['instances']:
        print(f"    - {instance}")
