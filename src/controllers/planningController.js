import planningService from '../services/planningService.js';
import categoryService from '../services/categoryService.js';

export async function renderPlanning(req, res) {
  try {
    const userId = req.user.id;
    const budgets = await planningService.listBudgets(userId);
    const goals = await planningService.listGoals(userId);
    const categories = await categoryService.listCategories(userId);
    res.render('planning/index', {
      title: 'Planning',
      budgets,
      goals,
      categories
    });
  } catch (e) {
    console.error(e);
    res.status(500).render('errors/500', { title: 'Server Error' });
  }
}
