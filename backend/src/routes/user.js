const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/user/organizations - fetch all orgs for the dropdown
router.get('/organizations', (req, res) => {
  const orgs = db.prepare('SELECT id, name FROM organizations ORDER BY name ASC').all();
  return res.json(orgs);
});

// POST /api/user/check-flag
// Body: { org_id, feature_key }
router.post('/check-flag', (req, res) => {
  const { org_id, feature_key } = req.body;
  if (!org_id || !feature_key || !feature_key.trim()) {
    return res.status(400).json({ error: 'org_id and feature_key required' });
  }

  const org = db.prepare('SELECT id, name FROM organizations WHERE id = ?').get(org_id);
  if (!org) {
    return res.status(404).json({ error: 'Organization not found' });
  }

  const key = feature_key.trim().toLowerCase().replace(/\s+/g, '_');
  const flag = db.prepare(
    'SELECT key, enabled FROM feature_flags WHERE key = ? AND org_id = ?'
  ).get(key, org_id);

  if (!flag) {
    return res.status(404).json({ error: `Feature "${key}" not found for organization "${org.name}"` });
  }

  return res.json({
    org: org.name,
    feature_key: flag.key,
    enabled: flag.enabled === 1,
  });
});

module.exports = router;
