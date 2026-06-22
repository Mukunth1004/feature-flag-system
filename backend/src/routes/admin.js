const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { requireOrgAdmin } = require('../middleware/auth');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const router = express.Router();

// POST /api/admin/signup
router.post('/signup', (req, res) => {
  const { email, password, org_id } = req.body;
  if (!email || !password || !org_id) {
    return res.status(400).json({ error: 'Email, password, and org_id required' });
  }

  const org = db.prepare('SELECT id FROM organizations WHERE id = ?').get(org_id);
  if (!org) {
    return res.status(404).json({ error: 'Organization not found' });
  }

  const hash = bcrypt.hashSync(password, 10);
  try {
    const stmt = db.prepare(
      'INSERT INTO users (email, password_hash, role, org_id) VALUES (?, ?, ?, ?)'
    );
    const result = stmt.run(email.trim().toLowerCase(), hash, 'org_admin', org_id);
    const user = db.prepare('SELECT id, email, role, org_id, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json(user);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    throw err;
  }
});

// POST /api/admin/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ? AND role = ?')
    .get(email.trim().toLowerCase(), 'org_admin');
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, org_id: user.org_id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
  return res.json({ token, org_id: user.org_id });
});

// GET /api/admin/flags
router.get('/flags', requireOrgAdmin, (req, res) => {
  const flags = db.prepare(
    'SELECT * FROM feature_flags WHERE org_id = ? ORDER BY created_at DESC'
  ).all(req.user.org_id);
  return res.json(flags);
});

// POST /api/admin/flags
router.post('/flags', requireOrgAdmin, (req, res) => {
  const { key, enabled } = req.body;
  if (!key || !key.trim()) {
    return res.status(400).json({ error: 'Feature key required' });
  }

  const flagKey = key.trim().toLowerCase().replace(/\s+/g, '_');
  try {
    const stmt = db.prepare(
      'INSERT INTO feature_flags (key, enabled, org_id) VALUES (?, ?, ?)'
    );
    const result = stmt.run(flagKey, enabled ? 1 : 0, req.user.org_id);
    const flag = db.prepare('SELECT * FROM feature_flags WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json(flag);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Feature key already exists for this organization' });
    }
    throw err;
  }
});

// PATCH /api/admin/flags/:id
router.patch('/flags/:id', requireOrgAdmin, (req, res) => {
  const { id } = req.params;
  const { enabled } = req.body;

  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ error: 'enabled (boolean) required' });
  }

  const flag = db.prepare('SELECT * FROM feature_flags WHERE id = ? AND org_id = ?')
    .get(id, req.user.org_id);
  if (!flag) {
    return res.status(404).json({ error: 'Feature flag not found' });
  }

  db.prepare(
    "UPDATE feature_flags SET enabled = ?, updated_at = datetime('now') WHERE id = ? AND org_id = ?"
  ).run(enabled ? 1 : 0, id, req.user.org_id);

  const updated = db.prepare('SELECT * FROM feature_flags WHERE id = ?').get(id);
  return res.json(updated);
});

// DELETE /api/admin/flags/:id
router.delete('/flags/:id', requireOrgAdmin, (req, res) => {
  const { id } = req.params;

  const flag = db.prepare('SELECT * FROM feature_flags WHERE id = ? AND org_id = ?')
    .get(id, req.user.org_id);
  if (!flag) {
    return res.status(404).json({ error: 'Feature flag not found' });
  }

  db.prepare('DELETE FROM feature_flags WHERE id = ? AND org_id = ?').run(id, req.user.org_id);
  return res.json({ message: 'Feature flag deleted' });
});

module.exports = router;
