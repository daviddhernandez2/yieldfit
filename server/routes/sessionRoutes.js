import express from 'express';
import { list, getOne, create, remove } from '../controllers/sessionController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', list);
router.get('/:id', getOne);
router.post('/', create);
// Sin PUT a propósito: una sesión guardada es historial y no se edita. El PUT que
// había regeneraba los snapshots con los nombres actuales, lo que rompía el historial
// inmutable (DECISIONS.md, 0004), y el cliente nunca lo usó. Si algún día se permite
// corregir una sesión, el endpoint nuevo tendrá que conservar los snapshots.
router.delete('/:id', remove);

export default router;