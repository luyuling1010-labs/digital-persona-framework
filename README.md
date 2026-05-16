# voice-first-persona-framework

A generic framework for building a voice-first digital persona demo with a FastAPI backend, a Next.js UI, source display, warning display, and simple persona boundary checks.

This repository is a framework, not a private persona package. It does not include celebrity data, private prompts, vector databases, fine-tuning files, voice imitation assets, or real API keys.

## What It Builds

- Voice-first digital persona demo
- RAG-grounded persona assistant
- Subtitle-first persona UI
- Safe persona boundary system
- OpenAI-compatible model client wrapper
- Placeholder retrieval interface that you can replace with your own vector DB

## What Is Not Included

- Private persona data
- Celebrity or public-figure datasets
- Vector DB files
- Fine-tune datasets
- Voice imitation assets
- Real API keys
- Production auth, billing, or user accounts

## You Provide

- Persona source material
- Production prompts
- Model API key
- Optional vector database
- Optional TTS provider

## Quick Start

Backend:

```bash
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn backend.app:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev -- -p 3000
```

The default backend uses `MODEL_PROVIDER=mock`, so the demo can run without an API key.

## Configuration

Copy `.env.example` to `.env` for local development. Keep real `.env` files out of source control.

Important variables:

- `MODEL_PROVIDER`: `mock`, `openai`, or `openai-compatible`
- `OPENAI_API_KEY`: required only for real model calls
- `OPENAI_BASE_URL`: optional compatible endpoint
- `PERSONA_NAME`: display/runtime persona name
- `PERSONA_ROLE`: short role description
- `PERSONA_STYLE`: generic style guidance
- `PERSONA_DATA_PATH`: path to your source-backed persona notes

## Replace The Toy Persona

The demo reads `examples/toy_persona/persona_notes.md`. Replace it with your own public or licensed persona material, or wire `backend/rag_retriever.py` to your preferred vector database.

Do not add private data, training samples, real voice files, or generated vector DB files to the repository.
