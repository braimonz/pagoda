import { useState } from 'react';

import { Contenido } from '@/components/layout/AppShell';
import { DialogoConfirmacion } from '@/components/ui/DialogoConfirmacion';
import { DIA_IDS } from '@/config/dias';
import type { MuscleGroupSummary } from '@/services/exercises.service';
import { useRutina } from '@/store/rutina.store';
import { useSeleccion } from '@/store/seleccion.store';

import { EstadoRecurso } from './EstadoRecurso';
import { MuscleGroupList } from './MuscleGroupList';
import { useMuscleGroups } from '../hooks/useMuscleGroups';

/** Paso 1: elegir uno o varios grupos musculares. */
export function PasoGrupos() {
  const grupos = useMuscleGroups();

  const seleccionados = useSeleccion((estado) => estado.grupos);
  const alternarGrupo = useSeleccion((estado) => estado.alternarGrupo);
  const semana = useRutina((estado) => estado.semana);

  /** Grupo cuya deselección está pendiente de confirmar. */
  const [aRetirar, setARetirar] = useState<{
    readonly grupo: MuscleGroupSummary;
    readonly colocados: number;
  } | null>(null);

  /**
   * Soltar un grupo se lleva por delante sus ejercicios, también los que
   * el socio ya hubiera colocado y reordenado en la semana. Eso sí merece
   * una pregunta: no es una tarjeta suelta, es trabajo de varios minutos
   * que desaparece de una pantalla que ni siquiera está a la vista.
   *
   * Seleccionar, en cambio, no destruye nada y va directo.
   */
  function alAlternar(grupo: MuscleGroupSummary) {
    const estaSeleccionado = seleccionados.includes(grupo.id);

    if (!estaSeleccionado) {
      alternarGrupo(grupo.id);
      return;
    }

    const colocados = DIA_IDS.reduce(
      (total, dia) => total + semana[dia].filter((e) => e.grupo === grupo.id).length,
      0,
    );

    if (colocados === 0) {
      alternarGrupo(grupo.id);
      return;
    }

    setARetirar({ grupo, colocados });
  }

  return (
    <Contenido>
      <div className="pt-10 pb-8">
        <p className="font-accent text-[0.6875rem] font-extrabold tracking-[0.3em] text-accent uppercase">
          Paso 1 de 3
        </p>
        <h1
          tabIndex={-1}
          className="mt-3 font-display text-5xl leading-[0.9] tracking-wide text-ink outline-none"
        >
          ¿Qué vas
          <br />a trabajar?
        </h1>
        <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-soft">
          Elige uno o varios grupos musculares.
        </p>
      </div>

      <EstadoRecurso
        estado={grupos.estado}
        error={grupos.error}
        onReintentar={grupos.reintentar}
        esqueleto="rejilla"
      >
        <MuscleGroupList grupos={grupos.datos} onAlternar={alAlternar} />
      </EstadoRecurso>

      {/* Aire para que la barra fija no tape la última tarjeta. */}
      <div className="h-40" />

      <DialogoConfirmacion
        abierto={aRetirar !== null}
        titulo={`Quitar ${aRetirar?.grupo.nombre ?? ''}`}
        descripcion={
          aRetirar
            ? `Tienes ${aRetirar.colocados} ${
                aRetirar.colocados === 1 ? 'ejercicio de este grupo colocado' : 'ejercicios de este grupo colocados'
              } en tu semana. Si lo quitas, ${aRetirar.colocados === 1 ? 'desaparecerá' : 'desaparecerán'} de la rutina.`
            : ''
        }
        textoConfirmar="Quitar de todos modos"
        textoCancelar="Conservarlo"
        onConfirmar={() => {
          if (aRetirar) alternarGrupo(aRetirar.grupo.id);
          setARetirar(null);
        }}
        onCancelar={() => setARetirar(null)}
      />
    </Contenido>
  );
}
