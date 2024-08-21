from codebleu import calc_codebleu

# prediction = "def add ( a , b ) :\n return a + b"
# reference1 = "def sum ( first , second ) :\n return second + first"
# reference2 = "def add ( a , b ) :\n return a + b"
# result = calc_codebleu([reference1], [prediction], lang="javascript", weights=(0.25, 0.25, 0.25, 0.25), tokenizer=None)
# print(result)
# # {
# #   'codebleu': 0.5537, 
# #   'ngram_match_score': 0.1041, 
# #   'weighted_ngram_match_score': 0.1109, 
# #   'syntax_match_score': 1.0, 
# #   'dataflow_match_score': 1.0
# # }
# result = calc_codebleu([reference2], [prediction], lang="javascript", weights=(0.25, 0.25, 0.25, 0.25), tokenizer=None)
# print(result)
# result = calc_codebleu([reference1, reference2], [prediction,prediction], lang="javascript", weights=(0.25, 0.25, 0.25, 0.25), tokenizer=None)
# print(result)

prediction_print_TwiceInlop = "function print(){for (var i = 0; i < 2; i++) {console.log(\"Hello\")}}"
reference1_print_Twice = "function print(){\n console.log(\"Hello\")\n console.log(\"Hello\")\n}"
# reference2_print_Twice = "for i in range(2):\n print(\"Hello\")"
result = calc_codebleu([reference1_print_Twice], [prediction_print_TwiceInlop], lang="javascript", weights=(0.1, 0.1, 0.4, 0.4), tokenizer=None)
print(result)

prediction_print_BP_wrong_query="function one(){}\n ctx.bthread('bthreadName', 'query1', function(){console.log(\"Hello\")})" 
reference1_print_Twice_print_BP_wrong_query="function one(){}\n ctx.bthread('bthreadName', 'query2', function(){console.log(\"Hello\")})" 
result = calc_codebleu([reference1_print_Twice_print_BP_wrong_query], [prediction_print_BP_wrong_query], lang="javascript", weights=(0.1, 0.1, 0.4, 0.4), tokenizer=None)
print(result)