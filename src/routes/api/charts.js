import { Router } from 'express';
import { expenseBreakdown } from '../../controllers/api/chartController.js';

const router = Router();

router.get('/expense-breakdown', expenseBreakdown);

export default router;
