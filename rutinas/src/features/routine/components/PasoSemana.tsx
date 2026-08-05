import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useMemo, useState } from 'react';

import { Contenido } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { DIA_IDS, DIAS, esDiaId, type Dia, type DiaId } from '@/config/dias';
import type { SeccionGrupo } from '@/services/exercises.service';
import { localizar, useRutina, useTotalAsignados, type EjercicioAsignado } from '@/store/rutina.store';
import { useUi } from '@/store/ui.store';
import { useSeleccion } from '@/store/seleccion.store';
import type { Exercise } from '@/types/exercise';

import { useExerciseIndex } from '../hooks/useExerciseIndex';
import { AgregarEjercicioSheet } from './AgregarEjercicioSheet';
import { DiaSeccion } from './DiaSeccion';

interface PasoSemanaProps {
  /** Los ejercicios disponibles para añadir, ya agrupados. */
  readonly secciones: readonly SeccionGrupo[];
}

/** Locuciones para lectores de pantalla: dnd-kit las trae solo en inglés. */
const AVISOS: Announcements = {
  onDragStart: ({ active }) => `Has cogido ${active.data.current?.['nombre'] ?? 'un ejercicio'}.`,
  onDragOver: ({ over }) => (over ? `Sobre ${over.id}.` : 'Fuera de cualquier día.'),
  onDragEnd: ({ over }) =>
    over ? `Soltado en ${over.id}.` : 'Soltado fuera; vuelve a su sitio.',
  onDragCancel: () => 'Movimiento cancelado.',
};

/**
 * Paso 3: organizar la semana.
 *
 * Los siete días con sus ejercicios. Se puede añadir, quitar y arrastrar
 * —dentro de un día para reordenar, o de un día a otro para cambiarlo de
 * sitio—. Todo se refleja al momento porque el estado vive en el store y
 * los recuentos se derivan de él; no hay nada que "guardar" a mano.
 */
