import { useState } from 'react';
import Button from '@/components/Button/Button.jsx';
import ExercisePicker from '@/components/ExercisePicker/ExercisePicker.jsx';
import Input from '@/components/Input/Input.jsx';
import Select from '@/components/Select/Select.jsx';
import { ejercicioConNombre, otroQueCrea } from '@/utils/importar.js';
import styles from '@/pages/Importar/Importar.module.css';

const esCardio = (tracking) => tracking === 'tiempo_distancia';

// Elegir la pareja de UN ejercicio de Strong (paso 2 de la importación): uno de tus ejercicios con
// el buscador de siempre, o uno nuevo. Solo se ofrecen los compatibles (decisión 3): para lo que
// trae peso y reps, ejercicios de fuerza; para una carrera, de cardio (que aquí sí se pueden
// elegir y crear, decisión 1, aunque la sesión activa los tenga en "Próximamente").
//
// Tercera opción, "No importar" (decisión de David): sus series se quedan fuera y el resto de cada
// entreno sí entra; se recuerda para la próxima vez.
//
// El nuevo NO se crea al pulsar: queda como decisión y se crea al importar, dentro de la misma
// transacción (si la importación falla, no queda un ejercicio suelto). Por eso no se usa el
// "+ Crear" del buscador, que lo crea en el momento.
// Props: fila (la de la vista previa), catalogo, opcionesEjercicio, decisiones, onDecidir(decisión).
export default function Emparejar({ fila, catalogo, opcionesEjercicio, decisiones, onDecidir }) {
  const actual = decisiones[fila.nombreStrong];
  const cardio = esCardio(fila.tracking);
  const incompatibles = new Set(catalogo.filter((e) => e.tracking !== fila.tracking).map((e) => e._id));

  // Para uno de fuerza, todos los tipos menos Cardio (Cardio + Cardio sería un ejercicio de
  // tiempo y distancia). Para uno de cardio, grupo y tipo son Cardio, sin elegir.
  const tipos = opcionesEjercicio.tipos.filter((t) => t.value !== 'Cardio').map(({ value, label }) => ({ value, label }));
  const propuesta = actual?.crear ?? fila.crear;
  const [nombre, setNombre] = useState(propuesta?.nombre ?? fila.nombreStrong);
  const [grupoMuscular, setGrupoMuscular] = useState(
    cardio ? 'Cardio' : propuesta?.grupoMuscular ?? opcionesEjercicio.gruposMusculares[0].value
  );
  const [tipo, setTipo] = useState(cardio ? 'Cardio' : propuesta?.tipo ?? tipos[0]?.value);

  const yaTienes = ejercicioConNombre(catalogo, nombre);
  const loCreaOtro = otroQueCrea(decisiones, nombre, fila.nombreStrong);
  const puedeCrear = nombre.trim().length >= 2 && !yaTienes && !loCreaOtro;

  return (
    <>
      <p className={styles.texto}>
        {fila.series.toLocaleString('es-ES')} {fila.series === 1 ? 'serie' : 'series'} en Strong{cardio && ' · cardio'}. Elige uno de tus ejercicios
        {cardio ? ' de cardio' : ''} o crea uno nuevo.
      </p>

      <ExercisePicker
        ejercicios={catalogo}
        opciones={opcionesEjercicio}
        excluidos={incompatibles}
        seleccionados={new Set(actual?.exerciseId ? [actual.exerciseId] : [])}
        onElegir={(exerciseId) => onDecidir({ exerciseId })}
        permitirBloqueados
      />
      {/* Sin listaCompleta: la lista va en su caja con altura máxima (como en el formulario de
          rutinas), para que "O crear uno nuevo" se vea sin bajar más allá de 58 ejercicios. */}

      <section className={styles.tarjeta}>
        <h2 className={styles.tituloTarjeta}>O crear uno nuevo</h2>
        <Input id="nombre-nuevo" label="Nombre" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={100} />

        {/* Decisión de David: un nombre que ya tienes (sin mayúsculas ni acentos) no se crea otra
            vez; se propone usar el tuyo. El servidor también lo rechaza. */}
        {yaTienes && (
          <div className={styles.aviso}>
            <p>
              <b>Ya tienes «{yaTienes.nombre}». </b>
              {yaTienes.tracking === fila.tracking
                ? 'Usa ese en lugar de crear otro con el mismo nombre (no distingue mayúsculas ni acentos).'
                : `Es de ${esCardio(yaTienes.tracking) ? 'cardio' : 'fuerza'} y este no: ponle otro nombre al nuevo.`}
            </p>
            {yaTienes.tracking === fila.tracking && (
              <Button size="sm" variant="primary" onClick={() => onDecidir({ exerciseId: yaTienes._id })}>
                Usar «{yaTienes.nombre}»
              </Button>
            )}
          </div>
        )}
        {!yaTienes && loCreaOtro && (
          <div className={styles.aviso}>
            <p>
              <b>«{loCreaOtro}» ya va a crear uno con ese nombre. </b>Ponle otro nombre, o empareja los dos con el mismo ejercicio tuyo.
            </p>
          </div>
        )}

        {cardio ? (
          <p className={styles.textoPequeno}>Grupo y tipo: Cardio (con tiempo y distancia).</p>
        ) : (
          <>
            <div className={styles.selects}>
              <Select label="Grupo muscular" value={grupoMuscular} onChange={(e) => setGrupoMuscular(e.target.value)} options={opcionesEjercicio.gruposMusculares} />
              <Select label="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} options={tipos} />
            </div>
            {fila.crear && <p className={styles.textoPequeno}>El tipo se propone por lo que va entre paréntesis en Strong («Cable» → Poleas).</p>}
          </>
        )}

        <div>
          <Button size="sm" variant="primary" disabled={!puedeCrear} onClick={() => onDecidir({ crear: { nombre: nombre.trim(), grupoMuscular, tipo } })}>
            Crear y usar
          </Button>
        </div>
      </section>

      <section className={styles.tarjeta}>
        <h2 className={styles.tituloTarjeta}>O no importarlo</h2>
        <p className={styles.textoPequeno}>
          {fila.series === 1 ? 'Su única serie se queda' : `Sus ${fila.series.toLocaleString('es-ES')} series se quedan`} fuera; el resto de cada entreno sí se importa. Si un
          entreno solo tenía ejercicios que no importas, se salta. Se recuerda para la próxima vez y se puede cambiar.
        </p>
        <div>
          <Button size="sm" variant="outline" disabled={Boolean(actual?.omitir)} onClick={() => onDecidir({ omitir: true })}>
            {actual?.omitir ? 'Ya no se importa' : 'No importar este ejercicio'}
          </Button>
        </div>
      </section>
    </>
  );
}
