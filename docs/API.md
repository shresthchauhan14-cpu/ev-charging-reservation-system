# REST API Documentation

## Version: v1
**Base URL:** `/api/v1`

---

### Authentication Endpoints

#### 1. `POST /api/v1/auth/register`
Registers a new driver account.
- **Request Body:**
  ```json
  {
    "fullName": "Rahul Sharma",
    "email": "rahul.sharma@example.com",
    "password": "User@12345",
    "phone": "+91 98111 22334"
  }
  ```
- **Responses:**
  - `201 Created`: Returns user object and JWT bearer token. Sets HttpOnly cookie `token`.
  - `409 Conflict`: Email already exists.

#### 2. `POST /api/v1/auth/login`
Authenticates user with email and password.
- **Request Body:**
  ```json
  {
    "email": "rahul.sharma@example.com",
    "password": "User@12345"
  }
  ```
- **Responses:**
  - `200 OK`: Returns authenticated user and token.
  - `401 Unauthorized`: Invalid email or password.

#### 3. `GET /api/v1/auth/me`
Retrieves authenticated user profile and registered vehicles.
- **Headers:** `Authorization: Bearer <token>`
- **Response:** `200 OK`

---

### Stations Endpoints

#### 4. `GET /api/v1/stations`
Lists charging stations with availability filters.
- **Query Parameters:** `search`, `city`, `connectorType` (CCS2, TYPE2, GBT)
- **Response:** `200 OK`

#### 5. `GET /api/v1/stations/:id`
Retrieves detailed station profile and charging points.
- **Response:** `200 OK`

#### 6. `GET /api/v1/stations/:id/availability`
Calculates interval availability for all dispensers at a station.
- **Query Parameters:** `startTime` (ISO), `endTime` (ISO)
- **Response:** `200 OK` with point-by-point interval statuses.

---

### Reservations Endpoints

#### 7. `POST /api/v1/reservations`
Creates a charging reservation inside an ACID transaction.
- **Request Body:**
  ```json
  {
    "chargingPointId": 1,
    "startTime": "2026-10-31T14:00:00Z",
    "endTime": "2026-10-31T15:00:00Z"
  }
  ```
- **Responses:**
  - `201 Created`: Confirmed reservation with unique `booking_reference`.
  - `409 Conflict`: Charging point is already reserved for this interval.

#### 8. `GET /api/v1/reservations`
Lists reservations. Regular users view their own bookings; administrators can view all.
- **Query Parameters:** `status` (CONFIRMED, COMPLETED, CANCELLED, NO_SHOW)
- **Response:** `200 OK`

#### 9. `POST /api/v1/reservations/:id/cancel`
Cancels reservation, frees the interval, and triggers smart waiting-list reallocation.
- **Response:** `200 OK` with reallocation status.

---

### Waiting List Endpoints

#### 10. `POST /api/v1/waiting-list`
Enqueues driver in the priority queue.
- **Request Body:**
  ```json
  {
    "chargingPointId": 2,
    "requestedStartTime": "2026-10-31T14:00:00Z",
    "requestedEndTime": "2026-10-31T15:00:00Z",
    "stateOfChargePercent": 15.0
  }
  ```
- **Response:** `201 Created`

#### 11. `GET /api/v1/waiting-list`
Returns active queue ranked by real-time calculated priority score $P_i$.
- **Response:** `200 OK`

#### 12. `POST /api/v1/waiting-list/simulate-allocation`
Triggers simulated slot release and priority-based allocation for viva evaluation.
- **Response:** `200 OK` with winner breakdown and created booking reference.

---

### Administration Endpoints (Role: `ADMIN`)

#### 13. `GET /api/v1/admin/dashboard`
Returns live system metrics from PostgreSQL.

#### 14. `POST /api/v1/admin/reservations/:id/simulate-noshow`
Marks reservation `NO_SHOW` past the 15-minute grace period and triggers waiting list allocation.

#### 15. `POST /api/v1/admin/reset-demo-data`
Re-runs migrations and seed scripts to restore pristine evaluation records.

