import { Router } from 'express';
import { renderReports, exportReport } from '../controllers/reportController.js';

const router = Router();

router.get('/', renderReports);
router.get('/export', exportReport); // /reports/export?format=pdf|csv

export default router;
