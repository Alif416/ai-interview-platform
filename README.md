# LevelUp.io

A full-stack technical interview preparation platform featuring AI-powered mock interviews, invite-only live coding rooms with real-time collaboration, a curated NeetCode 250 problem set, and a user profile management system — all wrapped in a LeetCode-inspired dark UI.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Socket.IO Events](#socketio-events)
- [User Roles](#user-roles)
- [Database Schema](#database-schema)
- [Scripts](#scripts)
- [License](#license)

---

## Features

- **AI Mock Interviews** — Conversational AI interviewer powered by Claude evaluates answers and returns scored feedback with grades, strengths, and improvement suggestions
- **Invite-Only Live Rooms** — Interviewers create private sessions and invite candidates by username; only invited users can see and join their session
- **Real-Time Collaboration** — Shared Monaco editor powered by Yjs/CRDT with live cursors, language switching, and instant in-browser code execution
- **250+ Curated Problems** — NeetCode 250 synced from LeetCode with difficulty filters, tag search, and pagination
- **Performance Analytics** — Visual charts tracking AI interview scores over time by topic and grade
- **User Profile Management** — Dedicated profile page where users can view their account info, change their password, and permanently delete their account
- **Role-Based Access Control** — Distinct permission flows for Candidates, Interviewers, and Admins
- **Secure Authentication** — JWT + httpOnly cookies, email verification, and password reset via email link

---

## Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| React 19 + Vite | UI framework and build tooling |
| React Router v7 | Client-side routing |
| Tailwind CSS v4 | Utility-first styling with custom design tokens |
| Monaco Editor | Code editor (same engine as VS Code) |
| Yjs + y-websocket | CRDT-based real-time collaborative editing |
| Socket.IO Client | Live room events (join, chat, code sync, problem selection) |
| Axios | HTTP client with JWT interceptors |
| React Hook Form | Form state management |

### Backend

| Technology | Purpose |
|---|---|
| Express 5 | HTTP server and REST API |
| Prisma 7 + PostgreSQL | ORM and relational database |
| Socket.IO | WebSocket server for live rooms |
| y-websocket | Yjs WebSocket provider for collaborative editing |
| Anthropic SDK (Claude) | AI interview evaluation and feedback |
| bcrypt + JWT | Password hashing and stateless authentication |
| Zod | Request validation schemas |
| Redis (ioredis) | Caching layer for problems and pending registrations |
| Nodemailer + Brevo | Transactional email (verification, password reset) |
| Jest + Supertest | Unit and integration testing |

---

## Project Structure

```
ai-interview-platform/
├── backend/
│   ├── config/
│   │   ├── config.js           # Environment variables
│   │   ├── database.js         # Prisma client
│   │   └── redis.js            # Redis connection
│   ├── controllers/
│   │   ├── authController.js   # Register, login, password, profile
│   │   ├── sessionController.js
│   │   ├── problemController.js
│   │   ├── aiController.js
│   │   └── performanceController.js
│   ├── middleware/
│   │   ├── auth.js             # JWT verify + role-based access
│   │   ├── validate.js         # Zod request validation
│   │   ├── errorHandler.js
│   │   ├── asyncHandler.js
│   │   └── rateLimit.js
│   ├── prisma/
│   │   ├── schema.prisma       # Database models
│   │   └── migrations/
│   ├── routes/
│   │   ├── index.js
│   │   ├── authRoutes.js
│   │   ├── sessionRoutes.js
│   │   ├── problemRoutes.js
│   │   ├── aiRoutes.js
│   │   └── performanceRoutes.js
│   ├── services/
│   │   ├── aiService.js        # Claude API integration
│   │   ├── emailService.js     # Verification + reset emails
│   │   └── cacheService.js     # Redis helpers
│   ├── sockets/
│   │   └── roomHandler.js      # Socket.IO room event listeners
│   ├── utils/
│   │   ├── jwt.js
│   │   ├── validators.js       # Zod schemas
│   │   └── apiResponse.js      # Standardized response format
│   └── index.js                # Server entry point
│
└── frontend/
    └── src/
        ├── api/
        │   └── axios.js        # Axios instance with auth interceptors
        ├── components/
        │   ├── ProtectedRoute.jsx
        │   ├── SessionCard.jsx
        │   ├── SessionList.jsx
        │   └── PerformanceChart.jsx
        ├── context/
        │   └── AuthContext.jsx  # Global auth state
        └── pages/
            ├── Home.jsx
            ├── Login.jsx
            ├── Registar.jsx
            ├── VerifyEmail.jsx
            ├── ForgotPassword.jsx
            ├── ResetPassword.jsx
            ├── Dashboard.jsx
            ├── Profile.jsx
            └── LiveInterviewRoom.jsx
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- Redis
- An [Anthropic API key](https://console.anthropic.com/)
- A Brevo (Sendinblue) account for transactional email

### 1. Clone the repository

```bash
git clone https://github.com/your-username/levelup-io.git
cd levelup-io/ai-interview-platform
```

### 2. Install dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 3. Configure environment variables

Create a `.env` file inside the `backend/` directory (see [Environment Variables](#environment-variables) below).

### 4. Run database migrations

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

### 5. Start all servers

Open three terminal tabs:

```bash
# Terminal 1 — REST API + Socket.IO (port 3000)
cd backend && npm run dev

# Terminal 2 — Yjs WebSocket server for collaborative editing (port 3001)
cd backend && npx y-websocket-server

# Terminal 3 — Vite frontend dev server (port 5173)
cd frontend && npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Environment Variables

Create `backend/.env` with the following keys:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/levelup

# Server
PORT=3000
NODE_ENV=development

# Auth
JWT_SECRET=your_long_random_secret_here
JWT_EXPIRES_IN=7d
COOKIE_MAX_AGE=604800000

# Anthropic (Claude AI)
ANTHROPIC_API_KEY=sk-ant-...

# Redis
REDIS_URL=redis://localhost:6379

# Email (Brevo / Sendinblue)
BREVO_API_KEY=your_brevo_api_key
EMAIL_FROM=no-reply@yourdomain.com

# Frontend origin (for CORS + email links)
FRONTEND_URL=http://localhost:5173
```

> Never commit your `.env` file. It is already listed in `.gitignore`.

---

## API Reference

All endpoints are prefixed with `/api/v1`. Authenticated routes require a valid JWT either via `Authorization: Bearer <token>` header or the `token` httpOnly cookie set at login.

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | — | Register — sends email verification link |
| `GET` | `/auth/verify-email?token=` | — | Verify email and activate account |
| `POST` | `/auth/resend-verification` | — | Resend verification email |
| `POST` | `/auth/login` | — | Login, returns JWT + sets httpOnly cookie |
| `POST` | `/auth/logout` | — | Clear auth cookie |
| `GET` | `/auth/me` | ✓ | Get current authenticated user |
| `POST` | `/auth/forgot-password` | — | Send password reset link to email |
| `POST` | `/auth/reset-password` | — | Reset password using token from email |
| `PUT` | `/auth/change-password` | ✓ | Change password (requires current password) |
| `DELETE` | `/auth/delete-account` | ✓ | Permanently delete account (requires password) |

### Sessions

| Method | Endpoint | Role | Description |
|---|---|---|---|
| `GET` | `/sessions` | Any | List sessions (candidates see invitations only) |
| `GET` | `/sessions/:id` | Any | Get session by ID (access-controlled) |
| `POST` | `/sessions` | Interviewer / Admin | Create session and invite candidate by username |
| `PUT` | `/sessions/:id` | Interviewer / Admin | Update session status |
| `DELETE` | `/sessions/:id` | Admin | Delete session |

### Problems

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/problems` | — | List problems (filters: `difficulty`, `search`, `page`, `limit`) |
| `GET` | `/problems/:id` | — | Get problem with test cases and starter code |
| `POST` | `/problems/:id/run` | ✓ | Run code against test cases (JavaScript sandbox) |
| `POST` | `/problems/sync` | ✓ | Sync NeetCode 250 from LeetCode into the database |

### AI Interview

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/ai/evaluate` | ✓ | Submit answer for AI evaluation and scoring |
| `GET` | `/ai/history` | ✓ | Get past AI evaluation history |

### Performance

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/performance` | ✓ | Get aggregate performance stats by topic and grade |

---

## Socket.IO Events

The live room connects to `http://localhost:3000` with a JWT passed in `auth.token`.

| Event | Direction | Description |
|---|---|---|
| `join-room` | Client → Server | Join a room (access checked against DB) |
| `room-state` | Server → Client | Full room state sent on successful join |
| `room-error` | Server → Client | Emitted when the user is not invited |
| `user-joined` | Server → Room | Broadcast when a participant joins |
| `user-left` | Server → Room | Broadcast on disconnect |
| `code-change` | Bidirectional | Real-time code sync (fallback to Yjs) |
| `language-change` | Bidirectional | Language switch sync across participants |
| `chat-message` | Bidirectional | Chat messages (last 100 kept in memory) |
| `chat-typing` | Client → Room | Typing indicator broadcast |
| `select-problem` | Client → Server | Interviewer selects a problem for the session |
| `problem-selected` | Server → Room | Broadcasts selected problem to all participants |

---

## User Roles

| Role | Capabilities |
|---|---|
| `CANDIDATE` | AI mock interviews · Problem practice · View own invitations · Join invited rooms |
| `INTERVIEWER` | Everything above + Create sessions · Invite candidates by username · Select problems in room |
| `ADMIN` | Everything above + Delete sessions · View all sessions |

---

## Database Schema

```
User
  id, name, email (unique), username (unique), password, role
  resetToken?, resetTokenExpiry?
  createdAt, updatedAt
  → hostedSessions[], attendedSessions[], evaluations[]

InterviewSession
  id, title, role, level, status, scheduledAt
  interviewerId → User
  candidateId   → User

AIEvaluation
  id, userId, question, answer, role, level, topic
  score, grade, strengths[], improvements[], idealAnswer
  createdAt

Problem
  id, title, slug (unique), difficulty
  description, examples (JSON), constraints[], testCases (JSON)
  starterCode (JSON), tags[]
```

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
npm run preview    # Preview production build locally
npm run lint       # ESLint
```

---

## License

MIT
