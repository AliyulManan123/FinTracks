import debtService from '../services/debtService.js';

export async function renderDebts(req, res) {
  try {
    const userId = req.user.id;
    const debts = await debtService.listDebts(userId);
    const payoff = await debtService.payoffSummary(userId);
    res.render('debts/index', {
      title: 'Debts',
      debts,
      payoff
    });
  } catch (e) {
    console.error(e);
    res.status(500).render('errors/500', { title: 'Server Error' });
  }
}
