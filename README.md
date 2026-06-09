# LevelUp.io

A full-stack technical interview preparation platform featuring AI-powered mock interviews, invite-only live coding rooms with real-time collaboration, and a curated problem set — all wrapped in a LeetCode-inspired dark UI.

---

## Features

- **AI Mock Interviews** — Conversational AI interviewer (Claude) evaluates answers and returns scored feedback with grades, strengths, and improvement suggestions
- **Invite-Only Live Rooms** — Interviewers create private sessions and invite candidates by username; only invited users can see and join their session
- **Real-Time Collaboration** — Shared Monaco editor powered by Yjs/CRDT with live cursors, language switching, and instant code execution
- **250+ Curated Problems** — NeetCode 250 synced with difficulty filters, tag search, and pagination
- **Performance Analytics** — Visual charts tracking AI interview scores over time by topic and grade
- **Role-Based Access** — Distinct flows for Candidates, Interviewers, and Admins

---

## Tech Stack

### Frontend
| Tech | Purpose |
|---|---|
| React 19 + Vite | UI framework and build tool |
| React Router v7 | Client-side routing |
| Tailwind CSS v4 | Utility-first styling |
| Monaco Editor | Code editor (same engine as VS Code) |
| Yjs + y-websocket | CRDT-based real-time collaborative editing |
| Socket.IO Client | Live room events (join, chat, code sync) |
| Axios | HTTP client |


---N
### Backend
| Tech | Purpose |
|---|---|
| Express 5 | HTTP server and REST API |
| Prisma 7 + PostgreSQL | ORM and relational database |
| Socket.IO | WebSocket server for live rooms |
| y-websocket | Yjs WebSocket provider for collaborative editing |
| Anthropic SDK (Claude) | AI interview evaluation |
| bcrypt + JWT | Authentication |
| Zod | Request validation |
| Redis (ioredis) | Optional caching layer |

---

## Project Structure

```
ai-interview-platform/
├── backend/
│   ├── controllers/        # Route handlers
│   ├── middleware/         # Auth, validation, error handling
│   ├── prisma/
│   │   ├── schema.prisma   # Database models
│   │   └── migrations/     # Migration history
│   ├── routes/             # Express routers
│   ├── sockets/            # Socket.IO room handler
│   └── utils/              # JWT, validators, API response helpers
└── frontend/
    └── src/
        ├── api/            # Axios instance
        ├── components/     # Shared UI components
        ├── context/        # AuthContext
        └── pages/          # Home, Dashboard, LiveInterviewRoom, Login, Register
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (default port `5433`)
- Redis (default port `6379`)
- Anthropic API key

### 1. Clone and install

```bash
git clone https://github.com/your-username/levelup-io.git
cd levelup-io/ai-interview-platform
```

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Configure environment

Create `backend/.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5433/levelup
PORT=3000
NODE_ENV=development
JWT_SECRET=your_long_random_secret_here
JWT_EXPIRES_IN=7d
ANTHROPIC_API_KEY=sk-ant-...
REDIS_URL=redis://localhost:6379
```

### 3. Run database migrations

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

### 4. Start the servers

**Backend** (REST API + Socket.IO on port 3000):

```bash
cd backend
npm run dev
```

**Yjs WebSocket server** (collaborative editing on port 3001):

```bash
cd backend
npx y-websocket-server
```

**Frontend** (Vite dev server on port 5173):

```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## API Reference

All endpoints are prefixed with `/api/v1`.

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | — | Register with name, username, email, password, role |
| `POST` | `/auth/login` | — | Login, returns JWT |
| `GET` | `/auth/me` | ✓ | Get current user |

### Sessions

All session routes require a valid JWT.

| Method | Endpoint | Role | Description |
|---|---|---|---|
| `GET` | `/sessions` | Any | List sessions filtered by role (candidates see invitations only) |
| `GET` | `/sessions/:id` | Interviewer / Candidate | Get session by ID (access-controlled) |
| `POST` | `/sessions` | Interviewer / Admin | Create session, invite candidate by `@username` |
| `PUT` | `/sessions/:id` | Interviewer / Admin | Update session status |
| `DELETE` | `/sessions/:id` | Admin | Delete session |

### Problems

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/problems` | — | List problems with difficulty filter, search, pagination |
| `GET` | `/problems/:id` | — | Get problem with test cases and starter code |
| `POST` | `/problems/sync` | ✓ | Sync NeetCode 250 problem set |

### AI Interview

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/ai/evaluate` | ✓ | Submit answer for AI evaluation |
| `GET` | `/ai/history` | ✓ | Get past AI evaluation history |
| `GET` | `/ai/performance` | ✓ | Aggregate performance stats by topic |

---

## Socket.IO Events

The live room connects to `http://localhost:3000` with a JWT in `auth.token`.

| Event | Direction | Description |
|---|---|---|
| `join-room` | Client → Server | Join a room (access-checked against DB) |
| `room-state` | Server → Client | Full initial room state on join |
| `room-error` | Server → Client | Emitted when user is not invited |
| `user-joined` | Server → Room | Broadcast when a participant joins |
| `user-left` | Server → Room | Broadcast on disconnect |
| `code-change` | Bidirectional | Real-time code sync (fallback) |
| `language-change` | Bidirectional | Language switch sync |
| `chat-message` | Bidirectional | Chat messages (last 100 kept) |
| `chat-typing` | Client → Room | Typing indicator |
| `select-problem` | Client → Server | Interviewer/Admin selects a problem |
| `problem-selected` | Server → Room | Broadcast selected problem to all |

---

## User Roles

| Role | Capabilities |
|---|---|
| `CANDIDATE` | AI mock interviews, problem practice, view own invitations, join invited rooms |
| `INTERVIEWER` | Everything above + create sessions, invite candidates by username, select problems in room |
| `ADMIN` | Everything above + delete sessions, view all sessions |

---

## Scripts

### Backend

```bash
npm run dev        # Start with nodemon (hot reload)
npm start          # Production start
npm test           # Run Jest test suite
npm run test:watch # Jest in watch mode
```

### Frontend

```bash
npm run dev        # Vite dev server
npm run build      # Production build
npm run preview    # Preview production build
npm run lint       # ESLint
```

---

## Database Schema

```
User
  id, email, username (unique), name, password, role, createdAt

InterviewSession
  id, title, role, level, status, scheduledAt
  interviewerId → User
  candidateId   → User

AIEvaluation
  id, userId, question, answer, role, level, topic
  score, grade, strengths[], improvements[], idealAnswer, createdAt

Problem
  id, title, slug (unique), difficulty, description
  examples (JSON), constraints[], testCases (JSON), starterCode (JSON), tags[]
```

---

## License

MIT
