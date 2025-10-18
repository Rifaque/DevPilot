// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

async function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // attach user to req
    const user = await prisma.user.findUnique({ where: { id: payload.userId }});
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    req.user = { id: user.id, role: user.role, name: user.name, email: user.email };
    next();
  } catch (err) {
    console.error('auth error', err);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (req.user.role !== role && req.user.role !== 'ADMIN') {
      // allow ADMIN to bypass or enforce exact match as needed
      return res.status(403).json({ error: 'Forbidden - insufficient role' });
    }
    next();
  };
}

module.exports = { authMiddleware, requireRole };
