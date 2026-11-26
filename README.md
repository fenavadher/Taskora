# Taskora – Task Management System

Taskora is a full-stack MERN (MongoDB, Express.js, React.js, Node.js) task management web application built for productivity tracking, Kanban workflows, daily progress analytics, and deadline alerts.

## Tech Stack

- **Frontend:** React 19, Vite, TypeScript, React Router, Axios, Tailwind CSS, Lucide React
- **Backend:** Node.js, Express.js, TypeScript
- **Database:** MongoDB Atlas & Mongoose
- **Authentication & Security:** JWT (`jsonwebtoken`), `bcryptjs` password hashing, strict input validation, user-scoped resource authorization

## Features

- User registration, login, and logout with JWT and bcrypt
- Protected frontend routes and protected backend API endpoints
- Full user-specific Task CRUD (title, description, priority, status, category, due date)
- Dashboard metrics (Total, Pending, In Progress, Completed, Overdue)
- Daily Progress visualization (completion rate bar + 7-day activity chart)
- Deadline Alerts panel (overdue and due within 48 hours)
- Quick Add Task bar & Add/Edit Task modal
- Search, filter by status/priority/category, and sort by due date
- Views for Dashboard, All Tasks, Today's Tasks, Completed Tasks, and Kanban Board
- Responsive desktop sidebar and mobile navigation drawer

---

## Project Structure

When extracted from the downloadable ZIP (`taskora-mern-project.zip`):

```text
taskora/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/      # Sidebar, TopBar, TaskModal, QuickAddBar, TaskRow, Charts
│   │   ├── context/         # AuthContext (JWT & health state)
│   │   ├── pages/           # Login, Register, Dashboard, Tasks, Kanban
│   │   ├── services/        # Axios instance & API modules
│   │   ├── types/           # TypeScript interfaces
│   │   └── utils/           # Date & deadline helpers
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── server/                  # Express + Mongoose backend
│   ├── config/db.ts         # MongoDB Atlas Mongoose connection
│   ├── controllers/         # Auth & Task route handlers
│   ├── middleware/          # JWT auth, DB check, and error handlers
│   ├── models/              # User & Task Mongoose schemas
│   ├── routes/              # /api/auth, /api/tasks, /api/export-zip
│   ├── tests/               # Automated backend tests
│   ├── utils/               # JWT & input validators
│   ├── app.ts               # Express app configuration
│   ├── index.ts             # Standalone server entry point
│   └── package.json
├── .env.example
└── README.md
```

---

## MongoDB Atlas Setup (Free Tier)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and sign in or create a free account.
2. Click **Create** (or **Build a Database**), select the **M0 Free** shared cluster, choose your preferred cloud region, and click **Create Deployment**.
3. **Create a Database User:**
   - Under **Security → Database Access**, click **Add New Database User**.
   - Choose **Password** authentication, enter a username (e.g. `taskora_user`) and a strong password, and grant **Read and write to any database**.
4. **Configure Network Access:**
   - Under **Security → Network Access**, click **Add IP Address**.
   - Click **Allow Access from Anywhere** (`0.0.0.0/0`) for development/deployment convenience and confirm.
5. **Copy Your Connection String:**
   - Go to **Database → Connect → Drivers** (Node.js).
   - Copy the URI, for example:
     `mongodb+srv://taskora_user:<db_password>@cluster0.xxxxx.mongodb.net/taskora?retryWrites=true&w=majority`
   - Replace `<db_password>` with your database user password (URL-encode special characters if needed) and include `/taskora` before the `?`.

---

## Local Setup & Commands

### 1. Configure Environment Variables

Inside `server/`, copy `.env.example` to `.env`:

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

```env
MONGO_URI=mongodb+srv://taskora_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/taskora?retryWrites=true&w=majority
PORT=5000
CLIENT_URL=http://localhost:5173
JWT_SECRET=replace_with_a_long_random_secret_at_least_32_chars
```

### 2. Install & Run Backend

```bash
cd server
npm install
npm run dev
```

The Express API server starts at `http://localhost:5000`.

### 3. Install & Run Frontend (in a second terminal)

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173` in your browser. Vite automatically proxies `/api/*` requests to `http://localhost:5000`.

### 4. Run Automated Tests

```bash
cd server
npm test
```

---

## REST API Documentation

Base URL: `http://localhost:5000/api`

### Health Check

- **GET `/api/health`** — Returns server and MongoDB connection status.

### Authentication

- **POST `/api/auth/register`**
  - Body: `{ "name": "Alex Morgan", "email": "alex@example.com", "password": "password123" }`
  - Response (`201`): `{ "success": true, "token": "<jwt>", "user": { "id", "name", "email", "createdAt" } }`
- **POST `/api/auth/login`**
  - Body: `{ "email": "alex@example.com", "password": "password123" }`
  - Response (`200`): `{ "success": true, "token": "<jwt>", "user": { ... } }`
- **GET `/api/auth/me`** *(Protected — `Authorization: Bearer <token>`)*
  - Response (`200`): `{ "success": true, "user": { ... } }`
- **POST `/api/auth/logout`**
  - Response (`200`): `{ "success": true, "message": "Signed out successfully." }`

### Tasks *(All endpoints require `Authorization: Bearer <token>`)*

- **GET `/api/tasks`**
  - Query params: `search`, `status` (`Pending|In Progress|Completed`), `priority` (`Low|Medium|High`), `category`, `view` (`all|today|completed`), `sort` (`dueDate_asc|dueDate_desc|priority|newest|oldest`)
  - Response (`200`): `{ "success": true, "count": 5, "tasks": [...] }`
- **GET `/api/tasks/stats`**
  - Response (`200`): `{ "success": true, "stats": { total, pending, inProgress, completed, overdue, dueToday, dueSoon, completedToday, completionRate }, "dailyProgress": [...], "alerts": [...], "categories": [...] }`
- **POST `/api/tasks`**
  - Body: `{ "title": "...", "description": "...", "priority": "Medium", "status": "Pending", "category": "Work", "dueDate": "2026-12-01T23:59:00.000Z" }`
  - Response (`201`): `{ "success": true, "task": { ... } }`
- **GET `/api/tasks/:id`**
  - Response (`200`): `{ "success": true, "task": { ... } }`
- **PUT / PATCH `/api/tasks/:id`**
  - Body: Partial or full task fields
  - Response (`200`): `{ "success": true, "task": { ... } }`
- **DELETE `/api/tasks/:id`**
  - Response (`200`): `{ "success": true, "message": "Task deleted successfully.", "id": "..." }`

---

## Uploading to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Taskora full-stack MERN task manager"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/taskora-task-manager.git
git push -u origin main
```

*(Ensure `.env` and `node_modules/` are listed in `.gitignore` so secrets are never pushed.)*

---

## Deployment Guide

### Deploy Backend (Render)
1. Push your repository to GitHub.
2. Create a new **Web Service** on [Render](https://render.com) pointing to the `server` root directory.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add Environment Variables: `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` (your deployed Vercel/Netlify URL).

### Deploy Frontend (Vercel)
1. Import the repository on [Vercel](https://vercel.com) with Root Directory set to `client`.
2. Add Environment Variable: `VITE_API_URL=https://your-render-backend.onrender.com/api`
3. Deploy and verify login, registration, and task persistence.
