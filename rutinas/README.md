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

Implementado: **carga del catálogo y navegación grupo → ejercicios**, sin estilos.

```
src/
├── types/exercise.ts                  vocabularios + esquema zod (tipo y validación
│                                      salen de la misma declaración)
├── config/
│   ├── muscleGroups.ts                nombre y kanji de cada grupo
│   └── labels.ts                      equipo y nivel en texto visible
├── lib/errors.ts                      error con mensaje de usuario y detalle técnico
├── services/exercises.service.ts      única puerta a los datos
├── hooks/useAsync.ts                  cargando / listo / error + reintentar
└── features/exercises/
    ├── hooks/                         useMuscleGroups · useExercisesByGroup
    ├── components/                    MuscleGroupList · ExerciseList · EstadoRecurso
    └── pages/ExercisesPage.tsx        único componente con estado
```

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

- Estilos (Tailwind con los tokens de Pagoda).
- `seriesSugeridas`, `repsSugeridas`, `descansoSugeridoSeg` y `ejecucion` en el
  JSON: el esquema ya los admite como opcionales, pero el catálogo aún no los trae.
- Router, constructor de rutina y persistencia.
