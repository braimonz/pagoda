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

Implementado: **el constructor de rutinas en tres pasos** — carga del JSON,
elección múltiple de grupos y de ejercicios, organización de la semana con
arrastrar y soltar, y compartir la rutina por enlace.

```
Paso 1 · Grupos        Paso 2 · Ejercicios      Paso 3 · Semana
┌───────────────┐      ┌───────────────────┐    ┌──────────────────┐
│ selección     │ Ver  │ los grupos        │Org.│ los 7 días       │
│ múltiple      │ejerc.│ elegidos, en      │───►│ añadir · quitar  │
│ de grupos     │ ───► │ secciones         │    │ arrastrar        │
├───────────────┤      ├───────────────────┤    ├──────────────────┤
│ 3 GRUPOS  [→] │      │ 6 EJERC.  [→]     │    │ 6 EJERC. · 3 DÍAS│
└───────────────┘      └───────────────────┘    └──────────────────┘
  bloqueada con 0        bloqueada con 0          se actualiza solo
```

### Reglas del constructor

- **Soltar un grupo suelta también sus ejercicios.** Una barra que dijera «6
  ejercicios» con solo 3 a la vista daría un número que el socio no puede
  comprobar ni corregir.
- **Al entrar a la semana se reparte por grupos**: el primer grupo al lunes, el
  segundo al martes, y así. Siete días vacíos obligarían a arrastrar quince
  tarjetas antes de ver nada.
- **Volver atrás no deshace la semana.** `sincronizar` conserva lo ya colocado y
  reparte solo lo nuevo; lo que deje de estar seleccionado sí desaparece.
- **Añadir desde la semana también marca el ejercicio como seleccionado**, para
  que la semana y la selección nunca digan cosas distintas.
- **Se permite repetir**: cada instancia lleva su propio `uid`, así que el mismo
  press de banca puede estar el lunes y el viernes y quitar uno no quita el otro.

### Compartir por enlace

La rutina entera viaja dentro de la URL: no hace falta servidor ni base de datos.

```
Semana → rutinaAJson()  → {"v":1,"d":{"lun":["press-banca-barra",…],…}}
       → codificarRutina() → base64url
       → crearEnlaceRutina() → https://pagoda.mx/rutinas/?data=eyJ2Ijox…
```

Al abrir un enlace con `?data=`, `useRutinaCompartida` decodifica, valida con zod,
coteja cada id contra el catálogo y entra directo al paso 3. Una rutina de seis
ejercicios ocupa 154 bytes de JSON y 206 caracteres de base64url.

Cuatro decisiones:

- **Alfabeto URL (RFC 4648 §5), no base64 clásico.** En una query, el `+` del
  base64 normal se interpreta como espacio y la rutina llega rota. Se cambian
  `+/` por `-_` y se quita el relleno.
- **Solo viajan los ids**, ni el `uid` de cada instancia —local, se regenera— ni
  el grupo, que se deduce del catálogo. Copiar el ejercicio entero congelaría los
  datos: al corregir una descripción, el enlace seguiría enseñando la vieja.
- **Claves de una letra y días vacíos omitidos.** Cada carácter del JSON se infla
  un 33 % al pasar a base64 y acaba en una URL que alguien pega en WhatsApp.
- **La URL se limpia con `replaceState` tras importar.** Sin eso, recargar
  volvería a importar y pisaría los cambios hechos después de abrir el enlace.

Los ids que ya no existen en el catálogo se descartan y se dice cuántos; un
enlace corrupto o de una versión más nueva avisa sin romper la app.

**Guardar en WhatsApp** abre `https://wa.me/?text=…` con el mensaje ya escrito:

```
Mi rutina semanal — Pagoda Fitness Center
5 ejercicios en 2 días

https://pagoda.mx/rutinas/?data=eyJ2Ijox…
```

Sin número de destino, así que el selector de contactos permite tanto mandársela
a alguien como guardársela uno mismo en su propio chat. Como los avisos del panel
de socios, no necesita servidor ni la API de WhatsApp Business.

Es un `<a>` real y no un `<button>` con `window.open`: así no lo bloquea el
navegador, se puede mantener pulsado para copiar la dirección y funciona dentro
de los navegadores integrados de Instagram o Facebook, donde `window.open` muchas
veces no hace nada. El enlace va en su propia línea y al final para que WhatsApp
lo detecte entero — pegado a otro texto, el punto final acaba dentro de la URL.

### Arrastrar y soltar

`@dnd-kit` con tres sensores: puntero, táctil y **teclado** —enfocar el asa,
espacio, flechas, espacio—, de modo que reordenar no depende de poder arrastrar.
Los anuncios para lectores de pantalla van traducidos al español.

El arrastre sale de un asa y no de toda la tarjeta: si la tarjeta entera
arrastrase, en móvil no se podría hacer scroll sin mover ejercicios sin querer.
El asa lleva `touch-action: none`, sin la cual el navegador se queda el gesto y
el arrastre no llega a empezar.

