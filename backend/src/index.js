require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');

const superAdminRoutes = require('./routes/superAdmin');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');

// Initialize DB (runs schema creation on import)
require('./db');

const app = express();

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Serve the 3 frontend apps
const frontendRoot = path.join(__dirname, '../../frontend');
app.use('/super-admin', express.static(path.join(frontendRoot, 'super-admin')));
app.use('/admin', express.static(path.join(frontendRoot, 'admin')));
app.use('/user', express.static(path.join(frontendRoot, 'user')));

// Root: show links to all 3 apps
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Feature Flag System</title>
      <style>
        body { font-family: system-ui, sans-serif; max-width: 480px; margin: 80px auto; padding: 0 20px; }
        h1 { font-size: 1.4rem; margin-bottom: 8px; }
        p { color: #666; font-size: 0.9rem; margin-bottom: 28px; }
        a { display: block; padding: 14px 20px; margin-bottom: 12px; border-radius: 8px; text-decoration: none; font-weight: 600; }
        .sa { background: #1a1a2e; color: #fff; }
        .admin { background: #16213e; color: #fff; }
        .user { background: #0f3460; color: #fff; }
        span { display: block; font-size: 0.78rem; font-weight: 400; opacity: 0.75; margin-top: 3px; }
      </style>
    </head>
    <body>
      <h1>Feature Flag System</h1>
      <p>Select the portal you want to access:</p>
      <a class="sa" href="/super-admin">
        Super Admin Portal
        <span>Create organizations &amp; manage the system</span>
      </a>
      <a class="admin" href="/admin">
        Admin Portal
        <span>Manage feature flags for your organization</span>
      </a>
      <a class="user" href="/user">
        User Portal
        <span>Check whether a feature is enabled for your org</span>
      </a>
    </body>
    </html>
  `);
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\nFeature Flag System running at http://localhost:${PORT}`);
  console.log(`  Super Admin  →  http://localhost:${PORT}/super-admin`);
  console.log(`  Admin        →  http://localhost:${PORT}/admin`);
  console.log(`  User         →  http://localhost:${PORT}/user`);
  console.log(`\nSuper Admin credentials: ${process.env.SUPER_ADMIN_EMAIL} / ${process.env.SUPER_ADMIN_PASSWORD}\n`);
});
