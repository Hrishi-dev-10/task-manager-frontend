# Task Master — Frontend

A React single-page app for managing projects and tasks. Includes a Kanban-style board with drag-and-drop status changes, role-based navigation, and live notifications delivered over Socket.IO.

Pairs with the Task Master Backend API (Express + PostgreSQL).

## Features

- **Authentication**: sign up, log in, and a forgot-password page. Access tokens refresh automatically on `401`, and the session is kept in `sessionStorage`.
- **Route guards**: guest-only pages (login/signup), protected dashboard pages, and an admin-only Users page.
- **Projects**: list, create, edit and delete projects (admins), manage members, view a project's details.
- **Task board**: columns for *In Progress*, *Blocked*, *In Review* and *Completed*. Drag a card between columns to change its status. `pending` tasks appear under *In Progress*.
- **Tasks page**: all tasks across the projects you can access, with create and edit forms.
- **Users page** (admin): searchable, paginated user list.
- **Settings**: update your profile details.
- **Notifications**: a live inbox fed by Socket.IO, plus recent history fetched from the API.
- Responsive layout with a sidebar (drawer on small screens), breadcrumbs and page titles driven by route metadata.

## Tech stack

| Area | Choice |
| --- | --- |
| UI | React 19, TypeScript |
| Build tool | Vite |
| Routing | React Router |
| State / data | Redux Toolkit (auth slice + RTK Query) and a small `fetch` client |
| Styling | Tailwind CSS 4 + daisyUI |
| Real-time | socket.io-client |
| Linting | ESLint with typescript-eslint |

## Project structure

```
frontend/
├── server/                # Mock API for local development (mounted at /api by Vite)
└── src/
    ├── api/               # fetch client with token refresh, shared types, useQuery hook
    ├── auth/              # auth context, route guards, role helpers
    ├── components/        # Modal, ProjectForm, TaskForm, UserUpdateForm, empty/error states
    ├── layouts/           # AuthLayout, DashboardLayout, AppHeader, Sidebar, route metadata
    ├── notifications/     # Socket connection and notification inbox provider
    ├── pages/             # Login, Signup, ForgotPassword, ProjectsList, ProjectDetail,
    │                      # Tasks, Users, Settings, NotFound
    ├── shared/            # Navbar, SideDrawer, Avatar, StatusBadge, icons, helpers
    ├── store/             # Redux store, auth slice, RTK Query API slice (auth endpoints)
    ├── tasks/             # TaskBoard, TaskList, ordering helpers
    ├── router.tsx         # Route table
    └── main.tsx           # App entry
```

## Getting started

### Prerequisites

- Node.js 20+
- The Task Master Backend running locally (see its README)

### Install and run

```bash
cd frontend
npm install
npm run dev
```

The app starts at `http://localhost:5173`.

### Connect to the backend

By default the app talks to `http://localhost:5000/api/v1` (REST) and `http://localhost:5000` (Socket.IO). Start the backend with `PORT=5000`.

The backend's CORS configuration only allows the origin `http://localhost:5173`, so keep Vite on its default port.

### First login

1. Sign up on the `/signup` page. New accounts get the `USER` role.
2. To use admin features (creating projects, the Users page), promote the account in the database: `UPDATE users SET role = 'ADMIN' WHERE email = '...';`

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Type-check (`tsc -b`) and build for production into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |

## Routes

| Path | Access | Page |
| --- | --- | --- |
| `/login`, `/signup`, `/forgotpassword` | Guests only | Authentication |
| `/` | Signed in | Redirects to `/projects` |
| `/projects` | Signed in | Project list |
| `/projects/:projectId` | Signed in | Project detail and task board |
| `/tasks` | Signed in | All tasks |
| `/settings` | Signed in | Profile settings |
| `/users` | Admin | User management |
| `*` | Anyone | Not found |

## How it works

- **API layer**: `src/api/client.ts` wraps `fetch`, attaches the Bearer token, and on a `401` attempts one refresh via `/auth/refresh-token` before redirecting to `/login`. Concurrent refreshes are de-duplicated. `src/store/api.ts` holds RTK Query endpoints for login, register and reset-password.
- **Auth state**: user and tokens live in `sessionStorage` (key `taskmaster.session`), so the session ends when the tab closes.
- **Notifications**: `NotificationSocket` opens a Socket.IO connection with the signed-in user's id and pushes incoming events into the notification inbox.
- **Task ordering**: `src/tasks/ordering.ts` is the hook point for persisting drag-and-drop order via `PUT /tasks/order`.

## Known limitations

- **`API` environment variable doesn't work as written.** The code reads `import.meta.env.API`, but Vite only exposes variables prefixed with `VITE_`. Until that is renamed (for example to `VITE_API_URL`), the base URL is always the localhost default. This needs a fix before deploying anywhere else.
- **Backend endpoints still missing:** deleting a task (`DELETE /tasks/:id`) and saving task order (`PUT /tasks/order`) are called by the client but not implemented in the backend yet.
- **Mock server is unused by default.** `server/` provides an in-memory dev API at `/api`, but the client points at the real backend.
- **Forgot password** calls the backend's reset endpoint directly; there is no email verification step yet.

## License

Private project.