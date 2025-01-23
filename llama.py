#Import all necessary libraries for Flask, ollama and langchain
from flask import Flask, request, jsonify, render_template
from langchain_ollama import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
import speech_recognition as sr
import os #Imported for file operations(ex: deleting files)
import json #Imported for handling Json data

app = Flask(__name__)

# Initialize the model that will be used. Code could be changed to any ollama model currently available.
model = OllamaLLM(model="llama3.1")


@app.route('/')
def index():
    return render_template('index.html') #Using Flask render the html template

#Intialize variables that will be globally used. Default they have nothing assigned
context = "" 
conversation = ""
last_modelType = "basic"  # Default model type
last_customPrompt = "" 

@app.route('/ask', methods=['POST']) #Method that takes the user input, modelType and custom prompt from the frontend, retrieves the data and passes it to the ollama AI model for a response
def ask():
    global context, custom_prompt, conversation , last_customPrompt, last_modelType
    data = request.json
    user_input = data.get("question")
    model_type = data.get("modelType")
    custom_prompt = data.get("customPrompt")
    last_modelType = data.get("modelType", "basic") 
    last_customPrompt = custom_prompt
    context = conversation #Set the context of the conversation equal to the ongoing conversation

    # Templates for different pre-made conversation types
    templates = {
    "basic": """
    Answer the question or comment the user enters below. You are a basic assistant model who provides simple, accurate and concise responses. You maintain a neutral tone and sometimes use humor to converse with the user but not often.
    Here is the conversation history: {context}

    Question: {question}

    Answer: 
    """,

    "comedic": """
    Answer the question or comment the user enters below. You are a friendly, personal assistant model who cracks jokes once in a while, has a never ending number of jokes. You aren't afraid to say some curse words like fuck, bitch, pussy etc occasionally.
    Here is the conversation history: {context}

    Question: {question}

    Answer: 
    """,
    "serious": """
    Answer the question or comment the user enters below. You are a serious and professional assistant model who provides accurate and detailed responses. You avoid humor and focus on delivering precise information.
    Here is the conversation history: {context}

    Question: {question}

    Answer: 
    """,
    "assistant": """
    Answer the question or comment the user enters below. You are a helpful and friendly personal assistant model who provides useful information and assistance. You maintain a polite and professional tone.
    Here is the conversation history: {context}

    Question: {question}

    Answer: 
    """
    ,
    "history buff": """
    Answer the question or comment the user enters below. You are a historian and you know everything there is to know about history.
    Here is the conversation history: {context}

    Question: {question}

    Answer: 
    """
    ,
    "philosopher": """
    Answer the question or comment the user enters below. You are a philosopher and you know everything about philosophy.
    Here is the conversation history: {context}

    Question: {question}

    Answer: 
    """
     ,
    "sports buff": """
    Answer the question or comment the user enters below. You are a sport enthusiast and you know everything their possibly could e about sports about sports.
    Here is the conversation history: {context}

    Question: {question}

    Answer: 
    """
    ,
    "writer": """
    Answer the question or comment the user enters below. You are a writer and you know everything about literature and writing papers, poems, leters etc.
    Here is the conversation history: {context}

    Question: {question}

    Answer: 
    """
    ,

    "coder": """
    Answer the question or comment the user enters below. You are a coder and you know everything about coding and programming. You can program large applications and solve hard problems. You also explain how to do code.
    Here is the conversation history: {context}

    Question: {question}

    Answer: 
    """
}

    if user_input:
        # Select the appropriate template
        if custom_prompt: #If user enters a custom template it will be made here for the AI to be personalized as 
            template = f"""
            {custom_prompt}. Be whatever it says.
            Here is the conversation history: {{context}}

            Question: {{question}}

            Answer: 
            """
            # Save the custom template
            templates["custom"] = template

        elif last_customPrompt:#If there is a last custom prompt created upon opening the chat it is passed to the AI model instead
            template = f"""
            {last_customPrompt}
            Here is the conversation history: {{context}}

            Question: {{question}}

            Answer: 
            """
            # Save the custom template
            templates["custom"] = template
        else:
            template = templates.get(model_type, templates["assistant"])

        # Create the prompt
        prompt = ChatPromptTemplate.from_template(template)
        chain = prompt | model

        # Get the response from the Llama model
        result = chain.invoke({"context": context, "question": user_input})
        # Clean up the result by stripping unnecessary whitespace or characters
        result = result.strip() if result else "Sorry, I didn't get that."
        # Add user input and bot response to context for history
        return jsonify({"answer": result})
    
    return jsonify({"error": "No question provided"}), 400

