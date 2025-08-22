import investmentService from '../services/investmentService.js';

export async function renderInvestments(req, res) {
  try {
    const userId = req.user.id;
    const holdings = await investmentService.listHoldings(userId);
    const totals = await investmentService.computeTotals(userId);
    res.render('investments/index', {
      title: 'Investments',
      holdings,
      totals
    });
  } catch (e) {
    console.error(e);
    res.status(500).render('errors/500', { title: 'Server Error' });
  }
}
