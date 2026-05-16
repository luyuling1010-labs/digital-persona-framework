# Architecture

The framework keeps the runtime path small and replaceable:

```text
Question
-> Router
-> Generic Retriever Interface
-> Prompt Builder
-> Model Client
-> Boundary Checker
-> FastAPI Response
-> Voice-first Next.js UI
```

## Backend Modules

- `backend/app.py`: FastAPI app and `/chat` response formatting
- `backend/schemas.py`: request and response models
- `backend/config.py`: environment-based settings
- `backend/question_router.py`: generic question classification
- `backend/rag_retriever.py`: toy file retriever and replacement interface
- `backend/prompt_builder.py`: generic persona prompt construction
- `backend/model_client.py`: mock and OpenAI-compatible model calls
- `backend/safety_checker.py`: generic identity, private-memory, and retrieval-leak boundary checks
- `backend/chat_pipeline.py`: orchestration

## Frontend Modules

- `frontend/components/DemoShell.tsx`: voice-first demo surface
- `frontend/components/PersonaPanel.tsx`: generic persona visual panel
- `frontend/components/ModeSelector.tsx`: mode switcher
- `frontend/components/DisclosurePanel.tsx`: sources, warnings, transcript panels
- `frontend/app/api/chat/route.ts`: Next.js proxy to FastAPI

## Replacing Retrieval

`backend/rag_retriever.py` intentionally uses toy markdown notes. For production, replace `retrieve_context()` with your vector database or search provider. Keep returned source items generic:

- `source_id`
- `title`
- `url`
- `content`
- `source_type`
- `notes`
- `score`
