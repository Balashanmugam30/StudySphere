from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import requests

app = FastAPI(title="StudySphere Backend - Groq")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GROQ API
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


# -----------------------------
# CHAT ROUTE (/ask)
# -----------------------------
@app.post("/ask")
async def ask_ai(payload: dict):
    question = payload.get("question", "")

    if not question:
        return {"answer": "Please provide a valid question."}

    data = {
        "model": "llama3-8b-8192",
        "messages": [{"role": "user", "content": question}]
    }

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(GROQ_URL, json=data, headers=headers)
        result = response.json()

        answer = result["choices"][0]["message"]["content"]
        return {"answer": answer}

    except Exception as e:
        return {"answer": f"Backend error: {str(e)}"}


# -----------------------------
# QUIZ ROUTE (/quiz)
# -----------------------------
@app.post("/quiz")
async def generate_quiz(payload: dict = None):

    prompt = """
    Generate exactly 3 multiple-choice questions (MCQs).
    Include:
    - Question
    - Options A, B, C, D
    - Correct answer
    Format cleanly.
    """

    data = {
        "model": "llama3-8b-8192",
        "messages": [{"role": "user", "content": prompt}]
    }

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(GROQ_URL, json=data, headers=headers)
        result = response.json()

        answer = result["choices"][0]["message"]["content"]
        return {"answer": answer}

    except Exception as e:
        return {"answer": f"Backend error: {str(e)}"}


# -----------------------------
# HEALTH CHECK
# -----------------------------
@app.get("/")
async def root():
    return {"message": "StudySphere Backend (GROQ) is running!"}
