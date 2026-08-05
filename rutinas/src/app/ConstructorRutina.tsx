import { AnimatePresence, motion } from 'framer-motion';
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';

import { AppShell, Contenido } from '@/components/layout/AppShell';
import { BarraInferior } from '@/components/layout/BarraInferior';
import { TopBar } from '@/components/layout/TopBar';
import { Avisos } from '@/components/ui/Avisos';
import { Button } from '@/components/ui/Button';
import { DialogoConfirmacion } from '@/components/ui/DialogoConfirmacion';
import { Skeleton } from '@/components/ui/Skeleton';
import { PasoEjercicios } from '@/features/exercises/components/PasoEjercicios';
import { PasoGrupos } from '@/features/exercises/components/PasoGrupos';
import { useExercisesByGroups } from '@/features/exercises/hooks/useExercisesByGroups';
import { BarraSemana } from '@/features/routine/components/BarraSemana';
import { CompartirSheet } from '@/features/routine/components/CompartirSheet';
import { useExerciseIndex } from '@/features/routine/hooks/useExerciseIndex';
import { useRutinaCompartida } from '@/features/routine/hooks/useRutinaCompartida';
import { pantalla } from '@/lib/motion';
import { useRutina } from '@/store/rutina.store';
import { useSeleccion, useTotalEjercicios, useTotalGrupos } from '@/store/seleccion.store';

/**
 * El paso 3 se carga aparte.
 *
 * Arrastra consigo `@dnd-kit` —unas 40 KB— que no hace falta para elegir
 * grupos ni ejercicios. Separarlo adelanta la primera pantalla, que es la
 * que decide si alguien se queda o cierra.
 */
const PasoSemana = lazy(() =>
  import('@/features/routine/components/PasoSemana').then((modulo) => ({
    default: modulo.PasoSemana,
  })),
);

type Paso = 'grupos' | 'ejercicios' | 'semana';

const ORDEN: readonly Paso[] = ['grupos', 'ejercicios', 'semana'];

const ANTERIOR: Record<Paso, Paso | null> = {
  grupos: null,
  ejercicios: 'grupos',
  semana: 'ejercicios',
};

const ETIQUETA_ATRAS: Record<Paso, string> = {
  grupos: '',
  ejercicios: 'Grupos',
  semana: 'Ejercicios',
};

/**
 * Los tres pasos para montar una rutina.
 *
 * Vive en `app/` porque es cableado: decide qué paso se ve y conecta dos
 * features que, por regla, no pueden importarse entre sí. Cuando entre el
 * router, cada paso será una ruta y este componente desaparecerá.
 */
