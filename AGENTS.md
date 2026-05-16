# AGENTS.md

This repository is a generic open-source framework for a voice-first digital persona demo.

## Scope

Allowed work:

- FastAPI `/chat` backend skeleton
- Generic model client abstraction
- Generic RAG retrieval interface and toy example data
- Generic persona boundary checks
- Next.js voice-first UI with subtitles, sources, warnings, and mode switching
- Public setup and architecture documentation

Out of scope by default:

- Private persona data
- Celebrity-specific persona data
- Vector database files
- Fine-tuning datasets
- Voice imitation assets
- Real API keys
- Production auth, billing, or user accounts

## Safety

The persona must not claim to be a real person, invent private memories, expose retrieval internals, or confirm factual claims without source-backed context.

## Development

Default local backend mode is `MODEL_PROVIDER=mock`, so the demo can run without external model calls. Replace the toy persona notes with your own source-backed data before using the framework for a real persona.
