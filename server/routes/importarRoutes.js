import express from 'express';
import { vistaPrevia } from '../controllers/importarController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { limiteVistaPreviaImportar } from '../middlewares/limiteIntentos.js';

const router = express.Router();

// Importar el historial desde otra app (bloque 7b). Solo usuarios con sesión.
router.use(requireAuth);

// El límite va después de requireAuth porque cuenta por usuario (req.user).
router.post('/strong/vista-previa', limiteVistaPreviaImportar, vistaPrevia);

export default router;
