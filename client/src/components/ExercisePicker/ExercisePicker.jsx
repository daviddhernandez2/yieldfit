import { useState, useMemo } from 'react';
import Chip from '@/components/Chip/Chip.jsx';
import Proximamente from '@/components/Proximamente/Proximamente.jsx';
import CrearEjercicio from '@/components/ExercisePicker/CrearEjercicio.jsx';
import NombreEjercicio from '@/components/NombreEjercicio/NombreEjercicio.jsx';
import { tipoDisponible } from '@/hooks/useOpcionesEjercicio.js';
import styles from '@/components/ExercisePicker/ExercisePicker.module.css';

const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// Catálogo de ejercicios para elegir uno: buscador, chips de grupo muscular y lista.
// Lo usan WorkoutForm (añadir o quitar de la rutina) y la sesión activa (reemplazar un
// ejercicio, bloque 6). El buscador y el filtro son estado propio: quien lo usa solo se
// entera de qué ejercicio se ha pulsado.
//
// Props:
//   - ejercicios: el catálogo del usuario (GET /api/exercises).
//   - opciones: grupos y tipos del servidor (useOpcionesEjercicio).
//   - seleccionados: Set de ids que se marcan con un check (los ya añadidos a la rutina).
//   - excluidos: Set de ids que no se muestran (p. ej. los que ya están en la sesión).
//   - onElegir(exerciseId): al pulsar un ejercicio.
//   - listaCompleta: sin altura máxima en la lista (en una página propia, como la de
//     reemplazar, hace scroll la página entera y no una caja dentro).
//   - onCreado(ejercicio): si se pasa, cuando lo buscado no existe aparece "+ Crear «…»" y
//     se puede crear ahí mismo (CrearEjercicio). Quien usa el buscador lo añade a su lista.
//   - permitirBloqueados: los ejercicios de un tipo bloqueado se pueden elegir. Solo para la
//     importación de Strong (bloque 7b): una carrera de Strong se empareja con "Carrera
//     continua" aunque la sesión activa todavía no sepa registrar cardio.
//
// Un ejercicio de un tipo bloqueado (cardio, 0030) sale con "Próximamente" y no se puede
// pulsar, salvo que ya esté seleccionado (así se puede quitar de una rutina que ya lo tenía)
// o que se pida permitirBloqueados.
export default function ExercisePicker({
  ejercicios,
  opciones,
  seleccionados = new Set(),
  excluidos = new Set(),
  onElegir,
  listaCompleta = false,
  onCreado,
  permitirBloqueados = false,
}) {
  const [busqueda, setBusqueda] = useState('');
  const [grupo, setGrupo] = useState(null);
  const [creando, setCreando] = useState(false);

  // "+ Crear" solo si se ha escrito algo y ningún ejercicio se llama exactamente así
  // (sin distinguir mayúsculas ni espacios de los extremos). Mira todo el catálogo, también
  // los excluidos: si ya existe, no se ofrece crear un duplicado.
  const textoBuscado = busqueda.trim();
  const existeExacto = ejercicios.some((ex) => ex.nombre.trim().toLowerCase() === textoBuscado.toLowerCase());
  const puedeCrear = Boolean(onCreado) && textoBuscado.length >= 2 && !existeExacto;

  const handleCreado = (ejercicio) => {
    setCreando(false);
    setBusqueda('');
    onCreado(ejercicio);
  };

  const visibles = useMemo(() => {
    const texto = busqueda.toLowerCase();
    return ejercicios.filter((ex) => {
      if (excluidos.has(ex._id)) return false;
      if (grupo && ex.grupoMuscular !== grupo) return false;
      if (texto && !ex.nombre.toLowerCase().includes(texto)) return false;
      return true;
    });
  }, [ejercicios, excluidos, grupo, busqueda]);

  // Pulsar el chip activo lo desactiva (vuelve a mostrar todos los grupos).
  const handleGrupoClick = (valor) => {
    setGrupo((actual) => (actual === valor ? null : valor));
  };

  return (
    <div className={styles.picker}>
      <input
        type="text"
        placeholder="Buscar ejercicio"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className={styles.searchInput}
      />

      <div className={styles.filtersScroll}>
        <div className={styles.filters}>
          {opciones.gruposMusculares.map((g) => (
            <Chip
              key={g.value}
              label={g.label}
              selected={grupo === g.value}
              onClick={() => handleGrupoClick(g.value)}
            />
          ))}
        </div>
      </div>

      <div className={`${styles.catalogo} ${listaCompleta ? styles.catalogoCompleto : ''} glassCard`}>
        {visibles.length === 0 && !puedeCrear && <p className={styles.vacio}>No hay ejercicios con esos filtros.</p>}
        {visibles.map((ex) => {
          const isSelected = seleccionados.has(ex._id);
          const disponible = permitirBloqueados || tipoDisponible(opciones, ex.tipo);
          return (
            <button
              key={ex._id}
              type="button"
              onClick={() => onElegir(ex._id)}
              disabled={!disponible && !isSelected}
              className={`${styles.catalogoItem} ${isSelected ? styles.catalogoItemSelected : ''}`}
            >
              {/* Grupo y tipo bajo el nombre: distingue "Press en máquina" de pecho y de hombros. */}
              <NombreEjercicio
                className={styles.catalogoItemName}
                nombre={ex.nombre}
                grupoMuscular={ex.grupoMuscular}
                tipo={ex.tipo}
                opciones={opciones}
              />
              <span className={styles.catalogoItemMeta}>{!disponible && <Proximamente />}</span>
              {isSelected && (
                <span className={styles.catalogoItemCheck}>
                  <IconCheck />
                </span>
              )}
            </button>
          );
        })}

        {/* Lo buscado no existe: crearlo aquí mismo, sin salir de la pantalla. */}
        {puedeCrear && !creando && (
          <button type="button" className={`${styles.catalogoItem} ${styles.crearFila}`} onClick={() => setCreando(true)}>
            <span className={styles.catalogoItemName}>+ Crear «{textoBuscado}»</span>
          </button>
        )}
      </div>

      {creando && (
        <CrearEjercicio
          nombreInicial={textoBuscado}
          grupoInicial={grupo}
          opciones={opciones}
          onCreado={handleCreado}
          onCancelar={() => setCreando(false)}
        />
      )}
    </div>
  );
}
