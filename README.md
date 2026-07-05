# TechBrief AI - Intelligent Technical Report Assistant

An AI-powered document intelligence platform. Built with **Firebase** (storage + database) and **Gemini API** (AI analysis).

## Tech Stack

- **Frontend:** React, Tailwind CSS, Framer Motion, Recharts, Firebase SDK
- **Backend:** FastAPI (Python) + Gemini API
- **Storage:** Firebase Storage (file uploads)
- **Database:** Firestore (documents + analysis results)
- **AI:** Google Gemini API

## Prerequisites

- Node.js 18+
- Python 3.10+
- Firebase project (with Firestore + Storage enabled)
- Gemini API key

## Quick Start

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a project and enable **Firestore Database** + **Storage**
3. Go to Project Settings > General > Your apps > Web app
4. Copy the `firebaseConfig` values

### 2. Frontend

```bash
# Install deps
npm install

# Copy and fill in your Firebase config
cp .env.example .env
# Edit .env with your Firebase project values

# Start dev server
npm run dev
```

### 3. Backend

```bash
cd backend

# Install Python deps
pip install -r requirements.txt

# Set your Gemini API key
# Edit .env and add:
# GEMINI_API_KEY=your_gemini_api_key_here

# Start API server
python main.py
```

### 4. Open

Open `http://localhost:5173` in your browser.

## Architecture

```
Frontend (React) ─── Firebase SDK ─── Firebase Storage
                                      └── Firestore
                    ─── fetch() ───── FastAPI ─── Gemini API
```

- Files upload directly to **Firebase Storage**
- Document records + analysis results stored in **Firestore**
- AI analysis calls routed through **FastAPI** which calls **Gemini API**
- Chat and comparison also go through FastAPI + Gemini

## Environment Variables

| Variable | Where | Required |
|----------|-------|----------|
| `VITE_FIREBASE_*` | `frontend/.env` | Yes |
| `GEMINI_API_KEY` | `backend/.env` | Yes |

## Project Structure

```
techbrief-ai/
├── backend/
│   ├── main.py           # FastAPI: extract, analyze, chat, compare
│   ├── requirements.txt
│   └── .env              # GEMINI_API_KEY
├── src/
│   ├── lib/
│   │   ├── firebase.js       # Firebase init (Storage + Firestore)
│   │   ├── AnalysisContext.jsx # Global state with Firebase
│   │   └── useSettings.js
│   ├── components/
│   │   ├── Sidebar.jsx
│   │   └── tabs/ (9 tabs)
│   └── pages/Home.jsx
├── .env.example
└── package.json
```

## API Endpoints (FastAPI)

| Endpoint | Purpose |
|----------|---------|
| `POST /api/extract` | Extract text from file URL |
| `POST /api/analyze` | Run Gemini analysis on text |
| `POST /api/chat` | RAG Q&A with document |
| `POST /api/compare` | Compare two documents |

## Hackathon Tips

- **No API key needed to demo:** Mock AI responses activate when `GEMINI_API_KEY` is blank
- **Works offline:** Firebase SDK falls back gracefully; mock data fills the UI
- **Impressive demo:** Upload a PDF, see the analysis pipeline, chat with the doc, compare documents
