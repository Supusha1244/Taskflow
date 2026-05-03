# TaskFlow – Team Task Manager

A full-stack collaborative task management web application built with React, Node.js/Express, and MongoDB.

## Live Demo

- **Frontend:** https://radiant-determination-frontend.up.railway.app/dashboard
- **Backend API:** https://taskflow-backend-673d.up.railway.app/

---

## Features

- **Authentication** – JWT-based signup/login with bcrypt password hashing
- **Projects** – Create projects, invite members by email, manage team access
- **Tasks** – Create tasks with title, description, priority, due date, and assignee
- **Kanban Board** – Drag-and-drop task cards across To Do / In Progress / Done
- **Dashboard** – Visual stats: total tasks, by status, by priority, overdue count, team workload
- **Role-Based Access** – Admin can manage tasks/members; Members can update only their assigned tasks
- **Responsive UI** – Works on desktop and mobile

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18, React Router v6, Axios    |
| Backend    | Node.js, Express.js                 |
| Database   | MongoDB with Mongoose ODM           |
| Auth       | JWT (jsonwebtoken) + bcryptjs       |
| Validation | express-validator                   |
| Deployment | Railway (separate frontend/backend) |

---

## Project Structure

```
task-manager/
├── backend/
│   ├── src/
│   │   ├── config/db.js          # MongoDB connection
│   │   ├── controllers/          # Business logic
│   │   │   ├── authController.js
│   │   │   ├── projectController.js
│   │   │   ├── taskController.js
│   │   │   └── dashboardController.js
│   │   ├── middleware/auth.js    # JWT protect + admin check
│   │   ├── models/               # Mongoose schemas
│   │   │   ├── User.js
│   │   │   ├── Project.js
│   │   │   └── Task.js
│   │   ├── routes/               # Express route definitions
│   │   └── index.js              # App entry point
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── context/AuthContext.jsx   # Global auth state
│   │   ├── pages/                    # Route-level components
│   │   ├── components/layout/        # Sidebar navigation
│   │   └── utils/api.js              # Axios instance + interceptors
│   ├── .env.example
│   └── package.json
└── README.md
```

---

## API Reference

### Auth
| Method | Endpoint         | Description        | Auth |
|--------|------------------|--------------------|------|
| POST   | /api/auth/signup | Register user      | No   |
| POST   | /api/auth/login  | Login              | No   |
| GET    | /api/auth/me     | Get current user   | Yes  |

### Projects
| Method | Endpoint                           | Description              | Auth   |
|--------|------------------------------------|--------------------------|--------|
| GET    | /api/projects                      | List my projects         | Yes    |
| POST   | /api/projects                      | Create project           | Yes    |
| GET    | /api/projects/:id                  | Get project              | Member |
| PATCH  | /api/projects/:id                  | Update project           | Admin  |
| DELETE | /api/projects/:id                  | Delete project + tasks   | Admin  |
| POST   | /api/projects/:id/members          | Add member by email      | Admin  |
| DELETE | /api/projects/:id/members/:userId  | Remove member            | Admin  |

### Tasks
| Method | Endpoint       | Description        | Auth            |
|--------|----------------|--------------------|-----------------|
| GET    | /api/tasks     | List tasks (filter)| Member          |
| POST   | /api/tasks     | Create task        | Admin           |
| GET    | /api/tasks/:id | Get task           | Member          |
| PATCH  | /api/tasks/:id | Update task        | Admin or Assignee|
| DELETE | /api/tasks/:id | Delete task        | Admin           |

### Dashboard
| Method | Endpoint        | Description             | Auth |
|--------|-----------------|-------------------------|------|
| GET    | /api/dashboard  | Stats for all my tasks  | Yes  |

---

## Local Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or MongoDB Atlas)

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/task-manager.git
cd task-manager
```

### 2. Backend setup
```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm install
npm run dev
```

### 3. Frontend setup
```bash
cd frontend
cp .env.example .env
# Edit .env: REACT_APP_API_URL=http://localhost:5000/api
npm install
npm start
```

App runs at `http://localhost:3000`

---

## Deployment on Railway

### Step 1: Set up MongoDB Atlas
1. Create a free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a database user and get your connection string

### Step 2: Deploy Backend
1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select your repo → set root directory to `backend`
3. Add environment variables:
   ```
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=your-32-char-random-secret
   CLIENT_URL=https://your-frontend.up.railway.app
   NODE_ENV=production
   PORT=5000
   ```
4. Deploy → copy the generated URL

### Step 3: Deploy Frontend
1. New Service in same Railway project → Deploy from GitHub
2. Set root directory to `frontend`
3. Add environment variable:
   ```
   REACT_APP_API_URL=https://your-backend.up.railway.app/api
   ```
4. Deploy → your app is live!

---

## Role-Based Access Control

| Action                   | Admin | Member |
|--------------------------|-------|--------|
| Create/delete tasks      | ✅    | ❌     |
| Assign tasks             | ✅    | ❌     |
| Update task status       | ✅    | ✅ (own tasks only) |
| Add/remove members       | ✅    | ❌     |
| Delete project           | ✅    | ❌     |
| View project tasks       | ✅    | ✅     |

---

## Database Schema

**User:** name, email (unique), password (hashed), timestamps

**Project:** name, description, color, admin (ref: User), members ([ref: User]), status, timestamps

**Task:** title, description, project (ref: Project), assignee (ref: User), createdBy (ref: User), status (todo/inprogress/done), priority (low/medium/high), dueDate, tags, timestamps

---

## Author

Built for the Full-Stack Coding Assignment – Team Task Manager
