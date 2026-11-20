# Zeno AI Voice Assistant

**Zeno** is Netcore's real-time, event-facing AI brand ambassador featuring:
- **Interactive Animated Avatar**: Dynamic video-state transitions (Idle, Greeting, Thinking, Speaking, Listening, Goodbye).
- **Sub-Second Voice Turnaround**: Simultaneous streaming transcription, LLM reasoning, concurrent TTS synthesis, and Web Audio streaming playback.
- **Enterprise-Grounded RAG**: LangGraph-orchestrated retrieval engine grounded in Netcore's knowledge base (autonomous AI agents, MarTech platform capabilities, and live web search fallback).
- **Lead Capture & SME Connect**: QR code lead capture with WhatsApp integration and local SQLite / MongoDB fallback.

---

## Prerequisites

1. **Python 3.10+** (Python 3.12 recommended)
2. **Node.js 18+** and **npm**
3. **OpenAI API Key** (Required for LLM generation, TTS synthesis, and Whisper transcription)

---

## Quick Start Guide

### Step 1: Backend Setup & Launch

1. Open a terminal and navigate to the backend directory:
   ```powershell
   cd backend
   ```

2. Activate the existing virtual environment (or create one):
   ```powershell
   # On Windows PowerShell:
   .\venv\Scripts\Activate.ps1
   # (If scripts execution is restricted, run: Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass)
   ```
   *(If creating a new venv: `python -m venv venv` followed by `.\venv\Scripts\Activate.ps1`)*

3. Install required Python packages:
   ```powershell
   pip install -r requirements.txt
   ```

4. Configure your environment variables:
   * The file `.env` has already been created for you in `backend/.env`.
   * Open `backend/.env` in your editor and enter your OpenAI API key:
     ```ini
     OPENAI_API_KEY=sk-...your-actual-key...
     ```
   * *(Optional)* If you have a Tavily API key for web search:
     ```ini
     TAVILY_API_KEY=tvly-...your-key...
     ```

5. Start the FastAPI backend server:
   ```powershell
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   The backend will be running at:
   - **API & Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   - **Health Check**: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

### Step 2: Frontend Setup & Launch

1. Open a **second terminal** and navigate to the frontend directory:
   ```powershell
   cd frontend
   ```

2. Install frontend dependencies (if not already installed):
   ```powershell
   npm install
   ```

3. Launch the Vite development server:
   ```powershell
   npm run dev
   ```

4. Open your browser and navigate to:
   - **Zeno Voice Assistant**: [http://localhost:5173](http://localhost:5173)
   - **Mobile Demo Request Form**: [http://localhost:5173/demo-request](http://localhost:5173/demo-request)

---

## Verifying & Testing the Application

### 1. Frontend Voice & Interaction Test
1. Click **"Start Conversation"** on the home screen.
2. Zeno will play the welcome greeting and transition from Idle to Greeting.
3. Select an industry (**E-commerce & D2C**, **Banking & Fintech**, or **Insurance**).
4. Click on a suggested question or click the **Microphone** button to speak your question.
5. Zeno will transition to **Thinking**, stream the 3D speech bubbles around the avatar, play synthesized voice audio, and transition back to **Listening** when done.

### 2. Backend Automated Test Suite
To verify the backend pipeline, run the following test scripts from inside `backend/` with your virtual environment activated:
```powershell
cd backend
python -m pytest test_websocket_mock.py
```
Or run live query verification (requires `OPENAI_API_KEY` configured in `.env`):
```powershell
python test_six_questions_live.py
python test_industry_pdf_flow.py
```
