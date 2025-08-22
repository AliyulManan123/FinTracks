import transactionService from '../services/transactionService.js';
import categoryService from '../services/categoryService.js';
import accountService from '../services/accountService.js';

export async function renderTransactionsPage(req, res) {
  try {
    const userId = req.user.id;
    const { page = 1, pageSize = 10, category, type, sort = 'date.desc', q } = req.query;
    const data = await transactionService.paginatedList(userId, { page, pageSize, category, type, sort, q });
    const categories = await categoryService.listCategories(userId);
    const accounts = await accountService.listAccounts(userId);

    res.render('transactions/index', {
      title: 'Transactions',
      data,
      categories,
      accounts,
      filters: { page, pageSize, category, type, sort, q }
    });
  } catch (e) {
    console.error(e);
    res.status(500).render('errors/500', { title: 'Server Error' });
  }
}

export async function listTransactions(req, res) {
  try {
    const userId = req.user.id;
    const data = await transactionService.paginatedList(userId, req.query);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to list transactions' });
  }
}
