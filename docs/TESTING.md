# Automated Testing Guide

## Test Suite Overview
VoltReserve includes comprehensive unit and integration tests executing against the PostgreSQL engine via Vitest and Supertest.

---

### Executing Tests

To run the complete automated test suite:
```bash
npm run test --workspace=server
```

---

### Test Suites Implemented

#### 1. Unit Tests (`tests/unit/priority-algorithm.test.ts`)
- **Formula Accuracy**: Validates $P_i = 0.50U_i + 0.30T_i + 0.20R_i$ for high-urgency (15% SOC) vs low-urgency (70% SOC).
- **Time Threshold Capping**: Verifies that waiting duration over 60 minutes is capped at $T_i = 1.00$.
- **Boundary Clamping**: Verifies that negative or >100% SOC inputs are normalized safely.
- **Weight Integrity**: Asserts that weights $\alpha + \beta + \gamma = 1.00000$.

#### 2. API Integration Tests (`tests/integration/api-auth-stations.test.ts`)
- `GET /api/health`: Asserts system status `UP` and database connectivity.
- `GET /api/project-info`: Verifies institutional metadata for IILM University.
- `POST /api/v1/auth/login`: Asserts valid credential authentication and JWT issuance.
- `POST /api/v1/auth/login` (Invalid): Rejects incorrect passwords with HTTP 401.
- `GET /api/v1/stations`: Verifies retrieval of Greater Noida station records.

#### 3. Database Concurrency Tests (`tests/integration/concurrency-booking.test.ts`)
- **Simultaneous Contention**: Two concurrent asynchronous requests (`Promise.all`) attempt to reserve the exact same charging point for overlapping intervals.
- **Assertion**: Exactly one request succeeds with `201 Created` and the competing request is rejected with `409 Conflict`.
- **Adjacent Intervals**: Validates that back-to-back non-overlapping bookings (`[10:00, 11:00)` and `[11:00, 12:00)`) both succeed without false positives.

---

### Actual Test Execution Output

```
Test Files  3 passed (3)
Tests       12 passed (12)
Duration    11.65s

✓ ../tests/unit/priority-algorithm.test.ts (5 tests)
✓ ../tests/integration/api-auth-stations.test.ts (5 tests)
✓ ../tests/integration/concurrency-booking.test.ts (2 tests)
  - [Concurrency Test Result] Request 1: 201, Request 2: 409
```

