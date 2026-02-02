# P.I.S. — Personal Intelligence Scheduler

## Executive Summary

**P.I.S. (Personal Intelligence Scheduler)** is a next-generation, AI-powered personal productivity and task management system designed to help individuals optimize their time, energy, and mental bandwidth. Unlike conventional to-do list applications that simply store and display tasks, P.I.S. acts as an **intelligent executive assistant** that understands your goals, respects your cognitive limits, and actively helps you make better decisions about how to spend your time.

The system is built on a modern, full-stack architecture combining a **Next.js 14** frontend with a **FastAPI** backend, backed by **PostgreSQL** for persistent storage. At its core lies a sophisticated **multi-model AI system** powered by **LangGraph** and **Ollama**, utilizing three specialized language models that work in concert to provide fast, intelligent, and context-aware assistance.

---

## The Problem P.I.S. Solves

Modern knowledge workers face an unprecedented challenge: **cognitive overload**. We are bombarded with tasks, notifications, meetings, and information from countless sources. Traditional productivity tools fail to address this because they:

1. **Treat all tasks equally** — A simple "buy milk" sits alongside "prepare quarterly strategy presentation" with no understanding of the cognitive weight of each.

2. **Ignore human energy patterns** — Most people have limited high-quality focus hours per day, yet standard tools don't account for this finite resource.

3. **Require constant manual management** — Users spend more time organizing their task lists than actually completing tasks.

4. **Lack contextual intelligence** — They can't read your documents, understand your projects, or make smart suggestions.

P.I.S. addresses all of these shortcomings by introducing **energy-aware task management**, **AI-powered planning**, and **document-integrated workflows**.

---

## Core Philosophy

### The Energy-First Paradigm

At the heart of P.I.S. is a revolutionary concept: **Energy Points**. Instead of treating time as the primary constraint (as most calendars do), P.I.S. recognizes that your **cognitive energy** is the true limiting factor.

Each task in P.I.S. has an associated **energy cost** ranging from 1 to 10 points:
- **1-3 points**: Low-energy tasks (emails, simple updates, routine admin)
- **4-6 points**: Medium-energy tasks (meetings, writing, analysis)
- **7-10 points**: High-energy tasks (deep work, creative projects, strategic planning)

Every user has a **daily energy capacity of 30 points** by default. This creates a natural constraint that forces prioritization and prevents the common trap of overscheduling. When you've used your energy, P.I.S. knows you need rest — not more tasks.

### The Eisenhower Matrix Integration

P.I.S. incorporates the **Eisenhower Decision Matrix** directly into its task model through two boolean flags:
- **Importance** (`importance: boolean`) — Is this task meaningful to your long-term goals?
- **Urgency** (`is_urgent: boolean`) — Does this task have a pressing deadline?

This creates four quadrants:
1. **Important + Urgent** → Do immediately
2. **Important + Not Urgent** → Schedule for deep work
3. **Not Important + Urgent** → Delegate or batch
4. **Not Important + Not Urgent** → Eliminate

The AI reasoning engine understands these quadrants and uses them when helping you plan your day or week.

---

## System Architecture

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 14, React, TypeScript | Modern, responsive web interface |
| **Styling** | Tailwind CSS | Utility-first styling |
| **Backend** | FastAPI (Python) | High-performance async API |
| **Database** | PostgreSQL | Reliable relational storage |
| **ORM** | SQLAlchemy | Pythonic database interactions |
| **AI Framework** | LangGraph + LangChain | Multi-model orchestration |
| **LLM Runtime** | Ollama | Local LLM inference |
| **Containerization** | Docker Compose | Reproducible deployments |

### Database Schema

The PostgreSQL database contains the following core tables:

#### Users (`users`)
Stores user accounts with authentication credentials:
- `id` (UUID, primary key)
- `name` (string)
- `email` (unique)
- `password_hash` (SHA256 hashed)
- `created_at` (timestamp)

#### Task Lists (`task_lists`)
Organizes tasks into named collections:
- `id` (UUID, primary key)
- `user_id` (foreign key to users)
- `name` (string)
- `color` (hex color for UI)
- `created_at` (timestamp)

#### Tasks (`tasks`)
The core task entity with rich metadata:
- `id` (UUID, primary key)
- `user_id` (foreign key to users)
- `list_id` (optional, foreign key to task_lists)
- `title` (string)
- `context` (text, additional notes)
- `priority` (enum: High, Medium, Low)
- `energy_cost` (integer, 1-10)
- `status` (enum: todo, in_progress, done, backlog)
- `importance` (boolean)
- `is_urgent` (boolean)
- `deadline` (optional datetime)
- `scheduled_date` (optional date)
- `started_at` (optional datetime)
- `ended_at` (optional datetime)
- `created_at` (timestamp)

