# Security Findings - Phase 5 Review

**Date:** January 2026
**Reviewer:** Phase 5 Integration & Testing

---

## Critical Issues

### 1. CRITICAL: Fake Encryption in Credentials Route

**File:** `src/app/api/credentials/route.ts:10-14`

**Issue:** The `encrypt()` function does NOT actually encrypt data. It merely base64 encodes the credentials WITH part of the encryption key included in the output. This means:
- Anyone with database access can read credentials in plaintext
- The "encryption" is trivially reversible
- Part of the key is exposed in every "encrypted" value

**Current Code:**
```typescript
function encrypt(data: string): string {
  const key = process.env.ENCRYPTION_KEY || "default-dev-key-32chars!!";
  // This is NOT encryption - it's base64 encoding!
  return Buffer.from(JSON.stringify({ data, key: key.slice(0, 8) })).toString("base64");
}
```

**Impact:** Equals 5 login credentials stored in the database are NOT encrypted and can be read by anyone with database access.

**Fix Required:** Implement proper AES-256-GCM encryption with secure key derivation.

---

### 2. HIGH: API Routes Not Protected by Authentication

**File:** `src/middleware.ts:19`

**Issue:** All API routes (`/api/*`) are explicitly excluded from authentication checks:
```typescript
if (isPublicRoute || isApiRoute || isStaticRoute) {
  return; // No auth check!
}
```

**Impact:** Any unauthenticated user can:
- Read all client data: `GET /api/clients`
- Create/modify clients: `POST/PUT /api/clients`
- Access credentials: `GET/POST /api/credentials`
- View all reports: `GET /api/reports`
- Modify report status: `PUT /api/reports/:id`

**Fix Required:** API routes must require authentication. Add session/token validation to all API handlers.

---

## Medium Issues

### 3. MEDIUM: Hardcoded Fallback Encryption Key

**File:** `src/app/api/credentials/route.ts:11`

**Issue:** Uses hardcoded fallback key `"default-dev-key-32chars!!"` if `ENCRYPTION_KEY` env var is not set. This fallback is predictable.

**Fix Required:** Fail loudly if `ENCRYPTION_KEY` is not set instead of using a fallback.

---

### 4. MEDIUM: Development Credentials Provider Allows Any Email

**File:** `src/lib/auth/config.ts:18-32`

**Issue:** In development mode, the credentials provider accepts ANY email without validation and grants ADMIN role.

**Impact:** Limited to development, but could be accidentally enabled in staging/production.

**Fix Required:** Add explicit environment check and warning logs.

---

## Low Issues

### 5. LOW: Error Messages May Leak Information

**Files:** Various API routes

**Issue:** Some error messages include internal details that could help attackers understand the system.

**Fix Required:** Ensure error messages in production are generic and don't leak implementation details.

---

## Recommendations

1. **Immediate:** Fix encryption and API authentication before any production deployment
2. **Before Pilot:** Implement proper secret management (Google Secret Manager recommended)
3. **Before Rollout:** Security audit of Equals 5 browser automation (credentials in memory)
4. **Ongoing:** Add rate limiting to API endpoints

---

## Status

| Issue | Severity | Status |
|-------|----------|--------|
| Fake encryption | CRITICAL | **Needs Fix** |
| Unprotected APIs | HIGH | **Needs Fix** |
| Hardcoded fallback key | MEDIUM | Needs Fix |
| Dev credentials provider | MEDIUM | Acceptable for now |
| Error message leakage | LOW | Acceptable for now |

---

*This document should be reviewed before Phase 6 (Pilot) begins.*
