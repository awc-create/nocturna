import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL || 'admin@Essentia.com').toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || 'supersecurepassword';
  const passwordHash = await hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: { role: 'admin', passwordHash },
    create: { email, role: 'admin', passwordHash, name: 'Admin' },
  });

  console.log('Admin ready:', email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
