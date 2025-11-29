import json
import ollama
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow React frontend to communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple message model
class Message(BaseModel):
    text: str

# Load conversation history from JSON
try:
    with open("history.json") as f:
        conversation_history = json.load(f)
except FileNotFoundError:
    conversation_history = []

SYSTEM_PROMPT = "You are a helpful assistant that always responds in English."

@app.post("/chat")
async def chat(message: Message, model: str = "mistral:latest"):

    # Select model
    if model != "mistral:latest":
        model = "llama2:7b-chat"
    else:
        model = "mistral:latest"

    try:
        # Add user message to history
        print(f"Agent user processing message: {message.text}")
        conversation_history.append({"role": "user", "text": message.text})

        # Combine system prompt + history
        prompt = SYSTEM_PROMPT + "\n"
        for msg in conversation_history:
            role = msg["role"].capitalize()
            prompt += f"{role}: {msg['text']}\n"
        prompt += "Assistant:"
        
        # OWN CALL
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": message.text}
        ]
        response = ollama.chat(model='mistral:latest', messages=messages)
        assistant_text = response['message']['content']

        # Add assistant message to history
        conversation_history.append({"role": "assistant", "text": assistant_text})

        # Save history
        with open("history.json", "w") as f:
            json.dump(conversation_history, f)
        
        return {"response": assistant_text}
    except Exception as e:
        print(f"Error processing message: {e}")
        return {"response": "Sorry, something went wrong."}