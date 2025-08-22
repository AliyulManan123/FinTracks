import { Router } from 'express';
import { renderSettings, updateProfile, updateSecurity, manageCategories } from '../controllers/settingsController.js';

const router = Router();

router.get('/', renderSettings);
router.post('/profile', updateProfile);
router.post('/security', updateSecurity);
router.post('/categories', manageCategories);

export default router;
