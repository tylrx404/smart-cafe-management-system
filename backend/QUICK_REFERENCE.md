# CafeOS Backend - Quick Reference Card

## 🚀 Quick Start (60 seconds)

```bash
cd backend
npm install
npm start
```

Server runs at: `http://localhost:5000` ✅

---

## 📍 Base API URL

```javascript
const API = 'http://localhost:5000/api';
```

---

## 📊 Database

- **Location:** `backend/db/cafeos.db`
- **Type:** SQLite3
- **Auto-creates:** Yes, on first run
- **Sample data:** Yes, seeded on first run

---

## 🔑 API Quick Reference

### Tables
```javascript
GET    /api/tables                    // All tables
GET    /api/tables/:id                // Specific table
PUT    /api/tables/:id/status         // Update status
GET    /api/tables/:id/orders         // Orders for table
```

### Orders
```javascript
POST   /api/orders                    // Create order
GET    /api/orders                    // All orders
GET    /api/orders?status=pending     // Filter by status
GET    /api/orders/:id                // Specific order
PUT    /api/orders/:id/status         // Update status
DELETE /api/orders/:id                // Delete order
```

### Payments
```javascript
POST   /api/payments                  // Record payment
GET    /api/payments                  // All payments
GET    /api/payments?order_id=1       // Filter by order
GET    /api/payments/:id              // Specific payment
```

### Dashboard
```javascript
GET    /api/dashboard/summary         // Stats & summary
```

---

## 📝 Request/Response Examples

### Create Order
**Request:**
```json
POST /api/orders
{
  "table_id": 1,
  "items": [
    {"name": "Biryani", "price": 300, "quantity": 2},
    {"name": "Coke", "price": 50, "quantity": 1}
  ],
  "total_amount": 650
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "order_id": 5
}
```

### Update Table Status
**Request:**
```json
PUT /api/tables/1/status
{
  "status": "occupied"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Table status updated to occupied",
  "table": {"id": 1, "status": "occupied"}
}
```

### Record Payment
**Request:**
```json
POST /api/payments
{
  "order_id": 5,
  "amount": 650,
  "payment_method": "card",
  "payment_status": "completed"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment recorded successfully",
  "payment_id": 3
}
```

---

## 🔄 Order Status Flow

```
pending → preparing → completed
  ↓
(Kitchen workflow)
```

Table status automatically updates:
```
empty → occupied (when order created)
        ↓
      ready (when order completed)
        ↓
      empty (when payment recorded)
```

---

## 💻 React Integration Example

```javascript
// Create order
const createOrder = async (tableId, items) => {
  const total = items.reduce((sum, item) => 
    sum + item.price * item.quantity, 0);
  
  const res = await fetch('http://localhost:5000/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      table_id: tableId,
      items,
      total_amount: total
    })
  });
  return await res.json();
};

// Get all tables
const getTables = async () => {
  const res = await fetch('http://localhost:5000/api/tables');
  return await res.json();
};

// Update order status
const updateOrderStatus = async (orderId, status) => {
  const res = await fetch(
    `http://localhost:5000/api/orders/${orderId}/status`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    }
  );
  return await res.json();
};

// Record payment
const recordPayment = async (orderId, amount, method) => {
  const res = await fetch('http://localhost:5000/api/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      order_id: orderId,
      amount,
      payment_method: method,
      payment_status: 'completed'
    })
  });
  return await res.json();
};
```

---

## 📋 Table Status Values

| Status | Usage |
|--------|-------|
| `empty` | Table available |
| `reserved` | Table reserved but empty |
| `occupied` | Table has active order |
| `ready` | Order ready, waiting payment |

---

## 📋 Order Status Values

| Status | Usage |
|--------|-------|
| `pending` | Order received, waiting kitchen |
| `preparing` | Kitchen preparing |
| `completed` | Order ready/served |

---

## 📋 Payment Status Values

| Status | Usage |
|--------|-------|
| `pending` | Payment initiated |
| `completed` | Payment successful |
| `failed` | Payment failed |

---

## ⚙️ Configuration

**Change port:**
```bash
PORT=3001 npm start
```

**Stop server:**
```
Ctrl + C
```

**Enable debug:**
Add logs in `server.js` like:
```javascript
console.log('Creating order:', { table_id, items, total_amount });
```

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Port 5000 in use | `PORT=3001 npm start` |
| Database locked | Delete `.db-shm` and `.db-wal` files |
| Module errors | Run `npm install` |
| CORS errors | Check BASE_URL in React code |

---

## 📁 File Structure

```
backend/
├── server.js                    ← Main API server
├── db/database.js              ← Database setup
├── package.json                ← Dependencies
├── API_EXAMPLES.js             ← Copy-paste examples
├── README.md                   ← Full docs
├── TESTING_CURL_COMMANDS.sh   ← cURL tests
└── db/cafeos.db               ← SQLite database (auto-created)
```

---

## 🧪 Testing with Postman

1. Create new POST request to `http://localhost:5000/api/orders`
2. Set header: `Content-Type: application/json`
3. Paste body:
```json
{
  "table_id": 1,
  "items": [{"name": "Tea", "price": 50, "quantity": 1}],
  "total_amount": 50
}
```
4. Click Send

---

## 🧪 Testing with cURL

```bash
# Create order
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"table_id":1,"items":[{"name":"Tea","price":50,"quantity":1}],"total_amount":50}'

# Get all orders
curl http://localhost:5000/api/orders

# Update status
curl -X PUT http://localhost:5000/api/orders/1/status \
  -H "Content-Type: application/json" \
  -d '{"status":"preparing"}'
```

---

## 🎯 Use in Your Views

### Customer.tsx
```typescript
const orders = await fetch('http://localhost:5000/api/orders').then(r => r.json());
```

### Admin.tsx
```typescript
const summary = await fetch('http://localhost:5000/api/dashboard/summary').then(r => r.json());
```

### Kitchen.tsx
```typescript
const pending = await fetch('http://localhost:5000/api/orders?status=pending').then(r => r.json());
```

---

## ✅ Checklist

- [ ] Installed dependencies (`npm install`)
- [ ] Started server (`npm start`)
- [ ] Server running on port 5000
- [ ] Database created at `db/cafeos.db`
- [ ] Sample tables in database
- [ ] Can call `/health` endpoint
- [ ] Can fetch `/api/tables`
- [ ] Connected from React frontend

---

## 📚 Full Documentation

See `README.md` for complete API documentation and examples.

---

**Status:** ✅ Ready for Production  
**Last Updated:** 2025-01-24  
**Version:** 1.0.0
