import express from 'express';
import { deshacerLote, importar, listarLotes, vistaPrevia } from '../controllers/importarController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { limiteDeshacerImportacion, limiteImportar, limiteVistaPreviaImportar } from '../middlewares/limiteIntentos.js';

const router = express.Router();

// Importar el historial desde otra app (bloque 7b). Solo usuarios con sesión.
router.use(requireAuth);

// El límite va después de requireAuth porque cuenta por usuario (req.user).
router.post('/strong/vista-previa', limiteVistaPreviaImportar, vistaPrevia);
router.post('/strong', limiteImportar, importar);

// Importaciones anteriores y deshacer una (decisión A).
router.get('/lotes', listarLotes);
router.delete('/lotes/:lote', limiteDeshacerImportacion, deshacerLote);

export default router;
