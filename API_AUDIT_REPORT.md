# Backend API Audit Report

**Scope:** Backend routes, schemas, authentication dependencies, services, repositories, models, frontend API callers, automated tests, and a local quotation lifecycle smoke test. **Review date:** 2026-10-29.

## Remediation status (2026-10-29)

The critical and high findings in this report were addressed in the current worktree:

- `SEC-01`: role reads require Admin/Super Admin access; role creation requires Super Admin and duplicate races return 409.
- `SEC-02`: Admin user listing and plan updates are limited to the Admin's company; Super Admin retains global access.
- `SEC-03`: production rejects missing/weak JWT secrets, access tokens default to 15 minutes, refresh tokens are stored as SHA-256 hashes and rotated under a row lock, and login rejects inactive accounts.
- `SEC-04`: password-reset tokens are stored as hashes and reset revokes all active sessions in the same transaction.
- `DATA-01`: company setup and quotation/customer/product creation now commit as one transaction.
- `FIN-01`: finalized documents cannot be edited or deleted; repeated finalization preserves payment status.
- `AUDIT-01`: quotation mutations record actor and before/after data in append-only audit events; an authorized audit-read endpoint is available.

Migration `0013` must be applied before deploying the backend code. It hashes existing refresh/reset tokens and adds quotation audit fields/tables. The migration was exercised against an isolated SQLite database seeded at revision `0012`; production-database migration and concurrent multi-process behavior still require deployment-level verification.

## Executive summary

The live local OpenAPI document exposes **40 route operations**. I traced the route handlers through the service and repository code and reviewed their schemas and persistence models. The audit found **23 route operations with at least one material risk or defect**; the other **17 had no material issue identified in static review**. “No issue identified” is not a claim of exhaustive runtime certification: the project has no integration suite that exercises every route and failure branch against a disposable database.

The most serious risks are publicly writable role management, cross-tenant user administration, a development JWT secret fallback, and the ability to change or hard-delete finalized financial documents. Multi-step quotation creation commits customers and products before the document transaction, so failures can leave partial records. Customer/product deletes are hard deletes and can fail when referenced by documents. Audit trails are limited to creator and timestamps; there is no `updated_by` or immutable event log.

### Verification performed

- Enumerated routes and request/response contracts from `/openapi.json`: 40 operations.
- Reviewed request validation, authorization, service/repository flow, model constraints, and frontend API usage.
- Backend suite after remediation: **55 passed**.
- Frontend utility/auth suite: **19 passed**.
- Vite production build: **passed**.
- Local authenticated API smoke flow: register, company setup, create quotation draft with the frontend’s null optional contact fields, finalize, and download a PDF. The flow succeeded and returned a valid `%PDF-` file.
- No production database failure injection, full per-route HTTP matrix, real SMTP delivery, or concurrent multi-process race test was performed. A green unit suite does not replace those checks.

## Endpoint inventory

All JSON endpoints use `Content-Type: application/json` unless noted. Protected routes require `Authorization: Bearer <access_token>`. There are no query-string parameters in the current route definitions. Responses below are the declared success response; FastAPI validation errors normally return 422, authentication failures 401, authorization failures 403, and domain errors are mapped by the global handler.

