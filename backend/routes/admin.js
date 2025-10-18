const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authMiddleware, requireRole } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

router.use(authMiddleware);
router.use(requireRole('ADMIN'));

router.get('/metrics', async (req, res) => {
  try {
    const totalProjects = await prisma.project.count();
    const totalUsers = await prisma.user.count();
    const totalTasks = await prisma.task.count();
    const todo = await prisma.task.count({ where: { status: 'TODO' }});
    const inProgress = await prisma.task.count({ where: { status: 'IN_PROGRESS' }});
    const done = await prisma.task.count({ where: { status: 'DONE' }});
    const overdue = await prisma.task.count({
      where: { dueDate: { lt: new Date() }, status: { not: 'DONE' } }
    });

    return res.json({ totalProjects, totalUsers, totalTasks, todo, inProgress, done, overdue });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, createdAt: true }});
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/users/:id/role', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { role } = req.body;
    if (!role) return res.status(400).json({ error: 'role required' });
    const updated = await prisma.user.update({ where: { id }, data: { role }});
    res.json({ id: updated.id, role: updated.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (req.user.id === id) return res.status(400).json({ error: "Can't delete yourself" });

    await prisma.user.delete({ where: { id }});
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/tasks', async (req, res) => {
  try {
    const { status, overdue } = req.query;
    const where = {};
    if (status) where.status = status;
    if (overdue === 'true') where.dueDate = { lt: new Date() }, where.status = { not: 'DONE' };
    const tasks = await prisma.task.findMany({ where, include: { assignee: true, project: true }});
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/users', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'name, email, password, and role required' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'User with this email already exists' });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, role, passwordHash },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });

    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
