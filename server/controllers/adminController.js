import mongoose from 'mongoose';
import BugReport from '../models/BugReport.js';
import User from '../models/User.js';
import Session from '../models/Session.js';
import Exercise from '../models/Exercise.js';
import Workout from '../models/Workout.js';

// Endpoints de la página /developer (bloque 11b, paso 11b.3). Solo para admin: las rutas
// llevan requireAuth y requireAdmin (routes/adminRoutes.js).
//
// LA ÚNICA EXCEPCIÓN a "todas las consultas filtran por userId": aquí se leen datos de
// todos los usuarios. Por eso solo se devuelve lo imprescindible, con la proyección
// escrita a mano: nada de fecha de nacimiento, peso, altura ni género.

const LIMITE_POR_DEFECTO = 20;
const LIMITE_MAXIMO = 50;
// Usuarios: una lista limitada, no paginada. En la beta son unos pocos; si algún día pasan
// de aquí, la respuesta lo dice (total) y tocará paginarla como los reportes.
const MAX_USUARIOS = 200;

const ESTADOS = ['pendiente', 'resuelto'];

// Mismo formato de cursor que el Historial (sessionController): "<fecha ISO>_<id>" del
// último reporte enviado. Devuelve { fecha, id }, o null si no tiene ese formato.
const leerCursor = (cursor) => {
  const separador = cursor.lastIndexOf('_');
  const fecha = new Date(cursor.slice(0, separador));
  const id = cursor.slice(separador + 1);
  if (separador < 1 || Number.isNaN(fecha.getTime()) || !mongoose.isValidObjectId(id)) return null;
  return { fecha, id: new mongoose.Types.ObjectId(id) };
};

const errorValidacion = (res, message) => res.status(400).json({ error: 'Validation Error', message });

// GET /api/admin/reports?estado=&usuario=&desde=&hasta=&cursor=&limite=
// Reportes de todos los usuarios, más recientes primero, paginados por cursor.
//   - estado: pendiente | resuelto (sin él, todos)
//   - usuario: id de un usuario
//   - desde, hasta: instantes ISO; el cliente los calcula con su zona horaria (inicio de
//     un día y comienzo del día siguiente al último). desde incluido, hasta excluido.
// Devuelve { reports, siguienteCursor }; cada reporte lleva el nombre y el email de quien
// lo envió (populate).
export const listReports = async (req, res, next) => {
  try {
    const { estado, usuario, desde, hasta, cursor } = req.query;

    const limite = req.query.limite === undefined ? LIMITE_POR_DEFECTO : Number(req.query.limite);
    if (!Number.isInteger(limite) || limite < 1 || limite > LIMITE_MAXIMO) {
      return errorValidacion(res, `limite tiene que ser un número entero entre 1 y ${LIMITE_MAXIMO}`);
    }

    const filtro = {};
    if (estado !== undefined) {
      if (!ESTADOS.includes(estado)) return errorValidacion(res, 'estado no válido');
      filtro.estado = estado;
    }
    if (usuario !== undefined) {
      if (!mongoose.isValidObjectId(usuario)) return errorValidacion(res, 'usuario no válido');
      filtro.userId = usuario;
    }
    if (desde !== undefined || hasta !== undefined) {
      filtro.createdAt = {};
      for (const [clave, operador] of [[desde, '$gte'], [hasta, '$lt']]) {
        if (clave === undefined) continue;
        const fecha = new Date(clave);
        if (Number.isNaN(fecha.getTime())) return errorValidacion(res, 'fecha no válida');
        filtro.createdAt[operador] = fecha;
      }
    }
    if (cursor !== undefined) {
      const posicion = leerCursor(String(cursor));
      if (!posicion) return errorValidacion(res, 'cursor no válido');
      // "Anteriores al último enviado"; si dos tienen la misma fecha, desempata el _id.
      // Va en $and para no pisar el filtro de fechas, que también usa createdAt.
      filtro.$and = [
        {
          $or: [
            { createdAt: { $lt: posicion.fecha } },
            { createdAt: posicion.fecha, _id: { $lt: posicion.id } },
          ],
        },
      ];
    }

    // Uno de más para saber si hay otra página sin un count aparte.
    const encontrados = await BugReport.find(filtro)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limite + 1)
      .populate('userId', 'nombreCompleto email');
    const reports = encontrados.slice(0, limite);
    const ultimo = reports.at(-1);
    const siguienteCursor =
      encontrados.length > limite ? `${ultimo.createdAt.toISOString()}_${ultimo._id}` : null;

    res.status(200).json({ reports, siguienteCursor });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/reports/:id  { estado } → { report }
// PATCH y no PUT: solo cambia el estado; el resto del reporte es lo que envió el usuario y
// no se edita.
export const updateReport = async (req, res, next) => {
  try {
    const { estado } = req.body;
    if (!ESTADOS.includes(estado)) return errorValidacion(res, 'estado no válido');

    const report = await BugReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Not Found', message: 'Reporte no encontrado' });
    }
    report.estado = estado;
    await report.save();
    await report.populate('userId', 'nombreCompleto email');

    res.status(200).json({ report });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ error: 'Not Found', message: 'Reporte no encontrado' });
    }
    next(error);
  }
};

// Cuántos documentos de una colección tiene cada usuario de la lista: { "<userId>": n }.
// Una agregación por colección (tres en total), no tres consultas por usuario.
const contarPorUsuario = async (Modelo, ids) => {
  const grupos = await Modelo.aggregate([
    { $match: { userId: { $in: ids } } },
    { $group: { _id: '$userId', n: { $sum: 1 } } },
  ]);
  return Object.fromEntries(grupos.map((g) => [String(g._id), g.n]));
};

// GET /api/admin/users → { users, total }
// Usuarios registrados, más recientes primero: nombre, email, registro, último acceso, rol
// y cuántas sesiones, ejercicios y rutinas tienen.
export const listUsers = async (req, res, next) => {
  try {
    // .select con la lista de lo que SÍ se lee: si mañana el modelo gana un campo personal,
    // no aparece aquí sin que alguien lo añada a propósito.
    const [usuarios, total] = await Promise.all([
      User.find({})
        .select('nombreCompleto email createdAt ultimoAcceso rol')
        .sort({ createdAt: -1 })
        .limit(MAX_USUARIOS)
        .lean(),
      User.countDocuments({}),
    ]);

    const ids = usuarios.map((u) => u._id);
    const [sesiones, ejercicios, rutinas] = await Promise.all([
      contarPorUsuario(Session, ids),
      contarPorUsuario(Exercise, ids),
      contarPorUsuario(Workout, ids),
    ]);

    const users = usuarios.map((u) => {
      const id = String(u._id);
      return {
        _id: u._id,
        nombreCompleto: u.nombreCompleto,
        email: u.email,
        createdAt: u.createdAt,
        ultimoAcceso: u.ultimoAcceso ?? null,
        // Los usuarios anteriores al 11b.1 no tienen el campo en la base (.lean() no
        // aplica los valores por defecto del modelo).
        rol: u.rol ?? 'usuario',
        sesiones: sesiones[id] ?? 0,
        ejercicios: ejercicios[id] ?? 0,
        rutinas: rutinas[id] ?? 0,
      };
    });

    res.status(200).json({ users, total });
  } catch (error) {
    next(error);
  }
};
