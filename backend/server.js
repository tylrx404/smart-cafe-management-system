const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { getDatabase, initializeDatabase, saveDatabase } = require('./db/database');
const authRoutes = require('./routes/auth');
const authSecureRoutes = require('./routes/auth-secure');
const { authMiddleware, roleMiddleware } = require('./middleware/auth');
const { initializeDatabase: initSQLite } = require('./db/sqlite');

// Initialize Express app
const app = express();

// Port configuration - use environment variable or default
// This allows flexibility for local development and deployment platforms
const PORT = process.env.PORT || 5173;
const HOST = process.env.HOST || 'localhost';

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json()); // Parse JSON bodies
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Initialize databases
initializeDatabase();
initSQLite();

// Register NEW secure authentication routes FIRST (SQLite + email-based for customers, PIN for admin/kitchen)
// These take priority over old JSON-based routes
app.use('/api/auth', authSecureRoutes);

// Legacy authentication routes (fallback for backwards compatibility)
app.use('/api/auth', authRoutes);

// Helper to get database and save after modifications
const db = () => getDatabase();
const save = () => saveDatabase();

// ============================================================================
// HEALTH CHECK ENDPOINT
// ============================================================================

/**
 * GET /health
 * Check if the server is running
 */
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'CafeOS Backend is running' });
});

// ============================================================================
// ORDERS ENDPOINTS
// ============================================================================

/**
 * POST /api/orders
 * Create a new order for a table
 * Body: { table_id, items: [{name, price, quantity}, ...], total_amount }
 */
