import { ExercisesPage } from '@/features/exercises/pages/ExercisesPage';

/**
 * Raíz de la aplicación.
 *
 * De momento monta directamente el catálogo. Cuando entren el router y el
 * AuthProvider (ARQUITECTURA.md §8), se enchufan aquí sin tocar el feature.
 */
export function App() {
  return <ExercisesPage />;
}
