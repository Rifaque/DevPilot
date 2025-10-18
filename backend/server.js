require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('./middleware/auth');

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true, name: 'DevPilot API' }));

// Routes
app.use('/api/admin', require('./routes/admin'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/ai', require('./routes/ai'));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err?.stack || err);
  res.status(500).json({ error: 'Server error' });
});

if (require.main === module) {
  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`DevPilot backend running on port ${port}`));
}

module.exports = app;
