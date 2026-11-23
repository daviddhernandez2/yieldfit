import { Link, useNavigate } from 'react-router-dom';
import styles from '@/pages/Privacidad/Privacidad.module.css';

// Nota de privacidad (bloque 11b, paso 11b.6). Pública: se puede leer antes de registrarse.
// Enlazada desde el registro y desde Perfil.
//
// Es una nota informativa en lenguaje llano, no un texto legal (decisión de David): la app
// está en beta, para conocidos. Si algún día se abre al público, hay que revisarla con
// alguien que sepa de RGPD.
//
// ESTA PÁGINA TIENE QUE DECIR LA VERDAD. Si cambia qué datos guarda la app, quién los ve o
// qué servicio los procesa, se actualiza aquí y la fecha de abajo (lista de comprobación en
// docs/privacidad.md).
const ACTUALIZADA = '23 de noviembre de 2026';

export default function Privacidad() {
  const navigate = useNavigate();

  // "Volver" a donde estaba (registro o Perfil). Si se abrió la página directamente, no hay
  // a dónde volver dentro de la app: a la portada. React Router guarda en history.state.idx
  // cuántas páginas de la app hay detrás.
  const volver = () => {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate('/');
  };

  return (
    <div className={styles.page}>
      <article className={styles.nota}>
        <button type="button" className={styles.volver} onClick={volver}>
          ← Volver
        </button>

        <h1 className={styles.title}>Privacidad</h1>
        <p className={styles.actualizada}>Última actualización: {ACTUALIZADA}</p>

        <p className={styles.intro}>
          Yield Fit es una app en pruebas, compartida con conocidos. Esta nota explica, sin letra
          pequeña, qué datos guarda, para qué y dónde. Es informativa: no es un texto legal.
        </p>

        <ul className={styles.resumen}>
          <li>Solo se guarda lo necesario para que la app funcione.</li>
          <li>Sin publicidad, sin analítica y sin vender ni compartir tus datos.</li>
          <li>Puedes borrar tu cuenta y todos tus datos desde Perfil cuando quieras.</li>
        </ul>

        <section>
          <h2>Qué se guarda y para qué</h2>
          <dl className={styles.datos}>
            <dt>Tu cuenta</dt>
            <dd>
              Nombre, email y fecha de nacimiento; y, solo si los das, peso, altura y género. Sirven
              para identificarte y mostrar tu perfil. La contraseña no se guarda: solo una huella
              cifrada (bcrypt) a partir de la que nadie puede leerla, tampoco el desarrollador.
            </dd>

            <dt>Tus entrenamientos</dt>
            <dd>
              Ejercicios, rutinas, sesiones (series, pesos, repeticiones, fecha y duración) y
              grupos de progreso. Sirven para tu historial y para calcular tu progreso.
            </dd>

            <dt>Registro y último acceso</dt>
            <dd>
              La fecha en que creaste la cuenta y la última vez que entraste (con una hora de
              margen). Sirven para saber quién usa la app durante las pruebas.
            </dd>

            <dt>Reportes de fallos</dt>
            <dd>
              Si usas el botón de reportar: lo que escribes, la pantalla en la que estabas, tu
              navegador y sistema, y el tamaño de la ventana. Antes de enviarlo ves exactamente
              qué se manda.
            </dd>

            <dt>Emails</dt>
            <dd>
              Tu email se usa solo para enviarte el enlace de recuperar la contraseña cuando lo
              pides y el aviso de que tu contraseña ha cambiado. Nada de publicidad ni boletines.
            </dd>

            <dt>Registros del servidor</dt>
            <dd>
              Como cualquier web, el servidor anota cada petición: tu dirección IP, la fecha, qué
              se pidió y tu navegador. Sirven para frenar ataques (limitar los intentos de
              entrar o de registrarse) y para encontrar fallos. Los guarda el proveedor del
              servidor durante un tiempo limitado.
            </dd>

            <dt>En tu dispositivo</dt>
            <dd>
              Una cookie técnica para mantener tu sesión abierta hasta 30 días, que ninguna web
              ni script puede leer. En el almacenamiento del navegador, el entreno en curso y tus
              preferencias de los gráficos. Se borra todo al cerrar sesión. No hay cookies de
              publicidad ni de seguimiento.
            </dd>
          </dl>
        </section>

        <section>
          <h2>Quién los ve</h2>
          <p>
            Tú. Y el desarrollador de la app, que en su panel de administración ve de cada
            usuario el nombre, el email, la fecha de registro, el último acceso y cuántas
            sesiones, ejercicios y rutinas tiene, además de los reportes de fallos. En ese panel
            no aparecen la fecha de nacimiento, el peso, la altura ni el género.
          </p>
          <p>
            Como responsable técnico, también tiene acceso a la base de datos para mantenerla
            (copias de seguridad y reparaciones). No se usa para nada más.
          </p>
        </section>

        <section>
          <h2>Dónde se guardan</h2>
          <ul className={styles.lista}>
            <li>
              <strong>Render</strong> (servidor de la app), en Frankfurt (Alemania).
            </li>
            <li>
              <strong>MongoDB Atlas</strong> (base de datos), en París (Francia).
            </li>
            <li>
              <strong>Vercel</strong> (sirve la web que abres en el navegador).
            </li>
            <li>
              <strong>Resend</strong> (envío de emails): recibe tu email y el texto de cada
              mensaje. Los envía desde Irlanda; la cuenta del servicio está en Estados Unidos, y
              guarda el historial de envíos 30 días.
            </li>
            <li>
              <strong>Copias de seguridad</strong> de la base de datos, en el ordenador del
              desarrollador, con el disco cifrado. Se hace una al mes y se guardan solo las 3
              más recientes.
            </li>
          </ul>
        </section>

        <section>
          <h2>Lo que puedes hacer</h2>
          <ul className={styles.lista}>
            <li>
              <strong>Cambiar tu contraseña</strong> en Perfil. Se cierra la sesión en tus otros
              dispositivos.
            </li>
            <li>
              <strong>Borrar tu cuenta</strong> en Perfil: se borran al momento tu cuenta y todos
              tus datos (entrenamientos, grupos y reportes). En las copias de seguridad pueden
              seguir como mucho unos 3 meses, hasta que esas copias se sustituyen por otras
              nuevas.
            </li>
          </ul>
        </section>

        <p className={styles.pie}>
          <Link to="/" className={styles.enlace}>
            Yield Fit
          </Link>
        </p>
      </article>
    </div>
  );
}
