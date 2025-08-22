import dashboardService from '../services/dashboardService.js';
import accountService from '../services/accountService.js';

export async function getDashboard(req, res) {
  try {
    const userId = req.user.id;
    const summary = await dashboardService.getSummary(userId);
    const accounts = await accountService.listAccounts(userId);
    res.render('dashboard', {
      title: 'Dashboard',
      summary,
      accounts
    });
  } catch (e) {
    console.error(e);
    res.status(500).render('errors/500', { title: 'Server Error' });
  }
}
