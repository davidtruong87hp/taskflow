import { PrismaClient } from '../generated/client';

const prisma = new PrismaClient();

async function main() {
  const dbName = process.env.DB_NAME;

  if (dbName === 'userdb') {
    await prisma.user.upsert({
      where: { email: 'alice@taskflow.dev' },
      update: {},
      create: { id: 1, name: 'Alice Nguyen', email: 'alice@taskflow.dev' },
    });
    await prisma.user.upsert({
      where: { email: 'bob@taskflow.dev' },
      update: {},
      create: { id: 2, name: 'Bob Tran', email: 'bob@taskflow.dev' },
    });
    console.log('✓ Seeded userdb');
  }

  if (dbName === 'taskdb') {
    await prisma.task.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, title: 'Set up CI pipeline', userId: 1, status: 'done' },
    });
    await prisma.task.upsert({
      where: { id: 2 },
      update: {},
      create: {
        id: 2,
        title: 'Write K8s manifests',
        userId: 1,
        status: 'done',
      },
    });
    await prisma.task.upsert({
      where: { id: 3 },
      update: {},
      create: {
        id: 3,
        title: 'Add OpenTelemetry',
        userId: 2,
        status: 'in-progress',
      },
    });
    console.log('✓ Seeded taskdb');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
