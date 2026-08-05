import { motion } from 'framer-motion';

import { lista } from '@/lib/motion';
import type { MuscleGroupSummary } from '@/services/exercises.service';

import { MuscleGroupCard } from './MuscleGroupCard';

interface MuscleGroupListProps {
  readonly grupos: readonly MuscleGroupSummary[];
  readonly onAlternar: (grupo: MuscleGroupSummary) => void;
}

/**
 * Rejilla de grupos musculares, de selección múltiple.
 *
 * Dos columnas en móvil —tarjetas de ~160 px, cómodas para el pulgar—,
 * tres a partir de tablet. El escalonado lo dispara este contenedor; cada
 * tarjeta solo declara su variante.
 */
export function MuscleGroupList({ grupos, onAlternar }: MuscleGroupListProps) {
  if (grupos.length === 0) {
    return (
      <p role="status" className="py-16 text-center text-sm text-ink-mute">
        El catálogo no tiene ningún grupo muscular con ejercicios.
      </p>
    );
  }

  return (
    <motion.div
      variants={lista}
      initial="entra"
      animate="visible"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3"
    >
      {grupos.map((grupo) => (
        <MuscleGroupCard key={grupo.id} grupo={grupo} onAlternar={onAlternar} />
      ))}
    </motion.div>
  );
}
