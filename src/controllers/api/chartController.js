import dashboardService from '../../services/dashboardService.js';

export async function expenseBreakdown(req, res) {
  try {
    const userId = req.user.id;
    const data = await dashboardService.expenseBreakdown(userId);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load chart data' });
  }
}
