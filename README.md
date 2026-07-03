# AutoCare Nepal - MERN Stack Architecture

This project is a classic MERN stack application split into two distinct workspaces:

1. **Frontend Client (`/client`):** A React SPA built using Vite, Tailwind CSS, and TanStack Router.
2. **Backend API Server (`/server`):** A standalone Express.js + Mongoose + MongoDB REST API server.

---

## Prerequisites

- **Node.js** (v18 or higher recommended)
- **MongoDB** (running locally on port `27017` or via a custom MongoDB connection string)

---

## Getting Started

### 1. Installation

To install all dependencies for both the frontend client and the backend server at once, run this command from the root directory:

```bash
npm run install:all
```

### 2. Running the Application

You can start both the client dev server and the backend Express server concurrently with a single command from the root directory:

```bash
npm run dev
```

This launches:
- **Frontend Client:** `http://localhost:5173/`
- **Backend API Server:** `http://localhost:5000/`

---

## Backend Services & Automatic Database Seeding

The server connects to MongoDB (database name: `autocare_nepal`) and automatically seeds mock data on its first launch.

### Default Seeded User Accounts:
* **Customer Account:**
  * **Email:** `user@autocare.com`
  * **Password:** `password123`
* **Admin Account:**
  * **Email:** `admin@autocare.com`
  * **Password:** `password123`
* **Superadmin Account:**
  * **Email:** `super@autocare.com`
  * **Password:** `password123`

---

## Project Structure

```
├── client/              # React Frontend SPA (Vite)
│   ├── src/             # Source files
│   │   ├── components/  # Reusable UI widgets and layout shells
│   │   ├── routes/      # Client-side file router pages
│   │   └── lib/         # Client fetch helpers targeting Express REST APIs
│   ├── index.html       # Client entry HTML container
│   └── vite.config.ts   # Vite configuration with /api reverse proxy
│
├── server/              # Express + MongoDB API Backend
│   ├── index.js         # Express app entry & Mongoose collections
│   └── package.json     # Node server dependencies
│
└── package.json         # Root workspace package scripts (dev, install:all)
```
