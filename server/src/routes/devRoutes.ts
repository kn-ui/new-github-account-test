import { Router } from 'express';
import { clearAll, seedAll } from '../controllers/devController';

const router = Router();

router.post('/clear', clearAll);
router.post('/seed', seedAll);

export default router;