| API | Request | Auth | Success response |
|---|---|---:|---|
| `POST /auth/register` | `UserRegister` JSON: username, email, password, optional mobile | No | 201 `UserRead` |
| `POST /auth/login` | Form URL encoded: username, password | No | 200 `Token` |
| `POST /auth/refresh` | `TokenRefreshRequest` JSON | No; refresh token body | 200 rotated `Token` |
| `POST /auth/logout` | `TokenRefreshRequest` JSON | No; refresh token body | 200 message |
| `POST /auth/forgot-password` | `ForgotPasswordRequest` JSON | No | 200 generic message; 503 if email configuration is unavailable |
| `POST /auth/setup-company` | `CompanyCreate` JSON | Bearer | 201 `CompanyRead` |
| `POST /auth/reset-password` | `PasswordResetRequest` JSON | No | 200 message |
| `GET /auth/me` | None | Bearer | 200 `UserRead` |
| `PATCH /auth/me` | `UserProfileUpdate` JSON | Bearer | 200 `UserRead` |
| `GET /companies/` | None | Bearer | 200 list of the user’s company (empty before setup) |
| `POST /companies/` | `CompanyCreate` JSON | Bearer; Admin/Manager/Super Admin | 201 `CompanyRead` |
| `GET /customers/` | None | Bearer | 200 list scoped to current owner/company |
| `POST /customers/` | `CustomerCreate` JSON | Bearer; Sales/Manager/Admin/Super Admin | 201 `CustomerRead` |
| `GET /customers/{customer_id}` | UUID path | Bearer | 200 `CustomerRead`; 404 outside owner/company scope |
| `PUT /customers/{customer_id}` | UUID path, `CustomerUpdate` JSON | Bearer | 200 `CustomerRead` |
| `DELETE /customers/{customer_id}` | UUID path | Bearer | 204 empty |
| `GET /products/` | None | Bearer | 200 list scoped to current owner/company |
| `POST /products/` | `ProductCreate` JSON | Bearer; Sales/Manager/Admin/Super Admin | 201 `ProductRead` |
| `GET /products/{product_id}` | UUID path | Bearer | 200 `ProductRead`; 404 outside owner/company scope |
| `PUT /products/{product_id}` | UUID path, `ProductUpdate` JSON | Bearer | 200 `ProductRead` |
| `DELETE /products/{product_id}` | UUID path | Bearer | 204 empty |
| `GET /quotations/form` | None | No | 200 HTML form |
| `POST /quotations/form` | Form fields for company, customer, and repeated product name/quantity/unit price | No | 200 `application/pdf` |
| `POST /quotations/submit` | `QuotationSubmit` JSON | Bearer; Sales/Manager/Admin/Super Admin | 201 `QuotationRead`, finalized |
| `POST /quotations/draft` | `QuotationSubmit` JSON | Bearer; Sales/Manager/Admin/Super Admin | 201 `QuotationRead`, draft |
| `POST /quotations/{quotation_id}/finalize` | UUID path, no body | Bearer; Sales/Manager/Admin/Super Admin | 200 finalized `QuotationRead` |
| `POST /quotations/` | `QuotationCreate` JSON, including company/customer IDs and items | Bearer; Sales/Manager/Admin/Super Admin | 201 `QuotationRead`, finalized |
| `GET /quotations/` | None | Bearer | 200 list scoped to owner/company |
| `GET /quotations/{quotation_id}` | UUID path | Bearer | 200 `QuotationRead`; 404 outside owner/company scope |
| `PUT /quotations/{quotation_id}` | UUID path, `QuotationUpdate` JSON | Bearer; Sales/Manager/Admin/Super Admin | 200 `QuotationRead` |
| `PATCH /quotations/{quotation_id}/payment-status` | UUID path, `{ "status": "Paid" | "Unpaid" }` | Bearer; Sales/Manager/Admin/Super Admin | 200 `QuotationRead` |
| `DELETE /quotations/{quotation_id}` | UUID path | Bearer; Sales/Manager/Admin/Super Admin | 204 empty |
| `GET /quotations/{quotation_id}/pdf` | UUID path | Bearer | 200 `application/pdf` |
| `GET /roles/` | None | Bearer; Admin/Super Admin | 200 list of `RoleRead` |
| `POST /roles/` | `RoleCreate` JSON | Bearer; Super Admin | 201 `RoleRead` |
| `POST /users/` | `UserRegister` JSON | Bearer; Super Admin only | 201 `UserRead` |
| `GET /users/admin` | None | Bearer; Admin/Super Admin | 200 list of users |
| `PATCH /users/{user_id}/plan` | UUID path, `UserPlanUpdate` JSON | Bearer; Admin/Super Admin | 200 `UserRead` |
| `GET /users/` | None | Bearer | 200 one-element list containing current user |
| `GET /health` | None | No | 200 `{ "status": "ok" }` |

**Invoice API shape:** there is no separate invoice router or model. Invoices use quotation endpoints and are distinguished by a title of `Invoice`/`Billing`; payment state is stored in the quotation `status` field. **File uploads:** no backend upload endpoint exists. Signature images are handled on the frontend for PDF generation.

## Findings

### SEC-01 — Unauthenticated role administration

**Severity: High. APIs:** `GET /roles/`, `POST /roles/`.

