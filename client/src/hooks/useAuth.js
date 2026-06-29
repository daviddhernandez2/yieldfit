import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext.jsx';

// Hook personalizado para acceder al contexto de autenticación.
// Usar useAuth() en lugar de useContext(AuthContext) directamente es
// más legible y permite añadir lógica adicional aquí si fuera necesario.
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}