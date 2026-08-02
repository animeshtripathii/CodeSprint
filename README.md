<div align="center">

# 🚀 CodeSprint

### The All-in-One Hackathon Management Platform

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-v19-61DAFB.svg)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248.svg)](https://www.mongodb.com)
[![Express](https://img.shields.io/badge/Express-v5-000000.svg)](https://expressjs.com)
[![Vite](https://img.shields.io/badge/Vite-v8-646CFF.svg)](https://vitejs.dev)
[![Socket.io](https://img.shields.io/badge/Socket.io-v4-010101.svg)](https://socket.io)

**CodeSprint** is a full-stack MERN hackathon management platform that provides end-to-end tools for organizers, participants, and judges — from hackathon discovery and team formation to AI-assisted submissions, real-time collaboration, leaderboards, and GitHub integration.

[Live Demo](#) · [Report Bug](https://github.com/animeshtripathii/CodeSprint/issues) · [Request Feature](https://github.com/animeshtripathii/CodeSprint/issues)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [Feature Highlights](#-feature-highlights)
- [Architecture](#-system-architecture)
- [Workflow Charts](#-workflow-charts)
  - [Authentication Flow](#1️⃣-authentication-flow)
  - [Hackathon Lifecycle](#2️⃣-hackathon-lifecycle)
  - [Team Formation Flow](#3️⃣-team-formation-flow)
  - [Submission & Review Flow](#4️⃣-submission--review-flow)
  - [AI Assistant Flow](#5️⃣-ai-assistant-flow)
  - [Real-Time Collaboration Flow](#6️⃣-real-time-collaboration--team-workspace)
  - [Leaderboard & Scoring Flow](#7️⃣-leaderboard--scoring-flow)
  - [GitHub Integration Flow](#8️⃣-github-integration-flow)
  - [Kanban & Task Management Flow](#9️⃣-kanban--task-management-flow)
  - [Notification Flow](#-notification-flow)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

CodeSprint eliminates the fragmented experience of running and participating in hackathons. Instead of juggling Discord for teams, Google Forms for registration, GitHub for code, and spreadsheets for judging — CodeSprint unifies everything in one intelligent platform.

| Role | What They Get |
|------|---------------|
| 🏢 **Organizer** | Create hackathons, manage registrations, review submissions, publish results |
| 👥 **Participant** | Discover & join hackathons, form teams, collaborate in real time, submit projects |
| ⚖️ **Judge** | Review assigned submissions, score projects, leave detailed feedback |
| 🛡️ **Admin** | Manage all users, oversee platform activity |

---

## 🛠 Tech Stack

### Backend

| Technology | Purpose |
|---|---|
| **Node.js + Express v5** | REST API server |
| **MongoDB + Mongoose** | Database & ODM |
| **Socket.io v4** | Real-time messaging & notifications |
| **JWT + Bcrypt** | Authentication & password hashing |
| **Clerk** | SSO / OAuth provider |
| **Cloudinary + Multer** | File & image uploads |
| **Google Generative AI** | AI-powered assistant |
| **Nodemailer** | Email notifications |
| **Morgan + Rate Limiter** | Logging & API protection |

### Frontend

| Technology | Purpose |
|---|---|
| **React 19 + Vite 8** | UI framework & build tool |
| **React Router v7** | Client-side routing |
| **Tailwind CSS v4** | Utility-first styling |
| **Framer Motion + GSAP** | Animations & transitions |
| **Three.js + R3F** | 3D landing page visuals |
| **Socket.io Client** | Real-time updates |
| **Clerk React** | Auth UI components |
| **React Hot Toast** | Toast notifications |
| **Lucide + React Icons** | Icon library |

---

## ✨ Feature Highlights

- 🔐 **Multi-provider Auth** — Email/password + GitHub/Google OAuth via Clerk
- 🏆 **Hackathon Management** — Full CRUD lifecycle for hackathons with prize tracking
- 👥 **Team Formation** — Create or join teams with invite links
- 💬 **Real-Time Chat** — Private DMs and community chat powered by Socket.io
- 🤖 **AI Assistant** — Google Gemini-powered project ideation and code help
- 📋 **Kanban Board** — Drag-and-drop task management per team
- 📅 **Calendar** — Event timeline and deadline tracker
- 🧑‍⚖️ **Judge Panel** — Assign judges, submit reviews, multi-criteria scoring
- 🥇 **Leaderboard** — Real-time dynamic rankings
- 🐙 **GitHub Integration** — Browse repos and file trees directly in the platform
- 📊 **Dashboard** — Personalized stats for participants and organizers
- 🔔 **Notifications** — In-app and real-time event notifications
- ☁️ **File Uploads** — Project assets via Cloudinary
- 🌐 **Community Hub** — Cross-hackathon discussion board

---

## 🏗 System Architecture

```mermaid
graph TB
    subgraph Client["Frontend - React + Vite"]
        UI["React Pages & Components"]
        CTX["Auth Context + State"]
        SOCK_C["Socket.io Client"]
    end

    subgraph Server["Backend - Express + Node.js"]
        API["REST API Router"]
        MW["Middleware Layer - Auth, Rate Limit, Error"]
        SOCK_S["Socket.io Server"]
        CTRL["Controllers"]
        SVC["Services"]
    end

    subgraph Data["Data Layer"]
        MDB["MongoDB - Mongoose ODM"]
    end

    subgraph External["External Services"]
        CLERK["Clerk Auth"]
        GEMINI["Google Gemini AI"]
        CLOUD["Cloudinary CDN"]
        GH["GitHub API"]
        MAIL["Nodemailer SMTP"]
    end

    UI -->|HTTP REST| API
    UI -->|WebSocket| SOCK_S
    CTX -->|JWT Cookie| MW
    API --> MW --> CTRL --> SVC --> MDB
    SOCK_S --> MDB
    SVC --> GEMINI
    SVC --> CLOUD
    SVC --> GH
    SVC --> MAIL
    UI --> CLERK
    CLERK -->|Token| CTX
```

---

## 📊 Workflow Charts

### 1️⃣ Authentication Flow

```mermaid
flowchart TD
    A([User Visits App]) --> B{Has Account?}
    B -->|No| C[Register Page]
    B -->|Yes| D[Login Page]

    C --> E{Auth Method}
    E -->|Email and Password| F[Fill Registration Form]
    E -->|GitHub or Google| G[OAuth via Clerk SSO]

    F --> H[POST /api/auth/register]
    H --> I{Validation OK?}
    I -->|No| J[Return Errors]
    I -->|Yes| K[Hash Password - Create User]
    K --> L[Issue JWT Cookie]

    G --> M[Clerk SSO Callback]
    M --> N[/sso-callback route]
    N --> O{Existing User?}
    O -->|No| P[Auto-create User Record]
    O -->|Yes| Q[Load Profile]
    P --> L
    Q --> L

    D --> R[POST /api/auth/login]
    R --> S{Credentials Valid?}
    S -->|No| T[401 Unauthorized]
    S -->|Yes| L

    L --> U[JWT stored in HttpOnly Cookie]
    U --> V[Redirect to /dashboard]
    V --> W([Authenticated Session])
```

---

### 2️⃣ Hackathon Lifecycle

```mermaid
flowchart LR
    A([Organizer]) --> B["Create Hackathon\nPOST /api/hackathons"]
    B --> C{Validation}
    C -->|Fail| D[Return Errors]
    C -->|Pass| E[(Save to MongoDB)]

    E --> F[Status: UPCOMING]
    F --> G["Browse Hackathons\nGET /api/hackathons"]
    G --> H[View Detail Page]

    H --> I["Register\nPOST /api/registrations"]
    I --> J{Already Registered?}
    J -->|Yes| K[Block Duplicate]
    J -->|No| L[Create Registration Record]

    L --> M[Join or Create Team]
    M --> N[Status: ONGOING]

    N --> O["Submit Project\nPOST /api/submissions"]
    O --> P["Judges Review\nPOST /api/reviews"]
    P --> Q[Scores Computed]
    Q --> R[Status: ENDED]
    R --> S["Leaderboard Published\nGET /api/leaderboard"]
    S --> T([Winners Announced])
```

---

### 3️⃣ Team Formation Flow

```mermaid
flowchart TD
    A([Registered Participant]) --> B{Team Action}
    B -->|Create| C["Create Team\nPOST /api/teams"]
    B -->|Join| D[Enter Invite Code]

    C --> E[Generate Unique Invite Code]
    E --> F[(Team Saved - Creator is Leader)]
    F --> G[Share Invite Link]

    D --> H[POST /api/teams/join]
    H --> I{Code Valid?}
    I -->|No| J[Error: Invalid Code]
    I -->|Yes| K{Team Full?}
    K -->|Yes| L[Error: Max Members Reached]
    K -->|No| M[Add Member to Team]

    M --> N[Team Workspace Unlocked]
    N --> O{Workspace Features}
    O --> P[Real-Time Chat]
    O --> Q[Kanban Board]
    O --> R[GitHub Repos]
    O --> S[Calendar]
    O --> T[AI Assistant]
    O --> U[File Sharing]
```

---

### 4️⃣ Submission & Review Flow

```mermaid
flowchart TD
    A([Team Member]) --> B[Navigate to Submit Page]
    B --> C["Fill Submission Form\n- Project Title\n- Description\n- GitHub Repo URL\n- Demo Video URL\n- Attachments"]

    C --> D[POST /api/submissions]
    D --> E{Validation}
    E -->|Fail| F[Return Field Errors]
    E -->|Pass| G{Deadline Passed?}
    G -->|Yes| H[Reject: Submission Closed]
    G -->|No| I[(Save Submission)]

    I --> J[Notification Sent to Organizer]
    J --> K[Organizer Assigns Judge]

    K --> L([Judge])
    L --> M[Browse Assigned Submissions]
    M --> N[Open Review Form]

    N --> P["Score on Criteria\n- Innovation\n- Technical Complexity\n- Presentation\n- Impact"]
    P --> Q[POST /api/reviews]
    Q --> R{All Judges Reviewed?}
    R -->|No| S[Awaiting Other Judges]
    R -->|Yes| T[Aggregate Scores]
    T --> U[Update Leaderboard]
    U --> V([Results Published])
```

---

### 5️⃣ AI Assistant Flow

```mermaid
flowchart TD
    A([User in Team Workspace]) --> B[Open AI Assistant Panel]
    B --> C{Input Type}

    C -->|Idea Generation| D[Describe Problem Statement]
    C -->|Code Help| E[Paste Code Snippet]
    C -->|Project Feedback| F[Share Project Details]

    D --> G[POST /api/ai/generate-idea]
    E --> H[POST /api/ai/code-help]
    F --> I[POST /api/ai/review-project]

    G --> J{Rate Limit OK?}
    H --> J
    I --> J

    J -->|Exceeded| K[429 Too Many Requests]
    J -->|OK| L[Build Prompt with Context]
    L --> M[Google Gemini API Call]
    M --> N{Response OK?}
    N -->|Error| O[Return Fallback Message]
    N -->|Success| P[Stream Response to Client]
    P --> Q[Display in Chat UI]
    Q --> R([User Receives AI Insight])
```

---

### 6️⃣ Real-Time Collaboration — Team Workspace

```mermaid
sequenceDiagram
    participant UA as Team Member A
    participant FE as React Frontend
    participant SOCK as Socket.io Server
    participant DB as MongoDB
    participant UB as Team Member B

    UA->>FE: Opens Team Workspace
    FE->>SOCK: connect + join room by teamId
    SOCK-->>FE: Connected ACK

    UA->>FE: Sends chat message
    FE->>SOCK: emit sendMessage with teamId and text
    SOCK->>DB: Save Message to DB
    SOCK-->>FE: emit newMessage to sender
    SOCK-->>UB: emit newMessage to receiver

    UA->>FE: Moves Kanban card
    FE->>SOCK: emit taskUpdate with taskId and new status
    SOCK->>DB: Update Task in DB
    SOCK-->>UB: emit taskUpdated event

    UB->>FE: Typing in chat
    FE->>SOCK: emit typing event with teamId
    SOCK-->>UA: emit userTyping with userId
```

---

### 7️⃣ Leaderboard & Scoring Flow

```mermaid
flowchart LR
    A["Judge Submits Review\nPOST /api/reviews"] --> B[(Store Review in DB)]
    B --> C["GET /api/leaderboard/:hackathonId"]
    C --> D[Aggregate Pipeline]

    D --> E{Score Calculation}
    E --> F[Sum all judge scores per submission]
    F --> G[Compute weighted average across criteria]
    G --> H[Sort teams descending by score]
    H --> I[Assign Ranks 1st 2nd 3rd]
    I --> J[Return Ranked Array]

    J --> K[Frontend LeaderboardPage]
    K --> L[Render podium and table]
    L --> M{Live Update Mode}
    M -->|Socket event| N[Real-time re-render on new review]
    M -->|Polling| O[Refetch every N seconds]
    N --> P([Participants see live ranking])
    O --> P
```

---

### 8️⃣ GitHub Integration Flow

```mermaid
flowchart TD
    A([User in Repositories Page]) --> B[GET /api/github/repos]
    B --> C{GitHub Token Present?}
    C -->|No| D[Prompt: Connect GitHub Account]
    C -->|Yes| E[Fetch Repos via GitHub API Proxy]

    E --> F[/api/github proxy endpoint]
    F --> G[GitHub REST API]
    G --> H[Return Repo List]
    H --> I[Display RepositoriesPage]

    I --> J[User Selects a Repo]
    J --> K[Navigate to /repositories/:owner/:repo]
    K --> L[Fetch File Tree via /api/github/tree]
    L --> M[Render RepoTreePage]

    M --> N{User Action}
    N -->|Browse Folder| O[Expand tree node]
    N -->|View File| P[Fetch file content via /api/github/blob]
    P --> Q[Syntax highlighted file preview]
    N -->|Link to Submission| R[Save Repo URL in Submission record]
```

---

### 9️⃣ Kanban & Task Management Flow

```mermaid
flowchart TD
    A([Team Member]) --> B["Open Kanban Board\n/kanban or /workspace"]
    B --> C["Load Tasks\nGET /api/tasks with teamId"]

    C --> D["Render Board Columns\nTodo | In Progress | Done"]

    D --> E{User Action}

    E -->|Create Task| F[Click Add Task button]
    F --> G["POST /api/tasks\nwith title, assignee, priority, dueDate"]
    G --> H[(Save Task to DB)]
    H --> I[Broadcast update via Socket.io]

    E -->|Move Card| J[Drag and Drop card]
    J --> K["PATCH /api/tasks/:id\nwith new status column"]
    K --> L[(Update Task Status in DB)]
    L --> I

    E -->|Edit Task| M[Open Task Detail Modal]
    M --> N["PATCH /api/tasks/:id\nwith updated fields"]
    N --> L

    E -->|Delete Task| O["DELETE /api/tasks/:id"]
    O --> P[(Remove Task from DB)]
    P --> I

    I --> Q[Real-time sync for all team members]
    Q --> D
```

---

### 🔔 Notification Flow

```mermaid
flowchart TD
    A{Triggering Event} --> B1[Team Invite Received]
    A --> B2[Submission Reviewed]
    A --> B3[Hackathon Deadline Approaching]
    A --> B4[New Message in Community]
    A --> B5[Registration Approved]

    B1 --> C[Create Notification Record]
    B2 --> C
    B3 --> C
    B4 --> C
    B5 --> C

    C --> D[(Save to MongoDB\nNotification Model)]
    D --> E[Socket.io emit to target userId]
    E --> F[Frontend receives newNotification event]
    F --> G[Bell icon badge count increments]
    G --> H["User clicks Notifications\n/notifications route"]
    H --> I[GET /api/notifications]
    I --> J["Mark as read\nPATCH /api/notifications/:id"]
    J --> K([Notification cleared])
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v20+
- **npm** v9+
- **MongoDB** (local or Atlas)
- **Clerk** account (for auth)
- **Cloudinary** account (for uploads)
- **Google AI Studio** API key (for AI features)

### Clone the Repository

```bash
git clone https://github.com/animeshtripathii/CodeSprint.git
cd CodeSprint
```

### Backend Setup

```bash
cd backend
cp .env.example .env       # Fill in your environment variables
npm install
npm run dev                # Starts on http://localhost:5000
```

### Frontend Setup

```bash
cd frontend
cp .env.example .env       # Fill in your environment variables
npm install
npm run dev                # Starts on http://localhost:5173
```

---

## 🔧 Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `CLERK_SECRET_KEY` | Clerk backend secret key |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `GOOGLE_AI_API_KEY` | Google Gemini API key |
| `CLIENT_URL` | Frontend origin URL |
| `GITHUB_CLIENT_ID` | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app secret |
| `SMTP_HOST` | Email SMTP host |
| `SMTP_USER` | Email SMTP username |
| `SMTP_PASS` | Email SMTP password |

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `VITE_API_BASE_URL` | Backend API base URL |
| `VITE_SOCKET_URL` | Socket.io server URL |

---

## 📡 API Reference

| Module | Base Path | Key Endpoints |
|---|---|---|
| Auth | `/api/auth` | `POST /register`, `POST /login`, `POST /logout` |
| Users | `/api/users` | `GET /me`, `PATCH /me`, `GET /:id` |
| Hackathons | `/api/hackathons` | `GET /`, `POST /`, `GET /:id`, `PATCH /:id` |
| Registrations | `/api/registrations` | `POST /`, `GET /my` |
| Teams | `/api/teams` | `POST /`, `POST /join`, `GET /:id` |
| Submissions | `/api/submissions` | `POST /`, `GET /:id`, `PATCH /:id` |
| Reviews | `/api/reviews` | `POST /`, `GET /submission/:id` |
| Leaderboard | `/api/leaderboard` | `GET /:hackathonId` |
| Dashboard | `/api/dashboard` | `GET /participant`, `GET /organizer` |
| Tasks | `/api/tasks` | `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id` |
| Messages | `/api/messages` | `GET /:teamId`, `POST /` |
| AI | `/api/ai` | `POST /generate-idea`, `POST /code-help` |
| GitHub | `/api/github` | `GET /repos`, `GET /tree`, `GET /blob` |
| Community | `/api/community` | `GET /messages`, `POST /messages` |

---

## 📁 Project Structure

```
CodeSprint/
├── backend/
│   ├── config/          # DB connection, Cloudinary config
│   ├── controllers/     # Route handler logic
│   ├── middleware/      # Auth, error handler, rate limiter
│   ├── models/          # Mongoose schemas
│   │   ├── User.js
│   │   ├── Hackathon.js
│   │   ├── Team.js
│   │   ├── Submission.js
│   │   ├── Review.js
│   │   ├── Task.js
│   │   ├── Message.js
│   │   ├── Notification.js
│   │   └── CommunityMessage.js
│   ├── routes/          # Express route definitions (15 modules)
│   ├── services/        # Business logic, AI, email
│   ├── utils/           # Seed scripts, helpers
│   ├── app.js           # Express app configuration
│   └── server.js        # HTTP + Socket.io server entry
│
└── frontend/
    ├── public/
    └── src/
        ├── components/  # Reusable UI components
        ├── context/     # AuthContext
        ├── lib/         # Utility functions
        ├── pages/       # 22 route-level page components
        ├── services/    # API service functions
        ├── store/       # State management
        ├── App.jsx      # Router configuration
        └── main.jsx     # React entry point
```

---

## ☁️ Deployment

| Layer | Platform |
|---|---|
| Frontend | **Vercel** (auto-deploy via `vercel.json`) |
| Backend | **Render / Railway / Fly.io** |
| Database | **MongoDB Atlas** |
| Media | **Cloudinary** |

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built with ❤️ by **Animesh Tripathi**

⭐ Star this repo if you find it useful!

</div>
