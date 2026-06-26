# ADANI Cafe - Database Security Upgrade (Phase 5)

**Status:** ✅ PHASE 5 - IN PROGRESS (Backend Authentication Routes Complete)
**Last Updated:** Current Session
**Progress:** 50% Complete (Database layer done, authentication routes done, frontend partially done)

---

## 📋 Overview

The ADANI Cafe POS system is being upgraded from a prototype JSON-file-based architecture to an enterprise-grade system with:
- **SQLite3 Database** - Relational data storage with foreign key constraints
- **Email-based Customer Login** - Secure customer authentication
- **Password Hashing** - bcryptjs password encryption (never stored in plain text)
- **PIN-based Admin/Kitchen Login** - 4-digit PIN for staff
- **JWT Token Authentication** - Stateless authentication across API endpoints
- **Order-User Linking** - All orders permanently associated with customer IDs
- **Multi-Customer Isolation** - Each customer sees only their own orders

---

## 🗄️ Database Architecture

### SQLite3 Schema (backend/db/adani_cafe.db)

```sql
-- Users Table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE,                          -- Customer email (UNIQUE constraint)
  password_hash TEXT,                          -- bcrypt hash of customer password
  pin_hash TEXT,                               -- bcrypt hash of admin/kitchen PIN
  role TEXT NOT NULL CHECK(role IN ('customer', 'admin', 'kitchen')),
  name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Orders Table (linked to users)
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,                   -- FOREIGN KEY to users.id
  table_id INTEGER,
  items TEXT NOT NULL,                        -- JSON array of ordered items
  total_amount REAL NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'preparing', 'ready', 'completed')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tables Table
CREATE TABLE tables (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_number INTEGER UNIQUE,
  status TEXT DEFAULT 'empty' CHECK(status IN ('empty', 'occupied', 'reserved')),
  current_order_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (current_order_id) REFERENCES orders(id) ON DELETE SET NULL
);

-- Payments Table
CREATE TABLE payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  method TEXT,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Sessions Table (optional - for advanced token management)
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT UNIQUE,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Key Features
- **FOREIGN KEY constraints** ensure data integrity
- **ON DELETE CASCADE** - Orders deleted if user is deleted
- **UNIQUE email** - No duplicate customer registrations
- **JSON items storage** - Order items stored as JSON string (parsed on retrieval)
- **Role-based access** - customer, admin, kitchen

---

## 🔐 Security Implementation

### Password Hashing (bcryptjs)
```javascript
// During Signup - BACKEND ONLY
const passwordHash = await bcrypt.hash(password, 10);  // 10 salt rounds
db.query('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)', 
  [email, passwordHash, 'customer']);

// During Login - BACKEND ONLY  
const user = db.query('SELECT * FROM users WHERE email = ?', [email]);
const isValid = await bcrypt.compare(providedPassword, user.password_hash);
```

### Authentication Flow (JWT)
```
CLIENT                          SERVER
  |                                |
  |-- POST /api/auth/customer/signup
  |    { email, password }         |
  |                                |
  |                          [Hash password with bcrypt]
  |                          [Save to database]
  |                          [Generate JWT token]
  |                          [Return token + user info]
  |<-- 201 { token, user }         |
  |                                |
  |-- Store token in localStorage  |
  |-- NEVER store password!        |
  |                                |
  |-- GET /api/orders              |
  |    Header: Authorization: Bearer <token>
  |                                |
  |                          [Verify JWT]
  |                          [Extract userId]
  |                          [Return user's orders]
  |<-- 200 { orders: [...] }       |
```

### Key Security Rules
1. **Passwords NEVER in Frontend**
   - Never visible in localStorage
   - Never visible in browser Inspector → Application tab
   - Never sent back from server

2. **ONLY JWT Token Stored**
   ```javascript
   localStorage.setItem('jwt_token', response.token);
   // WRONG: localStorage.setItem('password', response.password);
   // WRONG: localStorage.setItem('user_password', password);
   ```

3. **All Validation on Backend**
   - Email format validation
   - Password strength requirements
   - Duplicate email checking
   - PIN verification

4. **Password Comparison**
   ```javascript
   // CORRECT - Use bcrypt.compare()
   const isValid = await bcrypt.compare(plainPassword, storedHash);
   
   // WRONG - Never compare plain strings
   // if (plainPassword === storedPassword) { ... }
   ```

---

## 📡 API Endpoints (Phase 5)

### Customer Authentication

#### 1. **Customer Signup**
```
POST /api/auth/customer/signup
Content-Type: application/json

REQUEST BODY:
{
  "email": "john@adani.cafe",
  "password": "secure123",
  "name": "John Doe"          // Optional, derived from email prefix if not provided
}

RESPONSE (201):
{
  "success": true,
  "message": "Signup successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "john@adani.cafe",
    "name": "John Doe",
    "role": "customer"
  }
}

ERROR RESPONSES:
400: { error: "Email and password are required" }
409: { error: "Email already registered" }
400: { error: "Password must be at least 6 characters" }
```

#### 2. **Customer Login**
```
POST /api/auth/customer/login
Content-Type: application/json

