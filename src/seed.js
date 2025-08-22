import 'dotenv/config';
import prisma from './prisma.js';
import bcrypt from 'bcryptjs';

async function main() {
  const email = 'demo@apex.local';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Demo user already exists');
    return;
  }
  const user = await prisma.user.create({
    data: {
      email,
      name: 'Demo User',
      passwordHash: await bcrypt.hash('Password123', 12),
      provider: 'local'
    }
  });
  const account = await prisma.account.create({
    data: { userId: user.id, name: 'Cash', type: 'CASH', currency: 'IDR', balance: 1000000 }
  });
  const catFood = await prisma.category.create({ data: { userId: user.id, name: 'Food' } });
  await prisma.transaction.createMany({
    data: [
      { userId: user.id, accountId: account.id, type: 'INCOME', amount: 5000000, date: new Date(), description: 'Salary', tags: ['salary'] },
      { userId: user.id, accountId: account.id, type: 'EXPENSE', amount: 75000, date: new Date(), categoryId: catFood.id, description: 'Lunch', tags: ['meal'] }
    ]
  });
  console.log('Seeded demo data:', email, 'Password123');
}

main().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
