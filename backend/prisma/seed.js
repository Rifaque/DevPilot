const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

async function main() {
  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.userStory.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: { name: 'Admin User', email: 'admin@devpilot.local', passwordHash: hash, role: 'ADMIN' }
  });
  const manager = await prisma.user.create({
    data: { name: 'PM User', email: 'pm@devpilot.local', passwordHash: hash, role: 'MANAGER' }
  });
  const dev = await prisma.user.create({
    data: { name: 'Dev User', email: 'dev@devpilot.local', passwordHash: hash, role: 'DEVELOPER' }
  });

  const project = await prisma.project.create({
    data: {
      name: 'DevPilot Demo Project',
      description: 'Demo project seeded on setup',
      startDate: new Date(),
      endDate: null,
      members: {
        create: [
          { user: { connect: { id: admin.id } }, role: 'Admin' },
          { user: { connect: { id: manager.id } }, role: 'Manager' },
          { user: { connect: { id: dev.id } }, role: 'Developer' },
        ],
      },
    },
    include: { members: true }
  });

  await prisma.task.createMany({
    data: [
      { title: 'Setup repo', description: 'Initialize repo and CI', status: 'DONE', projectId: project.id, assigneeId: manager.id },
      { title: 'Create DB schema', description: 'Define Prisma schema', status: 'IN_PROGRESS', projectId: project.id, assigneeId: dev.id, dueDate: new Date(Date.now() + 3*24*3600*1000) },
      { title: 'Build frontend scaffold', description: 'Next.js app with CSS modules', status: 'TODO', projectId: project.id, assigneeId: dev.id, dueDate: new Date(Date.now() + 7*24*3600*1000) }
    ]
  });

  console.log('Seed completed');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
