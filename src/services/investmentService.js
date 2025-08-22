import prisma from '../prisma.js';

export default {
  async listHoldings(userId) {
    return prisma.investment.findMany({
      where: { userId },
      orderBy: { symbol: 'asc' }
    });
  },

  async computeTotals(userId) {
    const holdings = await this.listHoldings(userId);
    // Placeholder: treat avgPrice as current price for simplicity
    const totalCost = holdings.reduce((s, h) => s + Number(h.avgPrice) * Number(h.quantity), 0);
    const totalValue = totalCost; // replace with real quotes via external API
    const pnl = totalValue - totalCost;
    return { totalCost, totalValue, pnl };
  }
};
