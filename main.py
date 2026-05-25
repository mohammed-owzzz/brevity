import os
import io
import re
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber
from groq import Groq
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(BASE_DIR, ".env")
load_dotenv(env_path)

app = FastAPI(title="brevity-core")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

@app.get("/")
async def root():
    return {"system": "brevity inference engine is online. awaiting documents."}

@app.post("/summarize")
async def summarize_document(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="system error: only pdf files are supported.")
    
    try:
        file_bytes = await file.read()
        
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            pages_text = [page.extract_text() for page in pdf.pages if page.extract_text()]
            
        extracted_text = "\n".join(pages_text)
        cleaned_text = " ".join(extracted_text.split())
        
        if not cleaned_text:
            return {"status": "error", "message": "No readable text found. Document may be a scanned image."}
            
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are 'Brevity', an elite AI document extraction engine. Your absolute primary directive is exhaustive detail retention combined with ruthless conciseness. You must extract every core concept, specific metric, actionable insight, date, and personal detail (names, emails, phone numbers) present in the text. Leave zero factual details behind. FORMATTING RULES: 1. Output strictly in plain text. Absolutely NO Markdown formatting (no asterisks, bolding, italics, or hash symbols). 2. Do not use numbered lists or intro/outro conversational filler. 3. Use dense, precise language. Eliminate all filler words. 4. Structure the output as highly condensed, standalone points separated by newlines. Ensure the extraction is exhaustive and reflects the entirety of the source document."
                },
                {
                    "role": "user",
                    "content": f"Extract and condense the following document:\n\n{cleaned_text}"
                }
            ],
            model="llama-3.1-8b-instant",
            temperature=0.3,
        )
        
        final_summary = chat_completion.choices[0].message.content
        
        display_text = re.sub(r'[*#_~`]', '', final_summary)
        display_text = " ".join(display_text.split())
        display_text = display_text.strip()
        human_accurate_count = len(display_text)
        
        return {
            "filename": file.filename,
            "status": "success",
            "character_count": human_accurate_count, 
            "summary": final_summary
        }
        
    except Exception as e:
        print(f"CRITICAL ENGINE CRASH: {str(e)}") 
        raise HTTPException(status_code=500, detail=f"processing failed: {str(e)}")