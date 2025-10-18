// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authMiddleware, requireRole } = require('../middleware/auth');

// All admin routes require auth + admin role
router.use(authMiddleware);
router.use(requireRole('ADMIN'));

// 1) Site metrics: projects count, tasks by status, overdue tasks, users count
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

// 2) Users list (with role)
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, createdAt: true }});
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 3) Update user role
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

// 4) Delete a user
router.delete('/users/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // optional: prevent self-delete
    if (req.user.id === id) return res.status(400).json({ error: "Can't delete yourself" });

    await prisma.user.delete({ where: { id }});
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 5) Admin can get global tasks (with filters)
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

module.exports = router;
