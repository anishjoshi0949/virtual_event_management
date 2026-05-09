# 🎟️ Virtual Event Management Platform

A secure, production-ready REST API for managing virtual events — built with **Node.js**, **Express**, **PostgreSQL**, and **Prisma ORM**.

---

## 📋 Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Installation](#installation)
5. [Environment Variables](#environment-variables)
6. [Database Setup (Prisma)](#database-setup-prisma)
7. [Running the Server](#running-the-server)
8. [API Endpoints](#api-endpoints)
9. [Authentication Flow](#authentication-flow)
10. [Role-Based Access Control](#role-based-access-control)
11. [Sample Requests](#sample-requests)
12. [Error Handling](#error-handling)
13. [Future Improvements](#future-improvements)

---

## ✅ Features

- **JWT Authentication** — access token (15min) + refresh token (7d)
- **Stateless Auth** — no tokens stored in database
- **Role-Based Access Control** (Organizer / Attendee)
- **Full Event CRUD** — create, update, delete (organizer only)
- **Participant Registration** — register, cancel, view
- **Duplicate Prevention** — unique constraint on userId + eventId
- **Input Validation** via express-validator
- **PostgreSQL** persistence via **Prisma ORM**
- **Graceful shutdown** handling

---

## 🛠️ Tech Stack

| Layer      | Technology        |
|------------|-------------------|
| Runtime    | Node.js           |
| Framework  | Express.js        |
| Database   | PostgreSQL        |
| ORM        | Prisma            |
| Auth       | JWT + bcryptjs    |
| Validation | express-validator |
| Dev Tools  | nodemon, dotenv   |

---

## 📁 Project Structure

```
virtual-event-platform/
│
├── prisma/
│   ├── schema.prisma                 # Data models (User, Event, Registration)
│   └── migrations/                   # Auto-generated SQL migrations
│
├── src/
│   ├── controllers/
│   │   ├── authController.js         # register, login, refresh, logout
│   │   ├── eventController.js        # createEvent, updateEvent, deleteEvent
│   │   └── registrationController.js # registerForEvent, cancelRegistration, getMyEvents, getEventParticipants
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js         # JWT verification (protect)
│   │   ├── roleMiddleware.js         # Role-based access (restrictTo)
│   │   └── validateMiddleware.js     # express-validator error handler
│   │
│   ├── routes/
│   │   ├── authRoutes.js             # /api/auth/*
│   │   ├── eventRoutes.js            # /api/events/*
│   │   └── registrationRoutes.js     # /api/events/:id/register, /api/events/:id/participants
│   │
│   ├── validators/
│   │   ├── authValidator.js          # registerValidator, loginValidator, refreshValidator
│   │   └── eventValidator.js         # createEventValidator, updateEventValidator
│   │
│   ├── utils/
│   │   ├── generateToken.js          # generateAccessToken, generateRefreshToken
│   │   └── prismaClient.js           # Prisma singleton
│   │
│   ├── app.js                        # Express app setup + all routes
│   └── server.js                     # Entry point + DB connect + graceful shutdown
│
├── .env.example                      # Environment variables template
├── package.json
└── README.md
```

---

## ⚙️ Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/virtual-event-platform.git
cd virtual-event-platform

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.example .env
# → Edit .env with your PostgreSQL credentials and secrets
```

---

## 🔐 Environment Variables

```env
PORT=5000
NODE_ENV=development

# PostgreSQL connection string
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/virtual_events_db?schema=public"

# JWT — two separate secrets, expiry is hardcoded in generateToken.js
JWT_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
```

> ⚠️ No `JWT_EXPIRES_IN` needed — access token expires in **15 minutes**, refresh token in **7 days**, both hardcoded in `src/utils/generateToken.js`.

---

## 🗄️ Database Setup (Prisma)

```bash
# Stop server first (important on Windows)
Ctrl + C

# Generate Prisma client
npx prisma generate

# Run migrations (creates all tables)
npx prisma migrate dev --name init

# View data in browser GUI
npx prisma studio

# Start server again
npm run dev
```

### Data Models

| Model        | Fields                                                        |
|--------------|---------------------------------------------------------------|
| User         | id, name, email, password, role (ORGANIZER/ATTENDEE), timestamps |
| Event        | id, title, place, date, isActive, organizerId, timestamps     |
| Registration | id, userId, eventId, registeredAt — unique(userId + eventId) |

---

## 🚀 Running the Server

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

Server runs at: `http://localhost:5000`

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint               | Auth | Description                        |
|--------|------------------------|------|------------------------------------|
| POST   | `/api/auth/register`   | ❌   | Register as organizer or attendee  |
| POST   | `/api/auth/login`      | ❌   | Login — returns accessToken + refreshToken |
| POST   | `/api/auth/refresh`    | ❌   | Send refreshToken → get new accessToken |
| POST   | `/api/auth/logout`     | ✅   | Logout (client deletes tokens)     |

### Events

| Method | Endpoint           | Auth | Role      | Description              |
|--------|--------------------|------|-----------|--------------------------|
| POST   | `/api/events`      | ✅   | ORGANIZER | Create a new event       |
| PUT    | `/api/events/:id`  | ✅   | ORGANIZER | Update own event (partial) |
| DELETE | `/api/events/:id`  | ✅   | ORGANIZER | Delete own event         |

### Registrations

| Method | Endpoint                        | Auth | Role      | Description                    |
|--------|---------------------------------|------|-----------|--------------------------------|
| POST   | `/api/events/:id/register`      | ✅   | Any       | Register for an event          |
| DELETE | `/api/events/:id/register`      | ✅   | Any       | Cancel your registration       |
| GET    | `/api/my-events`                | ✅   | Any       | View your registered events    |
| GET    | `/api/events/:id/participants`  | ✅   | ORGANIZER | View all participants of event |

---

## 🔐 Authentication Flow

```
REGISTER
  └── validate input
  └── check duplicate email → 409 if exists
  └── bcrypt.hash(password, 12)
  └── prisma.user.create()
  └── return accessToken + refreshToken

LOGIN
  └── find user by email → 401 if not found
  └── bcrypt.compare(password) → 401 if wrong
  └── generateAccessToken()  → expires 15min
  └── generateRefreshToken() → expires 7d
  └── return both tokens (nothing stored in DB)

REFRESH
  └── verify refreshToken signature
  └── check user still exists in DB
  └── return new accessToken

LOGOUT
  └── server returns 200
  └── client deletes both tokens from storage
```

---

## 👮 Role-Based Access Control

| Role      | Permissions                                              |
|-----------|----------------------------------------------------------|
| ORGANIZER | Create, update, delete own events; view participants     |
| ATTENDEE  | Register/cancel for events; view own registered events  |

```
Every protected request:
  Authorization: Bearer <accessToken>
        ↓
  authMiddleware → verify JWT → attach req.user
        ↓
  roleMiddleware → check req.user.role → 403 if wrong role
        ↓
  controller
```

---

## 📮 Sample Requests

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Anish Kumar",
  "email": "anish@example.com",
  "password": "Secret123",
  "role": "organizer"
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "anish@example.com",
  "password": "Secret123"
}
```

### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGci..."
}
```

### Create Event
```http
POST /api/events
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "name": "Tech Summit 2026",
  "place": "Bangalore",
  "date": "2026-09-15"
}
```

### Update Event (partial)
```http
PUT /api/events/<event-id>
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "place": "Mumbai"
}
```

### Register for Event
```http
POST /api/events/<event-id>/register
Authorization: Bearer <accessToken>
```

### Cancel Registration
```http
DELETE /api/events/<event-id>/register
Authorization: Bearer <accessToken>
```

### View My Events
```http
GET /api/my-events
Authorization: Bearer <accessToken>
```

### View Participants (Organizer)
```http
GET /api/events/<event-id>/participants
Authorization: Bearer <accessToken>
```

---

## ⚠️ Error Handling

| Status | Meaning                          | Example                          |
|--------|----------------------------------|----------------------------------|
| 400    | Validation error / bad request   | Missing field, past date         |
| 401    | Unauthorized                     | No token, invalid/expired token  |
| 403    | Forbidden                        | Wrong role, not event owner      |
| 404    | Not found                        | Event doesn't exist              |
| 409    | Conflict                         | Email already registered         |
| 500    | Internal server error            | DB error, unhandled exception    |

---

## 🔮 Future Improvements

- [ ] `GET /api/events` — public event listing
- [ ] Email notifications via Nodemailer (welcome + confirmation)
- [ ] Jest + Supertest integration tests
- [ ] Event capacity limits
- [ ] Redis token blacklist for true server-side logout
- [ ] Rate limiting (express-rate-limit)
- [ ] Swagger / OpenAPI documentation
- [ ] Docker + docker-compose deployment
- [ ] QR ticket generation per registration
- [ ] Payment gateway (Razorpay / Stripe)
- [ ] Admin dashboard
- [ ] Event image uploads (S3 / Cloudinary)

---

## 👨‍💻 Author

**Anish** — Backend Developer

Built with ❤️ using Node.js + PostgreSQL + Prisma