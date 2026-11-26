import { useState } from 'react';
import Button from '@/components/Button/Button.jsx';
import { formatHora } from '@/utils/formato.js';
import { paresQueSeJuntan, sesionesAImportar, sinEmparejar } from '@/utils/importar.js';
import styles from '@/pages/Importar/Importar.module.css';

const ESTADO = { recordado: 'recordado', nombre: 'mismo nombre', equivalencia: 'propuesto' };
const numero = (n) => n.toLocaleString('es-ES');
const plural = (n, uno, varios) => `${numero(n)} ${n === 1 ? uno : varios}`;
// "16 may – 20 nov 2026" a partir de dos días 'YYYY-MM-DD'.
const rango = (desde, hasta) => {
  const f = (dia, conAnio) =>
    new Date(`${dia}T12:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', ...(conAnio && { year: 'numeric' }) }).replace('.', '');
  return desde === hasta ? f(hasta, true) : `${f(desde, desde.slice(0, 4) !== hasta.slice(0, 4))} – ${f(hasta, true)}`;
};
const diaLargo = (dia) =>
  new Date(`${dia}T12:00:00`).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).replace(/\./g, '');

// Paso 2 de la importación: lo que pasaría, sin haber escrito nada todavía. Resumen, avisos y
// errores, los días que coinciden con sesiones tuyas (cada uno con su interruptor, saltados por
// defecto) y la pareja de cada ejercicio de Strong, con la franja de "Importar" fija abajo.
// Los ejercicios van en el orden que manda el servidor (sin emparejar, propuestos, recordados) y
// NO se reordenan al elegir: una fila que salta de sitio al tocarla desorienta.
export default function VistaPrevia({ vista, catalogo, opcionesEjercicio, decisiones, incluidas, onIncluir, onEmparejar, onImportar, importando }) {
  const [verErrores, setVerErrores] = useState(false);
  const { resumen } = vista;
  const faltan = sinEmparejar(vista.ejercicios, decisiones);
  const aImportar = sesionesAImportar(vista, incluidas);
  const juntados = paresQueSeJuntan(vista.ejercicios, decisiones);
  const porId = new Map(catalogo.map((e) => [e._id, e]));
  const etiquetaTipo = (v) => opcionesEjercicio.tipos.find((t) => t.value === v)?.label ?? v;
  const etiquetaGrupo = (v) => opcionesEjercicio.gruposMusculares.find((g) => g.value === v)?.label ?? v;

  if (resumen.sesiones === 0) {
    return (
      <section className={styles.tarjeta}>
        <h2 className={styles.tituloTarjeta}>No hay nada nuevo</h2>
        <p className={styles.texto}>
          {resumen.yaImportadas > 0
            ? `Las ${numero(resumen.yaImportadas)} sesiones de este archivo ya están importadas.`
            : 'El archivo no tiene ninguna sesión que se pueda importar.'}
        </p>
      </section>
    );
  }

  const textoBarra = () => {
    if (faltan > 0) return `Falta emparejar ${plural(faltan, 'ejercicio', 'ejercicios')}`;
    if (aImportar === 0) return 'Todas coinciden con días que ya tienes: activa alguna para importarla';
    return 'Lo que elijas se recuerda para la próxima vez';
  };

  return (
    <>
      <div className={styles.resumen}>
        <div className={styles.dato}>
          <b>{numero(resumen.sesiones)}</b>
          <span>{resumen.sesiones === 1 ? 'sesión nueva' : 'sesiones nuevas'}</span>
        </div>
        <div className={styles.dato}>
          <b>{numero(resumen.yaImportadas)}</b>
          <span>ya importadas</span>
        </div>
        <div className={styles.dato}>
          <b>{numero(resumen.series)}</b>
          <span>series</span>
        </div>
        <div className={styles.dato}>
          <b className={styles.datoTexto}>{rango(resumen.desde, resumen.hasta)}</b>
          <span>fechas</span>
        </div>
      </div>

      {/* Avisos: lo que se ajusta sin ser un error. */}
      {(resumen.notasCortadas > 0 || vista.avisos.rpeQuitados > 0 || vista.avisos.seriesVacias > 0 || vista.avisos.horasInexistentes > 0) && (
        <div className={styles.aviso}>
          {resumen.notasCortadas > 0 && (
            <p>
              <b>Notas: </b>
              {plural(resumen.notasCortadas, 'sesión junta', 'sesiones juntan')} más de 500 caracteres de notas y se cortan.
            </p>
          )}
          {vista.avisos.rpeQuitados > 0 && (
            <p>
              <b>RPE: </b>
              {plural(vista.avisos.rpeQuitados, 'serie tiene', 'series tienen')} un RPE fuera de 1–10 (o de los pasos de 0,5): se importan sin él.
            </p>
          )}
          {vista.avisos.seriesVacias > 0 && (
            <p>
              <b>Series vacías: </b>
              {plural(vista.avisos.seriesVacias, 'serie no tiene', 'series no tienen')} ni peso ni reps ni tiempo: no se importan.
            </p>
          )}
          {vista.avisos.horasInexistentes > 0 && (
            <p>
              <b>Cambio de hora: </b>
              {plural(vista.avisos.horasInexistentes, 'sesión empieza', 'sesiones empiezan')} a una hora que no existe ese día; se pasa a la hora siguiente.
            </p>
          )}
        </div>
      )}

      {/* Errores por fila (decisión de David): el recuento encima de la lista. */}
      {vista.totalErrores > 0 && (
        <div className={`${styles.aviso} ${styles.avisoError}`}>
          <p>
            <b>{plural(vista.seriesDescartadas, 'serie no se importará', 'series no se importarán')}</b> por datos que no se entienden.
          </p>
          <button type="button" className={styles.enlace} onClick={() => setVerErrores((v) => !v)} aria-expanded={verErrores}>
            {verErrores ? 'Ocultar el detalle' : 'Ver el detalle'}
          </button>
          {verErrores && (
            <ul className={styles.errores}>
              {vista.errores.map((e) => (
                <li key={`${e.fila}-${e.mensaje}`}>
                  <span className={styles.errorFila}>Línea {e.fila}</span> {e.mensaje}
                </li>
              ))}
              {vista.totalErrores > vista.errores.length && <li>…y {numero(vista.totalErrores - vista.errores.length)} más.</li>}
            </ul>
          )}
        </div>
      )}

      {vista.coincidencias.length > 0 && (
        <section className={styles.tarjeta}>
          <h2 className={styles.tituloTarjeta}>Días con sesiones tuyas ({vista.coincidencias.length})</h2>
          <p className={styles.textoPequeno}>Esos días ya tienes una sesión registrada aquí. Por defecto no se importan; actívalo si es otro entreno.</p>
          <ul className={styles.lista}>
            {vista.coincidencias.map((c) => {
              const activa = incluidas.has(c.clave);
              return (
                <li key={c.clave} className={styles.fila}>
                  <div className={styles.filaTexto}>
                    <span className={styles.filaNombre}>{diaLargo(c.dia)}</span>
                    <span className={styles.filaSub}>
                      Strong: {c.nombre} · {formatHora(c.fecha)}
                    </span>
                    {c.sesionesApp.map((s) => (
                      <span key={String(s.fecha)} className={styles.filaSub}>
                        Tuya: {s.nombre} · {formatHora(s.fecha)}
                      </span>
                    ))}
                  </div>
                  <span className={styles.estadoInterruptor} aria-hidden="true">
                    {activa ? 'Importar' : 'Saltar'}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={activa}
                    aria-label={`Importar también la sesión de Strong del ${diaLargo(c.dia)}`}
                    className={`${styles.interruptor} ${activa ? styles.interruptorActivo : ''}`}
                    onClick={() => onIncluir(c.clave)}
                    disabled={importando}
                  />
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className={styles.tarjeta}>
        <div className={styles.cabeceraTarjeta}>
          <h2 className={styles.tituloTarjeta}>Ejercicios ({vista.ejercicios.length})</h2>
          {faltan > 0 && <span className={styles.contadorFalta}>{numero(faltan)} sin emparejar</span>}
        </div>
        <p className={styles.textoPequeno}>A qué ejercicio tuyo va cada uno. Arriba los que faltan; al final, los que ya recordabas. Lo que elijas se recuerda para la próxima vez.</p>

        {juntados.length > 0 && (
          <div className={styles.aviso}>
            {juntados.map((p) => (
              <p key={`${p.a}|${p.b}`}>
                <b>Se juntan: </b>«{p.a}» y «{p.b}» van a «{porId.get(p.exerciseId)?.nombre}». En los entrenos en que salen los dos, quedan como un solo ejercicio con las series seguidas.
              </p>
            ))}
          </div>
        )}

        <ul className={styles.lista}>
          {vista.ejercicios.map((e) => {
            const d = decisiones[e.nombreStrong];
            const propio = d?.exerciseId ? porId.get(d.exerciseId) : null;
            // El estado solo se dice si la decisión sigue siendo la propuesta del servidor.
            const esLaPropuesta = d?.exerciseId && d.exerciseId === e.exerciseId;
            return (
              <li key={e.nombreStrong} className={styles.fila}>
                <div className={styles.filaTexto}>
                  <span className={styles.filaNombre}>{e.nombreStrong}</span>
                  <span className={styles.filaSub}>
                    {plural(e.series, 'serie', 'series')}
                    {e.tracking === 'tiempo_distancia' && ' · cardio'} ·{' '}
                    {propio && (
                      <>
                        → <b className={styles.pareja}>{propio.nombre}</b>
                        {esLaPropuesta && ESTADO[e.motivo] && ` (${ESTADO[e.motivo]})`}
                      </>
                    )}
                    {d?.crear && (
                      <>
                        Crear: <b className={styles.pareja}>{d.crear.nombre}</b> ({etiquetaGrupo(d.crear.grupoMuscular)} · {etiquetaTipo(d.crear.tipo)})
                      </>
                    )}
                    {!d && <span className={styles.falta}>Sin emparejar</span>}
                  </span>
                </div>
                <button type="button" className={styles.accionFila} onClick={() => onEmparejar(e.nombreStrong)} disabled={importando}>
                  {d ? 'Cambiar' : 'Elegir'}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Franja fija abajo: dice qué falta y se activa cuando todo tiene pareja. */}
      <div className={styles.barra}>
        <Button variant="primary" fullWidth disabled={faltan > 0 || aImportar === 0 || importando} onClick={onImportar}>
          {importando ? 'Importando…' : `Importar ${plural(aImportar, 'sesión', 'sesiones')}`}
        </Button>
        <span className={styles.barraTexto}>{importando ? 'Puede tardar un minuto. No cierres la app hasta que termine.' : textoBarra()}</span>
      </div>
    </>
  );
}
