import prisma from '../prisma.js';

function nextMonthPayment(principal, rateAnnual, minPayment) {
  const r = Number(rateAnnual) / 12;
  const interest = Number(principal) * r;
  const principalPay = Math.max(0, Number(minPayment) - interest);
  const newPrincipal = Math.max(0, Number(principal) - principalPay);
  return { interest, principalPay, newPrincipal };
}

export default {
  listDebts(userId) {
    return prisma.debt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  },

  async payoffSummary(userId) {
    const debts = await this.listDebts(userId);
    const schedule = debts.map(d => {
      const step = nextMonthPayment(d.principal, d.interestRate, d.minPayment);
      return {
        id: d.id,
        name: d.name,
        principal: Number(d.principal),
        interestNextMonth: step.interest,
        principalNextMonth: step.principalPay,
        projectedPrincipal: step.newPrincipal
      };
    });
    const totals = {
      principal: schedule.reduce((s, x) => s + x.principal, 0),
      interestNextMonth: schedule.reduce((s, x) => s + x.interestNextMonth, 0),
      principalNextMonth: schedule.reduce((s, x) => s + x.principalNextMonth, 0)
    };
    return { schedule, totals };
  }
};
