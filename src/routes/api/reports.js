import { Router } from 'express';
import { apiExport } from '../../controllers/api/reportApiController.js';

const router = Router();

router.get('/export', apiExport);

export default router;
