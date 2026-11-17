# Notes Management Application

A production-grade, full-stack **Notes Management Web Application** built with **React 18 (Vite)**, **Tailwind CSS**, and **TipTap Rich Text Editor** on the frontend, and **Node.js + Express.js** with **MySQL (`mysql2/promise`)** on the backend.

Designed with strict modular architecture (`routes -> controllers -> services -> models`), stateless `HttpOnly` JWT cookie authentication, two-layer XSS protection (`DOMPurify` on the client and `sanitize-html` on the server), structured JSON/pretty logging via **Pino**, comprehensive unit & integration test suites (**Jest + React Testing Library** on the frontend; **Mocha + Chai + Sinon + Supertest + nyc** on the backend), and **SonarQube** static code analysis integration.

---

## 1. Project Overview

The Notes Management Application enables authenticated users to create, format, organize, pin, search, sort, edit, and delete personal rich-text notes in a modern SaaS-style workspace. Every database query is strictly scoped by `user_id` using parameterized SQL statements to guarantee complete multi-tenant isolation and prevent SQL injection or cross-user data access.

---

## 2. Features

1. **Authentication & Session Security:**
   - User registration with `bcrypt` password hashing (cost factor `12`) and duplicate email/username prevention (`409 Conflict`).
   - User login issuing a signed JWT inside an `HttpOnly`, `SameSite=Strict` cookie (`secure` in production).
   - Rate-limited login endpoint (`express-rate-limit`) and generic `"Invalid credentials"` responses (`401 Unauthorized`).
   - Protected routes on both backend (`protect` middleware) and frontend (`ProtectedRoute` + Axios `401` interceptor).
   - Current user session lookup (`GET /api/auth/me`), user profile management (`GET/PUT /api/users/profile`), password change (`PUT /api/users/change-password`), and secure logout (`POST /api/auth/logout`).
2. **Notes CRUD & Rich Text Editing:**
   - Create, read, update, and delete personal notes (`GET/POST /api/notes`, `GET/PUT/DELETE /api/notes/:id`).
   - **TipTap Rich Text Editor** with formatting toolbar: Bold, Italic, Strikethrough, Headings (`H1`–`H3`), Bullet Lists, Ordered Lists, Code Blocks, and validated Links (`http://`, `https://`, `mailto:`).
   - Pin/unpin notes to keep important notes at the top of the dashboard.
3. **Search, Filtering & Sorting:**
   - Debounced real-time search (`300ms`) across note `title` and plain-text `content_text` (`?search=`).
   - Filter by All Notes or Pinned Notes (`?pinned=true`) via the responsive SaaS Sidebar or SearchBar.
   - Sort notes by Newest First, Oldest First (`?sort=oldest`), or Title A–Z (`?sort=title`).
4. **Defense-in-Depth XSS & SQL Injection Protection:**
   - **Server-side:** `utils/sanitize.js` (`sanitize-html`) strips all HTML from titles and permits only safe formatting tags/attributes in note content while stripping `<script>`, `<iframe>`, inline event handlers (`onerror`, `onclick`), `style` attributes, and `javascript:` URLs.
   - **Client-side:** `DOMPurify.sanitize` sanitizes all HTML before editor initialization or preview rendering (`dangerouslySetInnerHTML` is never used), and `sanitizeLinkUrl` validates link protocols.
   - **Database Layer:** 100% parameterized queries via `mysql2/promise` `pool.execute()`.
5. **Centralized Logging & Exception Handling:**
   - **Pino + `pino-http`** structured logging (`pino-pretty` in development, JSON in production) with automatic redaction of cookies, authorization headers, passwords, and tokens.
   - Custom operational `AppError` class, `404` route handler, global Express error middleware, and `uncaughtException` / `unhandledRejection` process handlers.

---

