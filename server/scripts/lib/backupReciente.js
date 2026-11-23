// Comprueba que hay un backup de producción reciente antes de que un script escriba en
// producción (reparar-borrados.js, migrar-1rm.js). Ver docs/operaciones.md.
//
// Busca el backup más reciente en ~/yieldfit-backups (la carpeta de backup.sh) y exige
// que tenga el archivo y su huella, y que sea de hace menos de MINUTOS_BACKUP. No
// comprueba que se pueda restaurar: eso lo hace backup:restore-test, que va antes en el
// procedimiento. Lanza un error si algo falta; si todo está bien, devuelve el backup.

import { existsSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const MINUTOS_BACKUP = 60;

export const comprobarBackupReciente = () => {
  const carpeta = join(homedir(), 'yieldfit-backups');
  const backups = existsSync(carpeta)
    ? readdirSync(carpeta)
        .filter((nombre) => /^\d{4}-\d{2}-\d{2}_\d{4}$/.test(nombre))
        .sort()
    : [];
  if (backups.length === 0) {
    throw new Error('No hay ningún backup en ~/yieldfit-backups. Ejecuta antes: npm run backup');
  }
  const ultimo = join(carpeta, backups.at(-1));
  const archivo = join(ultimo, 'yieldfit.archive.gz');
  if (!existsSync(archivo) || !existsSync(`${archivo}.sha256`)) {
    throw new Error(`El último backup (${backups.at(-1)}) está incompleto. Ejecuta: npm run backup`);
  }
  const minutos = (Date.now() - statSync(archivo).mtimeMs) / 60000;
  if (minutos > MINUTOS_BACKUP) {
    throw new Error(
      `El último backup es de hace ${Math.round(minutos)} minutos (máximo ${MINUTOS_BACKUP}). ` +
        'Ejecuta antes: npm run backup'
    );
  }
  return { nombre: backups.at(-1), minutos: Math.round(minutos) };
};
