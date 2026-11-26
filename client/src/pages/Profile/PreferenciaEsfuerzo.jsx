import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth.js';
import useOpcionesEjercicio from '@/hooks/useOpcionesEjercicio.js';
import RadioGroup from '@/components/RadioGroup/RadioGroup.jsx';
import styles from '@/pages/Profile/Profile.module.css';

// "Esfuerzo por serie" en Perfil (bloque 5c, tarjeta Esfuerzo del design system): no mostrar,
// RPE o RIR. Las opciones las manda el servidor (GET /api/exercises/opciones); aquí no se copian.
// Se guarda al tocar, sin botón, como un interruptor: se ve elegido al momento y, si el servidor
// falla, vuelve a lo que había y lo avisa.
export default function PreferenciaEsfuerzo() {
  const { user, cambiarPreferencias } = useAuth();
  const { opciones } = useOpcionesEjercicio();
  const guardado = user.preferencias?.esfuerzo ?? 'no';
  // Lo que se ve mientras se guarda (null: lo guardado).
  const [elegido, setElegido] = useState(null);
  const [error, setError] = useState('');

  const cambiar = async (esfuerzo) => {
    if (esfuerzo === guardado) return;
    setElegido(esfuerzo);
    setError('');
    try {
      await cambiarPreferencias({ esfuerzo });
    } catch {
      setError('No se ha podido guardar. Inténtalo de nuevo.');
    } finally {
      setElegido(null);
    }
  };

  // Sin opciones (sin cobertura) no se pinta: no hay con qué elegir.
  if (!opciones?.esfuerzo) return null;

  return (
    <section className={`${styles.detailsSection} glassCard`} aria-labelledby="titulo-entrenamiento">
      <h2 id="titulo-entrenamiento" className={styles.detailsTitle}>
        Entrenamiento
      </h2>
      <RadioGroup
        label="Esfuerzo por serie"
        name="esfuerzo"
        value={elegido ?? guardado}
        onChange={cambiar}
        options={opciones.esfuerzo.opciones}
        error={error}
      />
      <p className={styles.ayudaPreferencia}>
        RPE: de {opciones.esfuerzo.rpe.min} a {opciones.esfuerzo.rpe.max}, cuánto esfuerzo te costó la serie. RIR:
        repeticiones que te quedaban (10 − RPE). Es opcional en cada serie.
      </p>
    </section>
  );
}
