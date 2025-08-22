import { Router } from 'express';
import { renderInvestments } from '../controllers/investmentController.js';

const router = Router();

router.get('/', renderInvestments);

export default router;
