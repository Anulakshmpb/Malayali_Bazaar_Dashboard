# Malayali Bazaar Dashboard

Administrative web dashboard for **Malayali Bazaar**, built with **React 19** (Create React App + Tailwind CSS) and backed by **Firebase** (Authentication, Cloud Firestore Enterprise `default` database, Cloud Storage, Cloud Functions v2, Cloud Messaging, and Firebase Hosting).

---

## Table of Contents

1. [Project Overview & Tech Stack](#project-overview--tech-stack)
2. [Repository Structure](#repository-structure)
3. [Firebase Configuration & Environments](#firebase-configuration--environments)
4. [Frontend Architecture & Routes](#frontend-architecture--routes)
5. [Cloud Functions v2](#cloud-functions-v2)
6. [Firestore Data Model & Indexes](#firestore-data-model--indexes)
7. [Security Rules & Access Control](#security-rules--access-control)
8. [Local Development & Emulators](#local-development--emulators)
9. [Testing, Linting & CI/CD](#testing-linting--cicd)
10. [Deployment & Pending Production Checklist](#deployment--pending-production-checklist)

---

## Project Overview & Tech Stack

- **Firebase Project:** `malayali-bazaar` (Project Number: `173521641394`)
- **Primary Currency & Region:** EUR (`€`, `en-IE` formatting), Germany (`+49`), Cloud Functions in `europe-west1`, Firestore `default` Enterprise database in `europe-west10`
- **Frontend:**
  - React `19.3.0` (`react-scripts@5.0.1`)
  - React Router DOM `7.18.4` (with `React.lazy` route-level code splitting)
  - Tailwind CSS `3.4.19`
  - Recharts `3.10.1`
  - Lucide React `1.52.0` & React Icons `5.7.0`
  - Firebase Web SDK `13.0.0`
- **Backend (`functions/`):**
  - Node.js `24` (ES Modules)
  - `firebase-functions` `^7.0.0` (v2 callables & Firestore Eventarc triggers, `maxInstances: 10`)
  - `firebase-admin` `^13.6.0`
  - `joi` `^18.2.9` for payload validation

---

## Repository Structure

```text
Malayali_Bazaar_Dashboard/
├── .firebaserc                        # Default Firebase project alias (malayali-bazaar)
├── .github/workflows/ci.yml           # GitHub Actions CI (lint, tests, production build)
├── firebase.json                      # Firestore, Storage, Hosting, Functions & Emulator config
├── firestore.rules                    # Cloud Firestore Security Rules
├── firestore.indexes.json             # Composite Firestore indexes
├── storage.rules                      # Cloud Storage Security Rules
├── tailwind.config.js                 # Tailwind theme tokens & fonts
├── package.json                       # Frontend dependencies & scripts
├── public/
│   ├── index.html
│   └── firebase-messaging-sw.js       # FCM background service worker
├── src/
│   ├── App.js                         # Root providers (ToastProvider, UserProvider, AppRoutes)
│   ├── index.css                      # Global styles & Google Fonts (Inter, Plus Jakarta Sans)
│   └── Components/
│       ├── Config/Firebase.js         # Firebase Web SDK initialization (Firestore DB: "default")
│       ├── Routes/                    # ProtectedRoute, PermissionRoute, lazy RoutesConfig
│       ├── Shared/
│       │   ├── AppBar.jsx             # Navigation shell, sidebar & notification bell
│       │   ├── hooks/                 # UserContext, ToastContext, UseFcmSubscription
│       │   ├── Pages/CommonTable.jsx  # Reusable searchable/sortable table
│       │   ├── ui/                    # PageHeader, StatCard, Modal, ConfirmDialog, StatusBadge, PolicyDocumentEditor
│       │   └── utils/                 # formatters.js (EUR currency/dates), csv.js (BOM-safe CSV export)
│       └── Pages/                     # Feature pages (Auth, Dashboard, Orders, Products, Banner, Section, PromoCode, DeliveryCharges, Users, UserLedger, Notifications, Reports, Settings, SiteManagement)
└── functions/
    ├── index.js                       # Exported Cloud Functions v2 entrypoints (24 functions)
    ├── shared/                        # config.js (DB: "default"), callable.wrapper.js, logger.js, utils.js
    ├── scripts/
    │   └── backfillAdminClaims.mjs    # One-time script to sync admin: true custom claims
    ├── test/                          # Node built-in test runner (*.test.mjs)
    └── src/
        ├── Admin/                     # manageAdmin, managePermission, addNewUser
        ├── Analytics/                 # Firestore triggers for orders, products, users
        ├── Catalog/                   # Category, SubCategory, Brand, ProductType, PromoCode, Banner, Section, Scheme
        ├── CustomerLedger/            # recordCustomerPayment
        ├── Delivery/                  # manageDeliveryPlace, manageDeliverySettings
        ├── Notification/              # sendPushNotification, syncNotificationTopics
        ├── Order/                     # placeOrder, validatePromoCode, updateOrderStatus
        ├── Product/                   # manageProduct
        └── WebsiteManagement/         # manageWebsiteManagement
```

---

## Firebase Configuration & Environments

- **Registered Apps (`malayali-bazaar`):**
  - **Web:** `1:173521641394:web:ef550238b527132091ceab`
  - **Android:** `1:173521641394:android:b9c23a00c4a6555491ceab` (`com.example.malayali_bazar`)
  - **iOS:** `1:173521641394:ios:86e7065eafa3747491ceab` (`malayaliBazar`)
- **Hosting (`firebase.json`):**
  - Site: `malayali-bazaar-admin`
  - Public directory: `build/` with SPA rewrite `** -> /index.html`
- **Environment Variables:**
  - `.env` defines `REACT_APP_FIREBASE_VAPID_KEY` for Web Push (FCM).
  - `public/firebase-messaging-sw.js` configures background FCM notifications using the Web SDK config.

---

## Frontend Architecture & Routes

### Routing & RBAC (`src/Components/Routes/`)
- `Routes.jsx` wraps protected pages in `ProtectedRoute` (Firebase Auth session check), `Layout` (`AppBar` + `useFcmSubscription(user?.uid, "adminUsers")`), and `PermissionRoute` (`hasPermission(route.path)`).
- `RoutesConfig.js` lazy-loads **30 protected routes** plus URL parameter aliases (`/orders/view/:id`, `/section/view/:id`):

| Category | Routes |
| :--- | :--- |
| **Overview** | `/dashboard`, `/analytics`, `/reports` |
| **Orders & Customers** | `/orders`, `/orders/view`, `/orders/view/:id`, `/users`, `/users/view`, `/customer-ledger`, `/customer-ledger/view/:id` |
| **Catalog** | `/products`, `/products/add`, `/products/stock`, `/products/category`, `/products/brand`, `/product/scheme`, `/promocode` |
| **Storefront & Delivery** | `/banner`, `/section`, `/section/view`, `/section/view/:id`, `/delivery-charges` |
| **Site Management (CMS)** | `/footer`, `/privacy`, `/terms`, `/shipping`, `/common-section` |
| **Notifications** | `/notification`, `/send-notification`, `/notification-templates` |
| **Admin & Settings** | `/admin/users`, `/admin/settings` |

### Shared UI & Utilities (`src/Components/Shared/`)
- **UI Primitives (`ui/`):** `PageHeader`, `StatCard`, `Modal`, `ConfirmDialog`, `StatusBadge`, `PolicyDocumentEditor`.
- **Utilities (`utils/`):**
  - `formatters.js`: Standardized EUR (`€`) currency and date formatting (`en-IE`).
  - `csv.js`: UTF-8 BOM-prefixed `Blob` CSV downloader (`downloadCsv`) avoiding `encodeURI` `#` truncation issues.
- **Data Table:** `CommonTable.jsx` provides client-side search, sorting, and pagination.

---

## Cloud Functions v2

All 24 functions exported from `functions/index.js` run on Node 24 in `europe-west1` (or default v2 region config) and target the `default` Enterprise Firestore database (`getFirestore(undefined, "default")` in `functions/shared/config.js`).

### Callable Functions
- **Admin & Auth (`src/Admin/admin.temp.js`):**
  - `manageAdmin` — Create/update/disable/remove admin accounts and sync `admin: true` custom claims.
  - `managePermission` — Manage role permission sets (`permissions` collection).
  - `addNewUser` — Create customer profile in `users/{uid}` (enforces `req.auth.uid === payload.uid` or active admin).
- **Orders (`src/Order/order.callable.js`):**
  - `placeOrder` — Server-side validated checkout (pricing, stock decrement, delivery settings, promo code usage, awaited `postOrderTasks` for cart clearing and `admin_notification`).
  - `validatePromoCode` — Validates promo code eligibility, dates, minimum order value, and usage limits.
  - `updateOrderStatus` — Active-admin-only order lifecycle & payment status updates (with atomic stock restoration on cancellation).
- **Catalog (`src/Catalog/catalog.callable.js` & `src/Product/product.callable.js`):**
  - `manageProduct` — Product CRUD (`add`, `edit`, `delete`).
  - `manageCategory`, `manageSubCategory`, `manageBrand`, `manageProductType`, `managePromoCode`, `manageBanner`, `manageSection`, `manageScheme` — Protected by `requireActiveAdmin`.
- **Delivery & Ledger & CMS:**
  - `manageDeliveryPlace` (`src/Delivery/deliveryPlace.callable.js`) — Delivery zone CRUD.
  - `manageDeliverySettings` (`src/Delivery/deliverySettings.callable.js`) — Normal & postal delivery settings.
  - `recordCustomerPayment` (`src/CustomerLedger/customerLedger.callable.js`) — Records customer ledger payments and updates linked orders.
  - `manageWebsiteManagement` (`src/WebsiteManagement/webManage.callable.js`) — Footer, policies, FAQs, and store info CMS.
- **Notifications (`src/Notification/notification.js`):**
  - `sendPushNotification` — Sends targeted or cursor-paginated broadcast FCM notifications with stale token cleanup.
  - `syncNotificationTopics` — Syncs user FCM topic subscriptions.

### Firestore Triggers (`src/Analytics/analytics.triggers.js`)
- `onOrderAnalyticsTrigger` — Updates `analytics/overview`, `analytics_time_series`, `analytics_products`, and `user_ledgers` on order delivery/completion and payment deltas.
- `onProductAnalyticsTrigger` — Syncs `analytics/products` and `analytics/overview.totalProducts`.
- `onUserAnalyticsTrigger` — Syncs `analytics/overview.totalUsers`.

---

## Firestore Data Model & Indexes

The active database is `projects/malayali-bazaar/databases/default` (`ENTERPRISE` edition, `europe-west10`).

### Core Collections
- **Admin & RBAC:** `adminUsers/{uid}`, `permissions/{id}`
- **Catalog:** `products/{id}`, `category/{id}`, `subCategory/{id}`, `brand/{id}`, `productTypes/{id}`, `schemes/{id}`, `banners/{id}`, `sections/{id}`, `promocodes/{id}` (+ `usages/`)
- **Orders & Customers:** `orders/{id}`, `users/{uid}` (+ `used_promocodes/`, `notifications/`), `cart/{uid}`
- **Ledgers:** `user_ledgers/{uid}` (+ `payments/`), `ledger_payments/{id}`
- **Analytics:** `analytics/overview`, `analytics/products`, `analytics_time_series/{id}`, `analytics_products/{id}`
- **Delivery & CMS:** `delivery_settings/{normal,postal}`, `delivery_places/{id}`, `websiteManagement/{docId}`
- **Notifications & Counters:** `admin_notification/{id}`, `notification_templates/{id}`, `configurations/{product,order}`, `counters/schemes`

### Composite Indexes (`firestore.indexes.json`)
- `delivery_places`: `postalCode` (ASC) + `status` (ASC)
- `orders`: `userId` (ASC) + `createdAt` (DESC)
- `orders`: `customerId` (ASC) + `createdAt` (DESC)
- `orders`: `status` (ASC) + `createdAt` (DESC)
- `subCategory`: `categoryId` (ASC) + `createdAt` (DESC)

---

## Security Rules & Access Control

- **Firestore (`firestore.rules`):**
  - `isAdmin()` verifies `request.auth != null`, `admin: true` custom claim or active `adminUsers/{uid}` document (`status == 'active'`).
  - `adminUsers` and `permissions` reads are restricted to self/active admins.
  - Direct client-side `orders` creation is blocked (must go through `placeOrder` callable).
  - Server-managed fields on `users` (`isActive`, `isBlocked`, `usedPromoCodesCount`, `promoCodeUsage`) are protected from client overwrites.
- **Cloud Storage (`storage.rules`):**
  - Enforces authenticated active-admin writes with file size and MIME type limits, and controlled reads for catalog/storefront assets.
- **Cloud Functions:**
  - All admin callables enforce `requireActiveAdmin(req)` (verifying active `adminUsers` status).

---

## Local Development & Emulators

### Prerequisites
- Node.js 20+ (Node 24 recommended for Cloud Functions)
- Firebase CLI (`npx -y firebase-tools@latest`)

### Install Dependencies
```bash
npm install
npm --prefix functions install
```

### Run Frontend Dev Server
```bash
npm start
```
Opens [http://localhost:3000](http://localhost:3000).

### Run Firebase Emulator Suite
Configured in `firebase.json` (`auth:9099`, `functions:5001`, `firestore:8080`, `storage:9199`, `hosting:5000`, `ui:4000`):
```bash
firebase emulators:start
```

---

## Testing, Linting & CI/CD

### Run Checks Locally
```bash
# Lint Cloud Functions
npm --prefix functions run lint

# Run Cloud Functions unit tests (mocked Firestore/Auth)
npm --prefix functions test

# Run frontend unit tests
CI=true npm test -- --watchAll=false

# Build production React bundle
npm run build
```

### GitHub Actions (`.github/workflows/ci.yml`)
Runs automatically on pushes and pull requests to `main`:
1. `npm ci` & `npm --prefix functions ci`
2. `npm --prefix functions run lint`
3. `npm --prefix functions test`
4. `CI=true npm test -- --watchAll=false`
5. `npm run build`

---

## Deployment & Pending Production Checklist

### 1. Deploy Firestore Indexes First
```bash
firebase deploy --only firestore:indexes
```

### 2. Backfill Admin Custom Claims
Existing active accounts in `adminUsers` need `admin: true` custom claims synced before deploying tightened rules:
```bash
node functions/scripts/backfillAdminClaims.mjs
```

### 3. Build & Deploy Functions, Rules, and Hosting
```bash
npm run build
firebase deploy --only firestore:rules,storage,functions,hosting
```
> **Pre-deploy checks:** Confirm storefront/mobile apps place orders via the `placeOrder` callable (not direct Firestore writes) and verify `public/firebase-messaging-sw.js` registers cleanly on the deployed domain.

### 4. Pending Live Cleanup & GCP Hardening (Requires Explicit Approval)
- **Orphaned Cloud Functions (`europe-west1`):** Delete 3 unused legacy functions no longer exported in `functions/index.js`:
  ```bash
  firebase functions:delete manageDeliveryCharge manageFooter managePrivacy --region europe-west1
  ```
- **Unused Standard Firestore Database `(default)` (`nam5`, `freeTier: false`):** Verify no legacy test build targets `(default)` (contains only test collections `brands`, `product_test`, `producttest`, `testproducts`) and delete to avoid unnecessary billing.
- **Firestore Backups & Delete Protection (`projects/malayali-bazaar/databases/default`):** Enable Delete Protection, Point-in-Time Recovery (PITR), and scheduled backups in `europe-west10` (incurs GCP storage charges).
- **Future Maintenance:**
  - Uninstall unused `react-toastify` and `sonner` packages (`npm uninstall react-toastify sonner`) when refreshing dependencies.
  - Evaluate migrating from `react-scripts@5.0.1` to Vite to resolve CRA transitive audit advisories.
