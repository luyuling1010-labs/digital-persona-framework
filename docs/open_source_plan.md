# Open Source Plan

## Included

- Generic FastAPI backend skeleton
- Generic Next.js voice-first UI
- Mock model provider
- OpenAI-compatible model provider
- Toy persona notes
- Generic prompt template
- Generic scripts and tests

## Excluded

- Private persona data
- Celebrity data
- Vector DB files
- Fine-tuning data
- Batch evaluation logic
- Private data cleaning pipelines
- Real API keys
- Voice, audio, or video assets

## Recommended Release Checklist

- Run tests.
- Run frontend build.
- Scan for private names, `.jsonl`, media files, database files, and real `.env` files.
- Confirm `.env.example` contains placeholders only.
- Confirm toy examples are synthetic.
- Initialize git only after the cleaned tree has been reviewed.
