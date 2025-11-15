from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import requests

app = FastAPI(title="StudySphere Backend - OpenRouter")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# --------------------------
# ASK ROUTE
# --------------------------
@app.post("/ask")
async def ask_ai(payload: dict):
    question = payload.get("question", "")

    if not question:
        return {"answer": "Please provide a question."}

    data = {
        "model": "meta-llama/llama-3.1-70b-instruct",
        "messages": [{"role": "user", "content": question}]
    }

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://yourdomain.com",
        "X-Title": "StudySphere"
    }

    try:
        response = requests.post(OPENROUTER_URL, json=data, headers=headers)
        result = response.json()
        answer = result["choices"][0]["message"]["content"]
        return {"answer": answer}

    except Exception as e:
        return {"answer": f"Backend error: {str(e)}"}


# --------------------------
# QUIZ ROUTE
# --------------------------
@app.post("/quiz")
async def generate_quiz(payload: dict = None):
    prompt = """
    Generate exactly 3 MCQs.
    Include:
    - Question
    - Options A, B, C, D
    - Correct answer letter only.
    """

    data = {
        "model": "meta-llama/llama-3.1-70b-instruct",
        "messages": [{"role": "user", "content": prompt}]
    }

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://yourdomain.com",
        "X-Title": "StudySphere"
    }

    try:
        response = requests.post(OPENROUTER_URL, json=data, headers=headers)
        result = response.json()
        answer = result["choices"][0]["message"]["content"]
        return {"answer": answer}

    except Exception as e:
        return {"answer": f"Backend error: {str(e)}"}


@app.get("/")
async def root():
    return {"message": "StudySphere OpenRouter backend running!"}
