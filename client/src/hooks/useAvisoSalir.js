import { useEffect, useRef } from 'react';
import { useBlocker } from 'react-router-dom';

// Aviso "Tienes cambios sin guardar" al salir de un formulario (bloque 11b, paso 11b.7).
//
// Uso en un formulario:
//   const aviso = useAvisoSalir(hayCambios(inicial, actual));
//   ...al guardar o borrar con éxito: aviso.permitirSalida(); navigate(...)
//   ...en el JSX: <ConfirmDialog {...aviso.dialogo} />
//
// Dos mecanismos, porque hay dos formas de irse:
//   1. useBlocker (React Router): cualquier navegación DENTRO de la app (la flecha de volver,
//      el menú, la barra de pestañas), el botón atrás del navegador y el gesto de deslizar
//      del iPhone. La frena y deja decidir con nuestro diálogo. Solo funciona con el data
//      router (createBrowserRouter, App.jsx).
//   2. beforeunload (navegador): cerrar la pestaña o recargar. El navegador enseña SU aviso,
//      con texto genérico: el nuestro no se puede poner. Safari en el iPhone no lo muestra.
// Ninguno de los dos actúa si no hay cambios.
export function useAvisoSalir(conCambios) {
  // Después de guardar o borrar, el formulario navega fuera a propósito: no hay que
  // preguntar. Es un ref y no estado porque se marca y se navega en la misma función, sin
  // esperar a otro render; el bloqueador lo lee en el momento de la navegación.
  const salidaPermitida = useRef(false);

  // Solo se bloquea si cambia la página (pathname). Cambiar solo la parte de después de
  // "?" o "#" en la misma página no pierde nada.
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      conCambios && !salidaPermitida.current && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (!conCambios) return;
    const alSalir = (e) => {
      e.preventDefault();
      // Navegadores antiguos solo muestran el aviso si returnValue tiene algo.
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', alSalir);
    return () => window.removeEventListener('beforeunload', alSalir);
  }, [conCambios]);

  return {
    permitirSalida: () => {
      salidaPermitida.current = true;
    },
    // Props listas para <ConfirmDialog />. "Salir sin guardar" deja seguir la navegación
    // que se frenó (proceed); "Seguir editando" la cancela y te quedas (reset).
    dialogo: {
      open: blocker.state === 'blocked',
      title: 'Cambios sin guardar',
      message: 'Tienes cambios sin guardar. ¿Salir y perderlos?',
      confirmLabel: 'Salir sin guardar',
      cancelLabel: 'Seguir editando',
      confirmVariant: 'danger',
      onConfirm: () => blocker.proceed?.(),
      onCancel: () => blocker.reset?.(),
    },
  };
}