## 3. Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 18, Vite 5, React Router v6, Tailwind CSS 3, Axios, TipTap (`@tiptap/react`, `@tiptap/starter-kit`), DOMPurify |
| **Backend** | Node.js, Express.js 4, `mysql2/promise` (Connection Pool, Raw Parameterized SQL), `cookie-parser`, `cors` |
| **Security & Validation** | `bcrypt` (cost 12), `jsonwebtoken`, `express-validator`, `express-rate-limit`, `sanitize-html` |
| **Logging** | `pino`, `pino-http`, `pino-pretty` |
| **Database** | MySQL 8.0 / MariaDB (InnoDB, `utf8mb4`, Foreign Keys with `ON DELETE CASCADE`, B-Tree & Composite Indexes) |
| **Frontend Testing** | Jest 29, React Testing Library (`@testing-library/react`, `@testing-library/jest-dom`), Babel (`@babel/preset-env`, `@babel/preset-react`), `jest-environment-jsdom` |
| **Backend Testing** | Mocha, Chai, Sinon, Supertest, `nyc` (Istanbul LCOV & text coverage) |
| **Code Quality** | SonarQube Community Edition, `sonar-scanner` |

---

## 4. Project Architecture & Folder Structure

```text
notes-app/
├── database/
│   └── schema.sql                       # MySQL DDL for notes_app and notes_app_test
├── docker-compose.yml                   # Optional Docker services (MySQL + SonarQube)
├── sonar-project.properties             # SonarQube static analysis & LCOV configuration
├── README.md                            # Complete project documentation
│
├── server/                              # Express.js Backend API
│   ├── scripts/
│   │   └── testDb.js                    # CLI script to verify MySQL connection & CRUD
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                    # mysql2 pool, query(), testConnection(), transaction()
│   │   │   └── logger.js                # Centralized Pino logger with sensitive field redaction
│   │   ├── controllers/
│   │   │   ├── authController.js        # register, login, logout, getMe
│   │   │   ├── notesController.js       # createNote, getAllNotes, getNoteById, updateNote, deleteNote
│   │   │   └── userController.js        # getProfile, updateProfile, changePassword
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js        # HttpOnly JWT cookie verification
│   │   │   ├── errorMiddleware.js       # Global Express error handling middleware
│   │   │   ├── rateLimiter.js           # Brute-force protection on login route
│   │   │   └── validateMiddleware.js    # express-validator rules & validation handler
│   │   ├── models/
│   │   │   ├── notesModel.js            # Parameterized SQL queries for notes
│   │   │   └── userModel.js             # Parameterized SQL queries for users
│   │   ├── routes/
│   │   │   ├── authRoutes.js            # /api/auth routes
│   │   │   ├── notesRoutes.js           # /api/notes protected routes
│   │   │   └── userRoutes.js            # /api/users protected routes
│   │   ├── services/
│   │   │   ├── authService.js           # Password hashing & JWT signing/verification
│   │   │   └── notesService.js          # Ownership enforcement, sanitization & business logic
│   │   ├── utils/
│   │   │   ├── AppError.js              # Custom operational error class
│   │   │   └── sanitize.js              # Server-side XSS sanitization (sanitize-html)
│   │   └── app.js                       # Express application setup
│   ├── tests/
│   │   ├── unit/                        # Mocha + Chai + Sinon unit tests (7 suites)
│   │   └── integration/                 # Supertest integration tests against notes_app_test
│   ├── server.js                        # Server entrypoint & process exception handlers
│   └── package.json
│
└── client/                              # React (Vite) Frontend
    ├── src/
    │   ├── components/
    │   │   ├── auth/                    # LoginForm.jsx, RegisterForm.jsx
    │   │   ├── common/                  # Navbar, Sidebar, ProtectedRoute, Modal, ConfirmDeleteModal, Button, Input, Spinner
    │   │   └── notes/                   # NoteCard, NoteList, NoteEditor (TipTap), SearchBar
    │   ├── context/
    │   │   └── AuthContext.jsx          # Global user authentication context
    │   ├── hooks/
    │   │   ├── useAuth.js               # AuthContext consumer hook
    │   │   ├── useDebounce.js           # Debounce hook for search bar
    │   │   └── useNotes.js              # Notes CRUD state & API hook
    │   ├── pages/
    │   │   ├── DashboardPage.jsx        # SaaS Notes Dashboard with Sidebar, Search & Modals
    │   │   ├── LoginPage.jsx            # Login view
    │   │   ├── NoteDetailPage.jsx       # Note editing & deletion view
    │   │   ├── ProfilePage.jsx          # User account & password settings view
    │   │   └── RegisterPage.jsx         # Sign up view
    │   ├── services/
    │   │   ├── api.js                   # Axios instance (withCredentials: true + 401 interceptor)
    │   │   ├── authService.js           # Auth & Profile API calls
    │   │   └── notesService.js          # Notes CRUD API calls
    │   ├── utils/
    │   │   └── helpers.js               # DOMPurify text truncation, URL sanitizer & date formatter
    │   ├── App.jsx                      # Application routing
    │   └── main.jsx                     # React DOM root
    ├── __tests__/                       # Jest + React Testing Library suites (9 suites, 37 tests)
    ├── babel.config.json                # Babel config for Jest
    ├── jest.config.js                   # Jest + JSDOM + LCOV coverage config
    ├── vite.config.js                   # Vite configuration
    └── package.json
```

