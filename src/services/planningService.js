import prisma from '../prisma.js';

export default {
  listBudgets(userId) {
    return prisma.budget.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { periodStart: 'desc' }
    });
  },

  listGoals(userId) {
    return prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }
};
