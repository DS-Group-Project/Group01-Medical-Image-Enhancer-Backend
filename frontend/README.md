<div align="center">

# 🏥 Medical Image Enhancer — Frontend

**AI-Powered Medical Image Enhancement & Analysis Platform**

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

> A modern, production-grade single-page application for uploading, enhancing, and analyzing medical images (JPEG, PNG, DICOM) using deep-learning backend services.

[Getting Started](#-getting-started) · [Architecture](#-architecture) · [Features](#-features) · [Contributing](#-contributing)

</div>

---

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Dev Server](#running-the-dev-server)
  - [Building for Production](#building-for-production)
- [Project Structure](#-project-structure)
- [Available Scripts](#-available-scripts)
- [API Integration](#-api-integration)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

| Category | Details |
|---|---|
| **Image Upload** | Drag-and-drop zone with multi-file support, file preview cards, and client-side validation (JPEG, PNG, DICOM up to 50 MB). |
| **Real-time Processing** | Job status polling with animated progress indicators; supports `PENDING → UPLOADING → QUEUED → PROCESSING → COMPLETED` pipeline. |
| **Image Viewer** | Side-by-side original vs. enhanced comparison with interactive controls. |
| **Dashboard** | Stats grid, recent activity feed, and at-a-glance metrics for processed jobs. |
| **History** | Full processing history with search, filtering, and pagination. |
| **Authentication** | JWT-based auth flow with login, registration, token refresh, and protected route guards. |
| **Mock Mode** | Built-in mock data layer (`VITE_USE_MOCK=true`) for frontend-only development without a backend. |
| **Responsive UI** | Fully responsive layout with mobile-first design, animated transitions (Framer Motion), and toast notifications. |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **UI Library** | React 18 (JSX) |
| **Build Tool** | Vite 5 |
| **Styling** | Tailwind CSS 3, PostCSS, Autoprefixer |
| **Routing** | React Router DOM v6 |
| **HTTP Client** | Axios (with request/response interceptors) |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |
| **Notifications** | React Hot Toast |
| **Type Checking** | TypeScript config (type-aware JSX) |
| **Font** | Inter (Google Fonts) |

---

## 🏗 Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                        Browser (SPA)                          │
│                                                               │
│  ┌─────────┐  ┌──────────┐  ┌────────────┐  ┌─────────────┐ │
│  │  Pages   │→ │Components│→ │  Services  │→ │  REST API   │ │
│  │          │  │ (UI/Biz) │  │ (api.js)   │  │ (Backend)   │ │
│  └─────────┘  └──────────┘  └────────────┘  └─────────────┘ │
│       ↕             ↕              ↕                          │
│  ┌─────────┐  ┌──────────┐  ┌────────────┐                  │
│  │ Routing  │  │ Context  │  │  Hooks     │                  │
│  │(Router6) │  │(AuthCtx) │  │(useAuth,   │                  │
│  │          │  │          │  │ usePolling) │                  │
│  └─────────┘  └──────────┘  └────────────┘                  │
└───────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Version |
|---|---|
| **Node.js** | `>=18.x` |
| **npm** | `>=9.x` (or **yarn** / **pnpm**) |
| **Git** | Latest |

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/DS-Group-Project/Group01-Medical-Image-Enhancer-Frontend.git
cd Group01-Medical-Image-Enhancer-Frontend

# 2. Install dependencies
npm install
```

### Environment Variables

Copy the example environment file and update values as needed:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:5000/api` | Backend API base URL |
| `VITE_APP_NAME` | `Medical Image Enhancer` | Application display name |
| `VITE_POLLING_INTERVAL` | `3000` | Job status polling interval (ms) |
| `VITE_MAX_FILE_SIZE` | `52428800` | Maximum upload file size in bytes (50 MB) |
| `VITE_USE_MOCK` | `true` | Enable mock data layer (set to `false` for live backend) |

> **⚠️ Important:** Never commit `.env` files containing real credentials. The `.env.example` file is safe to commit and serves as a template.

### Running the Dev Server

```bash
npm run dev
```

The application will be available at **`http://localhost:3000`**.

### Building for Production

```bash
# Build optimized bundle
npm run build

# Preview the production build locally
npm run preview
```

---

## 📂 Project Structure

```
medical-image-enhancer/
├── public/                     # Static assets
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── assets/                 # Bundled static assets
│   ├── components/
│   │   ├── dashboard/          # Dashboard-specific components
│   │   │   ├── RecentActivity.jsx
│   │   │   └── StatsGrid.jsx
│   │   ├── layout/             # App shell (Navbar, Footer, Layout)
│   │   │   ├── AppLayout.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── Navbar.jsx
│   │   ├── ui/                 # Reusable UI primitives
│   │   │   ├── Button.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   ├── LoadingSkeleton.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── StatsCard.jsx
│   │   │   └── StatusBadge.jsx
│   │   └── upload/             # File upload components
│   │       ├── FilePreviewCard.jsx
│   │       └── FileUploadZone.jsx
│   ├── context/
│   │   └── AuthContext.jsx     # Authentication context provider
│   ├── hooks/
│   │   ├── useAuth.js          # Auth convenience hook
│   │   └── usePolling.js       # Interval-based polling hook
│   ├── pages/
│   │   ├── DashboardPage.jsx   # Main dashboard
│   │   ├── HistoryPage.jsx     # Processing history
│   │   ├── ImageViewerPage.jsx # Enhanced image viewer
│   │   ├── LoginPage.jsx       # Login form
│   │   ├── NotFoundPage.jsx    # 404 page
│   │   ├── ProcessingPage.jsx  # Real-time processing status
│   │   ├── RegisterPage.jsx    # Registration form
│   │   └── UploadPage.jsx      # Image upload page
│   ├── services/
│   │   ├── api.js              # Axios instance with interceptors
│   │   ├── authService.js      # Auth API calls
│   │   ├── mockData.js         # Mock data for development
│   │   └── uploadService.js    # Upload/processing API calls
│   ├── utils/
│   │   ├── constants.js        # App-wide constants & enums
│   │   └── helpers.js          # Utility functions
│   ├── App.jsx                 # Root component with routing
│   ├── ErrorBoundary.jsx       # Global error boundary
│   ├── index.css               # Global styles & Tailwind directives
│   └── main.jsx                # Application entry point
├── .env.example                # Environment variable template
├── .gitignore                  # Git ignore rules
├── index.html                  # HTML entry point
├── package.json                # Dependencies & scripts
├── postcss.config.js           # PostCSS configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── vite.config.js              # Vite build configuration
```

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR on port `3000` |
| `npm run build` | Create optimized production build in `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint across all `.js` and `.jsx` files |

---

## 🔌 API Integration

The frontend communicates with the backend REST API via Axios. The API client is configured in `src/services/api.js` with:

- **Base URL** — configurable via `VITE_API_BASE_URL`
- **Request interceptor** — automatically attaches JWT `Bearer` token from `localStorage`
- **Response interceptor** — handles `401 Unauthorized` (auto-redirect to login) and global error toasts
- **Timeout** — 30-second request timeout

### Key API Endpoints (consumed by frontend)

| Service | Method | Endpoint | Description |
|---|---|---|---|
| Auth | `POST` | `/auth/login` | User login |
| Auth | `POST` | `/auth/register` | User registration |
| Upload | `POST` | `/upload` | Upload medical image for processing |
| Jobs | `GET` | `/jobs/:id` | Get processing job status |
| Jobs | `GET` | `/jobs` | List all user jobs (history) |
| Results | `GET` | `/results/:id` | Retrieve enhanced image result |

> **Note:** When `VITE_USE_MOCK=true`, all API calls are intercepted by the mock data layer in `src/services/mockData.js`, allowing full frontend development without a running backend.

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Commit** your changes using [Conventional Commits](https://www.conventionalcommits.org/)
   ```bash
   git commit -m "feat: add image zoom controls to viewer page"
   ```
4. **Push** to your branch
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Open** a Pull Request against `main`

### Commit Message Convention

| Prefix | Usage |
|---|---|
| `feat:` | A new feature |
| `fix:` | A bug fix |
| `docs:` | Documentation changes |
| `style:` | Code style changes (formatting, no logic change) |
| `refactor:` | Code refactoring |
| `test:` | Adding or updating tests |
| `chore:` | Build process or tooling changes |

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ by DS Group 01**

</div>