---

## 5. Installation Instructions & MySQL Configuration

### Prerequisites
- **Node.js** v18+ and **npm** v9+
- **MySQL 8.0+** (via XAMPP / local MySQL server on port `3306`, or Docker)

### Step 1: Database Setup (MySQL)
Start your local MySQL server (e.g., via XAMPP Control Panel -> Start MySQL) and import [database/schema.sql](database/schema.sql), which creates both `notes_app` (development/production) and `notes_app_test` (isolated integration test database):

```powershell
# Using XAMPP MySQL on Windows:
C:\xampp\mysql\bin\mysql.exe -u root -e "source c:/Users/Farhan/Desktop/10pearls/notes-app/database/schema.sql"

# Or using standard MySQL CLI:
mysql -u root -p < database/schema.sql
```

### Step 2: Install Dependencies
```powershell
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

---

## 6. Environment Variables

### Backend (`server/.env`)
Copy `server/.env.example` to `server/.env`:
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=notes_app
DB_TEST_NAME=notes_app_test
JWT_SECRET=your_super_secret_jwt_key_change_in_production_min_32_chars
CLIENT_ORIGIN=http://localhost:5173
LOG_LEVEL=info
```
*(When `NODE_ENV=test` is set during test runs, `server/src/config/db.js` automatically connects to `notes_app_test` so production data in `notes_app` is never modified).*

### Frontend (`client/.env`)
Copy `client/.env.example` to `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 7. Frontend and Backend Commands

### Backend (`notes-app/server`)
| Command | Description |
| :--- | :--- |
| `npm run dev` | Start backend in development mode with `nodemon` (`http://localhost:5000`) |
| `npm start` | Start backend in production mode (`node server.js`) |
| `npm run db:test` | Verify MySQL connection pool and execute sample CRUD transaction |

### Frontend (`notes-app/client`)
| Command | Description |
| :--- | :--- |
| `npm run dev` | Start Vite React development server (`http://localhost:5173`) |
| `npm run build` | Build production bundle into `client/dist/` |
| `npm run preview` | Preview production build locally |

---

## 8. Testing Commands

### Frontend Unit Tests (Jest + React Testing Library)
```powershell
cd client

# Run all 9 frontend test suites (37 unit tests)
npm test

# Run tests and generate LCOV + text coverage report (client/coverage/lcov.info)
npm run test:coverage
```

### Backend Unit & Integration Tests (Mocha + Chai + Sinon + Supertest + nyc)
```powershell
cd server

# Run backend unit tests (Sinon DB mocks, no MySQL required)
npm test

# Run live MySQL integration tests against isolated notes_app_test database
npm run test:integration

# Run all 79 backend tests (unit + integration) and generate LCOV coverage (server/coverage/lcov.info)
npm run coverage
```

---

## 9. SonarQube Instructions

The project includes [sonar-project.properties](sonar-project.properties) pre-configured for both `client/src` and `server/src` along with LCOV coverage reports (`client/coverage/lcov.info` and `server/coverage/lcov.info`).

1. **Start SonarQube Server via Docker:**
   ```powershell
   docker run -d --name sonarqube -p 9000:9000 sonarqube:community
   ```
