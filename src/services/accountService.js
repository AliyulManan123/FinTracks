import prisma from '../prisma.js';

export default {
  listAccounts(userId) {
    return prisma.account.findMany({
      where: { userId },
      orderBy: { name: 'asc' }
    });
  }
};
