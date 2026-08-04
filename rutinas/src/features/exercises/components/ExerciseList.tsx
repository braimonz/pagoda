import { motion } from 'framer-motion';

import { lista } from '@/lib/motion';
import type { Exercise } from '@/types/exercise';

import { ExerciseCard } from './ExerciseCard';

interface ExerciseListProps {
  readonly ejercicios: readonly Exercise[];
}

export function ExerciseList({ ejercicios }: ExerciseListProps) {
  if (ejercicios.length === 0) {
    return (
      <p role="status" className="py-16 text-center text-sm text-ink-mute">
        Este grupo muscular todavía no tiene ejercicios.
      </p>
    );
  }

  return (
    <motion.div variants={lista} initial="entra" animate="visible" className="flex flex-col gap-3">
      {ejercicios.map((ejercicio, indice) => (
        <ExerciseCard key={ejercicio.id} ejercicio={ejercicio} orden={indice + 1} />
      ))}
    </motion.div>
  );
}
