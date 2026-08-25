# Offline-First Architecture — Analysis & Implementation

Scope: the HisabBoi POS path (`cashbook-frontend` + `backend-1`) keeps working with no
network. Local writes land in IndexedDB first, drain through a durable sync queue, and
can never produce a duplicate sale on retry.

---

## 1. Codebase understanding

| Area | What is actually there |
| --- | --- |
| Frontend framework | React 19 + Vite 7 + TypeScript 5.9, `react-router-dom` v7 (`src/routes/index.tsx`) |
| State management | Zustand with `persist` — `authStore`, `businessStore`, `languageStore`, `themeStore`. No global server-cache layer; every page keeps rows in local `useState` and calls a service in `useEffect`. `@tanstack/react-query` is a dependency but **unused** |
| API layer | One axios instance, `src/services/api.ts`: `baseURL` from `VITE_API_URL`, request interceptor injects the Bearer token out of `localStorage["auth-storage"]`, response interceptor hard-redirects to `/login` on 401 |
| Auth | JWT. Token persisted by zustand into `localStorage`. Backend `auth.middleware.ts` accepts `Authorization: Bearer` or a `token` cookie |
| Existing storage | `localStorage` only (zustand persist). **No IndexedDB anywhere** |
| Existing offline handling | None. No `navigator.onLine` usage, no reachability check, no queue |
| Service worker / PWA | `vite-plugin-pwa` (workbox `generateSW`) was already configured in `vite.config.ts`: precache + `navigateFallback: /index.html` + `NetworkFirst` runtime cache for `/api/*`. The shell loaded offline; the data did not |
| POS modules | `pages/{sale,product,customer,purchase,expense,supplier}`, modals in `components/shared/` |
| Backend | Express 5 + Mongoose 9, flat `controllers` / `models` / `routes/route.ts`. `sendResponse` envelope, `asyncHandler`, `ApiError` + `errorHandler`. Money and stock are funnelled through `utils/ledger.ts` and `utils/inventory.ts`; `sale`/`payment` writes run in `session.withTransaction` |
| Unique ID strategy | Server-side Mongo `ObjectId` for everything. Invoice numbers come from `business.invoiceSettings.nextNumber`, incremented inside the sale transaction |
| Error handling / retry | Try/catch per call surfacing `err.response.data.message` through `sonner` toasts. **No retry anywhere** |

### Current data flow (sale — the critical path)

```
NewSalePage.handleSubmit
  → local useState (rows/discount/tax/paid)
  → saleService.create()            src/services/sale.service.ts
  → POST /api/sales                 axios + Bearer token
  → saleController.createSale       backend-1/src/controllers/sale.controller.ts
      └─ session.withTransaction
           Product.findOne ×N → adjustStock(-qty)      utils/inventory.ts
           business.invoiceSettings.nextNumber++
           Sale.create
           recordLedgerEntry → Transaction + cash/bank  utils/ledger.ts
           Customer.$inc totalSales/totalPaid/totalDue
  → toast + navigate("/sales")
```

Every step above required the network. A dropped connection lost the whole basket.

---

## 2. Feature-by-feature assessment

| Feature | Current files | Current flow | Offline support | IndexedDB store | Sync required | Conflict risk |
| --- | --- | --- | --- | --- | --- | --- |
| Products | `pages/product/ProductsPage.tsx`, `components/shared/ProductModal.tsx`, `services/product.service.ts`, `controllers/product.controller.ts`, `models/product.model.ts` | list/create/update/soft-delete via REST | **Yes** — read, create, edit, delete | `products` | Yes | Low (last-write-wins on scalar fields) |
| Inventory / stock | `components/shared/StockAdjustModal.tsx`, `utils/inventory.ts` | `POST /products/:id/adjust-stock` applies a delta | **Yes** | `products` (`pendingDeltas.stock`) | Yes | **High** — concurrent tills, overselling |
| Sales | `pages/sale/NewSalePage.tsx`, `services/sale.service.ts`, `controllers/sale.controller.ts` | transactional: stock + invoice number + ledger + customer totals | **Yes** | `sales` | Yes | **High** — duplicates on retry, stock rejection |
| Customers | `pages/customer/*`, `components/shared/CustomerModal.tsx` | list/create/update/soft-delete | **Yes** | `customers` | Yes | Low–Medium (cached balances) |
| Cart | `pages/sale/NewSalePage.tsx` (`useState` only) | never left memory | **Yes** | `carts` | **No** — local only | None |
| Payments (receive) | `components/shared/PaymentModal.tsx`, `controllers/payment.controller.ts` | transactional, validated against `customer.totalDue` | **Yes** | `payments` | Yes | Medium — server rejects amounts over the due |
| Payments (pay supplier) | same modal, `/payments/pay` | validated against `supplier.totalPayable` | **No — deliberate** | — | — | — |
| Purchases / expenses / reports / mess | `pages/{purchase,expense,reports,mass}` | REST | No — back-office, not counter flows | — | — | — |

