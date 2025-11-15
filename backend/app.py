from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
import os

app = FastAPI(title="StudySphere Backend - Groq")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GROQ CLIENT
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# WORKING MODEL
MODEL = "mixtral-8x7b-32768"   # <-- FINAL model


# -----------------------------
# CHAT ROUTE (/ask)
# -----------------------------
@app.post("/ask")
async def ask_ai(payload: dict):
    question = payload.get("question", "")

    if not question:
        return {"answer": "Please provide a valid question."}

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": question}]
        )

        answer = response.choices[0].message.content
        return {"answer": answer}

    except Exception as e:
        return {"answer": f"Backend error: {str(e)}"}


# -----------------------------
# QUIZ ROUTE (/quiz)
# -----------------------------
@app.post("/quiz")
async def quiz(payload: dict = None):

    prompt = """
    Generate exactly 3 multiple-choice questions (MCQs).
    Include:
    - Question
    - Options A, B, C, D
    - Correct answer
    Format cleanly.
    """

    try:
        response = client.chat.completions.create(
            model=MODEL,
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
    return {"message": "StudySphere Backend (GROQ) is running!"}
