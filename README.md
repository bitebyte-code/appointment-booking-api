# Appointment Booking API

Node.js 18+ • Express • MongoDB/Mongoose • JWT • Joi • Jest • Supertest

## Module coverage

1. **Setup & Data Modeling:** Express app, dotenv, MongoDB connection, User/Slot/Booking models.
2. **Authentication & Roles:** register/login, bcrypt password hashes, JWT, `user` and `provider` role guards.
3. **Slots & Booking:** providers create future slots; anyone can list available future slots; users book and cancel.
4. **Conflict Prevention & Validation:** Joi request validation, atomic slot claim, unique partial index for confirmed bookings, 409 conflicts.
5. **Error Handling & Testing:** centralized JSON errors and Jest/Supertest integration tests.

## Requirements

- Node.js 18 or newer
- MongoDB local service or MongoDB Atlas connection string
- Postman

## Install and run

```bash
npm install
```

Copy `.env.example` to `.env`, then set `MONGODB_URI` and a long random `JWT_SECRET` (at least 32 characters).

```bash
npm run dev
```

Health check: `GET http://localhost:5000/api/health`

For a local MongoDB installation, the example URI is:
`mongodb://127.0.0.1:27017/appointment_booking_api`

## API endpoints

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/health` | Public | Health check |
| POST | `/api/auth/register` | Public | Register a user/provider |
| POST | `/api/auth/login` | Public | Login and receive JWT |
| GET | `/api/auth/me` | JWT | Current account |
| GET | `/api/slots` | Public | List future available slots |
| POST | `/api/slots` | Provider JWT | Create slot |
| POST | `/api/bookings` | User JWT | Book a slot |
| GET | `/api/bookings/my` | User JWT | List own bookings |
| PATCH | `/api/bookings/:id/cancel` | Owner user JWT | Cancel booking |

### Register request

```json
{
  "name": "Priya Provider",
  "email": "provider@example.com",
  "password": "Password123",
  "role": "provider"
}
```

Registration returns `{ "data": { "user": {}, "token": "..." } }`.
For login, send `email` and `password`. Copy the returned token into Postman:
**Authorization → Bearer Token**.

### Create slot (provider token)

```json
{
  "startTime": "2027-01-15T10:00:00.000Z",
  "endTime": "2027-01-15T10:30:00.000Z"
}
```

Use a date/time in the future. `endTime` must be after `startTime`; overlapping slots for the same provider are rejected.

### List available slots

`GET /api/slots`

Optional provider filter: `GET /api/slots?providerId=YOUR_PROVIDER_USER_ID`

### Book slot (user token)

```json
{ "slotId": "PASTE_SLOT_OBJECT_ID_HERE" }
```

The API atomically changes the slot from available to booked. If a concurrent request loses the race, it receives HTTP `409 Conflict`.

### Cancel booking

`PATCH /api/bookings/BOOKING_ID/cancel` with the same user's Bearer token. The slot is made available again.

## Postman walkthrough

1. Create a collection named **Appointment Booking API** and set collection variable `baseUrl` to `http://localhost:5000`.
2. `GET {{baseUrl}}/api/health` — expect 200.
3. `POST {{baseUrl}}/api/auth/register` with a provider body above. Save `data.token` as `providerToken` and `data.user.id` as `providerId`.
4. `POST {{baseUrl}}/api/auth/register` with role `user` and another email. Save token as `userToken`.
5. Use `POST {{baseUrl}}/api/slots` with Bearer `providerToken` and a future `startTime`/`endTime`. Save `data.slot._id` as `slotId`.
6. `GET {{baseUrl}}/api/slots` — confirm the new slot appears.
7. Use `POST {{baseUrl}}/api/bookings` with Bearer `userToken` and `{ "slotId": "{{slotId}}" }`.
8. Repeat step 7 for the same slot. The second request should return **409**.
9. `GET {{baseUrl}}/api/slots` — booked slot should no longer appear.
10. `GET {{baseUrl}}/api/bookings/my` with `userToken` to get the booking ID.
11. `PATCH {{baseUrl}}/api/bookings/{{bookingId}}/cancel` with `userToken`.
12. `GET {{baseUrl}}/api/slots` — slot should appear again.
13. Try `POST /api/slots` with `userToken` — expect **403**.
14. Try invalid data (e.g. bad email or `endTime` before `startTime`) — expect **400**.

Use ISO-8601 timestamps and ensure they are in the future.

## Automated tests

```bash
npm test
```

Tests use `mongodb-memory-server`, which downloads a compatible MongoDB binary the first time it runs. Internet access may be required for that initial download. If your environment blocks it, point the tests at a dedicated test MongoDB instance or configure the binary cache.

## Important implementation notes

- The `Booking` model has a unique partial index on `{ slot: 1 }` for confirmed bookings, allowing cancelled historical bookings while enforcing only one confirmed booking per slot.
- Slot claiming uses a conditional atomic `findOneAndUpdate`, preventing two requests from both claiming an available slot.
- For a production-grade system, cancellation and slot release should be wrapped in a MongoDB transaction on a replica set, and the overlap check should be protected against concurrent slot creation (for example with a transaction/locking strategy). Do not expose unrestricted provider-role selection in a public production registration flow; use an invite/admin approval process.
- This is an educational internship project, not a production-hardened medical or scheduling system.
