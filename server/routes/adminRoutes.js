import express from 'express';
import { listReports, updateReport, listUsers } from '../controllers/adminController.js';
import { requireAuth, requireAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Página /developer (bloque 11b). Primero requireAuth (quién eres) y después requireAdmin
// (si puedes): el orden importa, requireAdmin lee el req.user que pone requireAuth.
router.use(requireAuth, requireAdmin);

router.get('/reports', listReports);
router.patch('/reports/:id', updateReport);
router.get('/users', listUsers);

export default router;
