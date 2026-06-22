const jwt = require('jsonwebtoken');
require('dotenv').config();

function verifyToken(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireSuperAdmin(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Super admin access required' });
    }
    next();
  });
}

function requireOrgAdmin(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.role !== 'org_admin') {
      return res.status(403).json({ error: 'Org admin access required' });
    }
    next();
  });
}

module.exports = { verifyToken, requireSuperAdmin, requireOrgAdmin };
