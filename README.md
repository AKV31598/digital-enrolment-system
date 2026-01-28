# Digital Enrolment System

A full-stack Policy Management application built with TypeScript, tRPC, React, and SQLite.

## 🎯 Overview

This application allows HR teams to manage employees and their dependents (family members) under group insurance policies. It features role-based access control with two user types:

- **HR Manager**: Full CRUD access to all employees and dependents
- **Employee**: Can view and manage their own dependents (cannot delete)

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Language** | TypeScript (100%) |
| **Frontend** | React 18 + Vite |
| **Backend** | Express.js + tRPC |
| **Database** | SQLite + Prisma ORM |
| **Styling** | Tailwind CSS |
| **Auth** | JWT (JSON Web Tokens) |

## 📋 Features

### Authorization & Access Control
- ✅ Role-based authentication (HR Manager / Employee)
- ✅ JWT token-based sessions
- ✅ Protected routes based on user role

### HR Manager Functions
- ✅ View all employees
- ✅ Add single employee via form
- ✅ Bulk upload employees via CSV
- ✅ Edit employee information
- ✅ Delete employees (cascade deletes dependents)
- ✅ Manage all dependents (CRUD)

### Employee Functions
- ✅ View own profile and policy info
- ✅ View own dependents
- ✅ Add new dependents (spouse, children, parents)
- ✅ Edit dependent information
- ❌ Cannot delete dependents (HR only)

### Error Handling
- ✅ Form validation
- ✅ CSV validation with row-level errors
- ✅ API error messages
- ✅ Toast notifications

### Data Persistence
- ✅ SQLite database
- ✅ Data survives logout/refresh
- ✅ Cascade delete for data integrity

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npm run db:generate

# 3. Create database and push schema
npm run db:push

# 4. Seed the database with test data
npm run db:seed

# 5. Start development server
npm run dev
```

### Or use the setup script:
```bash
npm run setup
npm run dev
```

## 🔐 Test Credentials

| Role | Username | Password |
|------|----------|----------|
| HR Manager | `hr_admin` | `password123` |
| Employee | `john.doe` | `password123` |
| Employee | `jane.smith` | `password123` |

## 📁 Project Structure

```
digital-enrolment-system/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Test data seeding
├── src/
│   ├── server/
│   │   ├── index.ts       # Express server entry
│   │   ├── db.ts          # Prisma client
│   │   ├── context.ts     # tRPC context
│   │   ├── trpc.ts        # tRPC setup & middleware
│   │   ├── routers/       # API routes
│   │   │   ├── auth.ts    # Login/logout/me
│   │   │   ├── employee.ts# Employee CRUD
│   │   │   ├── member.ts  # Dependent CRUD
│   │   │   └── policy.ts  # Policy info
│   │   └── utils/
│   │       ├── auth.ts    # JWT & bcrypt helpers
│   │       └── csv-parser.ts # CSV parsing
│   ├── client/
│   │   ├── index.html     # HTML entry
│   │   ├── main.tsx       # React entry
│   │   ├── App.tsx        # Main app with routes
│   │   ├── trpc.ts        # tRPC client config
│   │   ├── context/       # React contexts
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   └── styles/        # CSS/Tailwind
│   └── shared/
│       └── types.ts       # Shared TypeScript types
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 🌐 API Endpoints

All API calls go through tRPC at `/api/trpc/*`

### Authentication
- `auth.login` - Login with username/password
- `auth.logout` - Logout current user
- `auth.me` - Get current user info

### Employees (HR only for write operations)
- `employee.list` - List all employees (paginated)
- `employee.getById` - Get employee details
- `employee.getCurrent` - Get logged-in employee's record
- `employee.create` - Add new employee
- `employee.bulkCreate` - Bulk add from CSV
- `employee.update` - Update employee
- `employee.delete` - Delete employee + dependents

### Members/Dependents
- `member.listByEmployee` - Get dependents for employee
- `member.getById` - Get member details
- `member.create` - Add dependent
- `member.update` - Update dependent
- `member.delete` - Remove dependent (HR only!)

### Policies
- `policy.list` - List all policies
- `policy.getById` - Get policy details
- `policy.getCurrent` - Get current employee's policy

## 📊 Database Schema

```
User (id, username, password, role, firstName, lastName, email)
  └── Employee (id, employeeCode, firstName, lastName, email, phone, ...)
        └── Member (id, firstName, lastName, relationship, dateOfBirth, gender)
  └── InsurancePolicy (id, policyNumber, policyName, companyName)
```

## 🔒 Security Features

1. **Password Hashing**: bcrypt with salt rounds
2. **JWT Authentication**: Secure token-based auth
3. **Role-based Access**: Middleware enforces permissions
4. **Input Validation**: Zod schemas for all inputs
5. **SQL Injection Prevention**: Prisma ORM parameterized queries