#### Documents (`docs`)
The "Brain" — your personal knowledge base:
- `id` (UUID, primary key)
- `user_id` (foreign key to users)
- `title` (string)
- `content` (text, markdown/rich text)
- `created_at` (timestamp)
- `last_edited` (timestamp)

#### Document-Task Links (`doc_task_links`)
Creates bidirectional relationships between documents and tasks:
- `id` (UUID, primary key)
- `doc_id` (foreign key to docs)
- `task_id` (foreign key to tasks)
- `created_at` (timestamp)

#### Energy Logs (`energy_logs`)
Tracks daily energy consumption:
- `id` (integer, primary key)
- `date` (date, unique per day)
- `total_capacity` (integer, default 30)
- `used_capacity` (integer, tracks spent energy)

---

## The AI Brain: Multi-Model LangGraph Architecture

The most sophisticated aspect of P.I.S. is its **multi-model AI system**. Rather than using a single large language model for all tasks (which would be slow and inefficient), P.I.S. employs **three specialized models**, each optimized for a specific type of interaction.

### Model Roster

| Model | Size | Role | Latency | Use Cases |
|-------|------|------|---------|-----------|
| **phi3:mini** | 2.2 GB | Router + Fast Executor | ~100-500ms | Intent classification, CRUD operations, quick responses |
| **llama3.1:latest** | 4.9 GB | Reasoning Engine | ~2-5s | Planning, scheduling, prioritization, goal breakdown |
| **qwen2.5:14b** | 9.0 GB | Document Analyst | ~3-8s | Summarization, extraction, document-to-task conversion |

### LangGraph Workflow

The AI system is built using **LangGraph**, a framework for building stateful, multi-step LLM applications. The workflow follows this pattern:

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INPUT                               │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    INTENT ROUTER NODE                            │
│                       (phi3:mini)                                │
│                                                                  │
│  Classifies user intent into one of four categories:            │
│  • fast_task  — Simple CRUD operations                          │
│  • reasoning  — Complex planning/scheduling                     │
│  • document   — Reading/summarizing documents                   │
│  • smalltalk  — Casual conversation                             │
└───────┬──────────────┬──────────────┬──────────────┬────────────┘
        │              │              │              │
        ▼              ▼              ▼              ▼
┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐
│ FastTask  │  │ Reasoning │  │ Document  │  │ SmallTalk │
│   Node    │  │   Node    │  │   Node    │  │   Node    │
│(phi3:mini)│  │(llama3.1) │  │(qwen2.5)  │  │  (rules)  │
└─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
      │              │              │              │
      └──────────────┴──────────────┴──────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                       RESPONSE                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Node Responsibilities

#### 1. Intent Router Node (phi3:mini)
The first model in the chain, responsible for **fast classification**:
- Analyzes the user's message
- Extracts key parameters (task title, action type, document ID)
- Returns a structured JSON routing decision
- Target latency: <500ms

Example:
```
User: "Add a task to review the quarterly report"

Router Output:
{
  "intent": "fast_task",
  "confidence": 0.95,
  "action": "create",
  "title": "review the quarterly report"
}
```

#### 2. Fast Task Node (phi3:mini)
Handles **direct database operations** with minimal latency:
- Create new tasks
- List existing tasks
- Mark tasks as complete
- Delete tasks
- Update task properties

This node **directly modifies the database** and returns confirmation messages.

#### 3. Reasoning Node (llama3.1:latest)
The **strategic brain** of the system:
- Weekly and daily planning
- Priority recommendations
- Breaking large goals into subtasks
- Conflict resolution when schedules overlap
- Energy-aware scheduling suggestions

This node **produces plans** which may then be executed by the Fast Task Node.

#### 4. Document Node (qwen2.5:14b)
The **knowledge worker** specialized in text analysis:
- Reading and summarizing documents
- Extracting action items from meeting notes
- Converting document content into suggested tasks
- Answering questions about document content

Documents are **chunked** to fit within context limits (500-1000 tokens per chunk).

#### 5. SmallTalk Node (Rule-Based)
Handles **casual interaction** without calling an LLM:
- Greetings ("Hello", "Hi")
- Thanks and acknowledgments
- Questions about the AI's capabilities
- Help requests

This provides **instant responses** for non-task-related conversations.

---

## Frontend Architecture

