import { Router } from 'express';
import { listTransactions, renderTransactionsPage } from '../controllers/transactionController.js';

const router = Router();

// Server-rendered list with pagination, filtering, sorting
router.get('/', renderTransactionsPage);

// Optional server-side export/other page actions can be added here
router.get('/list', listTransactions);

export default router;
