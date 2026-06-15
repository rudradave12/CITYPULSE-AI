# Security Specification & Test-Driven-Design (TDD)
## CityPulse AI - Issue Reporting & Resolution

This document defines the Attribute-Based Access Control (ABAC) invariants and Zero-Trust database operations for CityPulse AI. Secure Firestore rules ensure that even if the client application is altered or bypassed, malicious inputs or identity spoofing are strictly blocked.

---

## 1. Central Data Invariants

1. **Identity Integrity**: Users can only register, read, or modify their own profile data (`/users/{uid}`). Identity spoofing is blocked at the gateway level.
2. **Authority Decoupling (RBAC is DB-Bound)**: Administrative actions (such as assigning departments or editing analytics counters directly) are strictly restricted. Standard citizens are prohibited from elevating their role, overriding administrative stats, or updating system-only fields.
3. **Failsafe Ticket Submissions**: An issue ticket (`/issues/{id}`) can only be created with its `status` initialized as `"Pending"`, and the `reporterId` must match the actual authenticated user ID of the transaction.
4. **System-Generated Field Immutability**: Critical fields like `createdAt`, `reporterId`, and AI analysis fields (`category`, `confidenceScore`, `severity`, `severityScore`, `assignedDepartment`, `complaintText`) are locked once posted. Citizens cannot update them.
5. **Terminal State Integrity**: When an issue is transitioned to `"Resolved"` by an authorized officer, further updates to its core details are securely locked.

---

## 2. The "Dirty Dozen" Vulnerability Payloads

The following 12 payloads represent malicious attempts to bypass security rules. Firestore rules must synchronously block these transactions, returning `PERMISSION_DENIED`.

### Hook 1: Identity Spoofing & Profiling
#### Payload 1: Profile Hijack
*   **Attack Vector**: Authenticated as `uid_citizen_abc`, tries to write directly to `/users/uid_some_other_user`.
*   **Safety Expectation**: `PERMISSION_DENIED` since writing path must exactly match `request.auth.uid`.

#### Payload 2: Self-Role Elevation
*   **Attack Vector**: Citizen creates own profile document inside `/users/uid_citizen_abc` specifying `"role": "admin"`.
*   **Safety Expectation**: `PERMISSION_DENIED`. Default roles for client registrations are restricted, or users cannot modify their own authenticated role to elevate tier capabilities.

---

### Hook 2: Incident Reporting Spoofs
#### Payload 3: Issue Impersonation
*   **Attack Vector**: Authenticated user `uid_citizen_abc` submits a ticket to `/issues/ticket_123` with field `"reporterId": "uid_victim_user_xyz"`.
*   **Safety Expectation**: `PERMISSION_DENIED`. `request.auth.uid` must match the document field `"reporterId"`.

#### Payload 4: Arbitrary Initial Status Override
*   **Attack Vector**: Citizen uploads a pothole report, forcing status directly to `"Resolved"` instead of the mandatory `"Pending"`.
*   **Safety Expectation**: `PERMISSION_DENIED` because new tickets must begin with `"status": "Pending"`.

#### Payload 5: Future Timestamp & Spoofed Chrono Updates
*   **Attack Vector**: Client payload submits `"createdAt": "2029-01-01T00:00:00Z"` to trick reporting systems.
*   **Safety Expectation**: `PERMISSION_DENIED`. Timestamp write operations must resolve against `request.time` exactly.

#### Payload 6: Malicious GPS Coordinate Overflow
*   **Attack Vector**: Client tries to submit a report with coordinates `"latitude": 3141.59` and `"longitude": -9999.9`.
*   **Safety Expectation**: `PERMISSION_DENIED` due to numerical boundary validation checks (lat: -90 to 90, lng: -180 to 180).

---

### Hook 3: Active State & Field Mutations
#### Payload 7: Mutation of Immutable Owner Field
*   **Attack Vector**: Citizen attempts to update an active ticket's `"reporterId"` to transfer reporting responsibilities to another user.
*   **Safety Expectation**: `PERMISSION_DENIED` because `reporterId` is immutable on update.

