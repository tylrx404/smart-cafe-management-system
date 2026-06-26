#!/bin/bash

# CafeOS Backend - cURL Testing Commands
# Copy & paste these commands to test the API

BASE_URL="http://localhost:5000"

echo "🧪 CafeOS API Testing Commands"
echo "=============================="
echo ""
echo "Make sure server is running: npm start"
echo ""

# ============================================================================
# HEALTH CHECK
# ============================================================================
echo "1️⃣  Health Check"
echo "curl $BASE_URL/health"
echo ""

# ============================================================================
# TABLES
# ============================================================================
echo "2️⃣  Get All Tables"
echo "curl $BASE_URL/api/tables"
echo ""

echo "3️⃣  Get Table by ID"
echo "curl $BASE_URL/api/tables/1"
echo ""

echo "4️⃣  Update Table Status"
echo "curl -X PUT $BASE_URL/api/tables/1/status \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"status\": \"occupied\"}'"
echo ""

echo "5️⃣  Get Orders for Table"
echo "curl $BASE_URL/api/tables/1/orders"
echo ""

# ============================================================================
# ORDERS
# ============================================================================
echo "6️⃣  Create New Order"
echo "curl -X POST $BASE_URL/api/orders \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{"
echo "    \"table_id\": 1,"
echo "    \"items\": ["
echo "      {\"name\": \"Biryani\", \"price\": 300, \"quantity\": 1},"
echo "      {\"name\": \"Coke\", \"price\": 50, \"quantity\": 2}"
echo "    ],"
echo "    \"total_amount\": 400"
echo "  }'"
echo ""

echo "7️⃣  Get All Orders"
echo "curl $BASE_URL/api/orders"
echo ""

echo "8️⃣  Get Orders with Status Filter"
echo "curl '$BASE_URL/api/orders?status=pending'"
echo ""

echo "9️⃣  Get Specific Order"
echo "curl $BASE_URL/api/orders/1"
echo ""

echo "🔟 Update Order Status"
echo "curl -X PUT $BASE_URL/api/orders/1/status \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"status\": \"preparing\"}'"
echo ""

echo "1️⃣1️⃣ Delete Order"
echo "curl -X DELETE $BASE_URL/api/orders/1"
echo ""

# ============================================================================
# PAYMENTS
# ============================================================================
echo "1️⃣2️⃣ Record Payment"
echo "curl -X POST $BASE_URL/api/payments \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{"
echo "    \"order_id\": 1,"
echo "    \"amount\": 400,"
echo "    \"payment_method\": \"card\","
echo "    \"payment_status\": \"completed\""
echo "  }'"
echo ""

echo "1️⃣3️⃣ Get All Payments"
echo "curl $BASE_URL/api/payments"
echo ""

echo "1️⃣4️⃣ Get Payments by Order"
echo "curl '$BASE_URL/api/payments?order_id=1'"
echo ""

echo "1️⃣5️⃣ Get Specific Payment"
echo "curl $BASE_URL/api/payments/1"
echo ""

# ============================================================================
# DASHBOARD
# ============================================================================
echo "1️⃣6️⃣ Get Dashboard Summary"
echo "curl $BASE_URL/api/dashboard/summary"
echo ""

# ============================================================================
# WORKFLOW EXAMPLE
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 COMPLETE ORDER WORKFLOW (Copy & Execute in Order)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "# Step 1: Get table info"
echo "curl $BASE_URL/api/tables/1"
echo ""

echo "# Step 2: Create order for table 1"
echo "curl -X POST $BASE_URL/api/orders \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{"
echo "    \"table_id\": 1,"
echo "    \"items\": ["
echo "      {\"name\": \"Butter Chicken\", \"price\": 350, \"quantity\": 1},"
echo "      {\"name\": \"Naan\", \"price\": 60, \"quantity\": 3},"
echo "      {\"name\": \"Lassi\", \"price\": 80, \"quantity\": 2}"
echo "    ],"
echo "    \"total_amount\": 710"
echo "  }'"
echo ""

echo "# Step 3: Kitchen sees pending order"
echo "curl '$BASE_URL/api/orders?status=pending'"
echo ""

echo "# Step 4: Kitchen updates order to 'preparing'"
echo "curl -X PUT $BASE_URL/api/orders/1/status \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"status\": \"preparing\"}'"
echo ""

echo "# Step 5: Kitchen marks order as 'completed'"
echo "curl -X PUT $BASE_URL/api/orders/1/status \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"status\": \"completed\"}'"
echo ""

echo "# Step 6: Customer pays for order (using order_id=1)"
echo "curl -X POST $BASE_URL/api/payments \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{"
echo "    \"order_id\": 1,"
echo "    \"amount\": 710,"
echo "    \"payment_method\": \"card\","
echo "    \"payment_status\": \"completed\""
echo "  }'"
echo ""

echo "# Step 7: Check table status (should be empty again)"
echo "curl $BASE_URL/api/tables/1"
echo ""

echo "# Step 8: View dashboard summary"
echo "curl $BASE_URL/api/dashboard/summary"
echo ""

echo "✅ Complete workflow executed!"
echo ""
