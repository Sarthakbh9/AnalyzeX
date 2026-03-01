# Step-by-Step Setup Guide 🚀

Follow these exact steps to run the RAG Dashboard application on your local machine.

## Prerequisites
Before you begin, ensure you have the following installed on your system:
1. **Python 3.10+** (You can check your version by running `python3 --version` in your terminal).
2. **Node.js 18+** & **npm** (You can check by running `node --version` and `npm --version`).

---

## 🟢 Part 1: Start the Python Backend (FastAPI)

We need to start the backend so it can load the Swiggy PDF, build the vector search index, and talk to the LLM.

**Step 1:** Open a terminal window and navigate into the project folder:
```bash
cd /path/to/rag-swiggy-app
```

**Step 2:** Create a Python virtual environment to keep packages isolated:
```bash
python3 -m venv venv
```

**Step 3:** Activate the virtual environment:
- On Linux/macOS:
  ```bash
  source venv/bin/activate
  ```
- On Windows:
  ```cmd
  venv\Scripts\activate
  ```

**Step 4:** Install all necessary Python libraries (LangChain, FAISS, etc.):
```bash
pip install -r requirements.txt
```

**Step 5:** Navigate into the `src/` directory where the backend code lives:
```bash
cd src
```

**Step 6:** Start the FastAPI server using Uvicorn:
```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```
*Leave this terminal window open.* The backend is now running at `http://localhost:8000`.

---

## 🔵 Part 2: Start the Frontend UI (Next.js)

Now we need to start the dashboard interface.

**Step 1:** Open a **new** terminal window and navigate to the project directory:
```bash
cd /path/to/rag-swiggy-app
```

**Step 2:** Navigate into the frontend directory:
```bash
cd frontend
```

**Step 3:** Install all the Node.js dependencies (React, TailwindCSS, etc.):
```bash
npm install
```

**Step 4:** Start the Next.js development server:
```bash
npm run dev
```
*Leave this terminal window open.* The frontend is now running at `http://localhost:3000`.

---

## 🟠 Part 3: Using the Dashboard

1. Open your web browser (Chrome, Firefox, Safari) and go to:
   👉 **http://localhost:3000**
   
2. You will see the **AnalyzeX Dashboard**. Look at the left sidebar.

3. **Provide an API Key:** 
   - Select either **Groq** or **OpenAI** from the dropdown. 
   - Paste your corresponding API key into the text box. (Warning: If you do not provide a key, queries will fail).

4. **Initialize Data:** 
   - Click the orange **"Build Vector Store"** button in the sidebar. 
   - This takes the `data/swiggy_annual_report.pdf`, extracts the text, creates embeddings using HuggingFace models, and saves the vectors locally. It takes roughly 30-60 seconds. You only need to do this once.

5. **Ask Questions:** 
   - At the bottom of the screen, ask questions like *"What was the total revenue in FY23?"* or *"What are the key risk factors?"* 
   - The AI will retrieve the exact document chunk and answer you. Click **"View Retrieved Context"** under the AI's answer to see the raw text it pulled from the PDF.
   - If you ask something unrelated (e.g. "Who wrote Harry Potter?"), it will strictly reply: *"The information is not available in the Swiggy Annual Report."* to prevent hallucination.
