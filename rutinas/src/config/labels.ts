import type { EquipmentId, LevelId } from '@/types/exercise';

/* Traducción de los vocabularios del JSON a texto visible. Los ids del
   catálogo van sin acentos para que sean seguros como claves; el nombre que
   ve el socio se resuelve aquí y solo aquí. */

export const NOMBRES_EQUIPO: Record<EquipmentId, string> = {
  barra: 'Barra',
  mancuerna: 'Mancuerna',
  maquina: 'Máquina',
  polea: 'Polea',
  'peso-corporal': 'Peso corporal',
  banda: 'Banda',
  disco: 'Disco',
  accesorio: 'Accesorio',
};

export const NOMBRES_NIVEL: Record<LevelId, string> = {
  principiante: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
};