app.post('/api/orders', (req, res) => {
  try {
    const { table_id, items, total_amount } = req.body;
    const database = db();

    // Validation
    if (!table_id || !items || !total_amount) {
      return res.status(400).json({
        error: 'Missing required fields: table_id, items, total_amount',
      });
    }

    // Check if table exists
    const table = database.tables.find(t => t.id === table_id);
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    // Create order
    const order = {
      id: database.nextOrderId++,
      table_id,
      items,
      total_amount,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    database.orders.push(order);

    // Update table status to occupied
    table.status = 'occupied';

    save();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order_id: order.id,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/orders
 * Fetch all orders
 * Optional query: status (pending, preparing, completed)
 */
app.get('/api/orders', (req, res) => {
  try {
    const { status } = req.query;
    const database = db();
    
    let orders = database.orders;
    if (status) {
      orders = orders.filter(o => o.status === status);
    }

    res.json({
      success: true,
      total: orders.length,
      orders,
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/orders/:id
 * Fetch a specific order by ID
 */
app.get('/api/orders/:id', (req, res) => {
  try {
    const { id } = req.params;
    const database = db();

    const order = database.orders.find(o => o.id === parseInt(id));

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/orders/:id/status
 * Update order status
 * Body: { status: 'pending' | 'preparing' | 'completed' }
 */
app.put('/api/orders/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const database = db();

    // Validation
    const validStatuses = ['pending', 'preparing', 'completed'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    // Find order
    const order = database.orders.find(o => o.id === parseInt(id));
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update order status
    order.status = status;
    order.updated_at = new Date().toISOString();

    save();

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/orders/:id
 * Delete an order
 */
app.delete('/api/orders/:id', (req, res) => {
  try {
    const { id } = req.params;
    const database = db();

    const index = database.orders.findIndex(o => o.id === parseInt(id));
    if (index === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }

    database.orders.splice(index, 1);
    save();

    res.json({
      success: true,
      message: 'Order deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// TABLES ENDPOINTS
// ============================================================================

/**
 * GET /api/tables
 * Fetch all tables with their current status
 */
app.get('/api/tables', (req, res) => {
  try {
    const database = db();
    const tables = database.tables.sort((a, b) => a.table_number - b.table_number);

    res.json({
      success: true,
      total: tables.length,
      tables,
    });
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/tables/:id
 * Fetch a specific table by ID
 */
app.get('/api/tables/:id', (req, res) => {
  try {
    const { id } = req.params;
    const database = db();

    const table = database.tables.find(t => t.id === parseInt(id));

    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    res.json({
      success: true,
      table,
    });
  } catch (error) {
    console.error('Error fetching table:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/tables/:id/status
 * Update table status (empty, reserved, occupied, ready)
 * Body: { status: 'empty' | 'reserved' | 'occupied' | 'ready' }
 */
app.put('/api/tables/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const database = db();

    // Validation
    const validStatuses = ['empty', 'reserved', 'occupied', 'ready'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    // Find table
    const table = database.tables.find(t => t.id === parseInt(id));
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    // Update table status
    table.status = status;

    save();

    res.json({
      success: true,
      message: `Table status updated to ${status}`,
      table: {
        id: table.id,
        status,
      },
    });
  } catch (error) {
    console.error('Error updating table status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/tables/:id/orders
 * Fetch all orders for a specific table
 */
app.get('/api/tables/:id/orders', (req, res) => {
  try {
    const { id } = req.params;
    const database = db();

    // Check if table exists
    const table = database.tables.find(t => t.id === parseInt(id));
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    // Get all orders for this table
    const orders = database.orders.filter(o => o.table_id === parseInt(id));

    res.json({
      success: true,
      table_id: parseInt(id),
      total_orders: orders.length,
      orders,
    });
  } catch (error) {
    console.error('Error fetching table orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// PAYMENTS ENDPOINTS
// ============================================================================

/**
 * POST /api/payments
 * Store payment details after successful payment
 * Body: { order_id, amount, payment_method, payment_status }
 */
app.post('/api/payments', (req, res) => {
  try {
    const { order_id, amount, payment_method, payment_status } = req.body;
    const database = db();

    // Validation
    if (!order_id || !amount || !payment_method) {
      return res.status(400).json({
        error: 'Missing required fields: order_id, amount, payment_method',
      });
    }

    // Check if order exists
    const order = database.orders.find(o => o.id === order_id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Create payment
    const payment = {
      id: database.nextPaymentId++,
      order_id,
      amount,
      payment_method,
      payment_status: payment_status || 'completed',
      created_at: new Date().toISOString()
    };

    database.payments.push(payment);

    // Update order status to completed if payment succeeded
    if (payment_status === 'completed' || !payment_status) {
      order.status = 'completed';
      order.updated_at = new Date().toISOString();

      // Update table status back to empty
      const table = database.tables.find(t => t.id === order.table_id);
      if (table) {
        table.status = 'empty';
      }
    }

    save();

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      payment_id: payment.id,
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/payments
 * Fetch all payments
 * Optional query: order_id (filter by specific order)
 */
app.get('/api/payments', (req, res) => {
  try {
    const { order_id } = req.query;
    const database = db();

    let payments = database.payments;
    if (order_id) {
      payments = payments.filter(p => p.order_id === parseInt(order_id));
    }

    res.json({
      success: true,
      total: payments.length,
      payments,
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/payments/:id
 * Fetch a specific payment by ID
 */
app.get('/api/payments/:id', (req, res) => {
  try {
    const { id } = req.params;
    const database = db();

    const payment = database.payments.find(p => p.id === parseInt(id));

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// DASHBOARD/ANALYTICS ENDPOINTS
// ============================================================================

/**
 * GET /api/dashboard/summary
 * Get quick summary for dashboard (total orders, revenue, etc.)
 */
app.get('/api/dashboard/summary', (req, res) => {
  try {
    const database = db();

    // Total revenue
    const completedOrders = database.orders.filter(o => o.status === 'completed');
    const total_revenue = completedOrders.reduce((sum, o) => sum + o.total_amount, 0);

    // Order stats
    const total_orders = database.orders.length;
    const pending = database.orders.filter(o => o.status === 'pending').length;
    const preparing = database.orders.filter(o => o.status === 'preparing').length;
    const completed = database.orders.filter(o => o.status === 'completed').length;

    // Table stats
    const empty_tables = database.tables.filter(t => t.status === 'empty').length;
    const occupied_tables = database.tables.filter(t => t.status === 'occupied').length;
    const reserved_tables = database.tables.filter(t => t.status === 'reserved').length;
    const total_tables = database.tables.length;

    res.json({
      success: true,
      summary: {
        revenue: total_revenue,
        orders: {
          total_orders,
          pending,
          preparing,
          completed
        },
        tables: {
          empty_tables,
          occupied_tables,
          reserved_tables,
          total_tables
        },
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * 404 - Not Found
 */
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
  });
});

// ============================================================================
// START SERVER
// ============================================================================

const server = app.listen(PORT, HOST, () => {
  const serverUrl = `http://${HOST}:${PORT}`;
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`✓ CafeOS Backend Server running on ${serverUrl}`);
  console.log(`${'═'.repeat(60)}\n`);
  
  console.log('📚 Available endpoints:');
  console.log('   GET    /health');
  console.log('\n   🔐 AUTH ENDPOINTS (Public):');
  console.log('   POST   /api/auth/customer/signup');
  console.log('   POST   /api/auth/customer/login');
  console.log('   POST   /api/auth/staff/login');
  console.log('\n   🛒 ORDERS ENDPOINTS:');
  console.log('   GET    /api/orders');
  console.log('   POST   /api/orders');
  console.log('   GET    /api/orders/:id');
  console.log('   PUT    /api/orders/:id/status');
  console.log('   DELETE /api/orders/:id');
  console.log('\n   🪑 TABLES ENDPOINTS:');
  console.log('   GET    /api/tables');
  console.log('   GET    /api/tables/:id');
  console.log('   GET    /api/tables/:id/orders');
  console.log('   PUT    /api/tables/:id/status');
  console.log('\n   💳 PAYMENTS ENDPOINTS:');
  console.log('   POST   /api/payments');
  console.log('   GET    /api/payments');
  console.log('   GET    /api/payments/:id');
  console.log('\n   📊 DASHBOARD ENDPOINTS:');
  console.log('   GET    /api/dashboard/summary');
  console.log(`\n💾 Database: ./db/cafeos.json\n`);
});

// Handle port already in use error
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\n✗ Error: Port ${PORT} is already in use.`);
    console.error(`\nSolutions:`);
    console.error(`1. Kill the process using port ${PORT}`);
    console.error(`2. Use a different port: PORT=3000 npm start`);
    console.error(`3. Wait a moment and try again\n`);
    process.exit(1);
  } else {
    throw error;
  }
});

module.exports = app;
