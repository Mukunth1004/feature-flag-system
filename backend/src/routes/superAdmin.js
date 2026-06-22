const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { requireSuperAdmin } = require('../middleware/auth');
require('dotenv').config();

const router = express.Router();

// POST /api/super-admin/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  if (
    email !== process.env.SUPER_ADMIN_EMAIL ||
    password !== process.env.SUPER_ADMIN_PASSWORD
  ) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign(
    { role: 'super_admin', email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
  return res.json({ token });
});

// POST /api/super-admin/organizations
router.post('/organizations', requireSuperAdmin, (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Organization name required' });
  }
  try {
    const stmt = db.prepare('INSERT INTO organizations (name) VALUES (?)');
    const result = stmt.run(name.trim());
    const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json(org);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Organization name already exists' });
    }
    throw err;
  }
});

// GET /api/super-admin/organizations
router.get('/organizations', requireSuperAdmin, (req, res) => {
  const orgs = db.prepare('SELECT * FROM organizations ORDER BY created_at DESC').all();
  return res.json(orgs);
});

module.exports = router;
