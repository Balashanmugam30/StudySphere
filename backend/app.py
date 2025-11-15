from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
import os

app = FastAPI(title="StudySphere Backend")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OpenAI v1 client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# -----------------------------
# CHAT ROUTE  (Frontend calls /ask)
# -----------------------------
@app.post("/ask")
async def ask_ai(payload: dict):
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
# QUIZ ROUTE (Frontend calls /quiz)
# -----------------------------
@app.post("/quiz")
async def generate_quiz(payload: dict = None):

    prompt = """
    Generate exactly 3 multiple-choice questions (MCQs).
    Each must include:
    - Question
    - Options A, B, C, D
    - Correct answer
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