## 📝 License

This project is for demonstration purposes.

---

## 📋 Features

### Authorization & Access Control
- ✅ Role-based authentication (HR Manager / Employee)
- ✅ JWT token-based sessions
- ✅ Protected routes based on user role

### HR Manager Functions
- ✅ View all employees
- ✅ Add single employee
- ✅ Bulk upload employees (CSV)
- ✅ Edit employee details
- ✅ Delete employee (cascades to dependents)
- ✅ Manage all dependents

### Employee Functions
- ✅ View own profile
- ✅ View own dependents
- ✅ Add dependents
- ✅ Edit dependents
- ❌ Cannot delete dependents (HR only)

### Error Handling
- ✅ Form validation
- ✅ CSV validation with detailed errors
- ✅ API error messages
- ✅ Toast notifications

### Data Integrity
- ✅ Cascade delete (employee → dependents)
- ✅ Unique employee codes per policy
- ✅ Relationship constraints (one spouse, etc.)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npm run db:generate

# 3. Create database and run migrations
npm run db:push

# 4. Seed the database with test data
npm run db:seed

# 5. Start development server
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api/trpc

### Test Credentials

| Role | Username | Password |
|------|----------|----------|
| HR Manager | `hr_admin` | `password123` |
| Employee | `john.doe` | `password123` |
| Employee | `jane.smith` | `password123` |

## 📁 Project Structure

```
digital-enrolment-system/
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── seed.ts            # Test data seeding
│   └── dev.db             # SQLite database (generated)
├── src/
│   ├── server/
│   │   ├── index.ts       # Express server entry
│   │   ├── db.ts          # Prisma client
│   │   ├── context.ts     # tRPC context
│   │   ├── trpc.ts        # tRPC setup & middleware
│   │   ├── routers/
│   │   │   ├── index.ts   # Main router
│   │   │   ├── auth.ts    # Authentication
│   │   │   ├── employee.ts# Employee CRUD
│   │   │   ├── member.ts  # Dependent CRUD
│   │   │   └── policy.ts  # Policy info
│   │   └── utils/
│   │       ├── auth.ts    # JWT & password utils
│   │       └── csv-parser.ts # CSV parsing
│   ├── client/
│   │   ├── index.html     # HTML entry
│   │   ├── main.tsx       # React entry
│   │   ├── App.tsx        # App with routing
│   │   ├── trpc.ts        # tRPC client
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   └── AddMemberModal.tsx
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Employees.tsx
│   │   │   ├── EmployeeDetails.tsx
│   │   │   ├── Dependents.tsx
│   │   │   ├── AddEmployee.tsx
│   │   │   └── BulkUpload.tsx
│   │   └── styles/
│   │       └── index.css  # Tailwind styles
│   └── shared/
│       └── types.ts       # Shared TypeScript types
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend & backend in dev mode |
| `npm run dev:client` | Start only frontend (Vite) |
| `npm run dev:server` | Start only backend (Express) |
| `npm run build` | Build for production |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed database with test data |
| `npm run db:studio` | Open Prisma Studio (DB browser) |

## 📡 API Endpoints (tRPC)

### Authentication
- `auth.login` - Login with username/password
- `auth.logout` - Logout current user
- `auth.me` - Get current user info

### Employees
- `employee.list` - List all employees (HR)
- `employee.getById` - Get single employee
- `employee.getCurrent` - Get current employee (self)
- `employee.create` - Create employee (HR)
- `employee.bulkCreate` - Bulk import from CSV (HR)
- `employee.update` - Update employee (HR)
- `employee.delete` - Delete employee (HR)

### Members (Dependents)
- `member.listByEmployee` - List dependents
- `member.getById` - Get single member
- `member.create` - Add dependent
- `member.update` - Update dependent
- `member.delete` - Delete dependent (HR only!)

### Policies
- `policy.list` - List policies (HR)
- `policy.getById` - Get policy details
- `policy.getCurrent` - Get employee's policy

## 🔐 Security Notes

- Passwords are hashed using bcrypt (10 salt rounds)
- JWT tokens expire after 7 days
- API routes are protected by role-based middleware
- Employees cannot delete dependents (enforced server-side)



## 📦 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npm run db:generate

# 3. Create database and run migrations
npm run db:push

# 4. Seed database with test data
npm run db:seed

# 5. Start development servers
npm run dev
```

Or run the setup script:
```bash
npm run setup
npm run dev
```

## 🔐 Test Credentials

| Role | Username | Password |
|------|----------|----------|
| HR Manager | `hr_admin` | `password123` |
| Employee | `john.doe` | `password123` |
| Employee | `jane.smith` | `password123` |

