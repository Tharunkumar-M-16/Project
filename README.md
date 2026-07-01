# ReadyScore — Smart Live Online Classroom + AI Employability (MERN)

> *"A credit score for careers."* A smart live-classroom platform where tutors run
> **live online classes**, share documents, and assign **auto-graded tests** — and every
> test result feeds an explainable **ReadyScore** (0–100) that measures how ready a student
> is for their target role. Built for 4 roles: **student, tutor, mentor, admin.**

---

## ✨ What's inside

- **Auth** — register/login, JWT, role-based access control (4 roles)
- **Live classes** — tutors create classes with a free embedded **Jitsi** video room (no signup)
- **Documents** — attach resources/links to each class
- **Auto-graded tests** — tutors assign MCQ tests; graded instantly on submit
- **Smart tie-in** — a good test score **verifies the matching skill** and raises the ReadyScore live
- **ReadyScore engine** — 4 explainable pillars: Skills 40% · Applied 25% · Consistency 20% · Soft 15%
- **Skill-gap analysis** — "what to fix next" + an actionable roadmap
- **Role dashboards** — student (classes + score), tutor (manage classes/tests), mentor (overview all), admin (analytics)
- **Seed data** — demo users, target roles, live classes, documents, and a test

## 🧱 Stack

| Layer | Tech |
|---|---|
| Frontend | React (Vite) + Tailwind CSS + React Router + Axios |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcrypt |

---

## 🚀 Getting started

### Prerequisites
- Node.js 18+ and npm
- MongoDB running locally (`mongodb://127.0.0.1:27017`) — or set `MONGO_URI` in `server/.env`

### 1. Install dependencies
```bash
npm run install:all          # installs both server and client
```

### 2. Seed demo data
```bash
npm run seed
```
Everyone logs in with an **ID + password** (no email). This creates:

**Staff** — log in via the hidden **`/manual-login`** page (credentials configured in `server/.env`):

| Role | ID | Password |
|---|---|---|
| admin | `admin` | `admin123` |
| mentor | `rishi` | `123` |

**Users** — created by the mentor; log in at the normal **`/login`** page:

| Role | ID | Password |
|---|---|---|
| tutor | `tutor` | `tutor123` |
| student | `student` | `student123` |

> The **mentor** is the controller — they create every student/tutor login, reset passwords, and delete accounts. New students/tutors don't self-register; the mentor makes their ID.

### 3. Run it (two terminals)
```bash
# Terminal 1 — API on http://localhost:5000
npm run server

# Terminal 2 — web app on http://localhost:5173
npm run client
```
Open **http://localhost:5173** and log in with a demo account (the login page has
one-click buttons to fill each demo role).

---

## 📁 Project structure

```
project/
├── server/                 # Express API
│   ├── config/db.js        # MongoDB connection
│   ├── models/             # User (4 roles), Role, Class, Test
│   ├── services/readyScore.js   # ⭐ the ReadyScore engine
│   ├── controllers/        # auth, profile, readyscore, roles, classes, tests, admin
│   ├── middleware/         # protect + authorize (RBAC)
│   ├── routes/             # /api/* endpoints
│   ├── utils/seed.js       # demo data (users, classes, docs, test)
│   └── server.js
└── client/                 # React (Vite)
    └── src/
        ├── context/AuthContext.jsx     # auth state + token
        ├── components/                 # Navbar, ProtectedRoute, ReadyScoreCard, StudentRoster
        └── pages/                      # Login, Register, Dashboard + per-role dashboards
            ├── tutor/                  # TutorDashboard, ClassManager, CreateTestForm
            └── student/                # StudentDashboard, StudentClasses, TestTaker, SkillsEditor
```

## 🔌 Key API endpoints

| Method | Route | Who | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | public | create account (with role) |
| POST | `/api/auth/login` | public | login → JWT |
| GET | `/api/classes?scope=mine` | any | my classes (tutor's own / student's enrolled) |
| POST | `/api/classes` | tutor | create a live class (auto Jitsi link) |
| POST | `/api/classes/:id/enroll` | student | join a class |
| POST | `/api/classes/:id/documents` | tutor | attach a document/resource |
| POST | `/api/tests` | tutor | assign an MCQ test to a class |
| GET | `/api/tests/class/:classId` | any | tests for a class (answers hidden from students) |
| POST | `/api/tests/:id/submit` | student | submit answers → auto-graded → verifies skill |
| GET | `/api/tests/:id/submissions` | tutor/mentor/admin | view submissions |
| GET | `/api/readyscore` | student | ReadyScore for my target role |
| GET | `/api/readyscore/user/:id` | tutor/mentor/admin | a student's score |
| PUT | `/api/profile/skills` | student | update skills → recompute score |
| GET | `/api/admin/stats` | admin | platform analytics |

---

## 🛣️ Roadmap (next up)

- ✅ ~~Auto-graded tests → verified skills feed the score~~ (done)
- Embed the Jitsi room **inside** the app (currently opens in a new tab)
- AI tutor + AI grading of open-ended answers via an LLM (Gemini free tier)
- File uploads for documents (currently link-based)
- Replace the formula-based ReadyScore with a trained ML model as data grows
