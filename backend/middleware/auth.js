const jwt = require('jsonwebtoken');

// Secret key for JWT signing - in production, use environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'cafeos_secret_key_2024_hackathon';

/**
 * MIDDLEWARE: Verify JWT token
 * Checks if the request has a valid JWT token in Authorization header
 * Format: Authorization: Bearer <token>
 */
function authMiddleware(req, res, next) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach decoded user info to request
    next();
  } catch (error) {
    console.error('JWT verification error:', error.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * MIDDLEWARE: Check user role
 * Ensures the authenticated user has the required role
 */
function roleMiddleware(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Access denied. Required role: ${allowedRoles.join(', ')}` 
      });
    }

    next();
  };
}

/**
 * Generate JWT token
 * Used after successful login
 */
function generateToken(userId, role) {
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: '24h' } // Token valid for 24 hours
  );
}

module.exports = {
  authMiddleware,
  roleMiddleware,
  generateToken,
  JWT_SECRET
};
