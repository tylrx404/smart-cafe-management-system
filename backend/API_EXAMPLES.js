// CafeOS API Examples - Copy & Paste Ready

// ============================================================================
// BASE URL
// ============================================================================
const BASE_URL = 'http://localhost:5000';

// ============================================================================
// ORDERS API
// ============================================================================

// 1. Create a new order
async function createOrder() {
  const response = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      table_id: 1,
      items: [
        { name: 'Biryani', price: 300, quantity: 2 },
        { name: 'Coca Cola', price: 50, quantity: 2 },
        { name: 'Gulab Jamun', price: 80, quantity: 1 }
      ],
      total_amount: 730
    })
  });
  const data = await response.json();
  console.log('Order created:', data);
  return data;
}

// 2. Fetch all orders
async function getAllOrders() {
  const response = await fetch(`${BASE_URL}/api/orders`);
  const data = await response.json();
  console.log('All orders:', data);
  return data;
}

// 3. Fetch orders by status (pending, preparing, completed)
async function getOrdersByStatus(status) {
  const response = await fetch(`${BASE_URL}/api/orders?status=${status}`);
  const data = await response.json();
  console.log(`Orders with status ${status}:`, data);
  return data;
}

// 4. Get specific order by ID
async function getOrderById(orderId) {
  const response = await fetch(`${BASE_URL}/api/orders/${orderId}`);
  const data = await response.json();
  console.log('Order details:', data);
  return data;
}

// 5. Update order status (for kitchen)
async function updateOrderStatus(orderId, status) {
  const response = await fetch(`${BASE_URL}/api/orders/${orderId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }) // 'pending' | 'preparing' | 'completed'
  });
  const data = await response.json();
  console.log('Order status updated:', data);
  return data;
}

// 6. Delete an order
async function deleteOrder(orderId) {
  const response = await fetch(`${BASE_URL}/api/orders/${orderId}`, {
    method: 'DELETE'
  });
  const data = await response.json();
  console.log('Order deleted:', data);
  return data;
}

// ============================================================================
// TABLES API
// ============================================================================

// 1. Fetch all tables
async function getAllTables() {
  const response = await fetch(`${BASE_URL}/api/tables`);
  const data = await response.json();
  console.log('All tables:', data);
  return data;
}

// 2. Get specific table by ID
async function getTableById(tableId) {
  const response = await fetch(`${BASE_URL}/api/tables/${tableId}`);
  const data = await response.json();
  console.log('Table details:', data);
  return data;
}

// 3. Update table status
async function updateTableStatus(tableId, status) {
  const response = await fetch(`${BASE_URL}/api/tables/${tableId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }) // 'empty' | 'reserved' | 'occupied' | 'ready'
  });
  const data = await response.json();
  console.log('Table status updated:', data);
  return data;
}

// 4. Get all orders for a specific table
async function getTableOrders(tableId) {
  const response = await fetch(`${BASE_URL}/api/tables/${tableId}/orders`);
  const data = await response.json();
  console.log(`Orders for table ${tableId}:`, data);
  return data;
}

// ============================================================================
// PAYMENTS API
// ============================================================================

// 1. Record a payment
async function recordPayment(orderId, amount, paymentMethod) {
  const response = await fetch(`${BASE_URL}/api/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      order_id: orderId,
      amount: amount,
      payment_method: paymentMethod, // 'card' | 'cash' | 'upi' | etc
      payment_status: 'completed'
    })
  });
  const data = await response.json();
  console.log('Payment recorded:', data);
  return data;
}

// 2. Fetch all payments
async function getAllPayments() {
  const response = await fetch(`${BASE_URL}/api/payments`);
  const data = await response.json();
  console.log('All payments:', data);
  return data;
}

// 3. Get payments for a specific order
async function getPaymentsByOrderId(orderId) {
  const response = await fetch(`${BASE_URL}/api/payments?order_id=${orderId}`);
  const data = await response.json();
  console.log(`Payments for order ${orderId}:`, data);
  return data;
}

// 4. Get specific payment by ID
async function getPaymentById(paymentId) {
  const response = await fetch(`${BASE_URL}/api/payments/${paymentId}`);
  const data = await response.json();
  console.log('Payment details:', data);
  return data;
}

// ============================================================================
// DASHBOARD API
// ============================================================================

// Get dashboard summary (total revenue, orders, table stats)
async function getDashboardSummary() {
  const response = await fetch(`${BASE_URL}/api/dashboard/summary`);
  const data = await response.json();
  console.log('Dashboard Summary:', data);
  return data;
}

// ============================================================================
// COMPLETE WORKFLOW EXAMPLE
// ============================================================================

async function completeOrderWorkflow() {
  console.log('🚀 Starting Complete Order Workflow\n');

  // Step 1: Get all tables
  console.log('Step 1: Fetching all tables...');
  const tables = await getAllTables();
  const tableId = tables.tables[0].id;
  console.log(`✓ Using table ${tableId}\n`);

  // Step 2: Create an order for the table
  console.log('Step 2: Creating order...');
  const orderResult = await createOrder();
  const orderId = orderResult.order_id;
  console.log(`✓ Order created with ID ${orderId}\n`);

  // Step 3: Kitchen starts preparing
  console.log('Step 3: Kitchen starts preparing (updating order status)...');
  await updateOrderStatus(orderId, 'preparing');
  console.log(`✓ Order status updated to "preparing"\n`);

  // Step 4: Kitchen completes order
  console.log('Step 4: Order is ready (updating order status)...');
  await updateOrderStatus(orderId, 'completed');
  console.log(`✓ Order status updated to "completed"\n`);

  // Step 5: Record payment
  console.log('Step 5: Processing payment...');
  const paymentResult = await recordPayment(orderId, 730, 'card');
  console.log(`✓ Payment recorded: ${paymentResult.message}\n`);

  // Step 6: Get dashboard summary
  console.log('Step 6: Fetching dashboard summary...');
  const summary = await getDashboardSummary();
  console.log(`✓ Total Revenue: ₹${summary.summary.revenue}`);
  console.log(`✓ Total Orders: ${summary.summary.orders.total_orders}\n`);

  console.log('✅ Complete Workflow Done!\n');
}

// ============================================================================
// TESTING
// ============================================================================

// Uncomment below to run examples:
// createOrder().catch(console.error);
// getAllTables().catch(console.error);
// completeOrderWorkflow().catch(console.error);
