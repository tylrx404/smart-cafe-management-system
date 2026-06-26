/**
 * Authentication Routes - ADANI Cafe POS System
 * 
 * Handles:
 * - Customer signup (email + password)
 * - Customer login (email + password)
 * - Admin/Kitchen login (PIN)
 * - JWT token generation
 * - Password/PIN encryption with bcrypt
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  getUserByEmail,
  createUser,
  createAdminUser,
  getUserById
} = require('../db/sqlite');

const router = express.Router();

// Secret key for JWT (use environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'adani_cafe_secret_2024';
const JWT_EXPIRY = '24h';

// ============================================================================
// CUSTOMER SIGNUP
// ============================================================================
/**
 * POST /api/auth/customer/signup
 * Create new customer account
 * Body: { email, password, name }
 */
router.post('/customer/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if customer already exists
    const existingUser = getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password with bcrypt (10 salt rounds)
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user in database
    const userId = createUser(email, passwordHash, 'customer', name || email.split('@')[0]);

    // Generate JWT token
    const token = jwt.sign(
      { userId, role: 'customer', email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    // Return response (NEVER include password or hash)
    res.status(201).json({
      success: true,
      message: 'Signup successful',
      token,
      user: {
        id: userId,
        email,
        name: name || email.split('@')[0],
        role: 'customer'
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Signup failed', details: error.message });
  }
});

// ============================================================================
// CUSTOMER LOGIN
// ============================================================================
/**
 * POST /api/auth/customer/login
 * Authenticate customer with email and password
 * Body: { email, password }
 */
router.post('/customer/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user in database
    const user = getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if user is a customer
    if (user.role !== 'customer') {
      return res.status(401).json({ error: 'Invalid login method for this account' });
    }

    // Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: 'customer', email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    // Return response (NEVER include password or hash)
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || user.email.split('@')[0],
        role: 'customer'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// ============================================================================
// ADMIN LOGIN (PIN)
// ============================================================================
/**
 * POST /api/auth/admin/login
 * Admin/Kitchen staff login using PIN
 * Body: { pin, role: 'admin' | 'kitchen' }
 */
router.post('/admin/login', async (req, res) => {
  try {
    const { pin, role } = req.body;

    // Validation
    if (!pin || !role) {
      return res.status(400).json({ error: 'PIN and role are required' });
    }

    if (!['admin', 'kitchen'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // For demo purposes: use hardcoded admin/kitchen accounts
    // In production, fetch from database with PIN hash
    let user = null;
    let adminEmail = role === 'admin' ? 'admin@adani.cafe' : 'kitchen@adani.cafe';

    user = getUserByEmail(adminEmail);

    // If user doesn't exist, create with default PIN (1234)
    if (!user) {
      const pinHash = await bcrypt.hash('1234', 10);
      const userId = createAdminUser(adminEmail, pinHash, role, role.charAt(0).toUpperCase() + role.slice(1));
      user = { id: userId, email: adminEmail, role, pin_hash: pinHash };
    }

    // Verify PIN using bcrypt
    const isPinValid = await bcrypt.compare(pin, user.pin_hash);
    if (!isPinValid) {
      return res.status(401).json({ error: 'Invalid PIN' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    // Return response (NEVER include PIN or hash)
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || role,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// ============================================================================
// KITCHEN LOGIN (PIN) - Alias for easier use
// ============================================================================
/**
 * POST /api/auth/kitchen/login
 * Kitchen staff login using PIN
 * Body: { pin }
 */
router.post('/kitchen/login', async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin) {
      return res.status(400).json({ error: 'PIN is required' });
    }

    // Forward to admin login with kitchen role
    req.body.role = 'kitchen';
    return router._lookup('admin/login', req, res);
  } catch (error) {
    // If forwarding fails, call admin login directly
    req.body.role = 'kitchen';
    // Re-call the admin login logic
    return require('express').Router.prototype.post.call(this, '/admin/login', async (req, res) => {
      const { pin, role } = { pin: req.body.pin, role: 'kitchen' };

      try {
        const adminEmail = 'kitchen@adani.cafe';
        let user = getUserByEmail(adminEmail);

        if (!user) {
          const pinHash = await bcrypt.hash('1234', 10);
          const userId = createAdminUser(adminEmail, pinHash, 'kitchen', 'Kitchen');
          user = { id: userId, email: adminEmail, role: 'kitchen', pin_hash: pinHash };
        }

        const isPinValid = await bcrypt.compare(pin, user.pin_hash);
        if (!isPinValid) {
          return res.status(401).json({ error: 'Invalid PIN' });
        }

        const token = jwt.sign(
          { userId: user.id, role: 'kitchen', email: user.email },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRY }
        );

        res.status(200).json({
          success: true,
          message: 'Login successful',
          token,
          user: {
            id: user.id,
            email: user.email,
            name: 'Kitchen',
            role: 'kitchen'
          }
        });
      } catch (error) {
        console.error('Kitchen login error:', error);
        res.status(500).json({ error: 'Login failed', details: error.message });
      }
    })(req, res);
  }
});

// ============================================================================
// VERIFY TOKEN
// ============================================================================
/**
 * POST /api/auth/verify
 * Verify if JWT token is still valid
 */
router.post('/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = getUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
