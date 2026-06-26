const fs = require('fs');
const path = require('path');

// Database file path
const dbPath = path.join(__dirname, 'cafeos.json');

// In-memory database
let db = {
  users: [
    // users: {id, role, name, password_hash (for customers), pin_hash (for admin/kitchen), created_at}
  ],
  tables: [],
  orders: [],
  payments: [],
  nextOrderId: 1,
  nextPaymentId: 1,
  nextUserId: 1
};

/**
 * Load database from file or initialize with defaults
 */
function initializeDatabase() {
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf8');
      db = JSON.parse(data);
      console.log('✓ Database loaded from file');
    } else {
      seedDatabase();
      saveDatabase();
      console.log('✓ Database initialized with sample data');
    }
  } catch (error) {
    console.error('Error loading database:', error);
    seedDatabase();
    saveDatabase();
  }
}

/**
 * Save database to file
 */
function saveDatabase() {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving database:', error);
  }
}

/**
 * Get database instance
 */
function getDatabase() {
  return db;
}

/**
 * Seed initial data
 */
function seedDatabase() {
  // Create demo tables
  db.tables = [
    { id: 1, table_number: 1, status: 'empty', created_at: new Date().toISOString() },
    { id: 2, table_number: 2, status: 'empty', created_at: new Date().toISOString() },
    { id: 3, table_number: 3, status: 'empty', created_at: new Date().toISOString() },
    { id: 4, table_number: 4, status: 'empty', created_at: new Date().toISOString() },
    { id: 5, table_number: 5, status: 'empty', created_at: new Date().toISOString() },
  ];

  // Initialize empty users array - users will be created via signup/login
  db.users = [];
  db.nextUserId = 1;

  db.orders = [];
  db.payments = [];
  db.nextOrderId = 1;
  db.nextPaymentId = 1;

  console.log('✓ Sample data seeded');
}

module.exports = {
  getDatabase,
  initializeDatabase,
  seedDatabase,
  saveDatabase
};
