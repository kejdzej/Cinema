const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, getRow } = require('../database/connection');
const { logger } = require('../utils/logger');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Email, password, firstName, and lastName are required' });
    }

    // Check if user already exists
    const existingUser = await getRow('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Get customer role ID
    const customerRole = await getRow('SELECT id FROM roles WHERE name = $1', ['customer']);
    if (!customerRole) {
      return res.status(500).json({ error: 'Customer role not found' });
    }

    // Create user
    const userResult = await query(`
      INSERT INTO users (email, password_hash, first_name, last_name, phone, is_active)
      VALUES ($1, $2, $3, $4, $5, true)
      RETURNING id, email, first_name, last_name, created_at
    `, [email, passwordHash, firstName, lastName, phone || null]);

    const user = userResult.rows[0];

    // Assign customer role
    await query(`
      INSERT INTO user_roles (user_id, role_id)
      VALUES ($1, $2)
    `, [user.id, customerRole.id]);

    // Create loyalty account
    await query(`
      INSERT INTO loyalty_accounts (user_id, points, tier)
      VALUES ($1, 0, 'standard')
    `, [user.id]);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    logger.info('User registered successfully', { userId: user.id, email });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        createdAt: user.created_at
      },
      token
    });
  } catch (error) {
    logger.error('Registration failed:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get user with roles
    const user = await getRow(`
      SELECT u.*, array_agg(r.name) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.email = $1 AND u.is_active = true
      GROUP BY u.id
    `, [email]);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    logger.info('User logged in successfully', { userId: user.id, email });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        roles: user.roles
      },
      token
    });
  } catch (error) {
    logger.error('Login failed:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    // Get loyalty account info
    const loyaltyAccount = await getRow(`
      SELECT points, tier FROM loyalty_accounts WHERE user_id = $1
    `, [user.id]);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        roles: user.roles,
        loyalty: loyaltyAccount || { points: 0, tier: 'standard' }
      }
    });
  } catch (error) {
    logger.error('Get user profile failed:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  // In a real app, you might want to blacklist the token
  // For now, just return success
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
