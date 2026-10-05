# HisabBoi — Complete Page & Modal Data Specification

This document provides a comprehensive, page-by-page and modal-by-modal data contract and UI specification for the **HisabBoi** hybrid mobile accounting application.

For each screen and modal, this document details:
1. **Identity & Route:** URL path, component path, and authorized roles.
2. **Workflow & Purpose:** Why this screen exists and how users interact with it.
3. **Data Input ("Which data take"):** URL parameters, form inputs, local storage/drafts, and store dependencies.
4. **Data Display ("Which data showing"):** API endpoints, computed calculations, KPI cards, and UI components.
5. **Concrete Seed Data Example:** Realistic JSON data illustrating exact inputs and rendered outputs using an authentic Bangladeshi retail business scenario (**"Talukder General Store"** in Mirpur-10, Dhaka).

---

## Master Seed Business Profile

All subsequent pages reference this unified master dataset:

```json
{
  "activeBusiness": {
    "_id": "biz_6701a1b2c3d4e5f6a7b8c9d0",
    "name": "Talukder General Store",
    "type": "business",
    "businessType": "retail_shop",
    "phone": "+8801712345678",
    "address": "Holding 42, Road 5, Block B, Mirpur-10, Dhaka-1216",
    "currency": "BDT",
    "logoUrl": "https://res.cloudinary.com/hisabboi/image/upload/v1/logos/talukder_store.png",
    "openingBalance": 25000,
    "cashBalance": 18450.50,
    "bankBalance": 42100.00,
    "paymentMethods": ["cash", "bkash", "nagad", "bank"],
    "invoiceSettings": {
      "prefix": "TGS",
      "nextNumber": 1048
    },
    "owner": {
      "_id": "usr_990112233445566778899001",
      "firstName": "Bijon",
      "lastName": "Talukder",
      "email": "bijontalukder1247@gmail.com"
    },
    "mealEnabled": false,
    "status": true,
    "createdAt": "2026-01-10T08:30:00.000Z"
  }
}
```

---

## 1. Authentication & Onboarding Pages