**Root cause:** Both handlers omit `get_current_user` and any authorization check. The create handler inserts arbitrary role names after a non-atomic duplicate check.

**Impact:** Anonymous callers can enumerate the role table and create unlimited role records, producing database growth and polluting an authorization-critical table. I found no direct route that lets an attacker assign the new role to a user, so direct privilege escalation is not established by this code review.

**Recommended fix:** Require a Super Admin for role creation; expose only a minimal public role list if registration truly needs one; use a unique constraint and translate `IntegrityError` to 409.

```python
async def create_role(
    payload: RoleCreate,
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    if current_user["role"] != "Super Admin":
        raise HTTPException(status_code=403, detail="Insufficient privileges.")
```

### SEC-02 — Admin user APIs are not tenant-scoped

**Severity: High. APIs:** `GET /users/admin`, `PATCH /users/{user_id}/plan`.

**Root cause:** Any Admin can list every user via `UserService.list_users()` and change any user’s subscription plan by ID. Neither route checks the target user’s company or restricts the operation to a Super Admin.

**Impact:** Cross-company user profile disclosure and subscription changes.

**Recommended fix:** Scope Admin queries and target updates to the admin’s company, or reserve global operations to Super Admin. Pass tenant scope into the repository query rather than checking only after retrieving a record.

```python
if current_user["role"] != "Super Admin" and target.company_id != current_user["company_id"]:
    raise HTTPException(status_code=404, detail="User not found.")
```

### SEC-03 — Unsafe JWT fallback and refresh-token storage

**Severity: Critical if production omits environment configuration; otherwise High defense-in-depth risk. APIs:** all bearer-protected routes, plus login/refresh/logout.

**Root cause:** `JWT_SECRET_KEY` defaults to the known value `changeme`; access tokens default to seven days. The complete refresh JWT is stored in `auth_sessions.refresh_token` as plaintext. Configuration does not fail fast when the default is active.

**Impact:** A deployment missing its secret is vulnerable to token forgery for known user IDs. A database leak exposes active refresh credentials directly. Long-lived access tokens increase the impact of token theft.

**Recommended fix:** Reject development defaults in production at startup, use a managed secret, shorten access-token lifetime, store only a keyed hash of refresh tokens, and rotate/revoke sessions atomically.

```python
if settings.environment == "production" and settings.jwt_secret_key == "changeme":
    raise RuntimeError("JWT_SECRET_KEY must be configured in production")
```

### SEC-04 — Password reset does not revoke existing sessions

**Severity: High. API:** `POST /auth/reset-password`.

**Root cause:** Password reset changes the password hash and clears the reset token, but does not call `AuthSessionService.revoke_all_sessions_for_user`.

**Impact:** Someone holding a refresh token can continue minting sessions after the legitimate user resets the password.

**Recommended fix:** Revoke all sessions in the same transaction as the password change. Store reset tokens hashed and add reset-attempt limits.

```python
user.hashed_password = get_password_hash(new_password)
user.password_reset_token = None
await auth_sessions.revoke_all_for_user(user.id)
await session.commit()
```

### DATA-01 — Multi-record create flows commit partial data

**Severity: High. APIs:** `POST /auth/setup-company`, `POST /quotations/submit`, `POST /quotations/draft`.

**Root cause:** These flows call services that commit independently. Company setup commits the company before attaching it to the user. Quotation submit/draft commit a newly created customer and each auto-created product before the quotation/items are committed.

**Impact:** A later validation, database, product-resolution, or quota failure can leave orphan companies, customers, or products with no matching document. Retries may create duplicates or confusing catalog entries.

**Recommended fix:** Keep a single request-scoped transaction; make service methods flush only; commit once after all records pass validation. Roll back on any exception.

```python
async with session.begin():
    customer = await customers.create(..., commit=False)
    product = await products.create(..., commit=False)
    quotation = await quotations.create(..., commit=False)
```

### FIN-01 — Finalized documents can be edited and deleted

**Severity: Critical for accounting/audit requirements. APIs:** `PUT /quotations/{quotation_id}`, `DELETE /quotations/{quotation_id}`.

**Root cause:** `update_quotation` prevents changing the status of a finalized record but still permits changes to title, dates, totals, terms, customer, and items. The delete route permits any owned document, including finalized invoices and quotations. Deletion is physical.

