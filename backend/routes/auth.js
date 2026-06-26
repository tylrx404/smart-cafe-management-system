const express = require('express');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../middleware/auth');
const { getDatabase, saveDatabase } = require('../db/database');

const router = express.Router();

// ============================================================================
// CUSTOMER SIGNUP
// ============================================================================
/**
 * POST /api/auth/customer/signup
 * Create a new customer account
 * Body: { name, password }
 * 
 * SECURITY NOTES:
 * - Password is hashed using bcrypt before storage
 * - Never store plain text passwords
 * - Hash cost is set to 10 (good balance between security and speed)
 */
router.post('/customer/signup', async (req, res) => {
  try {
    const { name, password } = req.body;

    // Validation
    if (!name || !password) {
      return res.status(400).json({ error: 'Name and password are required' });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }

    const db = getDatabase();

    // Check if customer already exists
    const existingUser = db.users.find(u => u.name === name && u.role === 'customer');
    if (existingUser) {
      return res.status(409).json({ error: 'Customer name already exists' });
    }

    // Hash password with bcrypt (10 salt rounds = good security/speed balance)
    const passwordHash = await bcrypt.hash(password, 10);

    // Create new customer user
    const newUser = {
      id: db.nextUserId++,
      name,
      role: 'customer',
      password_hash: passwordHash, // NEVER store plain password
      created_at: new Date().toISOString()
    };

    db.users.push(newUser);
    saveDatabase();

    // Generate JWT token for immediate login after signup
    const token = generateToken(newUser.id, newUser.role);

    res.status(201).json({
      success: true,
      message: 'Customer account created successfully',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// CUSTOMER LOGIN
// ============================================================================
/**
 * POST /api/auth/customer/login
 * Customer login with name and password
 * Body: { name, password }
 * 
 * SECURITY NOTES:
 * - Uses bcrypt.compare() to securely verify password
 * - Never returns password hash to frontend
 * - Returns JWT token that must be sent in Authorization header
 */
router.post('/customer/login', async (req, res) => {
  try {
    const { name, password } = req.body;

    // Validation
    if (!name || !password) {
      return res.status(400).json({ error: 'Name and password are required' });
    }

    const db = getDatabase();

    // Find customer user by name
    const user = db.users.find(u => u.name === name && u.role === 'customer');
    if (!user) {
      return res.status(401).json({ error: 'Invalid name or password' });
    }

    // Verify password using bcrypt
    // bcrypt.compare() safely compares plain password with hash
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid name or password' });
    }

    // Generate JWT token
    const token = generateToken(user.id, user.role);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// STAFF LOGIN (Admin & Kitchen)
// ============================================================================
/**
 * POST /api/auth/staff/login
 * Staff login with 4-digit PIN
 * Body: { role, pin }
 * role: "admin" or "kitchen"
 * pin: 4-digit string
 * 
 * SECURITY NOTES:
 * - PINs are stored as bcrypt hashes (same as passwords)
 * - PIN validation happens on backend only
 * - Frontend never has access to PIN logic
 * - Returns JWT token for session management
 * 
 * DEFAULT PINS FOR TESTING:
 * - Admin: 9999
 * - Kitchen: 1111
 */
router.post('/staff/login', async (req, res) => {
  try {
    const { role, pin } = req.body;

    // Validation
    if (!role || !pin) {
      return res.status(400).json({ error: 'Role and PIN are required' });
    }

    if (pin.length !== 4 || isNaN(pin)) {
      return res.status(400).json({ error: 'PIN must be a 4-digit number' });
    }

    if (role !== 'admin' && role !== 'kitchen') {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const db = getDatabase();

    // Find or create staff user (staff users persist across sessions)
    let user = db.users.find(u => u.role === role);

    if (!user) {
      // First time login - create staff user with PIN
      // Default PINs: admin=9999, kitchen=1111
      const defaultPin = role === 'admin' ? '9999' : '1111';
      const pinHash = await bcrypt.hash(defaultPin, 10);

      user = {
        id: db.nextUserId++,
        name: role === 'admin' ? 'Admin User' : 'Kitchen Staff',
        role,
        pin_hash: pinHash,
        created_at: new Date().toISOString()
      };

      db.users.push(user);
      saveDatabase();
    }

    // Verify PIN using bcrypt
    if (!user.pin_hash) {
      // If no PIN set, use default PIN for this role
      const defaultPin = role === 'admin' ? '9999' : '1111';
      const pinHash = await bcrypt.hash(defaultPin, 10);
      user.pin_hash = pinHash;
      saveDatabase();
    }

    const pinMatch = await bcrypt.compare(pin, user.pin_hash);
    if (!pinMatch) {
      return res.status(401).json({ error: 'Invalid PIN' });
    }

    // Generate JWT token
    const token = generateToken(user.id, user.role);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Staff login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
