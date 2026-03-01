from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from rag_pipeline import ask_question
from embed_store import build_vector_store

app = FastAPI(title="Swiggy RAG API")

# Setup CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    question: str
    api_key: str | None = None
    provider: str | None = "groq" # groq or openai

class QueryResponse(BaseModel):
    answer: str
    context: list[str]

@app.post("/chat", response_model=QueryResponse)
async def chat_endpoint(req: QueryRequest):
    if not req.question:
        raise HTTPException(status_code=400, detail="Question is required")
        
    # Dynamically inject the key so user can supply from UI
    if req.provider == "openai" and req.api_key:
        os.environ["OPENAI_API_KEY"] = req.api_key
    elif req.api_key:
        os.environ["GROQ_API_KEY"] = req.api_key
        
    try:
        result = ask_question(req.question)
        return QueryResponse(
            answer=result["answer"],
            context=result["contexts"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/process")
async def process_document():
    # Helper to initialize the vectorstore via API if needed
    try:
        if not os.path.exists("../data/faiss_index"):
            build_vector_store("../data/swiggy_annual_report.pdf")
            return {"status": "success", "message": "Index built successfully."}
        return {"status": "success", "message": "Index already exists."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
