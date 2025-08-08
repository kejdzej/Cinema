const jwt = require('jsonwebtoken');
const { getRow } = require('../database/connection');
const { logger } = require('../utils/logger');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user with roles
    const user = await getRow(`
      SELECT u.*, array_agg(r.name) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.id = $1 AND u.is_active = true
      GROUP BY u.id
    `, [decoded.userId]);

    if (!user) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Token verification failed:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Middleware to check if user has specific role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRoles = req.user.roles || [];
    const hasRole = Array.isArray(roles) 
      ? roles.some(role => userRoles.includes(role))
      : userRoles.includes(roles);

    if (!hasRole) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Helper middleware for specific roles
const requireAdmin = requireRole('admin');
const requireStaff = requireRole(['admin', 'staff']);
const requireCustomer = requireRole(['admin', 'staff', 'customer']);

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireStaff,
  requireCustomer
};