REQUEST BODY:
{
  "email": "john@adani.cafe",
  "password": "secure123"
}

RESPONSE (200):
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "john@adani.cafe",
    "name": "John Doe",
    "role": "customer"
  }
}

ERROR RESPONSES:
401: { error: "Invalid email or password" }
500: { error: "Login failed" }
```

### Admin/Kitchen Authentication

#### 3. **Admin Login (PIN)**
```
POST /api/auth/admin/login
Content-Type: application/json

REQUEST BODY:
{
  "pin": "1234",
  "role": "admin"    // or "kitchen"
}

RESPONSE (200):
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "email": "admin@adani.cafe",
    "name": "Admin",
    "role": "admin"
  }
}

NOTES:
- Default PIN: "1234"
- PIN stored as bcrypt hash
- Create separate accounts for admin and kitchen staff
```

#### 4. **Token Verification**
```
POST /api/auth/verify
Content-Type: application/json
Authorization: Bearer <jwt_token>

RESPONSE (200):
{
  "success": true,
  "user": {
    "id": 1,
    "email": "john@adani.cafe",
    "name": "John Doe",
    "role": "customer"
  }
}

ERROR RESPONSES:
401: { error: "Token expired" }
401: { error: "Invalid token" }
```

---

## 🛠️ Implementation Files

### Backend Changes

#### 1. **backend/db/sqlite.js** (NEW - 412 lines)
- Complete SQLite database abstraction layer
- Functions: `initializeDatabase()`, `getUserByEmail()`, `createUser()`, `createOrder()`, `getOrdersByUserId()`, etc.
- Status: ✅ COMPLETE

#### 2. **backend/routes/auth-secure.js** (NEW - 285 lines)
- New authentication routes using SQLite
- Endpoints: `/api/auth/customer/signup`, `/api/auth/customer/login`, `/api/auth/admin/login`, `/api/auth/verify`
- Password hashing with bcryptjs
- JWT token generation
- Status: ✅ COMPLETE

#### 3. **backend/server.js** (UPDATED)
- Initialize SQLite database
- Register new auth routes alongside old ones
- Status: ✅ UPDATED

### Frontend Changes

#### 4. **views/Auth.tsx** (UPDATED)
- Customer form: Changed from "Name" field to "Email" field
- Added email validation regex
- Updated signup/login to use `/api/auth/customer/signup` and `/api/auth/customer/login`
- JWT token stored in localStorage (NOT password)
- Status: ✅ UPDATED (forms and handlers done)

#### 5. **types.ts** (UPDATED)
- User interface now includes optional `email` field
- Status: ✅ UPDATED

#### 6. **store/CafeContext.tsx** (VERIFIED)
- Already handles JWT token properly
- Stores token in localStorage
- Status: ✅ NO CHANGES NEEDED

---

## 🔄 User Workflow Examples

### Scenario 1: Customer Signup and Order
```
1. User selects "Customer" role
2. Frontend shows email + password form (NOT name field)
3. User enters: email=john@adani.cafe, password=secure123
4. Frontend calls: POST /api/auth/customer/signup
5. Backend:
   - Validates email format
   - Checks if email exists (UNIQUE constraint)
   - Hashes password with bcrypt
   - Creates user in database with id=1
   - Generates JWT token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   - Returns token + user info
6. Frontend stores JWT in localStorage['jwt_token']
7. User navigates to /customer dashboard
8. When placing order, backend automatically links to user_id=1
9. Other customers cannot see this order (filtered by user_id)
```

### Scenario 2: Admin Views All Orders
```
1. User selects "Admin" role
2. Frontend shows 4-digit PIN input
3. User enters: PIN=1234
4. Frontend calls: POST /api/auth/admin/login
5. Backend:
   - Finds admin account with email=admin@adani.cafe
   - Verifies PIN with bcrypt.compare('1234', pin_hash)
   - Generates JWT with role='admin'
   - Returns token
6. Frontend stores JWT in localStorage
7. Admin navigates to /admin dashboard
8. Admin can see ALL orders (not filtered by user_id)
9. Admin can see customer names, emails, order history
```

### Scenario 3: Multi-Customer Isolation
```
Customer 1: john@adani.cafe signs up → user_id = 1
  - Places order at table 5 → orders.user_id = 1
  
Customer 2: sarah@adani.cafe signs up → user_id = 2
  - Places order at table 7 → orders.user_id = 2

Scenario A: Customer 1 views their orders
  - Query: SELECT * FROM orders WHERE user_id = 1
  - Result: Only order at table 5 (placed by customer 1)

Scenario B: Customer 2 views their orders
  - Query: SELECT * FROM orders WHERE user_id = 2
  - Result: Only order at table 7 (placed by customer 2)

Scenario C: Admin views all orders
  - Query: SELECT * FROM orders
  - Result: Both orders from all customers
