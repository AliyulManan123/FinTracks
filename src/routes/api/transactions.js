import { Router } from 'express';
import {
  apiCreateTransaction,
  apiUpdateTransaction,
  apiDeleteTransaction,
  apiGetTransaction
} from '../../controllers/api/transactionApiController.js';

const router = Router();

router.get('/:id', apiGetTransaction);
router.post('/', apiCreateTransaction);
router.put('/:id', apiUpdateTransaction);
router.delete('/:id', apiDeleteTransaction);

export default router;
