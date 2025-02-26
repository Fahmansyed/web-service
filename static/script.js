const socket = io();
const loginPage = document.getElementById("loginPage");
const chatPage = document.getElementById("chatPage");
const usernameInput = document.getElementById("username");
const joinChat = document.getElementById("joinChat");
const chatbox = document.getElementById("chatbox");
const startButton = document.getElementById("startButton");

let username = "";
let recognition;
let isListening = false; // Track if recognition should keep running
let userColors = {}; // Store colors for each user

const fixedColors = [
    "#E57373", "#81C784", "#64B5F6", "#FFD54F",
    "#BA68C8", "#4DB6AC", "#F06292", "#7986CB"
];

// Assign a fixed color to each username
function getFixedColor(username) {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return fixedColors[Math.abs(hash) % fixedColors.length];
}

// Handle user login
joinChat.addEventListener("click", () => {
    username = usernameInput.value.trim();
    if (username) {
        sessionStorage.setItem("username", username);
        
        if (!userColors[username]) {
            userColors[username] = getFixedColor(username);
        }

        loginPage.style.display = "none";
        chatPage.style.display = "flex";
    }
});

// Toggle speech recognition on button click
startButton.addEventListener("click", () => {
    if (!isListening) {
        startListening();
        startButton.textContent = "Stop Listening";
    } else {
        stopListening();
        startButton.textContent = "Start Listening";
    }
});

// Function to start speech recognition
function startListening() {
    isListening = true;
    runSpeechRecognition(); // Start recognition loop
}

// Function to continuously restart speech recognition
function runSpeechRecognition() {
    if (!isListening) return; // Stop if manually stopped

    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = false; // Important! Prevents Chrome issues
    recognition.interimResults = false;

    recognition.onresult = (event) => {
        const results = event.results;
        if (results.length > 0) {
            const result = results[results.length - 1];
            if (result.length > 0) {
                const transcript = result[0].transcript.trim();
                if (transcript) {
                    socket.emit("speech_to_text", { username, text: transcript });
                    displayMessage(username, transcript, true);
                }
            }
        }
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
    };

    recognition.onend = () => {
        if (isListening) {
            console.log("Speech recognition stopped. Restarting in 1 second...");
            setTimeout(runSpeechRecognition, 1000); // Restart after 1 sec
        }
    };

    recognition.start();
}

// Function to stop speech recognition manually
function stopListening() {
    isListening = false;
    if (recognition) {
        recognition.stop();
    }
}

// Listen for messages from the server
socket.on("speech_update", (data) => {
    if (data && data.text && data.username) {
        if (!userColors[data.username]) {
            userColors[data.username] = getFixedColor(data.username);
        }
        displayMessage(data.username, data.text, data.username === username);
    }
});

// Function to display messages in the chatbox
function displayMessage(sender, message, isMine) {
    const messageWrapper = document.createElement("div");
    messageWrapper.classList.add("message-wrapper", isMine ? "my-message-wrapper" : "other-message-wrapper");

    const lastMessage = chatbox.lastChild;
    const isNewSender = !lastMessage || lastMessage.dataset.sender !== sender;

    if (isNewSender) {
        const usernameElement = document.createElement("p");
        usernameElement.textContent = sender;
        usernameElement.classList.add("message-username");
        usernameElement.style.color = userColors[sender];
        messageWrapper.appendChild(usernameElement);
    }

    const messageContainer = document.createElement("div");
    messageContainer.classList.add("message", isMine ? "my-message" : "other-message");
    messageContainer.textContent = message;
    messageWrapper.appendChild(messageContainer);

    messageWrapper.dataset.sender = sender;
    chatbox.appendChild(messageWrapper);
    chatbox.scrollTop = chatbox.scrollHeight;
}