#### Payload 8: Direct AI Assessment Hijacking
*   **Attack Vector**: User accesses client-side console to change a potholes ticket's severity to `"Low"` and `severityScore: 10` after Gemini resolved it as `"Critical"`.
*   **Safety Expectation**: `PERMISSION_DENIED` because citizens cannot alter AI validation states (`severity`, `category`, `assignedDepartment`).

#### Payload 9: Unauthorized Department Allocation
*   **Attack Vector**: A standard citizen modifies the assigned department of a water leak report from `"Water Department"` to `"Road Department"`.
*   **Safety Expectation**: `PERMISSION_DENIED` since department reassignment requires administrative/officer authentication.

---

### Hook 4: Admin & Analytical Counter Spoofs
#### Payload 10: direct Analytics Injection (Billing Fatigue)
*   **Attack Vector**: Malicious script attempts to write directly into the `/analytics/stats` document to change the resolved ticket stats count to `999999`.
*   **Safety Expectation**: `PERMISSION_DENIED`. Modifying analytical caches is restricted exclusively to recognized admin or internal operations.

#### Payload 11: Shadow Field ("Ghost Field") Insertion
*   **Attack Vector**: Script submits an update carrying a ghost flag `"isVerifiedPremium": true` alongside expected ticket keys.
*   **Safety Expectation**: `PERMISSION_DENIED` as schema keys must be strictly validated.

#### Payload 12: Ticket Poisoning via Massive Resource Strings
*   **Attack Vector**: Attack path injects a 10MB structured payload into the `locationName` field or attempts to use path traversal strings `../../admins/secrets` as a record ID.
*   **Safety Expectation**: `PERMISSION_DENIED` due to bounds checking (ID sizes ≤ 128 characters and text sizes strictly configured).

---

## 3. Virtual Security Rule Assertions (Test Spec)

```typescript
// Test assertions mapping the "Dirty Dozen" to permission controls.
describe("CityPulse AI Security Rules Specification", () => {
  it("prevents profile hijacking (Payload 1)", () => {
    assertForbidden("uid_citizen_abc", "users/uid_some_other_user", "write");
  });

  it("prohibits profile self-role elevation (Payload 2)", () => {
    assertForbidden("uid_citizen_abc", "users/uid_citizen_abc", "create", { role: "admin" });
  });

  it("enforces matching reporter ID on ticket creation (Payload 3)", () => {
    assertForbidden("uid_citizen_abc", "issues/ticket_123", "create", { reporterId: "uid_victim_user_xyz" });
  });

  it("forces initial status of issues to Pending (Payload 4)", () => {
    assertForbidden("uid_citizen_abc", "issues/ticket_123", "create", { status: "Resolved", reporterId: "uid_citizen_abc" });
  });

  it("guarantees temporal integrity on submission (Payload 5)", () => {
    assertForbidden("uid_citizen_abc", "issues/ticket_123", "create", { createdAt: "2029" });
  });

  it("validates boundary GPS coordinates (Payload 6)", () => {
    assertForbidden("uid_citizen_abc", "issues/ticket_123", "create", { latitude: 999.0 });
  });

  it("locks reporter credentials upon modification (Payload 7)", () => {
    assertForbidden("uid_citizen_abc", "issues/ticket_123", "update", { reporterId: "uid_other" });
  });

  it("shields AI parameters from raw client updates (Payload 8)", () => {
    assertForbidden("uid_citizen_abc", "issues/ticket_123", "update", { severity: "Low" });
  });

  it("secures routing allocations to management profiles (Payload 9)", () => {
    assertForbidden("uid_citizen_abc", "issues/ticket_123", "update", { assignedDepartment: "Road Department" });
  });

  it("limits statistical alterations list to systems (Payload 10)", () => {
    assertForbidden("uid_citizen_abc", "analytics/system_metrics", "write");
  });

  it("filters out arbitrary ghost configurations (Payload 11)", () => {
    assertForbidden("uid_citizen_abc", "issues/ticket_123", "update", { isVerifiedPremium: true });
  });

  it("checks identifier paths against poisoning patterns (Payload 12)", () => {
    assertForbidden("uid_citizen_abc", "issues/../admins/secrets", "write");
  });
});
```