CHAT_NAMES_FILE = 'saved_chats.json' #Save chat names to json file for retrival 

def load_chat_names():
    #Loads the list of chat names from the file
    try:
        with open(CHAT_NAMES_FILE, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return []

def save_chat_names(chat_names):
    #Saves the list of chat names to the file 
    with open(CHAT_NAMES_FILE, 'w') as f:
        json.dump(chat_names, f)

@app.route('/save_chat', methods=['POST']) #Function that is ran when user clicks save chat. 
def save_chat():#Saves the chat in format of conversation, customPrompt, modelSelect, chatName and context 
    global last_opened_chat,conversation
    data = request.get_json()
    conversation = data.get("conversation")
    custom_prompt = data.get("customPrompt")
    modelType = data.get("modelSelect")
    chat_name = data.get('chatName', last_opened_chat)  # Use last_opened_chat as default. If no chat name is provided a base on will be given

    if conversation:
        # Sanitize chat_name to create a valid filename with no whitespace
        sanitized_chat_name = chat_name.replace(" ", "_").replace("/", "_")
        chat_file = f"{sanitized_chat_name}.json"

        # Structure for the chat to be saved as
        updated_chat = {
            "conversation": conversation,
            "customPrompt": custom_prompt,
            "modelSelect": modelType,
            "chatName": chat_name,
            "context": conversation  #Context is assigned to be same as conversation as previously stated in ask function
        }

        # Save the updated chat data to the specific file by dumping the data
        with open(chat_file, 'w') as file:
            json.dump(updated_chat, file, indent=4)

        # Update last_opened_chat only if a chatName was provided
        if chat_name: 
            last_opened_chat = chat_name

        # Update and save chat names
        chat_names = load_chat_names()
        if chat_name not in chat_names: 
            chat_names.append(chat_name) 
        save_chat_names(chat_names)

        return jsonify({"status": "success"})
    return jsonify({"error": "No conversation provided"}), 400


@app.route('/autoSave_chat', methods=['POST'])#Function that is ran/called from frontend when user enters a new message into an already previously saved chat 
def autoSave_chat():#Auto Saves chat if a chat was already saved and saves in the same format as before  
  global last_opened_chat, custom_prompt,conversation, last_modelType, last_customPrompt
  data = request.get_json()

  # Extract conversation details from request
  conversation = data.get("conversation")
  modelType = data.get("modelSelect")
  custom_prompt = last_customPrompt #Get the last customprompt that the automatically saved chat had
  chat_name = last_opened_chat  #Use last_opened_chat as the chat name for new chats to be automatically saved to 

  if conversation:
    # Prioritize using the provided chatName if available
    if chat_name:
      sanitized_chat_name = chat_name.replace(" ", "_").replace("/", "_")
    else:
      # Fallback to last_opened_chat if no chatName provided
      sanitized_chat_name = last_opened_chat.replace(" ", "_").replace("/", "_")
    chat_file = f"{sanitized_chat_name}.json"

    # Structure for the auto saved conversation file
    updated_chat = {
      "conversation": conversation,
      "customPrompt": custom_prompt,
      "modelSelect": modelType,
      "chatName": chat_name,
      "context": conversation
    }

    # Save the updated chat data to the specific file and completely overwrite the old jsons files data
    with open(chat_file, 'w') as file:
      json.dump(updated_chat, file, indent=4)

    # Update last_opened_chat only if chatName was provided in the request
    if chat_name:
      last_opened_chat = chat_name

    return jsonify({"status": "success", "message": "Chat saved successfully!"})

  return jsonify({"error": "No conversation provided"}), 400


# Function to load previously saved chats for a specific chat name
@app.route('/load_chats', methods=['GET'])
def load_all_chats():
    chats = []
    chat_names = load_chat_names()

    for chat_name in chat_names:
        try:
            with open(f"{chat_name.replace(' ', '_').replace('/', '_')}.json", 'r') as file:
                chat_data = json.load(file)
                chat_data['chatName'] = chat_name 
                chats.append(chat_data) 
        except FileNotFoundError:
            print(f"Chat file '{chat_name}.json' not found.")
        except json.JSONDecodeError:
            print(f"Error decoding JSON file: {chat_name}.json")
            continue

    return jsonify({"chats": chats})

    
#Function to delete previously saved chats
@app.route('/delete_chat/<chat_name>', methods=['DELETE'])
def delete_chat(chat_name):
    sanitized_chat_name = chat_name.replace(" ", "_").replace("/", "_")
    chat_file = f"{sanitized_chat_name}.json"

    if os.path.exists(chat_file):
        os.remove(chat_file)# Remove the chat file

        # Update chat_names list after the chat was deleted
        chat_names = load_chat_names()
        if chat_name in chat_names:
            chat_names.remove(chat_name)
            save_chat_names(chat_names)

        return jsonify({"status": "success"})

    return jsonify({"error": "Chat not found"}), 404

#Function to open old chats with saved history
last_opened_chat = ""
@app.route('/open_chat/<chat_name>', methods=['GET'])
def open_chat(chat_name):
    global last_opened_chat, last_customPrompt 

    if not chat_name:
        chat_name = last_opened_chat 

    sanitized_chat_name = chat_name.replace(" ", "_").replace("/", "_")
    chat_file = f"{sanitized_chat_name}.json"

    if os.path.exists(chat_file):
        try:
            with open(chat_file, 'r') as file:
                chat_data = json.load(file)
                last_opened_chat = chat_name  # Update last_opened_chat for the auto save
                last_customPrompt = chat_data.get("customPrompt")# Update last_customPrompt for the auto save
                return jsonify({"chat": chat_data}) 
        except (json.JSONDecodeError, IndexError):
            print(f"Error loading chat from {chat_file}")
            return jsonify({"chat": {}})
    else:
        return jsonify({"chat": {}})
    

@app.route('/update_chat_name/<old_name>', methods=['PUT'])
def update_chat_name(old_name):#Function that allows users to update/edit a previously saved chat name if they wish
    try:
        # Get the new chat name from the request data
        data = request.get_json()
        new_name = data.get('newName')

        # Sanitize the old and new names to create valid filenames
        sanitized_old_name = old_name.replace(" ", "_").replace("/", "_")
        sanitized_new_name = new_name.replace(" ", "_").replace("/", "_")

        # Find the chat file corresponding to the old name
        old_chat_file = f"{sanitized_old_name}.json"
        
        # If the chat file exists, rename it
        if os.path.exists(old_chat_file):
            # Read the chat data from the old file
            with open(old_chat_file, 'r') as file:
                chat_data = json.load(file)

            # Update the chat name in the data
            chat_data['chatName'] = new_name
            chat_data['conversation'] = chat_data['conversation']  # No changes to conversation
            chat_data['customPrompt'] = chat_data['customPrompt']  # No changes to prompt
            chat_data['modelSelect'] = chat_data['modelSelect']  # No changes to model type

            # Write the updated chat data to the new file
            new_chat_file = f"{sanitized_new_name}.json"
            with open(new_chat_file, 'w') as file:
                json.dump(chat_data, file, indent=4)

            # Delete the old file
            os.remove(old_chat_file)

            # Update chat names in the saved list
            chat_names = load_chat_names()
            if old_name in chat_names:
                chat_names.remove(old_name)
            if new_name not in chat_names:
                chat_names.append(new_name)
            save_chat_names(chat_names)

            return jsonify({"message": "Chat name updated successfully!"}), 200
        
        # If the old chat name was not found
        return jsonify({"error": "Chat not found"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500



#Function to reset chat context when a new chat is created
@app.route('/reset_context', methods=['POST'])
def reset_context():
    global context
    context = ""
    return jsonify({"status": "success"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
    app.run(debug=True)