**Impact:** Issued financial documents can be changed or erased without an audit record. A finalized invoice can be modified after its payment state is set. Quota usage rows survive document deletion, making the customer-facing ledger disagree with quota history.

**Recommended fix:** Reject all content changes and deletion after finalization. Use cancellation/credit-note workflows and append-only audit events recording actor, timestamp, before/after values, and reason.

```python
if quotation.finalized_at is not None:
    raise ConflictError("Finalized documents cannot be edited; issue a correction document.")
```

### DATA-02 — Catalog/customer deletion is hard and FK-restricted

**Severity: Medium. APIs:** `DELETE /customers/{customer_id}`, `DELETE /products/{product_id}`.

**Root cause:** These routes physically delete records. `quotations.customer_id` and `quotation_items.product_id` are non-null foreign keys without `ON DELETE` behavior; only quotation-to-items has delete-orphan cascade.

**Impact:** Deleting a customer/product referenced by a quotation can fail at commit with an unhelpful 500. If constraints are loosened later, historical documents could lose linked data. No soft-delete mechanism is modeled.

**Recommended fix:** Prefer `is_active`/`deleted_at` soft deletion and prevent new selection while preserving document snapshots; return a clear 409 if a referenced entity cannot be deleted.

### TENANT-01 — Catalog writes can create inaccessible orphan rows

**Severity: Medium. APIs:** `POST /customers/`, `POST /products/`, `POST /companies/`.

**Root cause:** Customer/product routes do not require `current_user.company_id`, while service/model fields allow `company_id=None`. Company creation commits a company but does not associate it with the caller; only `/auth/setup-company` links a company to a user.

**Impact:** A not-yet-configured user can create records that list routes then hide because listing returns empty without a company. `/companies/` can create an unowned company that is not visible to the creator through their own company list.

**Recommended fix:** Require setup before catalog writes, and make company ownership/creation semantics explicit. Either attach a newly created company to an authorized user or restrict this endpoint to a true platform-level Super Admin operation.

### VAL-01 — Update endpoints cannot clear fields and miss uniqueness checks

**Severity: Medium. APIs:** `PUT /customers/{customer_id}`, `PUT /products/{product_id}`.

**Root cause:** Service updates apply values only when they are not `None`, so JSON `null` cannot clear nullable fields. Customer update does not check for an existing email. Product update does not check SKU uniqueness even though `products.sku` is globally unique in the database.

**Impact:** Users cannot remove stale optional values. Duplicate customer emails can be created; duplicate product SKUs can become generic 500 responses from a unique-constraint failure.

**Recommended fix:** Define explicit PATCH semantics using `model_fields_set`, validate uniqueness before commit, and still translate database uniqueness races to 409.

```python
changes = payload.model_dump(exclude_unset=True)
for field, value in changes.items():
    setattr(customer, field, value)  # explicit null clears nullable fields
```

### API-01 — Legacy form-to-PDF endpoint is public and has uncaught malformed inputs

**Severity: Medium. API:** `POST /quotations/form` (and public `GET /quotations/form`).

**Root cause:** The route has no authentication or request-size limit. Missing quantity/price fields can raise `TypeError` (`int(None)` / `Decimal(None)`), while the handler catches only `ValueError` and `InvalidOperation`. It also accepts a zero unit price although the JSON quotation schema requires a positive amount.

**Impact:** Malformed requests become 500s; the public PDF generator can be abused for resource consumption and bypasses document persistence, ownership, and quota rules.

**Recommended fix:** Remove the legacy route if unused, or require auth, model the body with Pydantic, cap item count/body size, and return 422/400 for invalid values.

### API-02 — PDF lookup turns infrastructure failures into 404s

**Severity: Medium. API:** `GET /quotations/{quotation_id}/pdf`.

**Root cause:** A broad `except Exception` around `get_quotation_with_details` converts database outages and programming errors into 404 and returns `str(exc)` to the caller.

**Impact:** Clients misreport server/database failures as missing documents, retries and observability are impaired, and internal exception details can leak.

**Recommended fix:** Catch only `NotFoundError` for 404, log unexpected failures with a reference ID, and return a generic 500 response.

### OBS-01 — Health endpoint does not check database readiness

**Severity: Medium. API:** `GET /health`.

**Root cause:** It always returns `{"status":"ok"}` without checking the database or required dependencies.

