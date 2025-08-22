import { Router } from 'express';
import { getDashboard } from '../controllers/dashboardController.js';

const router = Router();

router.get('/', (req, res) => res.redirect('/dashboard'));
router.get('/dashboard', getDashboard);

export default router;
