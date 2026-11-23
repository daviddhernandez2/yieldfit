# Nota de privacidad

[← Índice](README.md)

La nota que leen los usuarios es una página de la app: `/privacidad`
(`client/src/pages/Privacidad/Privacidad.jsx`), pública y enlazada desde el registro y desde Perfil
(bloque 11b). **El texto está solo ahí**, para no tener dos versiones que se contradigan: este
documento explica cuándo hay que tocarlo.

Es una nota informativa en lenguaje llano, no un texto legal. Si la app se abre al público, hay
que revisarla con alguien que sepa de RGPD.

## Cuándo hay que actualizarla

Cada vez que cambie algo de esto, se cambia la página **y su fecha** (`ACTUALIZADA`) en el mismo
commit que el código:

- **Un dato nuevo** que la app guarde del usuario (un campo en un modelo con `userId` o en
  `User`), o uno que deje de guardar.
- **Quién ve qué:** p. ej. un campo nuevo en el panel de `/developer` (`adminController.js`).
- **Un servicio nuevo** que reciba datos (almacenamiento de imágenes del bloque 10, notificaciones
  del bloque 12…) o un cambio de región de los actuales (Render, Atlas, Vercel, Resend).
- **Lo que se guarda en el dispositivo** (claves `yieldfit_` de localStorage, cookies).
- **Qué pasa al borrar la cuenta** (`utils/borrarCuenta.js`) o **con las copias de seguridad**
  ([operaciones.md](operaciones.md)).
- **Analítica, publicidad o seguimiento:** hoy no hay ninguno, y la nota lo promete. Añadir
  cualquiera es una decisión de producto que pasa por `DECISIONS.md` antes que por el código.
