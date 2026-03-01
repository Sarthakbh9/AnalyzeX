import os
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from load_pdf import get_document_chunks

VECTOR_STORE_PATH = "../data/faiss_index"

def get_embeddings_model():
    return HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

def build_vector_store(pdf_path: str):
    print("Initializing embedding model...")
    embeddings = get_embeddings_model()
    
    print("Loading and splitting document...")
    chunks = get_document_chunks(pdf_path)
    
    print("Creating vector store...")
    vectorstore = FAISS.from_documents(chunks, embeddings)
    
    print(f"Saving vector store to {VECTOR_STORE_PATH}...")
    vectorstore.save_local(VECTOR_STORE_PATH)
    print("Done!")

def load_vector_store():
    embeddings = get_embeddings_model()
    return FAISS.load_local(VECTOR_STORE_PATH, embeddings, allow_dangerous_deserialization=True)

if __name__ == "__main__":
    build_vector_store("../data/swiggy_annual_report.pdf")
