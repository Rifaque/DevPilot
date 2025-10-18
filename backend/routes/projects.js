const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.use(authMiddleware);

// Create a project
router.post('/', async (req, res) => {
  if (req.user.role !== 'MANAGER' && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const { name, description, startDate, endDate } = req.body;
    const project = await prisma.project.create({
      data: { name, description, startDate: startDate ? new Date(startDate) : null, endDate: endDate ? new Date(endDate) : null }
    });
    res.status(201).json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// List all projects
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    const projects = await prisma.project.findMany({
      where: userRole === 'ADMIN'
        ? {}
        : { members: { some: { userId } } },
      include: {
        members: { include: { user: true } },
        tasks: true,
      },
    });

    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


// Get a specific project's detail
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const project = await prisma.project.findUnique({
      where: { id },
      include: { members: { include: { user: true } }, tasks: { include: { assignee: true } }, userStories: true}
    });
    if (!project) return res.status(404).json({ error: 'Not found' });
    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// For adding a member to the project
router.post('/:id/members', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const { userId, role } = req.body;
    const pm = await prisma.projectMember.create({
      data: { projectId, userId: parseInt(userId), role: role || 'Developer' }
    });
    res.status(201).json(pm);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a project
router.delete('/:id', async (req, res) => {
  if (req.user.role !== 'MANAGER' && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const id = parseInt(req.params.id);

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await prisma.projectMember.deleteMany({ where: { projectId: id } });
    await prisma.task.deleteMany({ where: { projectId: id } });
    await prisma.userStory.deleteMany({ where: { projectId: id } });

    await prisma.project.delete({ where: { id } });

    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


router.get('/:id/metrics', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const total = await prisma.task.count({ where: { projectId }});
    const todo = await prisma.task.count({ where: { projectId, status: 'TODO' }});
    const inProgress = await prisma.task.count({ where: { projectId, status: 'IN_PROGRESS' }});
    const done = await prisma.task.count({ where: { projectId, status: 'DONE' }});
    const overdue = await prisma.task.count({
      where: { projectId, dueDate: { lt: new Date() }, status: { not: 'DONE' } }
    });
    const completionPercent = total === 0 ? 0 : Math.round((done/total)*100);
    res.json({ total, todo, inProgress, done, overdue, completionPercent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