**Deliberate scope line.** Supplier payments and purchases are not mirrored: suppliers and
payables are back-office state, so an offline payable figure would be a guess. `paymentService.pay`
fails fast with a "needs a connection" message rather than queueing money against a stale balance.

### Files changed

**Backend — must modify**
- `src/controllers/sale.controller.ts` — replay guard + accept client `_id`; claim the operation inside the sale transaction
- `src/controllers/payment.controller.ts` — same, both directions
- `src/controllers/product.controller.ts` — same for create; `adjustProductStock` wrapped in a transaction when an `operationId` is present (a stock delta has no document of its own, so a blind retry would apply it twice)
- `src/controllers/customer.controller.ts` — same for create
- `src/routes/route.ts` — mount `GET /api/health`
- `src/middlewares/errorHandler.ts` — a duplicate operation claim answers **409** (retryable) instead of 400
- `src/config/db.ts` — a failed DB connect now throws instead of `process.exit(1)`, so the request (and `/api/health`) can report "database unavailable" rather than killing the process

**Backend — new**
- `src/models/sync-operation.model.ts` — the idempotency ledger
- `src/utils/idempotency.ts` — `parseClientObjectId` / `parseOperationId` / `findReplay` / `claimOperation`
- `src/controllers/health.controller.ts` — connectivity + writability probe

**Frontend — new**
- `src/offline/` — `schema.ts`, `idb.ts`, `ids.ts`, `network.ts`, `syncQueue.ts`, `syncManager.ts`, `localWrite.ts`, `bootstrap.ts`, `purge.ts`, `repositories/{base,index,cart.repo,meta.repo}.ts`, `__tests__/`
- `src/store/offlineStore.ts` — connectivity / queue depth / `dataVersion`
- `src/config/api.ts` — shared base URL (keeps the probe out of the interceptor-laden client)
- `src/components/shared/{SyncStatusIndicator,SyncBadge,OfflineAnnouncer}.tsx`

**Frontend — modified**
- `src/services/{product,customer,sale,payment}.service.ts` — offline-first, same exported signatures
- `src/services/api.ts` — reports request outcomes into the connectivity monitor
- `src/App.tsx` — starts the offline runtime
- `src/layout/AppLayout.tsx` — status indicator in the sidebar and the mobile header
- `src/pages/{product/ProductsPage,customer/CustomersPage,sale/SalesPage}.tsx` — `dataVersion` in the loader deps + per-row sync badge
- `src/pages/sale/NewSalePage.tsx` — cart persistence + offline-aware confirmation
- `src/components/shared/PaymentModal.tsx` — supplier-payment offline message
- `vite.config.ts` — `/api/health` excluded from the service-worker cache
- `src/i18n/locales/{en,bn}.json` — `offline.*` namespace

---

## 3. Architecture

```
User action
   ↓
Local state (React)
   ↓
IndexedDB write            repositories/*  — record + optimistic deltas
   ↓
Sync queue append          syncQueue.enqueue — operationId, seq, dependsOn
   ↓
API reachable?  ──no──→   stays PENDING; monitor + triggers retry
   │yes
   ↓
POST/PATCH with operationId  →  backend replay guard
   ↓
confirmed  →  record marked synced, delta settled
rejected   →  4xx: CONFLICT (parked)  ·  transport/5xx: retry with backoff
```

The existing architecture is kept intact. Services keep their exported signatures, so
pages, modals and types were not rewritten — the offline behaviour lives behind them.

---

## 4. IndexedDB schema — `hisabboi-offline` v1

Evaluated against the candidate list in the brief: `categories` is **not** a store (a product's
category is a free-text string on the product, not an entity); `saleItems` is **not** a store
(items are embedded in the sale document); `inventory` is **not** a store (stock is a field on
the product, tracked with a pending delta).