**Impact:** Orchestrators and deployment smoke checks can route traffic to an API that cannot serve requests because the database is unavailable.

**Recommended fix:** Keep `/health` as liveness and add `/ready` that performs a lightweight DB query and reports unavailable dependencies with 503.

### PERF-01 — Unbounded lists and N+1 admin serialization

**Severity: Medium, increasing with data volume. APIs:** list customers/products/quotations/users and quotation reference generation.

**Root cause:** List endpoints return every record without pagination/filter limits. `/users/admin` loads each role and company separately while serializing users. `get_next_reference_number` loads all of a user’s quotations into memory to find the maximum suffix.

**Impact:** Response size, query count, latency, and memory use grow with account history. Concurrent reference generation can also produce duplicate candidate values and a 500 on the unique constraint.

**Recommended fix:** Add cursor pagination and eager joins for user summaries; allocate references using a database sequence/upsert with a unique constraint and 409/atomic retry handling.

### AUDIT-01 — No update actor or immutable audit trail (addressed)

**Severity: High for financial records; Medium otherwise.**

**Root cause:** Models have `created_by_id` for selected entities and timestamps from `TimestampMixin`, but no `updated_by`, event table, or audit middleware. Companies lack creator attribution. Deletion removes the record outright.

**Impact:** It is not possible to determine who changed a customer/product/document, reconstruct prior values, or explain a financial correction. This falls short of the requested auditability for billing records.

**Remediation:** An append-only audit-event table is populated in the same transaction for quotation create/draft/finalize/update/payment-status/delete operations. Quotation updates record `updated_by_id`; finalized quotations are protected from edits and deletion. Catalog soft deletion and broader customer/company audit events remain follow-up work outside the critical/high fixes.

## RBAC and data-integrity review

- Bearer authentication is applied to customer, product, quotation, company, and user operations except the listed public routes. `get_current_user` checks the access-token type, re-reads the user, and loads the role from the database, so role claims in a stale JWT are not the sole authorization source.
- Customer/product/quotation reads generally filter by both company and creator. This prevents cross-user access but also means a manager cannot see another user’s records inside the same company. Confirm whether the product requirement is owner-level or company-wide sharing.
- The invoice payment-status service verifies company, creator, invoice title, and finalized status. Quota enforcement has row locking and usage tracking; existing unit tests cover limits and idempotent re-finalization.
- The current phone/PIN validators accept omitted, null, and blank optional fields while still enforcing exactly 10 and 6 digits. Regression tests cover these payloads; this fixed the recent quotation-draft HTTP 500.
- Catalog and customer records are hard-deleted. Quotation items are deleted with their quotation, but there is no soft-delete lifecycle. User deletion/deactivation endpoints are absent.
- Timestamps are automatically created/updated on mapped models. Creator attribution exists for customers/products/quotations/users; update actor attribution and immutable document history do not.
- The backend has no file-upload routes. The frontend generates the primary PDF locally; the backend PDF route is a fallback.

## Test gaps and next recommendations

1. Add route-level integration tests with a disposable PostgreSQL database for each of the 40 operations: success, schema-invalid, missing auth, wrong role, wrong tenant, missing ID, duplicate value, and database failure.
2. Add transaction tests that force failures after customer/product creation and assert the whole quotation request rolls back.
3. Add authorization regression tests for Admin A reading/changing users belonging to Company B, and for anonymous requests to `/roles`.
4. Add finalized-document immutability/deletion tests and linked customer/product deletion tests.
5. Add concurrent refresh replay, simultaneous quotation creation, and quota-finalization tests against PostgreSQL rather than only mocked repositories.
6. Add production-startup tests for missing/weak JWT secret, database readiness, and configured CORS origins. Confirm production environment overrides the current development defaults.
7. Add API pagination and response-contract tests to catch frontend/backend field drift.

## Overall disposition

The backend suite (55 tests), frontend utility/auth suite (19 tests), and Vite production build pass after remediation. Critical/high findings from this code review have fixes in the current worktree. Deployment still requires applying migration `0013`, setting a unique production `JWT_SECRET_KEY` of at least 32 bytes, and running route-level integration and concurrency checks against the deployment database. This remains a static/codebase audit; it does not certify production credentials, database contents, or deployed environment configuration.
