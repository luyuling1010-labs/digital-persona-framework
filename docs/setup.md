# Setup

## Backend

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Start the API:

```bash
uvicorn backend.app:app --reload --port 8000
```

The default configuration uses `MODEL_PROVIDER=mock`. For real model calls, set `MODEL_PROVIDER=openai` or `MODEL_PROVIDER=openai-compatible` and provide `OPENAI_API_KEY`.

## Frontend

Use Node.js 18.18 or newer. The template currently keeps React 18 and uses the patched Next.js 15 line.

```bash
cd frontend
npm install
npm run dev -- -p 3000
```

Set `NEXT_PUBLIC_API_BASE_URL` if your backend runs somewhere other than `http://localhost:8000`.

## Local Environment

Copy `.env.example` to `.env` for local development. Never commit real secrets.
