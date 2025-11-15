from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
import os

app = FastAPI(title="StudySphere Backend")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Allow all for hackathon
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OpenAI v1 client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# -----------------------------
# CHAT ROUTE
# -----------------------------
@app.post("/api/chat")
async def chat(payload: dict):
    question = payload.get("question", "")

    if not question:
        return {"answer": "Please provide a valid question."}

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": question}]
        )
        answer = response.choices[0].message.content
        return {"answer": answer}

    except Exception as e:
        return {"answer": f"Backend error: {str(e)}"}


# -----------------------------
# QUIZ ROUTE
# -----------------------------
@app.post("/api/quiz")
async def quiz(payload: dict = None):

    prompt = """
    Generate exactly 3 multiple-choice questions (MCQs).
    Each question must include:
    - Question text
    - Options A, B, C, D
    - Correct answer

    Format very clearly.
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}]
        )
        answer = response.choices[0].message.content
        return {"answer": answer}

    except Exception as e:
        return {"answer": f"Backend error: {str(e)}"}


# -----------------------------
# HEALTH CHECK
# -----------------------------
@app.get("/")
async def root():
    return {"message": "StudySphere Backend is running!"}
