const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authMiddleware, requireRole } = require('../middleware/auth');

router.use(authMiddleware);

// Create a task under project
router.post('/:projectId/tasks', async (req, res) => {
  if (req.user.role !== 'MANAGER' && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const projectId = parseInt(req.params.projectId);
    const { title, description, assigneeId, dueDate } = req.body;
    const task = await prisma.task.create({
      data: {
        title,
        description,
        projectId,
        assigneeId: parseInt(assigneeId) || null,
        dueDate: dueDate ? new Date(dueDate) : null
      }
    });
    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get tasks for project
router.get('/:projectId/tasks', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const tasks = await prisma.task.findMany({ where: { projectId }, include: { assignee: true }});
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a task (status or assignee or dueDate)
router.put('/task/:taskId', async (req, res) => {
  try {
    const taskId = parseInt(req.params.taskId);
    const { title, description, status, assigneeId, dueDate } = req.body;
    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        title,
        description,
        status,
        assigneeId: parseInt(assigneeId) || null,
        dueDate: dueDate ? new Date(dueDate) : undefined
      }
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a task
router.delete('/task/:taskId', async (req, res) => {
  if (req.user.role !== 'MANAGER' && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const taskId = parseInt(req.params.taskId);
    await prisma.task.delete({ where: { id: taskId }});
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
