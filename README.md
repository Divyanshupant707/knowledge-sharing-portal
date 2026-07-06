<img width="1881" height="967" alt="image" src="https://github.com/user-attachments/assets/1986892a-0e3a-49cf-8b7e-5d6d93364183" />

<img width="1591" height="537" alt="image" src="https://github.com/user-attachments/assets/1aa0b013-9711-4351-a040-47d65fd92a4c" />


# Knowledge Sharing Portal

A **full-stack Knowledge Sharing Portal** built with **React 19**, **TypeScript**, **Hono**, **tRPC**, **Drizzle ORM**, and **MySQL**. The application follows **Object-Oriented Design (OOD)** principles and provides a scalable Q&A platform featuring **OAuth authentication**, **Role-Based Access Control (RBAC)**, **ElasticSearch-inspired search**, bookmarking, voting, and user reputation.

---

# 🚀 Features

## 📚 Q&A Platform

- Ask questions with categories and tags
- Post answers with Markdown support
- Accept the best answer
- Comment on questions and answers
- Upvote and downvote questions and answers
- Bookmark questions
- Track question views

## 🔍 Search

- ElasticSearch-inspired full-text search
- Search across questions, answers, users, tags, and categories
- Auto-suggestions while typing
- Filter search results by content type

## 🔐 Authentication & Authorization

- OAuth 2.0 Authentication
- JWT Sessions
- Role-Based Access Control (RBAC)
  - Admin
  - Moderator
  - User
  - Guest

## 👤 User Features

- User profiles
- Reputation system
- Activity history
- Bookmark management

---

# 🏗️ Architecture

```text
Frontend (React 19 + TypeScript + Tailwind CSS + shadcn/ui)
                          │
                          ▼
              tRPC 11.x (End-to-End Type Safety)
                          │
                          ▼
          Hono HTTP Server + Drizzle ORM + MySQL
                          │
          ┌───────────────┴───────────────┐
          │                               │
          ▼                               ▼
  OOD Service Layer              OAuth 2.0 Authentication
  ├── QuestionService            ├── JWT Sessions
  ├── AnswerService              ├── RBAC
  ├── VoteService                ├── Admin
  ├── CommentService             ├── Moderator
  ├── BookmarkService            └── User
  ├── CategoryService
  ├── TagService
  └── SearchService
```

---

# 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| **Backend** | Hono, tRPC 11.x, Drizzle ORM |
| **Database** | MySQL |
| **Authentication** | OAuth 2.0, JWT Sessions |
| **Search** | ElasticSearch-inspired in-memory indexing |

---

# 🎯 Object-Oriented Design Patterns

- Service Layer Pattern
- Repository Pattern
- Role-Based Access Control (RBAC)
- Singleton Search Index
- Modular Object-Oriented Architecture

---

# 🗄️ Database Schema

| Table | Description |
|-------|-------------|
| `users` | User accounts and roles |
| `questions` | Questions with views, votes and answers |
| `answers` | Answers with acceptance status |
| `comments` | Comments on questions and answers |
| `votes` | Upvote and downvote tracking |
| `tags` | Tag management |
| `question_tags` | Many-to-many question-tag mapping |
| `bookmarks` | User bookmarks |
| `categories` | Question categories |
| `question_views` | View tracking |

---

# ⚙️ Getting Started

## Prerequisites

- Node.js 20+
- MySQL

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Divyanshupant707/knowledge-sharing-portal.git
cd knowledge-sharing-portal
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env`

```env
DATABASE_URL=mysql://user:password@localhost:3306/knowledge_portal

VITE_APP_ID=your_app_id
VITE_KIMI_AUTH_URL=your_auth_url

APP_SECRET=your_secret
OWNER_UNION_ID=your_union_id
```

### 4. Push the database schema

```bash
npm run db:push
```

### 5. Seed sample data (Optional)

```bash
npx tsx db/seed.ts
```

### 6. Start the development server

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:3000
```

---

# 📡 API Routers

| Router | Description |
|---------|-------------|
| `auth` | Authentication |
| `question` | Question CRUD |
| `answer` | Answer CRUD |
| `comment` | Comment management |
| `category` | Category management |
| `tag` | Tag operations |
| `bookmark` | Bookmark management |
| `search` | Full-text search |
| `admin` | Admin dashboard |
| `dashboard` | Public dashboard |

---

# 📂 Project Structure

```text
.
├── api/
├── contracts/
├── db/
├── public/
├── src/
├── package.json
├── drizzle.config.ts
└── README.md
```

---

# ⚠️ Important Note

Before running the application, ensure that:

- MySQL is installed and running.
- Copy `.env.example` to `.env`.
- Configure all required environment variables.
- Push the database schema:

```bash
npm run db:push
```

---

# 📄 License

This project is licensed under the **MIT License**.
