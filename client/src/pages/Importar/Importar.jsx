import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listExercises } from '@/api/exercises.js';
import { despertarServidor } from '@/api/health.js';
import { deshacerLote, getOpcionesImportar, importarStrong, listarLotes, vistaPreviaStrong } from '@/api/importar.js';
import BotonIcono from '@/components/BotonIcono/BotonIcono.jsx';
import ConfirmDialog from '@/components/ConfirmDialog/ConfirmDialog.jsx';
import useOpcionesEjercicio from '@/hooks/useOpcionesEjercicio.js';
import { useAvisoSalir } from '@/hooks/useAvisoSalir.js';
import { cuerpoDecisiones, decisionesIniciales, errorTamano, mensajeError, textoDeshacer, zonaDelDispositivo } from '@/utils/importar.js';
import PasoElegir from '@/pages/Importar/PasoElegir.jsx';
import VistaPrevia from '@/pages/Importar/VistaPrevia.jsx';
import Emparejar from '@/pages/Importar/Emparejar.jsx';
import Resultado from '@/pages/Importar/Resultado.jsx';
import formulario from '@/styles/paginaFormulario.module.css';
import styles from '@/pages/Importar/Importar.module.css';

// Importar el historial desde Strong (bloque 7b; diseño: tarjeta Importar del design system).
// Recorrido en una sola página, con un paso cada vez:
//   1. elegir: el archivo y la unidad, y debajo las importaciones anteriores;
//   2. previa: lo que pasaría (sin escribir nada) y qué ejercicio tuyo es cada uno de Strong;
//      dentro, "emparejar" uno abre su buscador en lugar de la lista;
//   3. resultado: lo importado y "Deshacer esta importación".
// Aquí viven el estado y las llamadas a la API; los pasos solo pintan, y la lógica (qué falta,
// qué se junta, qué se envía, qué mensaje de error) está en utils/importar.js.
export default function Importar() {
  const navigate = useNavigate();
  const { opciones: opcionesEjercicio, error: errorOpcionesEjercicio } = useOpcionesEjercicio();

  const [opciones, setOpciones] = useState(null); // { maxBytes, unidades } del servidor
  const [lotes, setLotes] = useState(null);
  const [errorCarga, setErrorCarga] = useState('');

  const [paso, setPaso] = useState('elegir');
  const [archivo, setArchivo] = useState(null); // { nombre, tamano, texto }
  const [unidad, setUnidad] = useState('kg');
  const [vista, setVista] = useState(null);
  const [catalogo, setCatalogo] = useState(null);
  const [decisiones, setDecisiones] = useState({});
  const [incluidas, setIncluidas] = useState(() => new Set());
  const [emparejando, setEmparejando] = useState(null); // nombre de Strong del que se elige pareja
  const [resultado, setResultado] = useState(null);

  // Lo que está en marcha: solo una cosa a la vez, y el botón que la lanzó queda bloqueado.
  const [ocupado, setOcupado] = useState(null); // 'leyendo' | 'previa' | 'importando' | 'deshaciendo'
  const [error, setError] = useState('');
  const [aDeshacer, setADeshacer] = useState(null); // { lote, sesiones, fecha } pendiente de confirmar
  const [loteEnCurso, setLoteEnCurso] = useState(null); // el que se está deshaciendo
  // Freno del doble envío. Es una ref y no el estado `ocupado`: dos toques seguidos llegan antes
  // de que React vuelva a pintar, y los dos verían `ocupado` todavía a null (lo encontró la prueba
  // en Chrome: dos importaciones). La ref cambia en el acto.
  const enCurso = useRef(false);

  const cargarLotes = useCallback(
    () =>
      listarLotes()
        .then((res) => setLotes(res.data.lotes))
        .catch(() => setLotes((actuales) => actuales ?? [])),
    []
  );

  useEffect(() => {
    let montado = true;
    getOpcionesImportar()
      .then((res) => montado && setOpciones(res.data.opciones))
      .catch(() => montado && setErrorCarga('No se ha podido conectar con el servidor. Revisa la conexión y vuelve a entrar.'));
    cargarLotes();
    return () => {
      montado = false;
    };
  }, [cargarLotes]);

  // Aviso al salir (segunda condición de David): mientras importa o deshace, y en la vista previa
  // (se perderían los emparejamientos elegidos). Los textos cambian según el caso.
  const enMarcha = ocupado === 'importando' || ocupado === 'deshaciendo';
  const aviso = useAvisoSalir(enMarcha || paso === 'previa');
  const dialogoSalir = enMarcha
    ? {
        ...aviso.dialogo,
        title: ocupado === 'importando' ? 'Importación en curso' : 'Deshaciendo la importación',
        message: 'Sigue en el servidor aunque salgas. Para saber si ha terminado, vuelve a Importar y mira Importaciones anteriores.',
        confirmLabel: 'Salir',
        cancelLabel: 'Quedarme',
        confirmVariant: 'primary',
      }
    : {
        ...aviso.dialogo,
        title: 'Salir de la importación',
        message: 'No se ha importado nada todavía. Si sales, se pierden los emparejamientos que hayas elegido.',
        confirmLabel: 'Salir',
        cancelLabel: 'Seguir',
      };

  // 1. Elegir archivo: el tamaño se comprueba aquí, sin enviarlo (quinta condición).
  const elegirArchivo = async (file) => {
    setError('');
    setArchivo(null);
    if (!file) return;
    const demasiado = errorTamano(file.size, opciones.maxBytes);
    if (demasiado) {
      setError(demasiado);
      return;
    }
    setOcupado('leyendo');
    try {
      setArchivo({ nombre: file.name, tamano: file.size, texto: await file.text() });
    } catch {
      setError('No se ha podido leer el archivo.');
    } finally {
      setOcupado(null);
    }
  };

  const verVistaPrevia = async () => {
    setError('');
    setOcupado('previa');
    try {
      const [res, cat] = await Promise.all([
        vistaPreviaStrong({ csv: archivo.texto, zona: zonaDelDispositivo(), unidad }),
        listExercises(),
      ]);
      const v = res.data.vistaPrevia;
      setVista(v);
      setCatalogo(cat.data.exercises);
      setDecisiones(decisionesIniciales(v.ejercicios));
      setIncluidas(new Set());
      setPaso('previa');
      window.scrollTo(0, 0);
    } catch (err) {
      setError(mensajeError(err, 'previa'));
    } finally {
      setOcupado(null);
    }
  };

  // 2. Importar. Primero se despierta el servidor con /health (si dormía, el aviso de servidor
  // dormido sale como siempre); la importación no lo dispara, porque tardar es lo normal en ella.
  const importar = async () => {
    if (enCurso.current) return;
    enCurso.current = true;
    setError('');
    setOcupado('importando');
    try {
      await despertarServidor();
      const res = await importarStrong({
        csv: archivo.texto,
        zona: zonaDelDispositivo(),
        unidad,
        ...cuerpoDecisiones(decisiones),
        incluirCoincidencias: [...incluidas],
      });
      setResultado(res.data.importacion);
      setPaso('resultado');
      window.scrollTo(0, 0);
      cargarLotes();
    } catch (err) {
      setError(mensajeError(err, 'importar'));
    } finally {
      enCurso.current = false;
      setOcupado(null);
    }
  };

  // 3. Deshacer (desde el resultado o desde la lista), siempre después de confirmar.
  const deshacer = async () => {
    const { lote } = aDeshacer;
    setADeshacer(null);
    if (enCurso.current) return;
    enCurso.current = true;
    setError('');
    setOcupado('deshaciendo');
    setLoteEnCurso(lote);
    try {
      await despertarServidor();
      await deshacerLote(lote);
      if (resultado?.lote === lote) {
        setResultado(null);
        setPaso('elegir');
        setArchivo(null);
      }
      await cargarLotes();
    } catch (err) {
      setError(mensajeError(err, 'deshacer'));
    } finally {
      enCurso.current = false;
      setOcupado(null);
      setLoteEnCurso(null);
    }
  };

  const volver = () => {
    if (emparejando) setEmparejando(null);
    else if (paso === 'previa') setPaso('elegir');
    else navigate('/history');
  };

  const fallo = errorCarga || errorOpcionesEjercicio;
  const titulo = emparejando ?? (paso === 'previa' ? 'Vista previa' : paso === 'resultado' ? 'Importación hecha' : 'Importar desde Strong');

  return (
    <div className={formulario.page}>
      <header className={formulario.header}>
        <BotonIcono
          icono="atras"
          etiqueta={emparejando ? 'Volver a la vista previa' : paso === 'previa' ? 'Volver a elegir el archivo' : 'Volver al historial'}
          onClick={volver}
          disabled={enMarcha}
        />
        <h1 className={`${formulario.title} ${styles.titulo}`}>{titulo}</h1>
      </header>

      {fallo && <p className={formulario.errorBanner}>{fallo}</p>}
      {error && (
        <p className={formulario.errorBanner} role="alert">
          {error}
        </p>
      )}

      {!fallo && paso === 'elegir' && (
        <PasoElegir
          opciones={opciones}
          archivo={archivo}
          unidad={unidad}
          onUnidad={setUnidad}
          onArchivo={elegirArchivo}
          onVistaPrevia={verVistaPrevia}
          ocupado={ocupado}
          lotes={lotes}
          loteEnCurso={loteEnCurso}
          onDeshacer={setADeshacer}
        />
      )}

      {!fallo && paso === 'previa' && vista && opcionesEjercicio && !emparejando && (
        <VistaPrevia
          vista={vista}
          catalogo={catalogo}
          opcionesEjercicio={opcionesEjercicio}
          decisiones={decisiones}
          incluidas={incluidas}
          onIncluir={(clave) =>
            setIncluidas((actuales) => {
              const nuevas = new Set(actuales);
              if (nuevas.has(clave)) nuevas.delete(clave);
              else nuevas.add(clave);
              return nuevas;
            })
          }
          onEmparejar={(nombreStrong) => {
            setEmparejando(nombreStrong);
            window.scrollTo(0, 0);
          }}
          onImportar={importar}
          importando={ocupado === 'importando'}
        />
      )}

      {!fallo && paso === 'previa' && emparejando && (
        <Emparejar
          fila={vista.ejercicios.find((e) => e.nombreStrong === emparejando)}
          catalogo={catalogo}
          opcionesEjercicio={opcionesEjercicio}
          decisiones={decisiones}
          onDecidir={(decision) => {
            setDecisiones((actuales) => ({ ...actuales, [emparejando]: decision }));
            setEmparejando(null);
          }}
        />
      )}

      {paso === 'resultado' && resultado && (
        <Resultado
          resultado={resultado}
          deshaciendo={ocupado === 'deshaciendo'}
          onDeshacer={() => setADeshacer({ lote: resultado.lote, sesiones: resultado.sesiones, fecha: resultado.fecha })}
          onHistorial={() => navigate('/history')}
        />
      )}

      <ConfirmDialog
        open={aDeshacer !== null}
        title="¿Deshacer esta importación?"
        message={aDeshacer ? textoDeshacer(aDeshacer) : ''}
        confirmLabel={aDeshacer ? `Borrar ${aDeshacer.sesiones} ${aDeshacer.sesiones === 1 ? 'sesión' : 'sesiones'}` : ''}
        cancelLabel="Cancelar"
        confirmVariant="danger"
        onConfirm={deshacer}
        onCancel={() => setADeshacer(null)}
      />
      <ConfirmDialog {...dialogoSalir} />
    </div>
  );
}