export function PasoSemana({ secciones }: PasoSemanaProps) {
  const semana = useRutina((estado) => estado.semana);

  /* Una acción por selector, no un objeto con las tres: devolver un objeto
     nuevo en cada llamada rompe la comparación por identidad de zustand y
     repinta sin parar. Las acciones sí son referencias estables. */
  const quitar = useRutina((estado) => estado.quitar);
  const mover = useRutina((estado) => estado.mover);
  const agregar = useRutina((estado) => estado.agregar);
  const insertar = useRutina((estado) => estado.insertar);
  const asegurarSeleccionado = useSeleccion((estado) => estado.asegurarSeleccionado);
  const mostrarAviso = useUi((estado) => estado.mostrarAviso);

  const total = useTotalAsignados();
  const indice = useExerciseIndex();

  const [diaDestino, setDiaDestino] = useState<Dia | null>(null);
  const [arrastrado, setArrastrado] = useState<EjercicioAsignado | null>(null);

  /* Con asa de arrastre no hace falta retardo táctil: el resto de la
     tarjeta sigue siendo zona de scroll, así que no compiten. */
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 80, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const porUid = useMemo(() => {
    const mapa = new Map<string, { asignado: EjercicioAsignado; dia: DiaId }>();
    for (const dia of DIA_IDS) {
      for (const asignado of semana[dia]) mapa.set(asignado.uid, { asignado, dia });
    }
    return mapa;
  }, [semana]);

  function alEmpezar(evento: DragStartEvent) {
    setArrastrado(porUid.get(String(evento.active.id))?.asignado ?? null);
  }

  function alTerminar(evento: DragEndEvent) {
    setArrastrado(null);

    const { active, over } = evento;
    if (!over) return;

    const uid = String(active.id);
    const destinoId = String(over.id);

    /* Soltar sobre el contenedor de un día lo manda al final; soltar sobre
       una tarjeta lo coloca en el lugar de esa tarjeta. */
    const origen = porUid.get(uid);

    if (esDiaId(destinoId)) {
      if (origen?.dia === destinoId) return;
      mover(uid, destinoId, semana[destinoId].length);
      avisarCambioDeDia(origen?.dia, destinoId);
      return;
    }

    const destino = porUid.get(destinoId);
    if (!destino || destinoId === uid) return;

    mover(uid, destino.dia, semana[destino.dia].findIndex((e) => e.uid === destinoId));
    avisarCambioDeDia(origen?.dia, destino.dia);
  }

  /* Solo se avisa al cambiar de día. Reordenar dentro del mismo día ya se
     ve en la propia lista; un aviso por cada arrastre sería ruido. */
  function avisarCambioDeDia(desde: DiaId | undefined, hasta: DiaId) {
    if (desde === undefined || desde === hasta) return;
    const nombre = DIAS.find((d) => d.id === hasta)?.nombre ?? '';
    mostrarAviso({ texto: `Movido al ${nombre.toLowerCase()}.`, tono: 'exito', duracionMs: 2200 });
  }

  /**
   * Quitar es destructivo, así que se ofrece deshacer en lugar de
   * preguntar antes: preguntar por cada tarjeta convertiría organizar la
   * semana en un interrogatorio. Se guarda el día y la posición exactos
   * para devolverla a su sitio y no al final de la lista.
   */
  function alQuitar(uid: string) {
    const sitio = localizar(semana, uid);
    const asignado = sitio ? semana[sitio.dia].find((e) => e.uid === uid) : undefined;
    if (!sitio || !asignado) return;

    const nombre = indice.datos.get(asignado.ejercicioId)?.nombre ?? 'Ejercicio';
    quitar(uid);

    mostrarAviso({
      texto: `${nombre} fuera de la rutina.`,
      accion: {
        etiqueta: 'Deshacer',
        alPulsar: () => insertar(sitio.dia, sitio.indice, asignado),
      },
    });
  }

  function alElegirEjercicio(ejercicio: Exercise) {
    if (!diaDestino) return;

    /* Se marca también como seleccionado: la semana y la selección tienen
       que decir lo mismo. Si no, al volver al paso 2 y regresar, este
       ejercicio no estaría en la selección y `sincronizar` lo borraría de
       la semana sin que el socio entendiera por qué. */
    asegurarSeleccionado(ejercicio);
    agregar(diaDestino.id, { id: ejercicio.id, grupo: ejercicio.grupoMuscular });
    mostrarAviso({
      texto: `${ejercicio.nombre} añadido al ${diaDestino.nombre.toLowerCase()}.`,
      tono: 'exito',
    });
    setDiaDestino(null);
  }

  return (
    <Contenido>
      <div className="pt-10 pb-8">
        <p className="font-accent text-[0.6875rem] font-extrabold tracking-[0.3em] text-accent uppercase">
          Paso 3 de 3
        </p>
        <h1
          tabIndex={-1}
          className="mt-3 outline-none font-display text-5xl leading-[0.9] tracking-wide text-ink">
          Tu semana
        </h1>
        <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-soft">
          Arrastra por el asa para reordenar o cambiar de día. Los días sin ejercicios
          quedan como descanso.
        </p>
      </div>

      {total === 0 && (
        <div
          role="status"
          className="mb-6 rounded-card border border-line bg-surface p-8 text-center shadow-soft"
        >
          <span aria-hidden="true" className="block font-kanji text-5xl leading-none text-accent/15">
            力
          </span>
          <p className="mt-4 font-display text-2xl tracking-wide text-ink">Semana vacía</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Quitaste todos los ejercicios. Añade los que quieras a cualquier día.
          </p>
          <Button
            tamano="lg"
            className="mt-6"
            onClick={() => setDiaDestino(DIAS[0] ?? null)}
          >
            Añadir al lunes
          </Button>
        </div>
      )}

      <DndContext
        sensors={sensores}
        collisionDetection={closestCorners}
        accessibility={{ announcements: AVISOS }}
        onDragStart={alEmpezar}
        onDragEnd={alTerminar}
        onDragCancel={() => setArrastrado(null)}
      >
        <div className="flex flex-col gap-4">
          {DIAS.map((dia) => (
            <DiaSeccion
              key={dia.id}
              dia={dia}
              ejercicios={semana[dia.id]}
              indice={indice.datos}
              onQuitar={alQuitar}
              onAgregar={setDiaDestino}
              arrastrando={arrastrado !== null}
            />
          ))}
        </div>

        {/* La tarjeta que sigue al dedo. Sin esto, al arrastrar solo se ve
            el hueco y no se sabe qué se está moviendo. */}
        <DragOverlay>
          {arrastrado && (
            <div className="flex items-center gap-3 rounded-card border border-accent-line bg-elevated p-3 shadow-lift">
              <span aria-hidden="true" className="text-lg text-accent">
                ⠿
              </span>
              <span className="text-sm font-semibold text-ink">
                {indice.datos.get(arrastrado.ejercicioId)?.nombre ?? 'Ejercicio'}
              </span>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <div className="h-40" />

      <AgregarEjercicioSheet
        dia={diaDestino}
        secciones={secciones}
        onElegir={alElegirEjercicio}
        onCerrar={() => setDiaDestino(null)}
      />
    </Contenido>
  );
}
