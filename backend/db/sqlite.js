/**
 * SQLite Database Module - ADANI Cafe POS System
 * 
 * Handles all database operations for:
 * - User management (signup, login, authentication)
 * - Order management (creation, updates, retrieval)
 * - Secure password/PIN storage using bcrypt hashing
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'adani_cafe.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

/**
 * Initialize database schema
 * Creates tables if they don't exist
 */
function initializeDatabase() {
  try {
    // Users table - for all roles (customer, admin, kitchen)
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password_hash TEXT,
        pin_hash TEXT,
        role TEXT NOT NULL CHECK(role IN ('customer', 'admin', 'kitchen')),
        name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Orders table - linked to users
    db.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        table_id INTEGER,
        items TEXT NOT NULL,
        total_amount REAL NOT NULL,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'preparing', 'ready', 'completed')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Tables table - cafe layout
    db.exec(`
      CREATE TABLE IF NOT EXISTS tables (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_number INTEGER UNIQUE NOT NULL,
        status TEXT DEFAULT 'empty' CHECK(status IN ('empty', 'occupied', 'reserved')),
        current_order_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (current_order_id) REFERENCES orders(id)
      )
    `);

    // Payments table - transaction history
    db.exec(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        method TEXT DEFAULT 'card',
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'failed')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      )
    `);

    // Sessions table - for JWT tracking (optional, for advanced features)
    db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log('✓ SQLite database initialized successfully');
    seedInitialData();
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

/**
 * Seed initial data (tables only)
 * Users will be created via signup
 */
function seedInitialData() {
  try {
    // Check if tables already exist
    const tableCount = db.prepare('SELECT COUNT(*) as count FROM tables').get().count;

    if (tableCount === 0) {
      // Insert 5 demo tables
      const insertTable = db.prepare(`
        INSERT INTO tables (table_number, status) VALUES (?, 'empty')
      `);

      for (let i = 1; i <= 5; i++) {
        insertTable.run(i);
      }

      console.log('✓ Initial cafe tables seeded');
    }
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}

/**
 * Get user by email
 */
function getUserByEmail(email) {
  try {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }
}

/**
 * Get user by ID
 */
function getUserById(userId) {
  try {
    return db.prepare('SELECT id, email, role, name, created_at FROM users WHERE id = ?').get(userId);
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    return null;
  }
}

/**
 * Create new user (signup)
 */
function createUser(email, passwordHash, role, name = null) {
  try {
    const stmt = db.prepare(`
      INSERT INTO users (email, password_hash, role, name)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(email, passwordHash, role, name);
    return result.lastInsertRowid;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

/**
 * Create admin/kitchen user with PIN
 */
function createAdminUser(email, pinHash, role, name) {
  try {
    const stmt = db.prepare(`
      INSERT INTO users (email, pin_hash, role, name)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(email, pinHash, role, name);
    return result.lastInsertRowid;
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
}

/**
 * Get all customers
 */
function getAllCustomers() {
  try {
    return db.prepare(`
      SELECT id, email, name, created_at FROM users WHERE role = 'customer'
    `).all();
  } catch (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
}

/**
 * Create order linked to user
 */
function createOrder(userId, tableId, items, totalAmount) {
  try {
    const itemsJson = JSON.stringify(items);
    const stmt = db.prepare(`
      INSERT INTO orders (user_id, table_id, items, total_amount, status)
      VALUES (?, ?, ?, ?, 'pending')
    `);
    const result = stmt.run(userId, tableId, itemsJson, totalAmount);

    // Update table status
    if (tableId) {
      db.prepare('UPDATE tables SET status = ?, current_order_id = ? WHERE id = ?')
        .run('occupied', result.lastInsertRowid, tableId);
    }

    return result.lastInsertRowid;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

/**
 * Get orders by user ID
 */
function getOrdersByUserId(userId) {
  try {
    const orders = db.prepare(`
      SELECT id, user_id, table_id, items, total_amount, status, created_at, updated_at
      FROM orders WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(userId);

    // Parse items JSON
    return orders.map(order => ({
      ...order,
      items: JSON.parse(order.items)
    }));
  } catch (error) {
    console.error('Error fetching orders by user:', error);
    return [];
  }
}

/**
 * Get all orders
 */
function getAllOrders(status = null) {
  try {
    let query = `
      SELECT id, user_id, table_id, items, total_amount, status, created_at, updated_at
      FROM orders
    `;
    let params = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const orders = db.prepare(query).all(...params);

    // Parse items JSON
    return orders.map(order => ({
      ...order,
      items: JSON.parse(order.items)
    }));
  } catch (error) {
    console.error('Error fetching all orders:', error);
    return [];
  }
}

/**
 * Update order status
 */
function updateOrderStatus(orderId, status) {
  try {
    db.prepare(`
      UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(status, orderId);

    // If order is completed, free up the table
    if (status === 'completed') {
      db.prepare(`
        UPDATE tables SET status = 'empty', current_order_id = NULL
        WHERE current_order_id = ?
      `).run(orderId);
    }

    return true;
  } catch (error) {
    console.error('Error updating order status:', error);
    return false;
  }
}

/**
 * Get order by ID
 */
function getOrderById(orderId) {
  try {
    const order = db.prepare(`
      SELECT id, user_id, table_id, items, total_amount, status, created_at, updated_at
      FROM orders WHERE id = ?
    `).get(orderId);

    if (order) {
      order.items = JSON.parse(order.items);
    }

    return order;
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
}

/**
 * Get all tables
 */
function getAllTables() {
  try {
    return db.prepare('SELECT * FROM tables ORDER BY table_number').all();
  } catch (error) {
    console.error('Error fetching tables:', error);
    return [];
  }
}

/**
 * Update table status
 */
function updateTableStatus(tableId, status) {
  try {
    db.prepare('UPDATE tables SET status = ? WHERE id = ?').run(status, tableId);
    return true;
  } catch (error) {
    console.error('Error updating table status:', error);
    return false;
  }
}

/**
 * Get database statistics
 */
function getStats() {
  try {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = "customer"').get().count;
    const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
    const totalRevenue = db.prepare('SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = "completed"').get().total;

    return {
      totalCustomers: userCount,
      totalOrders: orderCount,
      totalRevenue: totalRevenue
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return { totalCustomers: 0, totalOrders: 0, totalRevenue: 0 };
  }
}

/**
 * Close database connection
 */
function closeDatabase() {
  try {
    db.close();
    console.log('✓ Database connection closed');
  } catch (error) {
    console.error('Error closing database:', error);
  }
}

module.exports = {
  initializeDatabase,
  getUserByEmail,
  getUserById,
  createUser,
  createAdminUser,
  getAllCustomers,
  createOrder,
  getOrdersByUserId,
  getAllOrders,
  updateOrderStatus,
  getOrderById,
  getAllTables,
  updateTableStatus,
  getStats,
  closeDatabase,
  db // Export db instance for advanced queries if needed
};