2. **Create Project & Generate Token:**
   - Open `http://localhost:9000` in your browser and log in with `admin` / `admin`.
   - Create a local project with Project Key `notes-app` and generate an analysis token.
3. **Generate Fresh Coverage Reports:**
   ```powershell
   cd server && npm run coverage
   cd ../client && npm run test:coverage
   ```
4. **Run SonarScanner from Root (`notes-app/`):**
   ```powershell
   cd ..
   npx sonar-scanner -D"sonar.token=YOUR_SONAR_TOKEN"
   ```
5. **View Quality Gate Report:**
   - Open `http://localhost:9000/dashboard?id=notes-app`.

---

## 10. API Documentation

All API responses follow the consistent JSON envelope:
```json
{
  "success": true,
  "message": "Human-readable status message",
  "data": { ... }
}
```

### Authentication Endpoints (`/api/auth`)
| Method | Endpoint | Auth | Description | Status Codes |
| :--- | :--- | :---: | :--- | :--- |
| `POST` | `/api/auth/register` | No | Register a new user (`username`/`name`, `email`, `password`) | `201`, `400`, `409` |
| `POST` | `/api/auth/login` | No | Authenticate user and set `HttpOnly` JWT cookie | `200`, `400`, `401`, `429` |
| `POST` | `/api/auth/logout` | No | Clear `HttpOnly` JWT cookie | `200` |
| `GET` | `/api/auth/me` | Yes | Return currently authenticated user | `200`, `401`, `404` |

### Notes CRUD Endpoints (`/api/notes`)
| Method | Endpoint | Auth | Description | Status Codes |
| :--- | :--- | :---: | :--- | :--- |
| `GET` | `/api/notes` | Yes | List current user's notes (`?search=`, `?pinned=true`, `?sort=newest\|oldest\|title`) | `200`, `401` |
| `GET` | `/api/notes/:id` | Yes | Retrieve a single note owned by current user | `200`, `401`, `404` |
| `POST` | `/api/notes` | Yes | Create a new sanitized rich-text note (`title`, `content`, `is_pinned`) | `201`, `400`, `401` |
| `PUT` | `/api/notes/:id` | Yes | Update an owned note (`title`, `content`, `is_pinned`) | `200`, `400`, `401`, `404` |
| `DELETE` | `/api/notes/:id` | Yes | Permanently delete an owned note | `200`, `401`, `404` |

### User Profile Endpoints (`/api/users`)
| Method | Endpoint | Auth | Description | Status Codes |
| :--- | :--- | :---: | :--- | :--- |
| `GET` | `/api/users/profile` | Yes | Get current user profile | `200`, `401`, `404` |
| `PUT` | `/api/users/profile` | Yes | Update username/email (requires `currentPassword` for email change) | `200`, `400`, `401`, `409` |
| `PUT` | `/api/users/change-password` | Yes | Update password (`currentPassword`, `newPassword`) | `200`, `400`, `401` |

---

## 11. Screenshots

> Place project screenshots inside `docs/screenshots/` before final submission if required by your instructor:

1. **Login & Registration Pages (`docs/screenshots/01-auth-pages.png`):**
   - Clean, minimal SaaS authentication cards with form validation and error feedback.
2. **SaaS Notes Dashboard & Responsive Sidebar (`docs/screenshots/02-dashboard.png`):**
   - Sidebar navigation (All Notes, Pinned Notes counts), debounced SearchBar, and responsive note cards grid.
3. **TipTap Rich Text Note Editor (`docs/screenshots/03-rich-text-editor.png`):**
   - Modal & detail editor supporting Bold, Italic, Headings, Lists, Code Blocks, and validated Links.
4. **Delete Confirmation Modal (`docs/screenshots/04-delete-modal.png`):**
   - Accessible confirmation dialog preventing accidental note deletion.
5. **Test Suite & SonarQube Analysis (`docs/screenshots/05-tests-and-sonarqube.png`):**
   - 79 passing Mocha/Chai/Supertest backend tests, 37 passing Jest frontend tests, and SonarQube Quality Gate dashboard.

---

## License

MIT License