### Pages and Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Command Center | Dashboard with energy status, today's tasks, quick actions |
| `/tasks` | Task Manager | Full task list with filters, search, and bulk operations |
| `/calendar` | Calendar View | Tasks displayed on a calendar interface |
| `/brain` | Documents | Rich text document editor ("Brain Stack") |
| `/chat` | AI Chat | Conversational interface with the AI assistant |
| `/map` | Project Map | Visual project hierarchy (future feature) |
| `/settings` | Settings | User preferences and account management |
| `/login` | Login | User authentication |
| `/register` | Register | New user signup |

### Key Components

#### Sidebar (`Sidebar.tsx`)
- Collapsible navigation
- User profile display
- Energy status indicator
- Daily review trigger

#### Task Card (`TaskCard.tsx`)
- Visual representation of a task
- Priority indicator (color-coded)
- Energy cost badge
- Status toggle
- Quick actions menu

#### Editor (`Editor.tsx`)
- Rich text editing for documents
- Markdown support
- Auto-save functionality

#### Linked Tasks (`LinkedTasks.tsx`)
- Shows tasks associated with a document
- Bidirectional navigation
- Quick task creation from document context

---

## Backend API Endpoints

### Authentication
- `POST /register` — Create new user account
- `POST /login` — Authenticate and receive session

### Tasks
- `GET /tasks/` — List all tasks (with filters)
- `POST /tasks/` — Create new task
- `GET /tasks/{id}` — Get task details
- `PUT /tasks/{id}` — Update task
- `DELETE /tasks/{id}` — Delete task

### Task Lists
- `GET /task-lists/` — List all task lists
- `POST /task-lists/` — Create new list
- `PUT /task-lists/{id}` — Update list
- `DELETE /task-lists/{id}` — Delete list

### Documents
- `GET /documents/` — List all documents
- `POST /documents/` — Create new document
- `GET /documents/{id}` — Get document content
- `PUT /documents/{id}` — Update document
- `DELETE /documents/{id}` — Delete document

### Document-Task Links
- `GET /docs/{id}/linked-tasks/` — Get tasks linked to document
- `POST /docs/{id}/linked-tasks/` — Link task to document
- `DELETE /doc-task-links/{id}` — Remove link

### Energy
- `GET /energy/status` — Get today's energy status
- `POST /energy/reset` — Reset daily energy (new day)

### AI Chat
- `POST /agent/chat` — Send message to AI assistant

---

## Running the Application

### Prerequisites
- Docker and Docker Compose
- Ollama installed locally
- 16GB+ RAM recommended (for running 3 LLMs)

### Quick Start

```bash
# 1. Clone the repository
git clone <repository-url>
cd P.I.S.

# 2. Start Ollama and pull required models
ollama serve &
ollama pull phi3:mini
ollama pull llama3.1:latest
ollama pull qwen2.5:14b

# 3. Start the application stack
docker-compose up -d

# 4. Access the application
open http://localhost:3000
```

### Docker Services

| Service | Port | Description |
|---------|------|-------------|
| `frontend` | 3000 | Next.js web application |
| `backend` | 8000 | FastAPI server |
| `db` | 5432 | PostgreSQL database |

---

## Future Roadmap

### Planned Features

1. **Voice Interface** — Natural language voice commands
2. **Mobile App** — React Native companion app
3. **Calendar Sync** — Google Calendar / Outlook integration
4. **Team Collaboration** — Shared task lists and projects
5. **Recurring Tasks** — Automatic task regeneration
6. **Analytics Dashboard** — Productivity trends and insights
7. **Focus Mode** — Distraction-free task execution
8. **API Integrations** — Slack, Notion, Todoist sync

### Technical Improvements

1. **Streaming Responses** — Real-time AI output streaming
2. **Caching Layer** — Redis for faster repeated queries
3. **Background Jobs** — Celery for async processing
4. **Rate Limiting** — API protection
5. **Audit Logging** — Complete action history

---

## Conclusion

P.I.S. represents a new paradigm in personal productivity: an **AI-native task management system** that understands not just what you need to do, but how to help you do it efficiently. By combining energy-aware task modeling, intelligent document integration, and a sophisticated multi-model AI architecture, P.I.S. aims to be the last productivity tool you'll ever need.

The system is designed for **privacy-first operation** — all AI processing happens locally via Ollama, meaning your tasks, documents, and conversations never leave your machine. This makes P.I.S. suitable for sensitive personal and professional use.

**P.I.S. is not just a to-do list. It's your personal executive assistant, available 24/7, infinitely patient, and always ready to help you make the most of your limited time and energy.**

---

*Built with ❤️ using Next.js, FastAPI, PostgreSQL, LangGraph, and Ollama*
