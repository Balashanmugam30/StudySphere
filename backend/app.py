from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import os
import requests
import tempfile
import pdfplumber

app = FastAPI(title="StudySphere Backend - OpenRouter (Free Gemma Model)")

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
FRONTEND_URL = "https://study-sphere-75kh.vercel.app"

# Store PDF text in memory
PDF_MEMORY = {"text": ""}


# =============== PDF UPLOAD ROUTE ===============
@app.post("/upload_pdf")
async def upload_pdf(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        return {"message": "Please upload a valid PDF file"}

    # Save PDF temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_pdf:
        temp_pdf.write(await file.read())
        temp_path = temp_pdf.name

    # Extract text using pdfplumber
    try:
        with pdfplumber.open(temp_path) as pdf:
            text = ""
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                text += page_text + "\n"

        PDF_MEMORY["text"] = text

        return {"message": "PDF uploaded and processed successfully!"}

    except Exception as e:
        return {"message": f"Error reading PDF: {str(e)}"}


# =============== ASK WITH PDF SUPPORT ===============
@app.post("/ask")
async def ask_ai(payload: dict):

    question = payload.get("question", "")

    # If PDF exists, combine with question
    pdf_text = PDF_MEMORY["text"]
    final_prompt = (
        f"PDF CONTENT:\n{pdf_text}\n\nUSER QUESTION:\n{question}"
        if pdf_text.strip()
        else question
    )

    data = {
        "model": "google/gemma-2-9b-it",
        "messages": [
            {"role": "user", "content": final_prompt}
        ]
    }

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": FRONTEND_URL,
        "X-Title": "StudySphere"
    }

    try:
        response = requests.post(OPENROUTER_URL, json=data, headers=headers)
        result = response.json()
        answer = result["choices"][0]["message"]["content"]
        return {"answer": answer}

    except Exception as e:
        return {"answer": f"Backend error: {str(e)}"}


# =============== QUIZ FROM PDF ===============
@app.post("/quiz")
async def generate_quiz():

    pdf_text = PDF_MEMORY["text"]

    prompt = f"""
    Based ONLY on the following PDF content, generate exactly 3 MCQs.

    PDF CONTENT:
    {pdf_text}

    FORMAT:
    Q1: ...
    A) ...
    B) ...
    C) ...
    D) ...
    Correct: B

    Keep it clean and simple.
    """

    data = {
        "model": "google/gemma-2-9b-it",
        "messages": [{"role": "user", "content": prompt}]
    }

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": FRONTEND_URL,
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
    return {"message": "StudySphere Backend running with PDF + Gemma!"}

