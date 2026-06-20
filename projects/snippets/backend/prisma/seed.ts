import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create two demo users
  const aliceHash = await bcrypt.hash('password123', 12);
  const bobHash = await bcrypt.hash('password123', 12);

  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: { email: 'alice@example.com', name: 'Alice', passwordHash: aliceHash },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: { email: 'bob@example.com', name: 'Bob', passwordHash: bobHash },
  });

  // Create a collection owned by Alice
  const collection = await prisma.collection.create({
    data: {
      ownerId: alice.id,
      name: 'Utility Functions',
      description: 'Reusable TypeScript helpers',
      isPublic: false,
    },
  });

  // Grant Alice owner permission, Bob viewer permission
  await prisma.permission.upsert({
    where: { userId_collectionId: { userId: alice.id, collectionId: collection.id } },
    update: {},
    create: { userId: alice.id, collectionId: collection.id, role: 'owner' },
  });

  await prisma.permission.upsert({
    where: { userId_collectionId: { userId: bob.id, collectionId: collection.id } },
    update: {},
    create: { userId: bob.id, collectionId: collection.id, role: 'viewer' },
  });

  // Create a seed snippet
  const snippet = await prisma.snippet.create({
    data: {
      collectionId: collection.id,
      title: 'debounce',
      language: 'typescript',
      description: 'Delays function execution until after a wait period.',
      content: `export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}`,
    },
  });

  // Create the initial version for that snippet
  await prisma.snippetVersion.create({
    data: { snippetId: snippet.id, content: snippet.content, createdById: alice.id },
  });

  console.log(`Seeded: users=${[alice.email, bob.email].join(', ')}`);
  console.log(`Seeded: collection="${collection.name}", snippet="${snippet.title}"`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
