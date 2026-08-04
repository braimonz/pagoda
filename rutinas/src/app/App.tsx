import { MotionConfig } from 'framer-motion';

import { ExercisesPage } from '@/features/exercises/pages/ExercisesPage';

/**
 * Raíz de la aplicación.
 *
 * `reducedMotion="user"` hace que Framer Motion respete la preferencia del
 * sistema en toda la app: quien tenga activado "reducir movimiento" recibe
 * los cambios de opacidad pero ningún desplazamiento ni escala. No es un
 * detalle opcional — este tipo de animación puede provocar mareo.
 *
 * Cuando entren el router y el AuthProvider (ARQUITECTURA.md §8) se
 * enchufan aquí, sin tocar el feature.
 */
export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ExercisesPage />
    </MotionConfig>
  );
}
