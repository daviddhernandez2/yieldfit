import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth.js';
import Button from '@/components/Button/Button.jsx';
import Input from '@/components/Input/Input.jsx';
import RadioGroup from '@/components/RadioGroup/RadioGroup.jsx';
import styles from '@/pages/Register/Register.module.css';

// Opciones del campo género. Los valores coinciden con el enum del modelo User
// del backend. Si en el modelo se ampliaran, hay que sincronizar este array.
const GENERO_OPTIONS = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'femenino', label: 'Femenino' },
  { value: 'otro', label: 'Otro' },
];

// Pantalla de registro. Formulario único con todos los campos del modelo User.
// Tras un registro exitoso el backend devuelve un token, así que el usuario
// queda automáticamente autenticado y se le redirige al dashboard.
export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    nombreCompleto: '',
    fechaNacimiento: '',
    peso: '',
    altura: '',
    genero: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Helper para actualizar un solo campo del formData sin repetir el spread en cada handler.
  const updateField = (field) => (e) => {
    const value = e?.target ? e.target.value : e;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Validación mínima en cliente: solo cosas que el backend no detectaría bien
  // (como confirmar que las dos contraseñas coinciden). El resto lo valida Mongoose.
  const validar = () => {
    if (formData.password !== formData.passwordConfirm) {
      return 'Las contraseñas no coinciden.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const validationError = validar();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setSubmitting(true);
    try {
      // Construimos el payload eliminando campos opcionales vacíos para que
      // el backend reciba 'undefined' en lugar de '' (Mongoose los trata distinto).
      const payload = {
        email: formData.email,
        password: formData.password,
        nombreCompleto: formData.nombreCompleto,
        fechaNacimiento: formData.fechaNacimiento,
      };
      if (formData.peso) payload.peso = Number(formData.peso);
      if (formData.altura) payload.altura = Number(formData.altura);
      if (formData.genero) payload.genero = formData.genero;

      await register(payload);
      navigate('/dashboard');
    } catch (error) {
      // El backend devuelve mensajes específicos en 'details' (ValidationError)
      // o en 'message' (otros errores como 409 Conflict). Priorizamos el más detallado.
      const data = error.response?.data;
      const message = data?.details?.[0] || data?.message || 'Error al registrar. Inténtalo de nuevo.';
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  // El submit se habilita solo cuando los campos obligatorios están rellenos.
  // Esto da feedback visual al usuario y evita peticiones que sabemos que fallarán.
  const camposObligatoriosOk =
    formData.email &&
    formData.password &&
    formData.passwordConfirm &&
    formData.nombreCompleto &&
    formData.fechaNacimiento;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Crear cuenta</h1>
        <p className={styles.subtitle}>Empieza a registrar tu progreso</p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="tu@email.com"
            value={formData.email}
            onChange={updateField('email')}
            required
            autoComplete="email"
          />

          <Input
            id="password"
            label="Contraseña"
            type="password"
            placeholder="Mínimo 8 caracteres"
            value={formData.password}
            onChange={updateField('password')}
            required
            autoComplete="new-password"
          />

          <Input
            id="passwordConfirm"
            label="Confirmar contraseña"
            type="password"
            placeholder="Repite la contraseña"
            value={formData.passwordConfirm}
            onChange={updateField('passwordConfirm')}
            required
            autoComplete="new-password"
          />

          <Input
            id="nombreCompleto"
            label="Nombre completo"
            type="text"
            placeholder="Tu nombre"
            value={formData.nombreCompleto}
            onChange={updateField('nombreCompleto')}
            required
            autoComplete="name"
          />

          <Input
            id="fechaNacimiento"
            label="Fecha de nacimiento"
            type="date"
            value={formData.fechaNacimiento}
            onChange={updateField('fechaNacimiento')}
            required
          />

          <div className={styles.row}>
            <Input
              id="peso"
              label="Peso (kg)"
              type="number"
              placeholder="75"
              value={formData.peso}
              onChange={updateField('peso')}
              min="0"
              step="0.1"
            />
            <Input
              id="altura"
              label="Altura (cm)"
              type="number"
              placeholder="178"
              value={formData.altura}
              onChange={updateField('altura')}
              min="0"
            />
          </div>

          <RadioGroup
            label="Género"
            name="genero"
            value={formData.genero}
            onChange={updateField('genero')}
            options={GENERO_OPTIONS}
          />

          {errorMessage && (
            <div className={styles.errorBanner} role="alert">
              {errorMessage}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={submitting || !camposObligatoriosOk}
          >
            {submitting ? 'Creando cuenta...' : 'Crear cuenta'}
          </Button>
        </form>

        <p className={styles.footer}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className={styles.link}>
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}