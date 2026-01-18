---
id: 0005
title: qdrant neon integration
stage: implementation
date: 2026-01-17
surface: agent
model: claude-opus-4-5-20251101
feature: 003-ai-chatbot
branch: 004-theme-system
user: sarimarain99
command: /sp.implement
labels: ["implementation","database","qdrant","neon","vector"]
links:
  spec: specs/003-ai-chatbot/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - backend/.gitignore
  - backend/pyproject.toml
  - backend/.env.example
  - backend/app/services/qdrant_service.py
  - backend/app/services/conversation_service.py
  - backend/app/services/agent_service.py
tests:
  - Dependencies installation: IN PROGRESS (uv sync running in background)
  - Python import check: PENDING (verify qdrant-client and sentence-transformers)
---

## Prompt

there is qdrant(for chatbot's history) and neon database to store and return the users correctly so update the code and migrate them to their respective databases!

User selected: Hybrid approach - Store metadata in Neon PostgreSQL (Conversation/Message tables), store vector embeddings in Qdrant for semantic search and context retrieval

## Response snapshot

Implemented hybrid database architecture for AI chatbot:

**1. Added Dependencies (backend/pyproject.toml):**
- `qdrant-client>=1.12.0` - Vector database client for embeddings storage
- `sentence-transformers>=3.0.0` - Embeddings generation for semantic search

**2. Created Qdrant Service (backend/app/services/qdrant_service.py):**
- `QdrantService` class with singleton pattern
- Auto-creates collection `chat_messages` with 384-dim vectors (all-MiniLM-L6-v2)
- `store_message()` - Stores message embeddings with metadata
- `search_context()` - Semantic search for similar messages
- `delete_conversation_messages()` - Cleanup on deletion
- `get_conversation_embeddings()` - Retrieve all message vectors
- `get_qdrant_service()` - Singleton accessor

**3. Updated ConversationService (backend/app/services/conversation_service.py):**
- Modified `add_message()` to sync embeddings to Qdrant after PostgreSQL insert
- Modified `delete_conversation()` to delete from both databases
- Qdrant operations fail gracefully (optional enhancement)

**4. Updated AgentService (backend/app/services/agent_service.py):**
- Pass `user_id` parameter to `add_message()` calls for Qdrant storage

**5. Environment Configuration (backend/.env.example):**
- Added `QDRANT_URL` and `QDRANT_API_KEY` for Qdrant Cloud
- Updated `DATABASE_URL` example with Neon PostgreSQL format with SSL
- Included local development alternatives

**6. Created backend/.gitignore:**
- Python patterns, virtual environments, IDE files
- Database files (*.db, *.sqlite)
- Environment files

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Chat API Request                        │
└────────────────────────┬────────────────────────────────────┘
                         │
            ┌────────────▼────────────┐
            │   ConversationService   │
            └────────────┬────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌──────────────────┐          ┌──────────────────┐
│ Neon PostgreSQL  │          │    Qdrant        │
│ (Structured Data)│          │ (Vector DB)      │
├──────────────────┤          ├──────────────────┤
│ • User           │          │ • Embeddings     │
│ • Conversation   │          │ • Semantic Search│
│ • Message        │          │ • Context Recall │
│ • Task           │          │                  │
└──────────────────┘          └──────────────────┘
```

**Neon PostgreSQL** stores:
- Users (managed by Better Auth)
- Conversations (metadata, timestamps)
- Messages (role, content, tool_calls)
- Tasks (todo items)

**Qdrant** stores:
- 384-dim vectors from sentence-transformers all-MiniLM-L6-v2
- Semantic embeddings for context-aware AI responses

## Outcome

- ✅ Impact: Hybrid database architecture implemented. Neon stores structured data, Qdrant enables semantic search.
- 🧪 Tests: Dependencies installation in progress (uv sync), import verification pending
- 📁 Files: 6 files modified/created (2 new, 4 updated)
- 🔁 Next prompts: Verify dependencies install correctly, run tests to validate Qdrant integration
- 🧠 Reflection: This hybrid approach gives us the best of both worlds - PostgreSQL's ACID guarantees and Qdrant's vector search. The graceful degradation ensures the system works even if Qdrant is unavailable.

## Evaluation notes (flywheel)

- Failure modes observed: uv sync command takes time to complete, running in background
- Graders run and results: PENDING (awaiting dependency installation)
- Prompt variant: N/A
- Next experiment: Consider async embedding generation to avoid blocking message storage
