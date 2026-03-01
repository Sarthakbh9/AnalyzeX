import os
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

def get_document_chunks(filepath: str):
    print(f"Loading document from {filepath}...")
    loader = PyMuPDFLoader(filepath)
    docs = loader.load()
    
    # Adding extra metadata for sanity
    for doc in docs:
        doc.metadata["source"] = "Swiggy Annual Report FY23-24"
    
    print(f"Loaded {len(docs)} pages. Splitting text...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=150,
        separators=["\n\n", "\n", " ", ""]
    )
    
    chunks = text_splitter.split_documents(docs)
    print(f"Created {len(chunks)} chunks.")
    return chunks

if __name__ == "__main__":
    # Test reading
    chunks = get_document_chunks("../data/swiggy_annual_report.pdf")
    print(f"First chunk sample:\n{chunks[0].page_content}")
