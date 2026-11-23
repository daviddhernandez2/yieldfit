import { useState } from 'react';
import { createExercise } from '@/api/exercises.js';
import Select from '@/components/Select/Select.jsx';
import Button from '@/components/Button/Button.jsx';
import GrupoBotones from '@/components/GrupoBotones/GrupoBotones.jsx';
import styles from '@/components/ExercisePicker/ExercisePicker.module.css';

// Mini formulario para crear un ejercicio sin salir del buscador (bloque 9b, DECISIONS.md
// 0036). Lo abre ExercisePicker cuando lo buscado no existe: el nombre llega ya escrito y
// el grupo, si había un chip activo. Al crearlo, avisa con onCreado(ejercicio) y quien usa
// el buscador lo añade (rutina), lo marca (grupo) o lo elige (reemplazar).
export default function CrearEjercicio({ nombreInicial, grupoInicial, opciones, onCreado, onCancelar }) {
  // Primer tipo disponible como valor por defecto ("Pesas libres" si está): nunca uno
  // bloqueado como el cardio.
  const tipoPorDefecto =
    opciones.tipos.find((t) => t.value === 'Pesas libres' && t.disponible !== false)?.value ??
    opciones.tipos.find((t) => t.disponible !== false)?.value;

  const [nombre, setNombre] = useState(nombreInicial);
  const [grupoMuscular, setGrupoMuscular] = useState(grupoInicial ?? opciones.gruposMusculares[0].value);
  const [tipo, setTipo] = useState(tipoPorDefecto);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  // Mismo tratamiento que ExerciseForm: los tipos bloqueados se ven pero no se eligen.
  const opcionesTipo = opciones.tipos.map((t) =>
    t.disponible === false ? { ...t, label: `${t.label} (próximamente)`, disabled: true } : t,
  );

  const crear = async () => {
    setError('');
    setGuardando(true);
    try {
      const res = await createExercise({ nombre: nombre.trim(), grupoMuscular, tipo });
      onCreado(res.data.exercise);
    } catch (err) {
      const data = err.response?.data;
      setError(data?.details?.[0] || data?.message || 'No se ha podido crear el ejercicio.');
      setGuardando(false);
    }
  };

  // No es un <form>: el buscador vive dentro de otros formularios (rutina, grupo) y un
  // formulario dentro de otro no es válido en HTML. Enter en el nombre también crea.
  return (
    <div className={styles.crear}>
      <p className={styles.crearTitulo}>Nuevo ejercicio</p>
      <label className={styles.crearCampo}>
        <span>Nombre</span>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (nombre.trim() && !guardando) crear();
            }
          }}
          maxLength={40}
          className={styles.searchInput}
          autoFocus
        />
      </label>
      <div className={styles.crearSelects}>
        <Select label="Grupo muscular" value={grupoMuscular} onChange={(e) => setGrupoMuscular(e.target.value)} options={opciones.gruposMusculares} />
        <Select label="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} options={opcionesTipo} />
      </div>
      {error && <p className={styles.crearError} role="alert">{error}</p>}
      <GrupoBotones>
        <Button type="button" variant="outline" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </Button>
        <Button type="button" variant="primary" onClick={crear} disabled={guardando || !nombre.trim()}>
          {guardando ? 'Creando...' : 'Crear y añadir'}
        </Button>
      </GrupoBotones>
    </div>
  );
}
