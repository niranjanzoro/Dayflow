# Dayflow HRMS — Frontend

React + Vite frontend for the Dayflow HRMS. Runs fully standalone against a
mock, localStorage-backed "database" out of the box, and is wired to switch
to the real Spring Boot API with one env variable once the backend is ready.

## Stack

React 18 · Vite · React Router DOM · Axios · Context API (JWT auth) ·
Lucide React icons · plain CSS (design tokens, no framework).

## Getting started

```bash
npm install
npm run dev
```

Open the printed local URL (default `http://localhost:5173`).

## Demo accounts (mock mode)

| Role       | Email                     | Password      |
|------------|---------------------------|---------------|
| HR / Admin | admin@dayflow.com         | Admin@123     |
| Employee   | rahul.mehta@dayflow.com   | Employee@123  |
| Employee   | priya.nair@dayflow.com    | Employee@123  |

A third employee, **Daniel Cruz**, is seeded with `PENDING` status so you can
see the HR approval flow immediately from **Admin → Employees**.

## How sign-up / sign-in / roles work

- **Sign up** (`/signup`) only ever creates an **Employee** account. New
  accounts start in a `PENDING` state and cannot sign in until an HR admin
  approves them from **Employee Management**.
- **Sign in** (`/login`) is shared by both Employees and HR/Admin — the app
  routes each user to `/employee` or `/admin` based on their role after
  login.
- There is no HR sign-up. One HR/Admin account is seeded by default
  (`admin@dayflow.com`). From **Admin → Employees**, that HR user can:
  - **Approve** pending sign-ups,
  - **Promote** any active employee to HR (grants full admin access),
  - **Remove HR access** (demote back to employee),
  - **Deactivate / reactivate** accounts.

This mirrors how the real backend should enforce it too: `POST /auth/signup`
should always assign `ROLE_EMPLOYEE`, and only an authenticated HR user
should be able to call `POST /employees/{id}/promote-to-hr`.

## Mock mode vs. real backend

Every file in `src/api/` checks `VITE_USE_MOCK` (see `src/api/axiosClient.js`):

- `VITE_USE_MOCK=true` (default) → reads/writes a mock "database" kept in
  `localStorage` (`src/api/mockData.js`). Great for demos and UI work
  without the backend running.
- `VITE_USE_MOCK=false` → every function in `src/api/*.js` instead calls
  the real Spring Boot endpoints via Axios (`src/api/axiosClient.js`, which
  also attaches the JWT to every request and force-logs-out on `401`).

Copy `.env.example` to `.env` to configure this:

```
VITE_USE_MOCK=false
VITE_API_BASE_URL=http://localhost:8080/api
```

No page or component needs to change when you flip this — the mock and real
code paths live side-by-side inside each `api/*.js` file behind the same
function signatures, matching the backend's controllers
(`AuthController`, `EmployeeController`, `AttendanceController`,
`LeaveController`, `PayrollController`).

## Project structure

```
src/
├── App.jsx                 # Route table (public + role-protected routes)
├── main.jsx                # Entry point, providers
├── index.css                # Design tokens + all component styles
├── context/
│   └── AuthContext.jsx      # Current user/token, login/signup/logout
├── components/
│   ├── ProtectedRoute.jsx   # Auth + role guard
│   ├── DashboardLayout.jsx  # Sidebar + topbar shell for app pages
│   ├── Sidebar.jsx
│   ├── Navbar.jsx
│   └── StatCard.jsx
├── pages/
│   ├── Login.jsx / SignUp.jsx / ForgotPassword.jsx
│   ├── EmployeeDashboard.jsx
│   ├── AdminDashboard.jsx
│   ├── EmployeeManagement.jsx   # HR: approvals, promote/demote, status
│   ├── Profile.jsx              # shared, role-aware
│   ├── Attendance.jsx           # shared, role-aware
│   ├── Leave.jsx                # shared, role-aware
│   ├── Payroll.jsx              # shared, role-aware
│   └── NotFound.jsx
├── api/
│   ├── axiosClient.js       # JWT-attaching axios instance + USE_MOCK flag
│   ├── mockData.js          # seeded mock "DB" (localStorage)
│   ├── authApi.js
│   ├── employeeApi.js
│   ├── attendanceApi.js
│   ├── leaveApi.js
│   └── payrollApi.js
└── utils/
    └── roles.js             # ROLES / status enums shared across the app
```

## Notes

- Passwords are stored in plain text **only** inside the mock localStorage
  layer, purely to simulate login without a backend. The real backend should
  hash passwords (e.g. BCrypt) and this frontend never needs to change to
  support that — it just posts `{ email, password }` to `/auth/login`.
- Responsive down to mobile: the sidebar collapses behind a hamburger menu
  under ~860px.


cd "D:\DayFlow -Oodo\Dayflow\backend"
mvn spring-boot:run




cd "D:\DayFlow -Oodo\Dayflow\frontend"
npm install
npm run dev





cd "D:\DayFlow -Oodo\Dayflow\frontend"
npm run build
npm run lint



cd "D:\DayFlow -Oodo\Dayflow\backend"
mvn clean test
 