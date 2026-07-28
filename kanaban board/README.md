# Real-Time AI Kanban Board (MERN + Gemini)

A full-stack, collaborative Kanban Board web application built using the MERN stack (MongoDB, Express, React 18, Node.js) with real-time multiplayer updates via WebSockets (Socket.io) and Google Gemini AI powerups (via `@google/genai`).

---

## Key Features

### 1. Multiplayer Collaboration & Live Presence
- **Real-Time Board Syncing**: Actions (card drag-and-drop, task additions, comment threads, and column changes) sync instantly across all online members.
- **Presence Avatars**: Stacked avatars in the top header show who is currently active on the board.

### 2. Workload Tracking & Teammate Analytics
- **Workload Metrics Widget**: Shows each member's active task count and historical on-time task completion rate directly next to their badge on the **Team** page.
- **Performance Service**: Automatically monitors task status transitions to completed states and recalculates user stats (on-time rate, overdue rates, etc.).

### 3. Google Gemini AI Integrations
- **AI Task Generator**: Input a text description of your project to automatically generate a structured board layout of columns and tasks.
- **AI Subtask Suggestions**: Automatically suggest 3-6 actionable checklist subtasks based on a task's title and description.
- **AI Priority & Labeling**: Automatically classify urgency levels and suggest tags.
- **AI Workload Analysis**: Analyzes current board workload distribution and suggests task reassignments to balance active tasks and blockages (restriced to Board Owners/Admins).
- **Board Chat & AI Assistant**: Collapsible board-level chat drawer. Mention `@AI` to ask Flowbot project planning questions based on the live board state.

### 4. Notification System
- **Reassignment Alerts**: Immediate notification triggers whenever a task is assigned or reassigned to a member.
- **Overdue Task Cron Job**: Daily cron worker checks for overdue tasks and sends reminders.
- **Nodemailer & Email Dispatch**: Dispatches email alerts using Gmail SMTP alongside in-app notification bells.
- **Self-Reassignment Guard**: Automatically skips alerts if a user reassigns a task to themselves.

---

## Setup Instructions

### 1. Configure Environment Variables

#### Backend (`server/.env`)
Copy `server/.env.example` to `server/.env` and complete the variables:
```ini
MONGODB_URI=mongodb://localhost:27017/kanban
PORT=5000
JWT_SECRET=change_me_to_a_long_random_string
CLIENT_URL=http://localhost:5173

# Google Gemini API key — get one at https://ai.google.dev
GEMINI_API_KEY=your_gemini_key_here

# Nodemailer alerts (Gmail SMTP)
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_gmail_app_password
```

#### Frontend (`client/.env`)
Copy `client/.env.example` to `client/.env` and verify the values:
```ini
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

---

### 2. Spin up Containers
Run the following command in the project root:
```bash
docker-compose up --build
```
This builds and starts:
- **MongoDB** container mapping port `27017`
- **Node.js Express Server** container on `http://localhost:5000`
- **Vite React Client** container on `http://localhost:5173`

*Note: Alternatively, you can run the application locally outside of Docker by executing the `run-backend.bat` and `run-frontend.bat` scripts.*

---

### 3. Open the Application
Navigate to **[http://localhost:5173](http://localhost:5173)** in your browser:
- **Login / Signup**: Create an account or log in to get started.
- **Create Board**: Click the `New Board` button in the sidebar or top header, and name your board to start planning!
