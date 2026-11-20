# 🎓 Padho with Girish AI — Production AI-Powered YouTube Learning Assistant

**Author & Developer:** [Girish M. Gulaganji](https://github.com/girish-m-gulaganji)

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Qdrant](https://img.shields.io/badge/Qdrant-Cloud_Vector_DB-DC2626?style=flat)](https://qdrant.tech)
[![Groq](https://img.shields.io/badge/Groq-Llama--3.3--70B-F05A28?style=flat)](https://groq.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

An enterprise-ready, full-stack educational AI platform that converts any YouTube educational lecture or tutorial into an interactive, grounded AI tutor with semantic search, time-stamped video seeking, multi-level summaries, synthesised study notes, and instant practice quizzes.

---

## 🌟 Key Capabilities

- **⚡ Fast YouTube Ingestion:** Ingests any YouTube video in seconds using fast transcript extraction (`youtube-transcript-api` with fallback mechanisms), zero heavy GPU download requirements.
- **🕒 Intelligent Time-Window Chunking:** Slices lecture transcripts into 75-second contextual windows with 15-second rolling overlaps, preserving semantic flow and exact `[start_sec, end_sec]` bounds.
- **🎯 Grounded RAG with Zero-Hallucination Guarantees:** Vector retrieval through **Qdrant Cloud** with strict multi-tenant metadata filtering (`user_id`, `video_id`). Answers are grounded strictly in video transcripts with inline seekable timestamp citations `[mm:ss]`.
- **▶️ Interactive Timestamp Video Seeking:** Clicking any timestamp citation in the chat automatically jumps the embedded YouTube player to that exact moment in the lecture.
- **📋 Multi-Level Structured Summaries:** Instantly generates executive short summaries, detailed pedagogical breakdowns, key topics, critical takeaways, and terminology definitions.
- **📝 Markdown Study Notes:** Produces structured study guides with topic headings, core formulas, examples, and revision bullet points. Includes one-click Markdown copy and `.md` file download.
- **🧠 Interactive 5-Question MCQ Quiz Generator:** Tests comprehension with dynamic 4-option multiple choice questions, instant automated grading, detailed answer explanations, and attempt scoring.
- **🔐 Multi-Tenant Authentication & Isolation:** Secure registration, bcrypt password hashing, and signed JWT authentication ensuring users only ever access their own video transcripts and chat threads.
- **📊 Comprehensive Analytics Dashboard:** High-level metrics tracking total videos ingested, study sessions, quiz performance, and recent activity.

---

## 🏗️ System Architecture

```
                       ┌────────────────────────────────────────┐
                       │          React 18 + Tailwind           │
                       │     (Vite • Lucide • Dark Theme)       │
                       └───────────────────┬────────────────────┘
                                           │  REST + JWT
                                           ▼
                       ┌────────────────────────────────────────┐
                       │            FastAPI Backend             │
                       │     (Auth • Routing • Services)        │
                       └─────┬──────────────┬──────────────┬────┘
                             │              │              │
           ┌─────────────────┴─┐      ┌─────┴───────┐      └─────────────────┐
           ▼                   ▼      ▼             ▼                        ▼
┌────────────────────┐ ┌─────────────┐ ┌─────────┐ ┌────────────┐ ┌────────────────────┐
│   PostgreSQL /     │ │   YouTube   │ │ Hugging │ │   Qdrant   │ │     Groq API       │
│   SQLite Database  │ │ Transcripts │ │ Face    │ │  Cloud DB  │ │  Llama-3.3-70B     │
│ (Users/Notes/Quiz) │ │ (oEmbed/API)│ │ MiniLM  │ │ (Vectors)  │ │ (Grounded Prompts) │
└────────────────────┘ └─────────────┘ └─────────┘ └────────────┘ └────────────────────┘
```

---

## 📂 Repository Structure

```
.
├── backend/                        # FastAPI Application
│   ├── app/
│   │   ├── api/v1/                 # Modular API Routes (auth, videos, chat, etc.)
│   │   ├── core/                   # Database engine & JWT security
│   │   ├── models/                 # SQLAlchemy ORM Models (User, Video, Quiz, etc.)
│   │   ├── schemas/                # Pydantic v2 Request/Response Schemas
│   │   ├── services/               # RAG, Embedding, Qdrant, YouTube & LLM Services
│   │   ├── config.py               # Pydantic BaseSettings environment config
│   │   └── main.py                 # FastAPI Application Factory with CORS
│   ├── tests/                      # Automated test suite (Pytest + TestClient)
│   ├── Dockerfile                  # Container definition for cloud deployment
│   ├── vercel.json                 # Vercel serverless deployment configuration
│   └── requirements.txt            # Python dependencies
│
├── frontend/                       # React 18 Application
│   ├── src/
│   │   ├── components/             # Sidebar, Navbar, VideoPlayer, CitationBadge
│   │   ├── context/                # AuthContext with persistent JWT state
│   │   ├── pages/                  # 10 SaaS Pages (Dashboard, Chat, Quiz, etc.)
│   │   ├── services/               # Axios client with 401 interceptors
│   │   ├── App.jsx                 # Route definitions & ProtectedRoute wrapper
│   │   └── main.jsx                # React DOM entrypoint
│   ├── index.html                  # HTML template with dark theme
│   ├── tailwind.config.js          # Tailwind CSS theme configuration
│   └── vite.config.js              # Vite bundler configuration & backend proxy
│
└── rag based ai project/           # Legacy experimental notebooks and scripts
```

---

## 🚀 Quickstart Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm
- A free [Groq Cloud](https://console.groq.com) or [Google Gemini](https://aistudio.google.com) API key
- A free [Qdrant Cloud](https://cloud.qdrant.io) cluster URL and API key

---

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
# Activate on Windows:
.venv\Scripts\activate
# Activate on Linux/macOS:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your GROQ_API_KEY, QDRANT_URL, and QDRANT_API_KEY

# Run automated tests
pytest tests/test_backend.py -v

# Start FastAPI dev server
uvicorn app.main:app --reload --port 8000
```
Backend will be available at `http://127.0.0.1:8000` (Interactive Swagger Docs at `http://127.0.0.1:8000/docs`).

---

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🧪 Testing

The platform includes end-to-end backend tests covering:
- YouTube video URL validation & parsing (`youtube.com/watch?v=...`, `youtu.be/...`, shorts).
- Time-window chunking (75s duration, 15s overlap, timestamp indexing).
- Multi-tenant User Registration, bcrypt password hashing, JWT login, and authenticated route protection.
- API `/health` endpoint verification.

Run tests anytime with:
```bash
cd backend
pytest tests/test_backend.py -v
```

---

## 🚢 Deployment

### Frontend (Vercel)
1. Push repository to GitHub.
2. Import repository on [Vercel](https://vercel.com).
3. Set **Root Directory** to `frontend`.
4. Add environment variable: `VITE_API_URL=https://your-backend-domain.com`.
5. Deploy!

### Backend (Docker / Render / Railway)
A multi-stage `Dockerfile` is provided in `backend/`:
```bash
cd backend
docker build -t yt-learning-assistant-backend .
docker run -p 8000:8000 --env-file .env yt-learning-assistant-backend
```

---

## 🔒 Security & Privacy
- **Strict Data Isolation:** Vectors stored in Qdrant are segregated using payload filters on `user_id` and `video_id`.
- **Zero Hallucination Guardrails:** Prompt engineering restricts answers strictly to retrieved transcript chunks, responding transparently when the video does not cover the topic.
- **Secure Password Hashing:** Uses direct `bcrypt` hashing with unique salts.
- **Stateless Authentication:** Signed JWT bearer tokens with configurable expiration.

---

## 📄 License
MIT License. Free to use for educational, demonstration, and personal portfolio purposes.
