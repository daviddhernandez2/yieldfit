import { useState, useMemo } from 'react';
import Chip from '@/components/Chip/Chip.jsx';
import Proximamente from '@/components/Proximamente/Proximamente.jsx';
import { etiquetaDe, tipoDisponible } from '@/hooks/useOpcionesEjercicio.js';
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
//
// Un ejercicio de un tipo bloqueado (cardio, 0030) sale con "Próximamente" y no se puede
// pulsar, salvo que ya esté seleccionado: así se puede quitar de una rutina que ya lo tenía.
export default function ExercisePicker({
  ejercicios,
  opciones,
  seleccionados = new Set(),
  excluidos = new Set(),
  onElegir,
}) {
  const [busqueda, setBusqueda] = useState('');
  const [grupo, setGrupo] = useState(null);

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

      <div className={`${styles.catalogo} glassCard`}>
        {visibles.length === 0 && <p className={styles.vacio}>No hay ejercicios con esos filtros.</p>}
        {visibles.map((ex) => {
          const isSelected = seleccionados.has(ex._id);
          const disponible = tipoDisponible(opciones, ex.tipo);
          return (
            <button
              key={ex._id}
              type="button"
              onClick={() => onElegir(ex._id)}
              disabled={!disponible && !isSelected}
              className={`${styles.catalogoItem} ${isSelected ? styles.catalogoItemSelected : ''}`}
            >
              <span className={styles.catalogoItemName}>{ex.nombre}</span>
              <span className={styles.catalogoItemMeta}>
                {disponible ? etiquetaDe(opciones.gruposMusculares, ex.grupoMuscular) : <Proximamente />}
              </span>
              {isSelected && (
                <span className={styles.catalogoItemCheck}>
                  <IconCheck />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
