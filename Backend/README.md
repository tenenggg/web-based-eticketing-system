# eTicketing Backend

Node.js + Express + Socket.io + MySQL API for the ticketing system.

## Setup

1. Copy `.env` values for `PORT`, `IP_ADDRESS`, `JWT_SECRET`, and MySQL (`DB_*`).
2. Run `database/setup.sql` once in MySQL Workbench (creates schema + seed users).
3. `npm install` then `npm run dev` from the `Backend` folder.

## Seed users

Password for all: `password123`

- `admin` (role: admin)
- `user1`, `user2`, `user3` (role: user)

## API

- `POST /api/auth/login` | `POST /api/auth/register` | `GET /api/auth/me`
- `GET|POST /api/tickets` | `GET|PATCH /api/tickets/:id` | `GET /api/tickets/:id/log` | `POST /api/tickets/:id/attachments`
- `GET /api/chat/tickets/:id/messages` | `POST /api/chat/tickets/:id/read`

## Socket

Rooms: `admins`, `user_<id>`, `ticket_<id>`

- Client → server: `join_ticket`, `leave_ticket`, `send_message`, `admin_reply`
- Server → client: `receive_message`, `ticket_created`, `ticket_updated`, `message_error`, `message_sent`