```
products      key _id      idx business, syncStatus
  read offline ✓  write offline ✓  synced ✓
  the sellable catalogue; `stock` = serverValues.stock + pendingDeltas.stock

customers     key _id      idx business, syncStatus
  read offline ✓  write offline ✓  synced ✓
  balances (totalSales/totalPaid/totalDue) are delta-tracked the same way

sales         key _id      idx business, date, customer, syncStatus
  read offline ✓  write offline ✓  synced ✓
  never pruned on refresh — sale history is exactly what must stay readable offline

payments      key _id      idx business, syncStatus
  read offline ✓  write offline ✓ (receive only)  synced ✓

carts         key businessId
  read offline ✓  write offline ✓  synced ✗ — the basket being keyed in, local only

syncQueue     key operationId   idx status, seq, business, entityId
  operationId, userId, seq, businessId, entityType, entityId, operationType,
  payload, dependsOn[], status, retryCount, nextAttemptAt, lastError, createdAt, updatedAt

appMeta       key key
  queue sequence counter, last successful sync
```

Every cached record also carries `syncStatus`, `localUpdatedAt`, `syncError`, and — where
numbers move optimistically — `serverValues` / `pendingDeltas`.

### ID strategy

Client-minted ids follow the **MongoDB ObjectId layout** (`src/offline/ids.ts`): 4-byte
timestamp + 5-byte random + 3-byte counter, 24 hex chars. The backend accepts them verbatim as
`_id`, so existing `Types.ObjectId.isValid` route checks, indexes and sort order keep working —
and a sale rung up offline can reference a customer added ninety seconds earlier with no id
remapping pass after sync. `operationId` is a separate UUID, one per queued operation.

---

## 5. Sync queue

FIFO by `seq` (allocated in the same IndexedDB transaction as the insert, so two tabs cannot
share one). Statuses: `PENDING → PROCESSING → SUCCESS | FAILED | CONFLICT`.

- **Retry** — transport failures and 408/409/425/429/5xx back off exponentially (5s → 5min cap, 8 attempts, then `FAILED`)
- **Conflict** — any other 4xx means the server looked at the payload and refused; retrying it byte-for-byte cannot help, so it is parked for a person
- **Duplicate prevention** — every request carries its `operationId`; see §6
- **Reload recovery** — a row left `PROCESSING` can only be a request that died mid-flight, so it is reset to `PENDING` at the start of every run and re-sent (safe, because the backend deduplicates)
- **Mutex** — `runSync()` returns the in-flight promise; login, the `online` event, the interval and a manual press cannot race
- **Error logging** — `lastError` on the operation, `syncError` on the record

Operations are only marked `SUCCESS` after the backend responds.

---

## 6. Idempotency

Two client-generated keys per write:

```
clientId    = ObjectId-shaped id, becomes the record's _id
operationId = UUID, one per queued operation
```

`SyncOperation { business, operationId, entityType, entity }` with a unique index on
`(business, operationId)`. On every offline-originated write the controller first calls
`findReplay`: if the operation is already claimed, it re-reads the entity it produced and
returns **200 with the original record** — no second sale, no second stock movement, no second
invoice number. The claim is written inside the same Mongo transaction as the effect, so a
failed sale rolls the claim back too. A claim whose entity no longer exists is stale and is
dropped so the request reprocesses normally.

Concurrent duplicates hit the unique index; `errorHandler` maps that to **409**, which the
client treats as retryable — the retry then finds the claim and replays.

Requests without an `operationId` (all normal online traffic) bypass the ledger entirely and
behave exactly as before. Ledger rows expire after 90 days (TTL index).

---

## 7. Network handling

Three signals, in `src/offline/network.ts`:

1. **Browser link** — `navigator.onLine` and the `online`/`offline` events, trusted only when they say *offline*
2. **Health probe** — `GET /api/health` (new, public, cheap). It reports `writable` from `mongoose.connection.readyState`, because the API can answer while its database is down
3. **Real request outcomes** — the axios response interceptor reports back. A response of any status proves the API answered; a transport error means it did not

A successful **GET** is treated as weak evidence: the service worker's `NetworkFirst` cache can
answer one while genuinely offline, so a cached GET can keep a healthy status fresh but can never
flip offline → online. Only the probe and successful writes can do that. `/api/health` is
excluded from the service-worker cache (`NetworkOnly`) for the same reason.

