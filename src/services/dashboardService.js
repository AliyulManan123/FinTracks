import prisma from '../prisma.js';
import dayjs from 'dayjs';

export default {
  async getSummary(userId) {
    const [income, expense, latest] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId, type: 'INCOME', date: { gte: dayjs().startOf('month').toDate() } },
        _sum: { amount: true }
      }),
      prisma.transaction.aggregate({
        where: { userId, type: 'EXPENSE', date: { gte: dayjs().startOf('month').toDate() } },
        _sum: { amount: true }
      }),
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 5,
        include: { category: true, account: true }
      })
    ]);

    const accounts = await prisma.account.findMany({ where: { userId } });
    const netWorth = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

    return {
      monthIncome: Number(income._sum.amount || 0),
      monthExpense: Number(expense._sum.amount || 0),
      netWorth,
      latest
    };
  },

  async expenseBreakdown(userId) {
    const since = dayjs().startOf('month').toDate();
    const grouped = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { userId, type: 'EXPENSE', date: { gte: since } },
      _sum: { amount: true }
    });

    const categories = await prisma.category.findMany({
      where: { userId, id: { in: grouped.map(g => g.categoryId).filter(Boolean) } }
    });

    const map = new Map(categories.map(c => [c.id, c.name]));
    const labels = grouped.map(g => map.get(g.categoryId) || 'Uncategorized');
    const values = grouped.map(g => Number(g._sum.amount || 0));

    return { labels, values };
  }
};
