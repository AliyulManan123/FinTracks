import { Router } from 'express';
import { renderDebts } from '../controllers/debtController.js';

const router = Router();

router.get('/', renderDebts);

export default router;