Probing runs every 15s while unreachable and on tab focus; it is coalesced so concurrent callers
share one request.

---

## 8. Sync triggers

App start · login (token appears) · browser `online` event · connectivity restored · tab becomes
visible · 60s periodic retry · after every local write · manual "Sync now". All of them funnel
through the single `runSync()` mutex; bursts are coalesced by `scheduleSync()`.

---

## 9. Operation order

Strict FIFO by `seq` handles the common case (a customer is created before the sale that
references them). `dependsOn` is the safety net: a sale lists its customer and every product it
touches, a payment lists its customer. An operation whose dependency is unresolved — still
pending, backing off, failed or parked as a conflict — is **skipped, not attempted**, so one
rejection does not cascade into a series of 404s.

```
Create customer → Create sale → (stock applied by the sale) → Receive payment
```

No separate priority scheme or batch endpoint was needed: the backend already applies a sale's
items, ledger entry and customer totals in one Mongo transaction.

---

## 10. Conflict resolution

| Entity | Possible conflict | Detection | Strategy |
| --- | --- | --- | --- |
| Product (fields) | Price/name edited on two devices | — | **Last write wins.** Only changed fields are PATCHed; a pull never overwrites a record with queued local edits |
| Product (stock) | Another till sold the same units | Server `adjustStock` returns 400 *Insufficient stock* | **Reject and park.** The op becomes `CONFLICT`, the record is flagged, the user is told. Never silently retried into an oversell |
| Sale | Retry after a lost response | `operationId` already claimed | **Replay** — return the original sale. Duplicate prevention is the priority here |
| Sale | Server refuses (oversold, missing product) | 4xx | **Preserve and park.** The local sale is kept and marked `conflict`; a completed transaction is never discarded |
| Customer | Concurrent edits | — | Last write wins; balances are delta-rebased, never overwritten |
| Customer balances | Offline sale/payment moved the due | Rebase on every pull | **Server value + pending delta.** The server figure becomes the new baseline; unsynced movement is re-applied on top, so it is neither lost nor double-counted |
| Payment | Amount exceeds the server-side due | 400 | Ordering makes it rare (the payment waits for its sales); otherwise parked for review |
| Cart | — | — | Local only, never synced |

---

## 11. UI / UX

Reuses the existing design system (inline CSS custom properties, `lucide-react` icons, `sonner`).

- **`SyncStatusIndicator`** — sidebar row (matching `ThemeToggle variant="row"`) and mobile header icon. Five states in priority order: needs attention → syncing → offline → *n* waiting → all synced. Clicking it is "Sync now"
- **`SyncBadge`** — per-row "Pending sync" / "Sync failed" chip on products, customers and sales
- **`OfflineAnnouncer`** — toasts on the transitions that matter: went offline, back online, conflicts raised
- **Offline sale confirmation** — a sale saved offline says so and shows its `LOCAL-XXXXXX` reference instead of implying the backend has it
- Bilingual: 30 keys added to both `en.json` and `bn.json`

---

## 12. Data loading

```
Page → service → IndexedDB (returned immediately)
                 ↓ (background, if reachable)
              GET → merge into IndexedDB → bumpDataVersion() → page effect re-runs
```

Pages list `dataVersion` in their loader dependencies — a one-line change per page that fits the
existing `useEffect(load, [deps])` idiom, so no state-management rewrite was needed.

- **Source of truth offline** — IndexedDB
- **Source of truth online** — the server, for every record with no queued local write
- **Merge** — `rebaseFromServer`: a record with unsynced writes keeps its own field values; delta-tracked numbers re-baseline on the server figure with pending movement re-applied
- **Pruning** — only on an unfiltered full listing (products, customers), never on a search or a paginated page, and never for rows with pending work
- **Search/filter** run locally, so product and customer lookup work with no network

---

## 13. Security

- **No tokens in IndexedDB.** Auth stays exactly where it was — zustand `persist` in `localStorage`. The auth architecture is untouched
- **No payment instrument data** is cached; the app only ever stores a method string (`cash`/`bank`/`bkash`/…)
- **Customer PII** (name, phone, email, address) is cached because offline POS requires it. On logout everything the server already holds is evicted, so the next person on a shared counter terminal sees none of it
- **Unsynced work survives logout on purpose** — discarding a sale rung up offline would destroy a business record that exists nowhere else
- **Queued work is stamped with its author.** The sync manager only pushes operations whose `userId` matches the signed-in user, so one account's pending sales can never go out under another's credentials

