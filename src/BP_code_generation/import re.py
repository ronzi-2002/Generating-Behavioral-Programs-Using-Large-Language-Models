import re

def post_process(code):
    # Regular expression to match ctx.bthread with an empty array
    pattern = r"ctx\.bthread\('([^']+)'\,\s*\[\]\,\s*function\(\)\{"
    
    # Replace the matched pattern with the desired format
    processed_code = re.sub(pattern, r"bthread('\1', function(){", code)
    
    return processed_code

# Example usage:
code = """
 ctx.bthread('bthreadName', [], function(){
    // some code
    dsds
    ds
    ds
    ds
    dsd
    sd
    sd
    sd
    sd
    ddssdsdsdsd
});
"""
processed_code = post_process(code)
print(processed_code)