### 1.1 Login Page
- **Route:** `/login`
- **File:** [`src/pages/auth/LoginPage.tsx`](file:///d:/hisabboi/cashbook-frontend/src/pages/auth/LoginPage.tsx)
- **Role:** Guest only (redirects to `/dashboard` if authenticated)
- **Workflow:** User logs in with email/password or Google One Tap to access their businesses.

#### Data Input ("Which data take"):
| Field | Type | Validation / Constraints | Description |
|---|---|---|---|
| `email` | string | Valid email format, required | User account email |
| `password` | string | Min 6 chars, required | User password |
| Google Token | string | OAuth ID token (optional) | One-tap authentication |

#### Data Display ("Which data showing"):
- **Branding Header:** HisabBoi logo, welcome slogan.
- **Form Controls:** Email `NativeInput`, Password `NativeInput` with toggle show/hide icon.
- **Actions:** Login button (`Button` with spinner), Google SSO button, links to `/register` and `/forgot-password`.
- **Language Switcher:** Quick switch between English (`en`) and Bangla (`bn`).

#### Seed Data Example:
```json
// Input (Form submission)
{
  "email": "bijontalukder1247@gmail.com",
  "password": "SecurePassword123!"
}

// Output (API Response: POST /auth/login)
{
  "success": true,
  "data": {
    "token": "jwt_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.seedToken123456",
    "user": {
      "_id": "usr_990112233445566778899001",
      "firstName": "Bijon",
      "lastName": "Talukder",
      "email": "bijontalukder1247@gmail.com",
      "phone": "+8801712345678",
      "avatar": "https://api.dicebear.com/7.x/initials/svg?seed=BT"
    },
    "businesses": [
      {
        "_id": "biz_6701a1b2c3d4e5f6a7b8c9d0",
        "name": "Talukder General Store",
        "type": "business",
        "role": "owner"
      }
    ]
  }
}
```

---

### 1.2 Register Page
- **Route:** `/register`
- **File:** [`src/pages/auth/RegisterPage.tsx`](file:///d:/hisabboi/cashbook-frontend/src/pages/auth/RegisterPage.tsx)
- **Role:** Guest only
- **Workflow:** New shopkeeper registration.

#### Data Input:
- `firstName`: string (required, 2-50 chars)
- `lastName`: string (required, 2-50 chars)
- `email`: string (valid email, unique)
- `phone`: string (optional, 11-digit Bangladeshi mobile e.g. `01712345678`)
- `password`: string (min 6 chars)
- `confirmPassword`: string (must match `password`)

#### Data Display:
- Input form with validation error messages, password strength indicator, submit button, link to `/login`.

---

### 1.3 Onboarding Page
- **Route:** `/onboarding`
- **File:** [`src/pages/on-board/OnboardingPage.tsx`](file:///d:/hisabboi/cashbook-frontend/src/pages/on-board/OnboardingPage.tsx)
- **Role:** Authenticated users with 0 businesses
- **Workflow:** Wizard that initializes the user's first business ledger.

#### Data Input:
- `businessName`: string (e.g. `"Talukder General Store"`)
- `businessType`: `"retail_shop" | "restaurant" | "online_shop" | "service_business" | "freelancer" | "wholesale" | "other"`
- `currency`: string (defaults to `"BDT"`)
- `openingCashBalance`: number (e.g. `25000`)

#### Data Display:
- Multi-step visual card selector with business type icons, setup preview, submit loader.

---

## 2. Core Dashboard & Analytics

### 2.1 Dashboard Page
- **Route:** `/dashboard`
- **File:** [`src/pages/dashboard/DashboardPage.tsx`](file:///d:/hisabboi/cashbook-frontend/src/pages/dashboard/DashboardPage.tsx)
- **Subcomponents:** `BusinessDashboardContent.tsx`, `PersonalDashboardContent.tsx`
- **Role:** Owner, Admin, Member

#### Data Input:
- Active business ID (`activeBusiness._id` from `useBusinessStore`)
- Selected date filter: `"today" | "7d" | "30d" | "this_month" | "custom"`

#### Data Display:
- **Financial KPI Cards:**
  - Net Balance / Cash in Hand (`money(cashBalance)`)
  - Total Receivables / Customer Due (`money(totalCustomerDue)`)
  - Total Payables / Supplier Due (`money(totalSupplierDue)`)
  - Today's Total Sales vs. Purchases
- **Quick Action Row:**
  - `[ + New Sale ]` -> navigates to `/sales/new`
  - `[ + New Purchase ]` -> navigates to `/purchases/new`
  - `[ + Expense ]` -> opens `ExpenseModal`
  - `[ + Cash In/Out ]` -> opens `TxnModal`
- **Stock Alert Card:** Products with stock <= minStock
- **Recent Transactions Feed:** Last 5-10 sales, purchases, and expenses with status badges.

#### Seed Data Example:
```json
// GET /dashboard/business/biz_6701a1b2c3d4e5f6a7b8c9d0
{
  "summary": {
    "totalIncome": 85400.00,
    "totalExpense": 32150.00,
    "netProfit": 53250.00,
    "totalCustomerDue": 14250.00,
    "totalSupplierDue": 28600.00,
    "lowStockCount": 3
  },
  "todayStats": {
    "salesTotal": 12850.00,
    "salesCount": 14,
    "purchaseTotal": 4500.00,
    "expenseTotal": 650.00
  },
  "lowStockProducts": [
    {
      "_id": "prod_001",
      "name": "Teer Soybean Oil 5L",
      "stock": 2,
      "minStock": 5,
      "unit": "can"
    },
    {
      "_id": "prod_002",
      "name": "Aarong Butter 200g",
      "stock": 0,
      "minStock": 6,
      "unit": "pcs"
    }
  ]
}
```

---

## 3. Sales & POS (Point of Sale) Module

### 3.1 New Sale Form
- **Route:** `/sales/new`
- **File:** [`src/pages/sale/NewSalePage.tsx`](file:///d:/hisabboi/cashbook-frontend/src/pages/sale/NewSalePage.tsx)
- **Role:** Owner, Admin, Member
- **Workflow:** Cash register / POS checkout to record retail sales, manage cart items, apply discounts, and assign credit (baki) to customers.

#### Data Input ("Which data take"):
| Field | Type | UI Control | Description |
|---|---|---|---|
| `customerId` | string (optional) | `NativeSelectDrawer` | Customer for credit/invoice tracking |
| `items[].productId` | string (required) | `NativeSelectDrawer` | Selected inventory item |
| `items[].quantity` | number (required >= 1) | Numeric stepper / input | Units sold |
| `items[].unitPrice` | number (required) | `NativeInput` | Selling price per unit |
| `discount` | number (default 0) | `NativeInput` | Discount in BDT |
| `tax` | number (default 0) | `NativeInput` | VAT / Tax |
| `paidAmount` | number | `NativeInput` + presets | Cash received from customer |
| `paymentMethod` | string | `SegmentedControl` | `"cash" \| "bkash" \| "nagad" \| "bank"` |
| `note` | string (optional) | Textarea | Delivery or billing notes |

#### Local Storage / Offline Sync:
- Persisted locally in IndexedDB via `cartRepo.save(draft)` to survive tab close or process termination.

#### Data Display ("Which data showing"):
- Customer balance chip (e.g. `"Rafiqul Islam • Prev Due: ৳1,450"`).
- Line item total calculation: `qty * unitPrice`.
- Grand Total calculation: `subtotal - discount + tax`.
- Live Due calculation: `max(0, total - paidAmount)`.
- Warning alert if `due > 0` and customer is missing.
- Sticky Bottom Action Dock with Total & `Confirm Sale` CTA.

#### Seed Data Example:
```json
// Form Input Payload (POST /sales)
{
  "businessId": "biz_6701a1b2c3d4e5f6a7b8c9d0",
  "customerId": "cust_8801",
  "items": [
    {
      "product": "prod_001",
      "quantity": 2,
      "unitPrice": 820.00
    },
    {
      "product": "prod_003",
      "quantity": 5,
      "unitPrice": 75.00
    }
  ],
  "discount": 50.00,
  "tax": 0.00,
  "paidAmount": 1500.00,
  "paymentMethod": "cash",
  "note": "Delivered to shop front"
}

// Resulting Sale Record Created
{
  "_id": "sale_7701",
  "business": "biz_6701a1b2c3d4e5f6a7b8c9d0",
  "invoiceNumber": "TGS-1048",
  "customer": {
    "_id": "cust_8801",
    "name": "Rafiqul Islam",
    "phone": "+8801711223344"
  },
  "items": [
    {
      "product": "prod_001",
      "productName": "Teer Soybean Oil 5L",
      "quantity": 2,
      "unitPrice": 820.00,
      "lineTotal": 1640.00
    },
    {
      "product": "prod_003",
      "productName": "Miniket Rice 1kg Loose",
      "quantity": 5,
      "unitPrice": 75.00,
      "lineTotal": 375.00
    }
  ],
  "subtotal": 2015.00,
  "discount": 50.00,
  "tax": 0.00,
  "total": 1965.00,
  "paidAmount": 1500.00,
  "dueAmount": 465.00,
  "paymentMethod": "cash",
  "status": "partial",
  "date": "2026-10-05T14:15:00.000Z",
  "createdAt": "2026-10-05T14:15:00.000Z"
}
```

---

### 3.2 Sales List Page
- **Route:** `/sales`
- **File:** [`src/pages/sale/SalesPage.tsx`](file:///d:/hisabboi/cashbook-frontend/src/pages/sale/SalesPage.tsx)
- **Role:** Owner, Admin, Member

#### Data Input:
- Query parameters: `?page=1&limit=20&search=...`

#### Data Display:
- Search bar to search by customer name or invoice number (`TGS-1048`).
- Sale list rows (`NativeCard` / `ListItem`) showing:
  - Invoice #, customer name, date, item count
  - Total amount (`৳1,965`)
  - Status Badge: `paid` (green), `partial` (amber), `due` (red)
  - Quick action to view invoice / download PDF.

---

### 3.3 Sale Detail & Invoice Page
- **Routes:** `/sales/:id` and `/sales/:id/invoice`
- **Files:** [`SaleDetailPage.tsx`](file:///d:/hisabboi/cashbook-frontend/src/pages/sale/SaleDetailPage.tsx), [`SaleInvoicePage.tsx`](file:///d:/hisabboi/cashbook-frontend/src/pages/sale/SaleInvoicePage.tsx)

#### Data Input:
- Route param: `id` (Sale ID, e.g. `sale_7701`)

#### Data Display:
- Complete thermal / printable invoice layout:
  - Header: Business name, address, phone, invoice #, timestamp
  - Customer info: Name, phone
  - Itemized table: Product name, Quantity, Rate, Total
  - Summary: Subtotal, Discount, VAT, Net Total, Paid, Current Due, Previous Due
  - Action buttons: Print thermal receipt (58mm/80mm), Share via WhatsApp, Download PDF.

---

## 4. Purchase & Procurement Module

### 4.1 New Purchase Form
- **Route:** `/purchases/new`
- **File:** [`src/pages/purchase/NewPurchasePage.tsx`](file:///d:/hisabboi/cashbook-frontend/src/pages/purchase/NewPurchasePage.tsx)
- **Role:** Owner, Admin

#### Data Input ("Which data take"):
| Field | Type | UI Control | Description |
|---|---|---|---|
| `supplierId` | string (optional) | `NativeSelectDrawer` + quick modal | Supplier from whom goods are received |
| `purchaseDate` | string (YYYY-MM-DD) | `NativeInput` (date) | Transaction date (supports backdating) |
| `rows[].productId` | string (required) | `NativeSelectDrawer` + quick modal | Inventory item restocked |
| `rows[].quantity` | number (required) | Tactile `[-]` `[qty]` `[+]` stepper | Units purchased |
| `rows[].unitPrice` | number (required) | `NativeInput` | Wholesale cost per unit |
| `discount` | number (default 0) | `NativeInput` | Trade discount received |
| `paidAmount` | number | `NativeInput` + presets | Amount paid to supplier |
| `paymentMethod` | string | `SegmentedControl` | Payment channel |
| `note` | string (optional) | Textarea | Shipment details / bill number |

#### Embedded Modals:
- `+ Add Supplier` triggers inline [`SupplierModal`](file:///d:/hisabboi/cashbook-frontend/src/components/shared/SupplierModal.tsx)
- `+ Add Product` triggers inline [`ProductModal`](file:///d:/hisabboi/cashbook-frontend/src/components/shared/ProductModal.tsx)

#### Data Display ("Which data showing"):
- Supplier payable status chip (e.g. `Haji Enterprise • Payable: ৳12,500`).
- Inventory stock indicator: `Stock: 2 can • Cost: ৳780`.
- Quick Settlement chips: `[ ⚡ Full Paid ]`, `[ 📝 Full Due (Baki) ]`, `[ 50% ]`.
- Sticky Bottom Action Dock showing total cost and `Record Purchase` CTA.

#### Seed Data Example:
```json
// POST /purchases
{
  "businessId": "biz_6701a1b2c3d4e5f6a7b8c9d0",
  "supplierId": "supp_9901",
  "date": "2026-10-05T00:00:00.000Z",
  "items": [
    {
      "product": "prod_001",
      "quantity": 10,
      "unitPrice": 780.00
    },
    {
      "product": "prod_004",
      "quantity": 20,
      "unitPrice": 140.00
    }
  ],
  "discount": 200.00,
  "paidAmount": 5000.00,
  "paymentMethod": "bank",
  "note": "Invoice #HE-5542 via Chalan"
}

// Created Purchase Record:
{
  "_id": "pur_4401",
  "referenceNumber": "PUR-1021",
  "supplier": {
    "_id": "supp_9901",
    "name": "Haji Enterprise Wholesaler",
    "phone": "+8801819998877"
  },
  "subtotal": 10600.00,
  "discount": 200.00,
  "total": 10400.00,
  "paidAmount": 5000.00,
  "dueAmount": 5400.00,
  "status": "partial",
  "paymentMethod": "bank",
  "date": "2026-10-05T00:00:00.000Z"
}
```

---

### 4.2 Purchases List & Detail Page
- **Routes:** `/purchases` and `/purchases/:id`
- **Files:** [`PurchasesPage.tsx`](file:///d:/hisabboi/cashbook-frontend/src/pages/purchase/PurchasesPage.tsx), [`PurchaseDetailPage.tsx`](file:///d:/hisabboi/cashbook-frontend/src/pages/purchase/PurchaseDetailPage.tsx)

#### Data Display:
- Real-time search filter by reference number (`PUR-1021`) or supplier name.
- Summary of itemized procurement, supplier details, due balance badge, and invoice download button.

---

## 5. Customer CRM & Baki (Ledger) Module

### 5.1 Customers Page
- **Route:** `/customers`
- **File:** [`src/pages/customer/CustomersPage.tsx`](file:///d:/hisabboi/cashbook-frontend/src/pages/customer/CustomersPage.tsx)

#### Data Input:
- Search input (`searchQuery`) filtering by customer name or phone number.
- `+ Add Customer` button opening `CustomerModal`.

#### Data Display:
- Customer list rows (`ListItem` in `NativeCard`):
  - Avatar with customer initials
  - Customer name & phone number
  - Total sales count / volume
  - Due balance in bold red font (`৳ 1,450 Due`)
  - Chevron leading to `/customers/:id`.

#### Seed Data Example:
```json
// GET /customers/business/biz_6701a1b2c3d4e5f6a7b8c9d0
[
  {
    "_id": "cust_8801",
    "business": "biz_6701a1b2c3d4e5f6a7b8c9d0",
    "name": "Rafiqul Islam",
    "phone": "+8801711223344",
    "email": "rafiq@gmail.com",
    "address": "House 12, Road 3, Mirpur-10",
    "openingBalance": 500.00,
    "totalSales": 12450.00,
    "totalPaid": 11000.00,
    "totalDue": 1950.00,
    "status": true,
    "createdAt": "2026-01-15T10:00:00.000Z"
  },
  {
    "_id": "cust_8802",
    "business": "biz_6701a1b2c3d4e5f6a7b8c9d0",
    "name": "Shamima Akter",
    "phone": "+8801911556677",
    "address": "Section 11, Block C",
    "openingBalance": 0.00,
    "totalSales": 4500.00,
    "totalPaid": 4500.00,
    "totalDue": 0.00,
    "status": true,
    "createdAt": "2026-02-01T12:00:00.000Z"
  }
]
```

---

### 5.2 Customer Detail Page
- **Route:** `/customers/:id`
- **File:** [`src/pages/customer/CustomerDetailPage.tsx`](file:///d:/hisabboi/cashbook-frontend/src/pages/customer/CustomerDetailPage.tsx)

#### Data Input:
- Route param `:id`
- Action buttons:
  - `[ Collect Payment ]` -> opens `PaymentModal`
  - `[ Send SMS / WhatsApp Reminder ]`
  - `[ Edit Details ]` -> opens `CustomerModal`

#### Data Display:
- Total Due Hero Card (`৳ 1,950`) with payment action.
- Unified Transaction & Khata Ledger:
  - Sales invoices with items and amounts.
  - Payment collections with receipts and payment method.
  - Running balance timeline.

---

### 5.3 Baki (Credit & Payables Ledger) Page
- **Route:** `/baki`
- **File:** [`src/pages/baki/BakiPage.tsx`](file:///d:/hisabboi/cashbook-frontend/src/pages/baki/BakiPage.tsx)

#### Data Input:
- `tab`: `"receive"` (Customer Baki) vs. `"pay"` (Supplier Payable) via `SegmentedControl`.
- Search query filtering across ledger entities.

#### Data Display:
- **Receivables View (`receive`):**
  - KPI Hero: Total Customer Due (`৳ 14,250`)
  - List of all customers owing money, sorted from highest due to lowest.
  - 1-tap `[ Receive Payment ]` quick button on each row.
- **Payables View (`pay`):**
  - KPI Hero: Total Supplier Payable (`৳ 28,600`)
  - List of all suppliers owed money, sorted by due amount.
  - 1-tap `[ Make Payment ]` quick button on each row.
- Report export button (`printElementAsReport`).

---

## 6. Supplier CRM & Payables Module

### 6.1 Suppliers Page & Detail Page
- **Routes:** `/suppliers` and `/suppliers/:id`
- **Files:** [`SuppliersPage.tsx`](file:///d:/hisabboi/cashbook-frontend/src/pages/supplier/SuppliersPage.tsx), [`SupplierDetailPage.tsx`](file:///d:/hisabboi/cashbook-frontend/src/pages/supplier/SupplierDetailPage.tsx)

#### Data Input:
- Search filter by name or phone.
- `+ Add Supplier` action triggering `SupplierModal`.

#### Data Display:
- List of suppliers with total purchases volume, total paid, and total payable amount.
- Detail page showing procurement history, payment vouchers, and running balance.

#### Seed Data Example:
```json
{
  "_id": "supp_9901",
  "business": "biz_6701a1b2c3d4e5f6a7b8c9d0",
  "name": "Haji Enterprise Wholesaler",
  "phone": "+8801819998877",
  "address": "Shop 14, Krishi Market, Mohammadpur, Dhaka",
  "openingBalance": 10000.00,
  "totalPurchases": 145000.00,
  "totalPaid": 137000.00,
  "totalPayable": 18000.00,
  "status": true
}
```

---

## 7. Product & Inventory Management Module

### 7.1 Products Page
- **Route:** `/products`
- **File:** [`src/pages/product/ProductsPage.tsx`](file:///d:/hisabboi/cashbook-frontend/src/pages/product/ProductsPage.tsx)

#### Data Input:
- Search filter by product name, SKU, or category.
- Filter toggle: `"all"` vs. `"low_stock"`.
- Action buttons: `[ + Add Product ]`, `[ Adjust Stock ]`.

#### Data Display:
- Product list with thumbnail image, SKU badge, Category tag.
- Live Stock level: e.g. `2 can` (highlighted in red badge if `<= minStock`).
- Selling Price (`৳820.00`) and Purchase/Cost Price (`৳780.00`).
- Profit margin indicator: `Margin: ৳40 (5.1%)`.

#### Seed Data Example:
```json
// GET /products/business/biz_6701a1b2c3d4e5f6a7b8c9d0
[
  {
    "_id": "prod_001",
    "name": "Teer Soybean Oil 5L",
    "sku": "OIL-TEER-5L",
    "category": "Edible Oil",
    "purchasePrice": 780.00,
    "sellingPrice": 820.00,
    "stock": 2,
    "minStock": 5,
    "unit": "can",
    "imageUrl": "https://res.cloudinary.com/hisabboi/image/upload/v1/products/teer_5l.jpg",
    "status": true
  },
  {
    "_id": "prod_003",
    "name": "Miniket Rice 25kg Sack",
    "sku": "RICE-MIN-25KG",
    "category": "Grains & Rice",
    "purchasePrice": 1650.00,
    "sellingPrice": 1800.00,
    "stock": 18,
    "minStock": 5,
    "unit": "sack",
    "imageUrl": "https://res.cloudinary.com/hisabboi/image/upload/v1/products/miniket_25kg.jpg",
    "status": true
  },
  {
    "_id": "prod_004",
    "name": "Aarong Pure Ghee 400g",
    "sku": "GHEE-AAR-400G",
    "category": "Dairy",
    "purchasePrice": 480.00,
    "sellingPrice": 530.00,
    "stock": 12,
    "minStock": 3,
    "unit": "jar",
    "imageUrl": "https://res.cloudinary.com/hisabboi/image/upload/v1/products/aarong_ghee.jpg",
    "status": true
  }
]
```

---

## 8. Financial Accounting & Cashbook Module

### 8.1 Transactions (Cashbook) Page
- **Route:** `/transactions`
- **File:** [`src/pages/transactions/TransactionsPage.tsx`](file:///d:/hisabboi/cashbook-frontend/src/pages/transactions/TransactionsPage.tsx)

#### Data Input:
- Date range filters (`startDate`, `endDate`)
- Type filter: `all` | `income` | `expense` | `transfer`
- Search query (category or note)

#### Data Display:
- Financial summary bar: Total In (`৳ 18,450`), Total Out (`৳ 9,200`), Net Cashflow (`+৳ 9,250`).
- Interactive transaction rows with avatar, category name, timestamp, payment method tag, and amount (+green for cash in, -red for cash out).
- Row tap triggers action bottom sheet: `[ Edit ]`, `[ Delete ]`, `[ View Receipt ]`.

#### Seed Data Example:
```json
[
  {
    "_id": "txn_001",
    "business": "biz_6701a1b2c3d4e5f6a7b8c9d0",
    "type": "income",
    "amount": 1500.00,
    "date": "2026-10-05T14:15:00.000Z",
    "category": { "_id": "cat_sales", "name": "Retail Sales", "type": "income" },
    "paymentMethod": "cash",
    "source": { "type": "sale", "id": "sale_7701" },
    "customer": { "_id": "cust_8801", "name": "Rafiqul Islam" },
    "note": "Payment for invoice TGS-1048"
  },
  {
    "_id": "txn_002",
    "business": "biz_6701a1b2c3d4e5f6a7b8c9d0",
    "type": "expense",
    "amount": 650.00,
    "date": "2026-10-05T11:30:00.000Z",
    "category": { "_id": "cat_bills", "name": "Electricity Bill", "type": "expense" },
    "paymentMethod": "bkash",
    "note": "DESCO September bill payment"
  }
]
```

---

### 8.2 Expenses Page
- **Route:** `/expenses`
- **File:** [`src/pages/expense/ExpensesPage.tsx`](file:///d:/hisabboi/cashbook-frontend/src/pages/expense/ExpensesPage.tsx)

#### Data Input:
- Month / Year picker
- Category filter

#### Data Display:
- Total monthly expenses KPI card.
- Breakdown by expense category (Shop Rent, Utilities, Transport, Staff Salaries, Tea & Refreshment).
- Button to trigger `ExpenseModal`.

---

### 8.3 Profit & Loss Report Page
- **Route:** `/reports/profit-loss`
- **File:** [`src/pages/reports/ProfitLossPage.tsx`](file:///d:/hisabboi/cashbook-frontend/src/pages/reports/ProfitLossPage.tsx)

#### Data Input:
- Date Range: `startDate`, `endDate`

#### Data Display:
- **Revenue:** Gross Sales, Sales Returns, Net Sales
- **Cost of Goods Sold (COGS):** Opening Stock + Purchases - Closing Stock
- **Gross Profit:** Net Sales - COGS
- **Operating Expenses:** Rent, Bills, Salaries, Transport
- **Net Operating Profit:** Gross Profit - Operating Expenses
- Color-coded profit margin percentage card.

#### Seed Data Example:
```json
{
  "period": { "from": "2026-10-01", "to": "2026-10-05" },
  "revenue": {
    "totalSales": 128500.00,
    "discountsGiven": 2400.00,
    "netRevenue": 126100.00
  },
  "cogs": {
    "procurementCost": 98400.00
  },
  "grossProfit": 27700.00,
  "operatingExpenses": {
    "shopRent": 10000.00,
    "electricity": 2450.00,
    "transport": 1200.00,
    "refreshment": 650.00,
    "totalExpenses": 14300.00
  },
  "netProfit": 13400.00,
  "netProfitMargin": "10.62%"
}
```

---

## 9. Mess & Shared Living Module

### 9.1 Meals & Mess Summary Page
- **Routes:** `/meals` and `/mess`
- **Files:** [`MealsPage.tsx`](file:///d:/hisabboi/cashbook-frontend/src/pages/meal/MealsPage.tsx), [`MessSummaryPage.tsx`](file:///d:/hisabboi/cashbook-frontend/src/pages/mass/MessSummaryPage.tsx)
- **Role:** For mess/hostel businesses (`type === "mass"`)

#### Data Input:
- Date picker (select day of the month)
- Member meal counts (numeric stepper per member: Breakfast, Lunch, Dinner or total count e.g. 2.0, 1.5)
- Shared bazaar expenses

#### Data Display:
- Month calendar grid with individual daily meal counts.
- **Mess Financial Calculations:**
  - Total Mess Bazaar / Expenses (`৳ 34,500`)
  - Total Meals Consumed (`460 meals`)
  - Meal Rate: `৳ 34,500 / 460 = ৳ 75.00 / meal`
  - Per-member individual bill: `Member Meals * Meal Rate + Shared Utilities - Deposits = Balance Due / Refund`.

#### Seed Data Example:
```json
{
  "messSummary": {
    "month": 10,
    "year": 2026,
    "totalExpenses": 34500.00,
    "totalMeals": 460,
    "mealRate": 75.00
  },
  "members": [
    {
      "memberId": "mem_101",
      "name": "Tanvir Hasan",
      "mealsConsumed": 62,
      "mealCost": 4650.00,
      "fixedCost": 1200.00,
      "depositPaid": 6000.00,
      "balance": 150.00,
      "status": "refund"
    },
    {
      "memberId": "mem_102",
      "name": "Mehedi Zaman",
      "mealsConsumed": 55,
      "mealCost": 4125.00,
      "fixedCost": 1200.00,
      "depositPaid": 4000.00,
      "balance": -1325.00,
      "status": "due"
    }
  ]
}
```

---

## 10. Business Settings & Team Members

### 10.1 Members Page
- **Route:** `/members`
- **File:** [`src/pages/business-member/MembersPage.tsx`](file:///d:/hisabboi/cashbook-frontend/src/pages/business-member/MembersPage.tsx)

#### Data Input:
- Invite user email
- Assign role: `"admin" | "member" | "viewer"`

#### Data Display:
- List of current members with avatar, email, role badge, joined date, and remove action.

---

### 10.2 Business Settings Page
- **Route:** `/business/settings`
- **File:** [`src/pages/settings/BusinessSettingsPage.tsx`](file:///d:/hisabboi/cashbook-frontend/src/pages/settings/BusinessSettingsPage.tsx)

#### Data Input:
- `name`: string
- `phone`: string
- `address`: string
- `logoUrl`: image upload
- `paymentMethods`: array of active payment methods (`cash`, `bkash`, `nagad`, `bank`)
- `invoiceSettings`: prefix e.g. `"TGS"`, next number e.g. `1048`

---

## 11. Interactive Modals & Drawers

### 11.1 CustomerModal
- **File:** [`src/components/shared/CustomerModal.tsx`](file:///d:/hisabboi/cashbook-frontend/src/components/shared/CustomerModal.tsx)
- **Trigger:** "+ Add Customer" or "Edit Customer" buttons.

#### Input Data:
```json
{
  "name": "Rafiqul Islam",
  "phone": "+8801711223344",
  "email": "rafiq@gmail.com",
  "address": "House 12, Road 3, Mirpur-10, Dhaka",
  "openingBalance": 500.00,
  "notes": "Regular customer, pays weekly"
}
```
#### Output / Effects:
- Calls `POST /customers` (or `PUT /customers/:id`).
- Immediately adds the customer to customer list or autoselects in `NewSalePage`.

---

### 11.2 SupplierModal
- **File:** [`src/components/shared/SupplierModal.tsx`](file:///d:/hisabboi/cashbook-frontend/src/components/shared/SupplierModal.tsx)
- **Trigger:** "+ Add Supplier" in `/suppliers` or from inside `NewPurchasePage`.

#### Input Data:
```json
{
  "name": "Haji Enterprise Wholesaler",
  "phone": "+8801819998877",
  "email": "hajienterprise@gmail.com",
  "address": "Shop 14, Krishi Market, Mohammadpur, Dhaka",
  "openingBalance": 10000.00,
  "notes": "Supplies edible oils and bulk grains"
}
```
#### Output / Effects:
- Calls `POST /suppliers`.
- Autoselects the supplier inside `NewPurchasePage` without refreshing or losing entered line items.

---

### 11.3 ProductModal
- **File:** [`src/components/shared/ProductModal.tsx`](file:///d:/hisabboi/cashbook-frontend/src/components/shared/ProductModal.tsx)
- **Trigger:** "+ Add Product" in `/products`, `/sales/new`, or `/purchases/new`.

#### Input Data:
```json
{
  "name": "Pran Mustard Oil 1L",
  "sku": "OIL-PRAN-1L",
  "category": "Edible Oil",
  "purchasePrice": 280.00,
  "sellingPrice": 310.00,
  "stock": 24,
  "minStock": 5,
  "unit": "bottle",
  "imageUrl": "https://res.cloudinary.com/hisabboi/image/upload/v1/products/pran_mustard.jpg"
}
```
#### Output / Effects:
- Calls `POST /products`.
- Inserts new item into inventory and updates product selectors immediately.

---

### 11.4 PaymentModal
- **File:** [`src/components/shared/PaymentModal.tsx`](file:///d:/hisabboi/cashbook-frontend/src/components/shared/PaymentModal.tsx)
- **Trigger:** "Collect Payment" from Customer or "Pay Supplier".

#### Input Data:
```json
{
  "customerId": "cust_8801",
  "amount": 1000.00,
  "paymentMethod": "bkash",
  "date": "2026-10-05T16:00:00.000Z",
  "note": "bKash TrxID: 9J283KA891"
}
```
#### Output / Effects:
- Deducts `৳1,000` from customer's due balance (`totalDue` drops from `৳1,950` to `৳950`).
- Automatically creates an `income` transaction in the cashbook.

---

### 11.5 ExpenseModal
- **File:** [`src/components/shared/ExpenseModal.tsx`](file:///d:/hisabboi/cashbook-frontend/src/components/shared/ExpenseModal.tsx)
- **Trigger:** Floating "+ Expense" button on Dashboard or Expenses Page.

#### Input Data:
```json
{
  "categoryId": "cat_tea_snacks",
  "amount": 180.00,
  "paymentMethod": "cash",
  "date": "2026-10-05T17:30:00.000Z",
  "note": "Evening tea and biscuits for staff",
  "attachmentUrl": ""
}
```
#### Output / Effects:
- Decreases cash balance by `৳180.00`.
- Adds expense record and registers cashbook entry.

---

### 11.6 StockAdjustModal
- **File:** [`src/components/shared/StockAdjustModal.tsx`](file:///d:/hisabboi/cashbook-frontend/src/components/shared/StockAdjustModal.tsx)
- **Trigger:** "Adjust Stock" on product detail or list item.

#### Input Data:
```json
{
  "productId": "prod_001",
  "type": "decrease",
  "quantity": 1,
  "reason": "Damaged container leaked in storage"
}
```
#### Output / Effects:
- Adjusts inventory quantity (`stock` decreases from 2 to 1).
- Creates an auditable stock adjustment log.

---

### 11.7 BusinessSwitcher Drawer
- **File:** [`src/components/shared/BusinessSwitcher.tsx`](file:///d:/hisabboi/cashbook-frontend/src/components/shared/BusinessSwitcher.tsx)
- **Trigger:** Tapping active business name on the top app bar.

#### Data Display & Actions:
- Lists all businesses associated with the user's account.
- Displays business type badge (`Retail`, `Wholesale`, `Mess`, `Personal`).
- Tapping switches `activeBusiness` across the application with immediate store rehydration.
- Includes `+ Add New Business` button leading to `/business/new`.

---

## Summary Mapping Table

| URL Route | Screen / Component | Primary Input Data | Primary Output / Display Data |
|---|---|---|---|
| `/login` | `LoginPage` | Email, Password | JWT, User profile, User businesses |
| `/dashboard` | `DashboardPage` | Date range filter | Cash balance, Sales/Purchases stats, Dues, Low stock alerts |
| `/sales/new` | `NewSalePage` | Customer, Product rows, Qty, Price, Discount, Paid | Line totals, Subtotal, Net total, Live due, Receipt |
| `/sales` | `SalesPage` | Search query, Page | Invoices list with status badges (`paid`, `partial`, `due`) |
| `/sales/:id` | `SaleDetailPage` | Sale ID | Full itemized bill, customer info, payments |
| `/sales/:id/invoice` | `SaleInvoicePage` | Sale ID | Thermal / A4 printable receipt layout |
| `/purchases/new` | `NewPurchasePage` | Supplier, Items, Cost prices, Date, Paid | Purchase order, Stock increase, Supplier payable balance |
| `/purchases` | `PurchasesPage` | Search query | Procurement list with reference numbers |
| `/customers` | `CustomersPage` | Search query | Customer directory with total due badges |
| `/customers/:id` | `CustomerDetailPage` | Customer ID | Khata ledger, transaction history, payment collection CTA |
| `/baki` | `BakiPage` | Tab (`receive` / `pay`) | Total receivable/payable KPIs, sorted debtor/creditor list |
| `/suppliers` | `SuppliersPage` | Search query | Supplier directory with payable amounts |
| `/products` | `ProductsPage` | Search query, Low-stock toggle | Catalogue with prices, stock levels, min-stock warning |
| `/transactions` | `TransactionsPage` | Date range, Type filter | Cash In/Out ledger, net cashflow KPI, transaction rows |
| `/expenses` | `ExpensesPage` | Month filter | Category breakdown, expense vouchers |
| `/reports/profit-loss` | `ProfitLossPage` | Date range | Revenue, COGS, Gross profit, Expenses, Net profit |
| `/meals` | `MealsPage` | Date, Member counts | Daily meal grid, individual counts |
| `/mess` | `MessSummaryPage` | Month, Year | Total bazaar, meal rate calculation, member dues/refunds |
| `/members` | `MembersPage` | Email, Role | Team members list with role permissions |
| `/business/settings` | `BusinessSettingsPage` | Name, Phone, Address, Logo, Methods | Business profile and invoice prefix settings |
