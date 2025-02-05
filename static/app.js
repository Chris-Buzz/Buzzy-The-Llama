document.addEventListener('DOMContentLoaded', function() {
    const sendButton = document.getElementById('send-button');
    const saveButton = document.getElementById('save-button');
    const micButton = document.getElementById('mic-button');
    const newChatButton = document.getElementById('new-chat-button');
    const questionInput = document.getElementById('question');
    const popupMessage = document.getElementById('popup-message');
    const savedChatsList = document.getElementById('saved-chats-list');
    const modelSelect = document.getElementById('model-select');
    const customPrompt = document.getElementById('custom-prompt');
    const saveChatModal = document.getElementById('save-chat-modal');
    const saveChatModalText = document.getElementById('save-chat-modal-text');
    const saveChatYesButton = document.getElementById('save-chat-yes');
    const saveChatNoButton = document.getElementById('save-chat-no');
    const saveChatCancelButton = document.getElementById('save-chat-cancel');
    const deleteChatModal = document.getElementById('delete-chat-modal');
    const deleteChatModalText = document.getElementById('delete-chat-modal-text');
    const deleteChatYesButton = document.getElementById('delete-chat-yes');
    const deleteChatNoButton = document.getElementById('delete-chat-no');
    const chatNameInput = document.getElementById('chat-name');;
    let firstEntry = true;
    let chatSaved = false;
    const themeSwitch = document.getElementById('theme-switch');
    const sidebar = document.getElementById("sidebar");
    const toggleButton = document.getElementById("toggle-sidebar");
    const renameModal = document.getElementById("renameModal");
    const newChatNameInput = document.getElementById("newChatName");
    const submitRenameButton = document.getElementById("submitRename");
    const cancelRenameButton = document.getElementById("cancelRename");
    


    toggleButton.addEventListener("click", function () {
        if (sidebar.classList.contains("collapsed")) {
        sidebar.classList.remove("collapsed");
        sidebar.classList.add("expanding");

        setTimeout(() => {
            sidebar.classList.remove("expanding");
        }, 300); // Remove animation class after animation completes
        } else {
        sidebar.classList.add("collapsing");

        setTimeout(() => {
            sidebar.classList.remove("collapsing");
            sidebar.classList.add("collapsed");
        }, 300); // Wait for animation to finish before hiding completely
        }
    });
        // Load the saved theme from local storage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.classList.add(savedTheme);
        themeSwitch.checked = savedTheme === 'dark-mode';
    }
    
    themeSwitch.addEventListener('change', () => {
        if (themeSwitch.checked) {
                document.body.classList.add('dark-mode');
                document.body.classList.remove('light-mode');
                localStorage.setItem('theme', 'dark-mode');
        } else {
                document.body.classList.add('light-mode');
                document.body.classList.remove('dark-mode');
                localStorage.setItem('theme', 'light-mode');
        }
    });



    const customPromptExamples = [
        "Enter your custom prompt here... Example: You are a food enthusiast.",
        "Enter your custom prompt here... Example: You are a travel guide.",
        "Enter your custom prompt here... Example: You are a tech expert.",
        "Enter your custom prompt here... Example: You are a fitness coach.",
        "Enter your custom prompt here... Example: You are a history professor."
    ];

    function getRandomExample() {
        return customPromptExamples[Math.floor(Math.random() * customPromptExamples.length)];
    }

    sendButton.addEventListener('click', askQuestion);
    saveButton.addEventListener('click', function() {
        saveChatModalText.textContent = "Are you sure you want to save this chat?";
        saveChatModal.style.display = 'block';
    });
    newChatButton.addEventListener('click', function() {
        const conversation = document.getElementById('conversation');
        if (conversation.children.length > 0 && !chatSaved) {
            saveChatModalText.textContent = "Do you want to save the current chat before starting a new one?";
            saveChatModal.style.display = 'block';
        } else {
            newChat();
        }
    });

    saveChatYesButton.addEventListener('click', async function() {
        await saveChat();
        resetChat();
        saveChatModal.style.display = 'none';
    });


    saveChatCancelButton.addEventListener('click', function() {
        saveChatModal.style.display = 'none';
    });

    // Add event listener for Enter key
    questionInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault(); // Prevent default Enter key behavior
            askQuestion();
        }
    });

    // Add event listener for focus on the input field
    questionInput.addEventListener('focus', function() {
        if (firstEntry && modelSelect.value === 'comedic') {
            showPopupMessage();
        }
    });

    // Show custom prompt textarea if "Custom" is selected
    modelSelect.addEventListener('change', function() {
        if (modelSelect.value === 'custom') {
            customPrompt.style.display = 'block';
            customPrompt.placeholder = getRandomExample();
        } else {
            customPrompt.style.display = 'none';
        }

        // Update placeholder text based on selected model
        switch (modelSelect.value) {
            case 'comedic':
                questionInput.placeholder = "Ask me anything... like, literally anything! I love to crack jokes!";
                break;
            case 'serious':
                questionInput.placeholder = "I am a serious model and provide serious answers...";
                break;
            case 'assistant':
                questionInput.placeholder = "How can I assist you today?";
                break;
            case 'philosopher':
                questionInput.placeholder = "Ask me a philosophical question...";   
                break;
            case 'historian':
                questionInput.placeholder = "Ask me a history-related question...";   
                break;
            case 'basic':
                questionInput.placeholder = "Ask me any question you have...";   
                break;
            case 'writer':
                questionInput.placeholder = "I can help you with writing-related questions...";   
                break;
            case 'coder':
                questionInput.placeholder = "Beep boop bop... I can help you with coding questions...";   
                break;
            case 'sports buff':
                questionInput.placeholder = "I can assist with any sports inquiries...";   
                break;
            case 'custom':
                questionInput.placeholder = "Enter your custom question...";
                break;
            default:
                questionInput.placeholder = "Ask me anything...";
        }
    });


    async function askQuestion() {
        if (firstEntry) {
            firstEntry = false;
            popupMessage.classList.remove('visible');
        }

        const question = document.getElementById('question').value;
        if (question.trim() === "") return;  // Prevent empty questions

        const modelType = modelSelect.value;
        const customPromptText = customPrompt.value;

        // Append user message to the conversation
        const conversation = document.getElementById('conversation');
        conversation.innerHTML += `<p class="user-message">You: ${question}</p>`;
        conversation.scrollTop = conversation.scrollHeight;  // Scroll to the bottom

        // Show thinking animation
        const thinkingMessage = document.createElement('p');
        thinkingMessage.className = 'bot-message';
        thinkingMessage.textContent = 'Buzzy is thinking...';
        conversation.appendChild(thinkingMessage);
        conversation.scrollTop = conversation.scrollHeight;  // Scroll to the bottom

        // Send the question and model type to the backend and fetch the response
        const response = await fetch('/ask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ question: question, modelType: modelType, customPrompt: customPromptText })
        });

        const data = await response.json();

        // Remove thinking animation
        conversation.removeChild(thinkingMessage);

        if (data.answer) {
            // Append bot's response with typing effect
            typeEffect(conversation, `Buzzy: ${data.answer}`);
        } else {
            conversation.innerHTML += `<p class="bot-message">Error: ${data.error}</p>`;
        }

        // Clear input field
        document.getElementById('question').value = '';
    }

    function typeEffect(element, text) {
        const lines = text.split('\n');
        let i = 0;
        let paragraph = document.createElement('p');
        paragraph.className = 'bot-message';
        element.appendChild(paragraph);

        let inCodeBlock = false;
        const interval = setInterval(() => {
            if (i < lines.length) {
                const line = lines[i];

                if (line.startsWith("```")) {
                    inCodeBlock = !inCodeBlock;
                    if (inCodeBlock) {
                        paragraph = document.createElement('pre');
                        paragraph.className = 'bot-message';
                        element.appendChild(paragraph);
                    } else {
                        paragraph = document.createElement('p');
                        paragraph.className = 'bot-message';
                        element.appendChild(paragraph);
                    }
                    i++;
                    return;
                }

                if (inCodeBlock) {
                    paragraph.textContent += line + "\n";
                } else if (line.match(/^\d+\./)) {
                    paragraph.innerHTML += `<br>${line}`;
                } else {
                    paragraph.innerHTML += (i === 0 ? '' : '<br>') + line;
                }
                i++;
            } else {
                clearInterval(interval);
            }
            element.scrollTop = element.scrollHeight;
            if (chatSaved) {
                saveChatAutomatically();
            }   // Scroll to the bottom
        }, 35); // Adjust typing speed as needed
    }

    async function saveChatAutomatically() {
        const conversation = document.getElementById('conversation').innerHTML;
        const response = await fetch('autoSave_chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversation }),
        });
    
        if (response.ok) {
            console.log('Chat automatically saved.');
        } else {
            console.error('Failed to auto-save chat.');
        }
    }
    
    let index = 1;
    async function saveChat() {
        const chatName = chatNameInput.value || `Chat ${index}`;
        const conversation = document.getElementById('conversation').innerHTML;
        const customPromptText = customPrompt.value;
        const modelType = modelSelect.value;

        const saveResponse = await fetch('/save_chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                conversation: conversation,
                customPrompt: customPromptText,
                modelSelect: modelType,
                chatName: chatName,
            }),
        });

        if (saveResponse.ok) {
            alert('Chat saved successfully!');
            chatSaved = true;
            resetChat();
            chatNameInput.value = '';
            loadSavedChats();

            index++
        } else {
            const data = await saveResponse.json();
            alert(`Failed to save chat. Error: ${data.error}`);
        }
    }

    async function loadSavedChats() {
        try {
            const response = await fetch('/load_chats');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            savedChatsList.innerHTML = ''; // Clear the existing list
        
            data.chats.forEach((chat, index) => {
                const li = document.createElement('li');
                li.innerHTML = `
                <div class="left-buttons">
                    <button class="rename-chat-btn" onclick="renameChat('${chat.chatName}')">🖋</button>
                    <span>${chat.chatName || `Chat ${index + 1}`}</span>
                </div>
                <div class="right-buttons">
                    <button class="open-chat-btn" onclick="openChat('${chat.chatName}')">Open</button>
                    <button class="delete-chat-btn" onclick="deleteChat('${chat.chatName}')">🗑️</button>
                </div>
            `;
            
                savedChatsList.appendChild(li);
            });
        
            if (data.chats.length === 0) {
                resetChat();
            }
        } catch (error) {
            console.error('Error loading saved chats:', error);
            // Handle the error (e.g., display an error message to the user)
        }
    }
    

    window.renameChat = function(chatName) {
        newChatNameInput.value = chatName; // Pre-fill the input with the current chat name
        newChatNameInput.defaultValue = chatName; // Set default value for comparison
        renameModal.style.display = "flex"; // Show the modal
    };
    
    // Close the modal without renaming
    cancelRenameButton.onclick = function() {
        renameModal.style.display = "none"; // Hide the modal
    };
    
    // Handle renaming the chat
    submitRenameButton.onclick = async function() {
        const newChatName = newChatNameInput.value.trim(); // Get the new chat name
        const oldChatName = newChatNameInput.defaultValue; // Get the previous chat name
    
        if (!newChatName) {
            alert("Please enter a valid name!"); // Alert if the name is empty
            return;
        }
    
        if (newChatName === oldChatName) {
            renameModal.style.display = "none"; // No changes, just close modal
            return;
        }
    
        try {
            await updateChatName(oldChatName, newChatName); // Update the chat name
            renameModal.style.display = "none"; // Close the modal after renaming
            loadSavedChats(); // Reload chat list to reflect the changes
        } catch (error) {
            console.error('Error renaming chat:', error);
            alert('Failed to rename chat due to an error.');
        }
    };
    
    // Update the chat name on the server
    async function updateChatName(oldName, newName) {
        try {
            const response = await fetch(`/update_chat_name/${encodeURIComponent(oldName)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newName: newName })
            });
    
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Unknown error');
            }
    
            alert('Chat renamed successfully!');
        } catch (error) {
            alert(`Failed to rename chat. Error: ${error.message}`);
            throw error; // Rethrow error to prevent modal from closing on failure
        }
    }    
    
    

      window.deleteChat = async function(chatName) {
        deleteChatModalText.textContent = `Are you sure you want to delete the chat: "${chatName}"?`;
        deleteChatModal.style.display = 'block'; // Show the delete modal
    };

    // When user clicks Yes, delete chat
    deleteChatYesButton.addEventListener('click', async function() {
        const chatName = deleteChatModalText.textContent.split('"')[1]; // Get the chat name from the text
        const response = await fetch(`/delete_chat/${chatName}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('Chat deleted successfully!');
            loadSavedChats(); // Reload the list of saved chats
        } else {
            alert('Failed to delete chat.');
        }

        deleteChatModal.style.display = 'none'; // Close the modal
    });

    // When user clicks No, close the modal
    deleteChatNoButton.addEventListener('click', function() {
        deleteChatModal.style.display = 'none'; // Close the modal
    });

    // When user clicks the close button on the modal

    // Close modal when clicking outside the modal content
    window.onclick = function(event) {
        if (event.target === deleteChatModal) {
            deleteChatModal.style.display = 'none'; // Close the modal
        }
    };

    // Opening an existing chat
    window.openChat = async function(chatName) {
        const response = await fetch(`/open_chat/${chatName}`); // Fetch specific chat using its name
        const data = await response.json();
        // Handle the loaded chat data (conversation, customPrompt, etc.)
        if (data.chat) {
            // Display conversation and any associated data like custom prompts
            document.getElementById('conversation').innerHTML = data.chat.conversation;
            // Handle the custom prompt
            if (data.chat.customPrompt) {
                customPrompt.value = data.chat.customPrompt;
                modelSelect.value = 'custom';
                customPrompt.style.display = 'block';
            }
            else{
                resetCustom();
            }
            chatSaved = true;// Mark the chat as saved
            saveButton.style.display = 'none'; 
        }
    };


    function resetChat() {
        document.getElementById('conversation').innerHTML = '';
        saveButton.style.display = 'block';
        firstEntry = true;
        chatSaved = false;
        resetCustom();
        popupMessage.classList.remove('visible');
        fetch('/reset_context', { method: 'POST' });
    }

    function resetCustom() {
        customPrompt.value = '';
        modelSelect.value = 'basic';
        customPrompt.style.display = 'none';
        questionInput.placeholder = "Ask me anything..."; // Reset placeholder to comedic
    }

    async function newChat() {
        resetChat();
       
    }

    loadSavedChats();


    if ('webkitSpeechRecognition' in window) {
        const recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
    
        let isListening = false; // Track if the mic is actively listening
        let manuallyStopped = false; // Track if the stop was triggered manually
    
        micButton.addEventListener('click', function () {
            if (isListening) {
                manuallyStopped = true; // Indicate that stopping was intentional
                recognition.stop();
                micButton.textContent = '🎙️'; // Change button back to mic icon
            } else {
                manuallyStopped = false; // Reset manual stop flag
                recognition.start();
                micButton.textContent = '🛑'; // Change button to stop icon
            }
            isListening = !isListening;
        });
    
        recognition.onresult = function (event) {
            const transcript = event.results[0][0].transcript;
            questionInput.value = transcript;
        };
    
        recognition.onerror = function (event) {
            console.error('Speech recognition error', event);
        };
    
        recognition.onend = function () {
            if (!manuallyStopped) {
                recognition.start(); // Restart recognition only if stop wasn't triggered manually
            }
        };
    } else {
        micButton.style.display = 'none'; // Hide the mic button if speech recognition is not supported
    }
})
