import { Router } from 'express';
import { renderPlanning } from '../controllers/planningController.js';

const router = Router();

router.get('/', renderPlanning);

export default router;