## 📁 Project Structure

```
digital-enrolment-system/
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Test data seeding
├── src/
│   ├── server/           # Backend (Express + tRPC)
│   │   ├── routers/      # API endpoints
│   │   ├── utils/        # Auth, CSV parser
│   │   ├── context.ts    # Request context
│   │   ├── trpc.ts       # tRPC setup
│   │   ├── db.ts         # Prisma client
│   │   └── index.ts      # Server entry point
│   ├── client/           # Frontend (React)
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── context/      # React contexts
│   │   ├── styles/       # CSS files
│   │   ├── trpc.ts       # tRPC client
│   │   ├── App.tsx       # Main app component
│   │   └── main.tsx      # Entry point
│   └── shared/
│       └── types.ts      # Shared TypeScript types
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## ✨ Features

### Authorization Layer
- JWT-based authentication
- Role-based access control (HR Manager / Employee)
- Protected routes and procedures

### HR Manager Functions
- ✅ Create, Read, Update, Delete employees
- ✅ Create, Read, Update, Delete dependents
- ✅ Single employee entry form
- ✅ Bulk upload via CSV
- ✅ View all employees and dependents

### Employee Functions
- ✅ View own profile and policy
- ✅ Create dependents (spouse, children, parents)
- ✅ Update own dependents
- ❌ Cannot delete dependents (HR only)
- ❌ Cannot view other employees

### Error Handling
- Form validation with clear messages
- CSV validation with row-by-row errors
- API error handling with user-friendly messages

### Data Persistence
- SQLite database (survives restarts)
- Prisma ORM for type-safe queries

### Data Integrity
- Cascade delete (employee → dependents)
- Unique constraints on employee codes
- Relationship business rules (one spouse max)

## 🚀 API Endpoints (tRPC)

### Authentication
- `auth.login` - Login with username/password
- `auth.logout` - Logout current user
- `auth.me` - Get current user info

### Employees
- `employee.list` - List employees (HR only)
- `employee.getById` - Get employee details
- `employee.getCurrent` - Get current employee
- `employee.create` - Create employee (HR only)
- `employee.bulkCreate` - Bulk upload (HR only)
- `employee.update` - Update employee (HR only)
- `employee.delete` - Delete employee (HR only)

### Members (Dependents)
- `member.listByEmployee` - List dependents
- `member.create` - Add dependent
- `member.update` - Update dependent
- `member.delete` - Delete dependent (HR only!)

### Policies
- `policy.list` - List policies (HR only)
- `policy.getById` - Get policy details
- `policy.getCurrent` - Get employee's policy

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start both frontend and backend in dev mode |
| `npm run dev:server` | Start only the backend server |
| `npm run dev:client` | Start only the frontend (Vite) |
| `npm run build` | Build for production |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed database with test data |
| `npm run db:studio` | Open Prisma Studio (DB browser) |
| `npm run setup` | Full setup (install, generate, push, seed) |

## 🌐 URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api/trpc
- **Health Check**: http://localhost:3000/api/health
- **CSV Template**: http://localhost:3000/api/download/csv-template





## 📋 Features

### Authorization & Access Control
- ✅ Role-based authentication (HR Manager / Employee)
- ✅ JWT token-based sessions
- ✅ Protected routes based on user role

### HR Manager Functions
- ✅ View all employees
- ✅ Add single employee via form
- ✅ Bulk upload employees via CSV
- ✅ Edit employee details
- ✅ Delete employees (cascades to dependents)
- ✅ Manage all dependents (CRUD)

### Employee Functions
- ✅ View own profile and policy
- ✅ View own dependents
- ✅ Add new dependents
- ✅ Edit own dependents
- ❌ Cannot delete dependents (HR only)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Create database and apply schema
npm run db:push

# Seed the database with test data
npm run db:seed

# Start development servers
npm run dev
```

Or run all setup steps at once:
```bash
npm run setup
```

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api/trpc

### Test Credentials

| Role | Username | Password |
|------|----------|----------|
| HR Manager | `hr_admin` | `password123` |
| Employee | `john.doe` | `password123` |
| Employee | `jane.smith` | `password123` |

## 📁 Project Structure

```
digital-enrolment-system/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed data script
├── src/
│   ├── server/            # Backend code
│   ├── client/            # Frontend React app
│   └── shared/            # Shared types
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 📝 CSV Format for Bulk Upload

```csv
Employee Code,First Name,Last Name,Email,Phone,Date of Birth,Gender,Department,Designation
EMP001,John,Doe,john@company.com,+91 98765 43210,1990-05-15,Male,Engineering,Software Engineer
```

**Required columns**: Employee Code, First Name, Last Name, Email

## 📄 

This project was created by Ayush Kumar Vishwakarma.
