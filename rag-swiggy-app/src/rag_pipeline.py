from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI
from embed_store import load_vector_store
import os

TEMPLATE = """
You are a strict Question Answering assistant for the Swiggy Annual Report.

Your ONLY task is to answer the Question using the provided Context.
Rule 1: If the answer is present in the Context, answer it concisely.
Rule 2: If the Context DOES NOT contain the exact answer to the Question, you must output EXACTLY this sentence and nothing else:
"The information is not available in the Swiggy Annual Report."

Context:
{context}

Question:
{question}

Answer:
"""

def get_llm():
    # Will use Groq if OPENAI_API_KEY is not set or GROQ_API_KEY is set
    # Streamlit/FastAPI will allow setting this dynamically via environment
    if os.environ.get("OPENAI_API_KEY"):
        return ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
    elif os.environ.get("GROQ_API_KEY"):
        return ChatGroq(model_name="llama-3.1-8b-instant", temperature=0)
    else:
        # Fallback for testing - this will fail if no key provided
        return ChatGroq(model_name="llama-3.1-8b-instant", temperature=0)

def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

def build_rag_chain():
    vectorstore = load_vector_store()
    retriever = vectorstore.as_retriever(search_kwargs={"k": 4})
    
    prompt = ChatPromptTemplate.from_template(TEMPLATE)
    llm = get_llm()
    
    rag_chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )
    return rag_chain, retriever

def ask_question(question: str):
    rag_chain, retriever = build_rag_chain()
    # Also return source contexts for the UI
    context_docs = retriever.invoke(question)
    contexts = [doc.page_content for doc in context_docs]
    
    answer = rag_chain.invoke(question)
    return {
        "answer": answer,
        "contexts": contexts
    }

if __name__ == "__main__":
    import sys
    # For testing from CLI
    if len(sys.argv) > 1:
        query = sys.argv[1]
        print(f"Q: {query}")
        result = ask_question(query)
        print(f"A: {result['answer']}")
    else:
        print("Please provide a question.")