export function ConstructorRutina() {
  const [paso, setPaso] = useState<Paso>('grupos');
  const [sentido, setSentido] = useState(1);
  const [compartiendo, setCompartiendo] = useState(false);

  const contenido = useRef<HTMLElement>(null);

  const gruposSeleccionados = useSeleccion((estado) => estado.grupos);
  const ejerciciosSeleccionados = useSeleccion((estado) => estado.ejercicios);
  const totalGrupos = useTotalGrupos();
  const totalEjercicios = useTotalEjercicios();

  const sincronizar = useRutina((estado) => estado.sincronizar);
  const secciones = useExercisesByGroups(gruposSeleccionados);

  /** Cambia de paso recordando en qué sentido, para animar acorde. */
  const irA = useCallback((destino: Paso) => {
    setSentido(ORDEN.indexOf(destino) >= ORDEN.indexOf(paso) ? 1 : -1);
    setPaso(destino);
  }, [paso]);

  /* Si la URL trae ?data=, la rutina se reconstruye y se entra directo a
     la semana: quien abre un enlace compartido quiere ver la rutina, no
     empezar eligiendo grupos. */
  const catalogo = useExerciseIndex();
  const alImportar = useCallback(() => {
    setSentido(1);
    setPaso('semana');
  }, []);
  const compartida = useRutinaCompartida(catalogo.datos, catalogo.estado === 'listo', alImportar);

  const atras = ANTERIOR[paso];

  /* Cada paso empieza por arriba: sin esto el navegador conserva el scroll
     del anterior y se entra a media pantalla. */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [paso]);

  /**
   * El foco se lleva al título del paso nuevo, pero solo cuando termina de
   * entrar. Hacerlo en un efecto no valía: con `mode="wait"` el paso
   * entrante aún no está en el DOM cuando el efecto corre, así que el foco
   * se quedaba en el cuerpo del documento.
   *
   * Y nunca en el primer montaje: ahí el foco debe seguir al principio de
   * la página, donde está el enlace para saltar al contenido.
   */
  const primerMontaje = useRef(true);

  function alTerminarLaEntrada(definicion: unknown) {
    if (definicion !== 'visible') return;
    if (primerMontaje.current) {
      primerMontaje.current = false;
      return;
    }
    contenido.current?.querySelector<HTMLElement>('h1')?.focus();
  }

  function irALaSemana() {
    /* Se cuadra la semana con lo seleccionado justo al entrar: conserva lo
       que ya estaba colocado y reparte solo lo nuevo. Volver atrás a añadir
       un grupo no puede deshacer la semana que el socio acaba de organizar. */
    sincronizar(ejerciciosSeleccionados);
    irA('semana');
  }

  return (
    <AppShell>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-70 focus:rounded-btn focus:bg-accent focus:px-4 focus:py-2 focus:font-accent focus:text-sm focus:font-extrabold focus:text-on-accent"
      >
        Saltar al contenido
      </a>

      <TopBar
        izquierda={
          atras !== null && (
            <Button variante="discreto" onClick={() => irA(atras)} className="-ml-3 px-3">
              <span aria-hidden="true">←</span> {ETIQUETA_ATRAS[paso]}
            </Button>
          )
        }
      />

      {/* Sin `initial={false}`: esa prop se propaga por todo el subárbol y
          anularía también el escalonado de las listas en la primera carga,
          que es justo el momento que más se nota. */}
      <AnimatePresence mode="wait" custom={sentido}>
        <motion.main
          key={paso}
          id="contenido"
          ref={contenido}
          custom={sentido}
          variants={pantalla}
          initial="entra"
          animate="visible"
          exit="sale"
          onAnimationComplete={alTerminarLaEntrada}
        >
          {paso === 'grupos' && <PasoGrupos />}
          {paso === 'ejercicios' && (
            <PasoEjercicios grupos={gruposSeleccionados} secciones={secciones} />
          )}
          {paso === 'semana' && (
            <Suspense fallback={<EsqueletoSemana />}>
              <PasoSemana secciones={secciones.datos} />
            </Suspense>
          )}
        </motion.main>
      </AnimatePresence>

      {paso === 'grupos' && (
        <BarraInferior
          cantidad={totalGrupos}
          singular="grupo"
          plural="grupos"
          textoBoton="Ver ejercicios"
          ayuda="Elige al menos un grupo muscular."
          onContinuar={() => irA('ejercicios')}
        />
      )}

      {paso === 'ejercicios' && (
        <BarraInferior
          cantidad={totalEjercicios}
          singular="ejercicio"
          plural="ejercicios"
          textoBoton="Organizar"
          ayuda="Elige al menos un ejercicio."
          onContinuar={irALaSemana}
        />
      )}

      {paso === 'semana' && <BarraSemana onCompartir={() => setCompartiendo(true)} />}

      <CompartirSheet abierto={compartiendo} onCerrar={() => setCompartiendo(false)} />

      <DialogoConfirmacion
        abierto={compartida.estado === 'confirmar'}
        titulo="Ya tienes una rutina"
        descripcion={`Este enlace trae otra rutina. Si la abres, se sustituirán los ${compartida.ejerciciosEnRiesgo} ejercicios que tienes colocados.`}
        textoConfirmar="Abrir la compartida"
        textoCancelar="Conservar la mía"
        onConfirmar={compartida.confirmar}
        onCancelar={compartida.cancelar}
      />

      <Avisos />
    </AppShell>
  );
}

/** Mientras llega el trozo del paso 3, la forma de lo que va a aparecer. */
function EsqueletoSemana() {
  return (
    <Contenido>
      <p role="status" className="sr-only">
        Cargando tu semana…
      </p>
      <div aria-hidden="true" className="flex flex-col gap-4 pt-10">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-44 rounded-card" />
        ))}
      </div>
    </Contenido>
  );
}
