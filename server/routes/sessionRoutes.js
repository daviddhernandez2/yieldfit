import express from 'express';
import { list, getOne, create, remove, previousSets, previousNote, days, records } from '../controllers/sessionController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', list);
// Antes de '/:id': si no, Express tomaría "previous-sets", "previous-note", "days" o "records"
// por un id.
router.get('/previous-sets', previousSets);
router.get('/previous-note', previousNote);
router.get('/days', days);
router.get('/records', records);
router.get('/:id', getOne);
router.post('/', create);
// Sin PUT a propósito: una sesión guardada es historial y no se edita. El PUT que
// había regeneraba los snapshots con los nombres actuales, lo que rompía el historial
// inmutable (DECISIONS.md, 0004), y el cliente nunca lo usó. Si algún día se permite
// corregir una sesión, el endpoint nuevo tendrá que conservar los snapshots.
router.delete('/:id', remove);

export default router;