/** Días de la semana, de lunes a domingo. */
export const DIA_IDS = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'] as const;

export type DiaId = (typeof DIA_IDS)[number];

export interface Dia {
  readonly id: DiaId;
  readonly nombre: string;
  /** Inicial para la vista compacta. */
  readonly corto: string;
}

/* Como Record: TypeScript exige los siete, así que no se puede añadir un
   día al vocabulario y olvidarse de nombrarlo. */
const NOMBRES: Record<DiaId, Omit<Dia, 'id'>> = {
  lun: { nombre: 'Lunes', corto: 'L' },
  mar: { nombre: 'Martes', corto: 'M' },
  mie: { nombre: 'Miércoles', corto: 'X' },
  jue: { nombre: 'Jueves', corto: 'J' },
  vie: { nombre: 'Viernes', corto: 'V' },
  sab: { nombre: 'Sábado', corto: 'S' },
  dom: { nombre: 'Domingo', corto: 'D' },
};

export const DIAS: readonly Dia[] = DIA_IDS.map((id) => ({ id, ...NOMBRES[id] }));

export function esDiaId(valor: unknown): valor is DiaId {
  return typeof valor === 'string' && (DIA_IDS as readonly string[]).includes(valor);
}