```

---

## 📦 Dependencies

### Already Installed
- `bcryptjs@2.4.3` - Password hashing
- `jsonwebtoken@8.5.1` - JWT token generation

### Just Installed
- `better-sqlite3@9.x` - Synchronous SQLite wrapper for Node.js
- `sqlite3@5.x` - SQLite3 driver

### Installation Command
```bash
cd backend
npm install sqlite3 better-sqlite3
```

---

## 🚀 How to Test

### Test 1: Customer Signup
```bash
curl -X POST http://localhost:5173/api/auth/customer/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@adani.cafe",
    "password": "password123",
    "name": "Test User"
  }'
```

### Test 2: Customer Login
```bash
curl -X POST http://localhost:5173/api/auth/customer/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@adani.cafe",
    "password": "password123"
  }'
```

### Test 3: Admin Login with PIN
```bash
curl -X POST http://localhost:5173/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "pin": "1234",
    "role": "admin"
  }'
```

### Test 4: Verify JWT Token
```bash
curl -X POST http://localhost:5173/api/auth/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_jwt_token_here>"
```

---

## ⚠️ Important Security Notes

### NEVER DO THIS ❌
```javascript
// WRONG: Store password in localStorage
localStorage.setItem('password', userPassword);

// WRONG: Send password in responses
res.json({ password: user.password, token: jwt });

// WRONG: Store password hash in frontend
localStorage.setItem('passwordHash', hash);

// WRONG: Compare passwords as plain strings
if (inputPassword === storedPassword) { ... }

// WRONG: Put sensitive data in JWT
jwt.sign({ email, password, passwordHash }, secret);
```

### ALWAYS DO THIS ✅
```javascript
// RIGHT: Store only JWT token
localStorage.setItem('jwt_token', response.token);

// RIGHT: Use bcrypt for password comparison
const isValid = await bcrypt.compare(input, stored);

// RIGHT: Never return password or hash
res.json({ token, user: { id, email, name } });

// RIGHT: Hash passwords on backend
const hash = await bcrypt.hash(password, 10);

// RIGHT: Use JWT for authentication
res.header('Authorization', `Bearer ${token}`);
```

---

## 🔧 Configuration

### JWT Secret
- Current: `'adani_cafe_secret_2024'` (hardcoded)
- Production: Use `process.env.JWT_SECRET`

### JWT Expiry
- Current: `'24h'` (24 hours)
- Configurable in `backend/routes/auth-secure.js`

### Default Credentials
- Admin Email: `admin@adani.cafe`
- Admin PIN: `1234`
- Kitchen Email: `kitchen@adani.cafe`
- Kitchen PIN: `1234`

---

## 📊 Progress Tracking

### Phase 5 Milestones

- [x] **Database Layer (COMPLETE)**
  - [x] Install sqlite3 and better-sqlite3
  - [x] Create SQLite database schema (5 tables)
  - [x] Implement sqlite.js module (412 lines)
  - [x] Test database initialization

- [x] **Backend Authentication (COMPLETE)**
  - [x] Create auth-secure.js routes
  - [x] Implement customer signup with bcrypt
  - [x] Implement customer login with JWT
  - [x] Implement admin/kitchen PIN login
  - [x] Add JWT verification endpoint
  - [x] Register routes in server.js
  - [x] Test all endpoints with curl

- [x] **Frontend Forms (PARTIAL)**
  - [x] Update Auth.tsx email field (replace name)
  - [x] Update signup handler for email
  - [x] Update login handler for email
  - [x] Add email validation regex
  - [x] Update type definitions (User interface)
  - [ ] Test customer signup flow in browser
  - [ ] Test customer login flow in browser

- [ ] **Order Management (PENDING)**
  - [ ] Update order creation endpoints to include user_id
  - [ ] Update order retrieval to filter by user_id
  - [ ] Add authentication middleware to order routes
  - [ ] Link orders to customers in database

- [ ] **Testing & Validation (PENDING)**
  - [ ] End-to-end customer signup → login → order flow
  - [ ] Multi-customer scenario (orders isolation)
  - [ ] Admin viewing all orders
  - [ ] JWT token expiry handling
  - [ ] Error handling for invalid credentials

---

## 📝 Next Steps (For Continuation)

1. **Test Customer Signup** - Run the app and test signup flow in browser
2. **Test Customer Login** - Verify login with email and password
3. **Update Order Routes** - Link orders to user_id, add auth middleware
4. **Test Multi-Customer Isolation** - Create two customer accounts, verify order isolation
5. **Admin Dashboard** - Update admin views to display customer info with orders
6. **Kitchen Display** - Update kitchen view to show orders with customer details
7. **Error Handling** - Proper error messages for duplicate emails, invalid credentials
8. **Production Security** - Move JWT_SECRET to environment variables

---

## 📚 References

### SQLite Documentation
- [better-sqlite3 GitHub](https://github.com/WiseLibs/better-sqlite3)
- [Foreign Key Constraints](https://www.sqlite.org/foreignkeys.html)

### Security Best Practices
- [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [bcryptjs Documentation](https://github.com/dcodeIO/bcrypt.js)

---

**Created:** Current Session | **Status:** ✅ Phase 5 - 50% Complete | **Next Review:** After testing signup/login