---

## 14. Implementation steps (as built)

1. **Backend idempotency** — `sync-operation.model.ts`, `utils/idempotency.ts`, replay guards in the sale / payment / product / customer controllers, 409 for duplicate claims
2. **Backend health** — `health.controller.ts`, `GET /api/health`, `connectDB` no longer exits the process
3. **IndexedDB foundation** — `schema.ts` (stores, indexes, versioning), `idb.ts` (promise wrapper, additive `onupgradeneeded`, SSR guard), `ids.ts`
4. **Repositories** — `base.ts` (delta bookkeeping, merge rules), per-entity repos, cart and meta repos
5. **Network monitor** — three-signal connectivity, coalesced probe, SW-cache-aware
6. **Sync queue** — durable outbox, FIFO + dependencies, backoff, recovery, pruning
7. **Sync manager** — handlers per entity, classification, mutex, delta settlement, conflict flagging
8. **Service integration** — the four POS services rewritten offline-first behind unchanged signatures
9. **App wiring** — `bootstrap.ts` triggers, logout purge, `App.tsx`
10. **UI** — indicator, badges, announcer, cart persistence, bilingual strings
11. **Tests** — 12 scenarios against real IndexedDB and a fake backend that reproduces the ledger

---

## 15. Testing

`pnpm test` (vitest + `fake-indexeddb`). Two devDependencies were added — testing durability
against a real IndexedDB implementation is the whole point, and no runtime dependency was added
for the feature itself (the IndexedDB wrapper is ~150 lines rather than a library).

| Scenario | Covered |
| --- | --- |
| 1 — fully offline | products/customers/sales written locally, stock decremented, all still present after a "reload" |
| 2 — connection restored | queue drains, server invoice number replaces the placeholder, stock rebased once, queue empty |
| 3 — API down while the browser is online | operation stays `PENDING` with `retryCount > 0` and a future `nextAttemptAt`; succeeds when the backend returns |
| 4 — duplicate retry | server processes the sale, the response is lost, the same `operationId` is re-sent → **one** sale, **one** stock movement |
| 5 — reload mid-sync | a `PROCESSING` row is recovered to `PENDING` and completes |
| 6 — multiple dependent operations | POST order is customer → sale → payment; a stuck customer holds its sale back |
| 7 — conflict | an oversold sale is parked as `CONFLICT`, the record is kept and flagged, and it is not retried automatically |
| + | offline catalogue/customer search; pending stock and pending field edits survive a server refresh; the sync mutex |

---

## 16. Risks and edge cases

- **Offline invoice numbers.** `business.invoiceSettings.nextNumber` is server state; predicting it offline would collide across devices. Offline sales show `LOCAL-XXXXXX` until sync assigns the real number. Anything printing an invoice before sync shows the placeholder
- **Overselling is detected, not prevented.** Two tills offline against the same stock can both sell it. The second sale is preserved and parked as a conflict for a person to resolve — there is no correct automatic answer
- **Conflicts currently need a re-press.** "Sync now" re-attempts parked operations; there is no per-conflict edit-and-resend UI yet. That is the natural next increment
- **Customer `getOne` transactions.** The ledger shown on the customer detail page is not mirrored; offline it renders empty while the customer itself comes from cache
- **Supplier payments and purchases stay online-only** (§2)
- **Mongo transactions require a replica set.** Already true of the existing sale/payment code; `adjustProductStock` now shares that requirement, but only when an `operationId` is supplied
- **Service-worker API cache.** The `NetworkFirst` `/api/*` rule can still serve a stale GET to an online-only page. It cannot corrupt the connectivity signal (§7) and it does not touch the POS path, which reads from IndexedDB
- **Storage limits.** Sale history is never pruned locally; a very long-lived terminal will grow the `sales` store. Adding an age-based prune for synced sales is the obvious follow-up
- **Multi-tab.** Two tabs share one IndexedDB and each runs its own mutex, so both could push at once. The `operationId` ledger makes that safe (the loser replays), but a `BroadcastChannel` lock would avoid the wasted request