Un día entero es zona de destino **solo cuando está vacío**. Con tarjetas dentro
se desactiva a propósito: el contenedor le gana la detección de colisión a sus
propias tarjetas —es más grande y sus esquinas quedan más cerca— y todo
aterrizaba al final del día, con lo que reordenar dentro de un mismo día no
hacía nada.

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
│   ├── base64url.ts                   codificación segura para URLs
│   ├── cn.ts                          clases condicionales sin conflictos
│   ├── motion.ts                      vocabulario de animación compartido
│   └── errors.ts                      mensaje de usuario vs. detalle técnico
├── services/exercises.service.ts      única puerta a los datos
├── store/
│   ├── seleccion.store.ts             grupos y ejercicios elegidos (zustand)
│   └── rutina.store.ts                la semana: qué ejercicio en qué día
├── hooks/useAsync.ts                  cargando / listo / error + reintentar
├── components/
│   ├── ui/                            Button · Chip · Skeleton · Contador · Sheet · Toast
│   ├── layout/                        AppShell · TopBar · BarraInferior
│   └── brand/Grain.tsx                textura del sitio
├── features/
│   ├── exercises/                     PasoGrupos · PasoEjercicios · tarjetas
│   └── routine/                       PasoSemana · DiaSeccion · TarjetaAsignada
│       └── utils/compartir.ts         rutina ↔ JSON ↔ base64url ↔ enlace
└── app/ConstructorRutina.tsx          orquesta los tres pasos
```

### Experiencia

| Área | Qué hay |
|---|---|
| **Transiciones** | Direccionales: avanzar entra desde abajo, retroceder desde arriba. El sentido dice si vas o vuelves sin leer nada |
| **Microinteracciones** | Pulsación que cede un 3 %, check con rebote al seleccionar, cifras que ruedan dentro de una máscara, panel que se cierra arrastrando |
| **Esqueletos** | Con la forma de lo que va a llegar: rejilla, lista y semana. Nunca un spinner centrado |
| **Estados vacíos** | Los cuatro con salida: semana vacía con botón, día de descanso, catálogo sin grupos, filtro sin resultados |
| **Avisos** | Cola de hasta 3, con tono, acción y cierre manual o automático. `aria-live="polite"` |
| **Confirmaciones** | Diálogo solo para lo que destruye trabajo; para el resto, **Deshacer** |

**Cuándo se pregunta y cuándo se deshace.** Quitar un ejercicio actúa y ofrece
*Deshacer*, que lo devuelve a su día y posición exactos. Quitar un **grupo** que
tiene ejercicios ya colocados sí abre un diálogo: no es una tarjeta, es trabajo de
varios minutos que desaparece de una pantalla que ni siquiera está a la vista.
Preguntar por todo entrena a la gente a dar a «sí» sin leer, que es peor que no
preguntar.

### Accesibilidad

- Enlace **Saltar al contenido** como primer elemento tabulable.
- Al cambiar de paso el foco va al `<h1>`, y se hace al **terminar** la animación:
  con `mode="wait"` el paso entrante aún no está en el DOM cuando corre el efecto,
  así que el foco se quedaba en el cuerpo del documento.
- Panel y diálogo encierran el foco, se cierran con Escape y lo devuelven al botón
  que los abrió.
- `aria-live` en los recuentos de las barras y en la pila de avisos.
- Arrastrar funciona con teclado —espacio, flechas, espacio— y anuncia en español.
- Toda selección se marca con forma además de color.

### Rendimiento

| Medida | Efecto |
|---|---|
| El paso 3 en un `chunk` aparte | El bundle inicial baja de 137 a 122 KB gzip; `@dnd-kit` (19 KB) solo se descarga al llegar a la semana |
| `memo` en las tres tarjetas | Cada una lee del store su propio booleano, así que tocar una no repinta las otras 44 |
| `content-visibility: auto` | El navegador se salta estilo y trazado de las fichas fuera de pantalla |
| Promesa del catálogo memoizada | Una sola descarga por sesión |

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
exercises.service.ts   valida con zod → indexa por grupo y por id → cuenta
        │  getMuscleGroups() · getExercisesByGroups() · getExercisesIndex()
        ▼
useMuscleGroups · useExercisesByGroups · useExerciseIndex     sobre useAsync
        ▼
seleccion.store  →  rutina.store        lo elegido y dónde queda colocado
        ▼
ConstructorRutina   decide qué paso se ve
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
- **Persistencia**: la semana vive en memoria, así que recargar la borra. Es el
  siguiente paso obvio —`persist` de zustand con la clave `pagoda:rutina:local`
  que define `ARQUITECTURA.md` §7— y por eso la barra todavía no dice «guardado».
- Series, repeticiones y descanso por ejercicio: el esquema ya los admite, pero
  ni el JSON los trae ni la tarjeta de la semana los deja editar.
- Router y resumen — la pantalla ⑥ de `DISENO-UX.md`.
- Compartir como imagen: hoy el panel genera enlace y mensaje de WhatsApp, pero
  no la tarjeta 9:16 que describe la pantalla ⑦.
