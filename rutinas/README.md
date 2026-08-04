# Pagoda · Rutinas

Constructor de rutinas semanales del gimnasio. React + TypeScript + Vite.

- **Arquitectura:** [`ARQUITECTURA.md`](./ARQUITECTURA.md)
- **Diseño de las pantallas:** [`DISENO-UX.md`](./DISENO-UX.md)

---

## Puesta en marcha

```bash
cd rutinas
npm install
npm run dev        # http://localhost:5173/rutinas/
```

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run typecheck` | TypeScript en modo estricto, sin emitir |
| `npm run build` | `typecheck` + build de producción en `dist/` |
| `npm run preview` | Sirve `dist/` como lo haría producción |

La app se publica bajo `/rutinas`, por eso el `base` del `vite.config.ts` y por
eso la URL de desarrollo lleva ese prefijo. Cuando esté lista, el Express que ya
sirve el sitio la publica con una línea:

```js
app.use('/rutinas', express.static(path.join(RAIZ, 'rutinas/dist')));
```

---

## Estado actual

Implementado: **selección de ejercicios en dos pasos** — carga del JSON,
elección múltiple de grupos y de ejercicios, barra inferior con el recuento, e
interfaz con Tailwind y Framer Motion.

```
Paso 1 · Grupos          Paso 2 · Ejercicios
┌───────────────┐        ┌───────────────────┐
│ selección     │  Ver   │ los grupos        │
│ múltiple de   │ ejerc. │ elegidos, en      │
│ grupos        │ ─────► │ secciones         │
├───────────────┤        ├───────────────────┤
│ 3 GRUPOS  [→] │        │ 6 EJERC. [Contin.]│  ← barra fija
└───────────────┘        └───────────────────┘
    bloqueada con 0          bloqueada con 0
```

Soltar un grupo suelta también sus ejercicios: una barra que dijera «6
ejercicios» con solo 3 a la vista daría un número que el socio no puede
comprobar ni corregir.

```
src/
├── styles/
│   ├── index.css                      tema: @theme con todos los tokens
│   └── fonts.css                      tipografías alojadas en el proyecto
├── assets/fonts/                      3 woff2 · 88 KB · subconjunto latin
├── types/exercise.ts                  vocabularios + esquema zod (tipo y validación
│                                      salen de la misma declaración)
├── config/
│   ├── muscleGroups.ts                nombre y kanji de cada grupo
│   └── labels.ts                      equipo y nivel en texto visible
├── lib/
│   ├── cn.ts                          clases condicionales sin conflictos
│   ├── motion.ts                      vocabulario de animación compartido
│   └── errors.ts                      mensaje de usuario vs. detalle técnico
├── services/exercises.service.ts      única puerta a los datos
├── store/seleccion.store.ts           grupos y ejercicios elegidos (zustand)
├── hooks/useAsync.ts                  cargando / listo / error + reintentar
├── components/
│   ├── ui/                            Button · Chip · Skeleton · Contador · Toast
│   ├── layout/                        AppShell · TopBar · BarraInferior
│   └── brand/Grain.tsx                textura del sitio
└── features/exercises/
    ├── hooks/                         useMuscleGroups · useExercisesByGroups
    ├── components/                    MuscleGroupCard · ExerciseCard · EstadoRecurso
    └── pages/ExercisesPage.tsx        orquesta las dos vistas
```

### Sistema visual

Paleta oscura sobre tres superficies y un solo color de acción:

| Token | Valor | Uso |
|---|---|---|
| `bg-base` | `#111111` | lienzo |
| `bg-surface` | `#181818` | tarjetas |
| `bg-elevated` | `#232323` | chips, botón secundario, baldosas |
| `text-accent` / `bg-accent` | `#22C55E` | **solo acciones** |
| `text-on-accent` | `#06130B` | texto sobre el verde |
| `text-ink` / `-soft` / `-mute` | blanco al 100 / 68 / 42 % | jerarquía de texto |

Ningún componente escribe un color en hexadecimal: todo pasa por `@theme` en
`styles/index.css`. Si un valor no está declarado ahí, no pertenece al sistema.

Las animaciones viven en `lib/motion.ts` —una curva, cuatro variantes— y ninguna
pasa de 400 ms. `MotionConfig reducedMotion="user"` hace que toda la app respete
la preferencia del sistema: quien reduce el movimiento recibe los cambios de
opacidad pero ningún desplazamiento.

### Cómo fluyen los datos

```
public/data/ejercicios.json
        │  fetch  (una sola vez: la promesa está memoizada)
        ▼
exercises.service.ts   valida con zod → indexa por grupo (Map) → cuenta por grupo
        │  getMuscleGroups() · getExercisesByGroup()
        ▼
useMuscleGroups · useExercisesByGroup     sobre useAsync
        ▼
ExercisesPage   guarda el grupo elegido y alterna las dos vistas
```

Tres decisiones que conviene conocer antes de tocar esto:

1. **El JSON se descarga una vez.** Se memoiza la promesa, no el resultado, así
   que peticiones simultáneas comparten la descarga y el `StrictMode` de React
   —que monta cada efecto dos veces en desarrollo— no duplica la llamada.
   Si falla, la promesa se olvida para que **Reintentar** vuelva a la red.
2. **La lista de grupos sale del propio catálogo**, no de una constante. Un grupo
   sin ejercicios no aparece, y añadir ejercicios de un grupo nuevo lo hace
   aparecer solo.
3. **El orden del JSON se respeta.** Dentro de cada grupo los básicos van antes
   que los de aislamiento; ordenar alfabéticamente destruiría ese criterio.

### Pendiente

- Fotografía de los ejercicios: mientras `imagen` venga vacía, la baldosa de cada
  ficha lleva su número de orden y la tarjeta de grupo es cuadrada. Con fotos, la
  tarjeta puede volver al formato vertical 3:4 del documento de diseño.
- `seriesSugeridas`, `repsSugeridas`, `descansoSugeridoSeg` y `ejecucion` en el
  JSON: el esquema ya los admite como opcionales, pero el catálogo aún no los trae.
- **Qué hace *Continuar***: hoy confirma con un aviso y deja la selección en el
  store. El siguiente paso es repartir los ejercicios por días.
- Router, resumen y persistencia — las pantallas ③, ⑥ y ⑦ de `DISENO-UX.md`
  todavía no existen.
