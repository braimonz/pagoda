# Pagoda — Sistema de socios

Registro de socios por código QR y panel administrativo con avisos por WhatsApp.

---

## Puesta en marcha

```bash
cd app
npm install
cp .env.example .env        # ajusta JWT_SECRET y la contraseña de admin
npm run seed                # crea el usuario administrador
npm start
```

| Ruta | Para quién | Qué hace |
|---|---|---|
| `/` | **Público** | Sitio de marketing (la landing de la raíz del repo). |
| `/registro` | **Socio** | Destino del código QR. Alta e inicio de sesión. |
| `/credencial` | **Socio** | GymCard digital: plan, vigencia y asistencia. |
| `/admin` | **Personal** | Panel de control de socios. |

Un solo servidor sirve tanto el sitio público como la app de socios, así que
todo vive bajo el mismo dominio y basta un certificado HTTPS.

Usuario inicial: `crys` / la contraseña que definas en `.env` (por defecto `pagoda2025`).

> **Cambia `JWT_SECRET` y la contraseña de admin antes de publicar el sitio.**

---

## Cómo funciona

### 1. El socio llega al gimnasio

Escanea el QR pegado en recepción → cae en `/registro` → captura **nombre, apellidos,
teléfono y contraseña**. Queda guardado en la base de datos y ve su credencial digital.

El QR debe apuntar a `https://TU-DOMINIO/registro`. Puedes generarlo en cualquier
generador de QR gratuito una vez que el sitio esté publicado.

### 2. El administrador gestiona

En `/admin` se ve el tablero con seis métricas que **funcionan como filtros** al hacer clic:

| Métrica | Significa |
|---|---|
| Socios totales | Todos los registrados |
| Activas | Membresía vigente con más de 7 días por delante |
| Por vencer | Vence dentro de los próximos 7 días |
| Vencidas | La fecha de fin ya pasó |
| Sin asistir | Lleva más de 7 días sin registrar visita |
| Sin plan | Se registró pero aún no contrata |

Al abrir un socio se puede:

- **Renovar** con un clic (+1, +3, +6 meses o +1 año). Si aún tiene días vigentes,
  la renovación se encadena en lugar de perderlos.
- Editar plan, fechas y notas internas a mano.
- **Registrar la visita del día** (dos clics el mismo día no la duplican).
- **Enviar un WhatsApp** desde una plantilla.

### 3. Los mensajes de WhatsApp

El panel sugiere sola la plantilla adecuada según la situación del socio:

| Plantilla | Se sugiere cuando |
|---|---|
| Bienvenida | Recién registrado, sin plan ni visitas |
| Próxima a vencer | Faltan 7 días o menos |
| Membresía vencida | Ya pasó la fecha de fin |
| Hace días que no viene | Membresía activa pero +7 días sin asistir |
| Confirmación de renovación | Membresía activa |
| Felicitación por constancia | 8 o más visitas en el mes |
| Invitación a test físico | Todavía no registra ninguna visita |

Cada mensaje llega **ya personalizado** con el nombre, la fecha de vencimiento, los días
restantes y las visitas del socio. El texto es editable antes de enviarlo.

Al pulsar **Abrir WhatsApp y enviar** se abre WhatsApp con el mensaje escrito y el
número cargado; solo falta darle enviar. El mensaje queda guardado en el historial
del socio para saber qué se le ha dicho y cuándo.

> Este método usa enlaces `wa.me`, así que **no tiene costo ni requiere aprobación**
> de la API de WhatsApp Business. El envío es manual: el administrador confirma cada mensaje.

---

## Detalles técnicos

**Stack:** Node.js + Express + SQLite (`better-sqlite3`). Sin servicios externos.

**Base de datos:** `app/data/pagoda.db`. Se crea sola al arrancar.
Está en `.gitignore` porque contiene datos personales de los socios.

### Tablas

| Tabla | Contenido |
|---|---|
| `socios` | Datos, contraseña cifrada, plan y vigencia |
| `visitas` | Una fila por socio y día (índice único evita duplicados) |
| `mensajes` | Bitácora de lo enviado por WhatsApp |
| `admins` | Usuarios del panel |

### Seguridad implementada

- Contraseñas cifradas con **bcrypt** (nunca se guardan ni se devuelven en claro).
- Sesiones con **JWT** en cookie `httpOnly` con vencimiento de 12 h.
- Todas las rutas `/api/admin/*` exigen sesión de administrador.
- Las respuestas al socio omiten el hash y las notas internas del personal.
- Teléfonos normalizados a 10 dígitos y validados antes de guardarse.

### Pendientes antes de producción

1. Definir un `JWT_SECRET` propio y cambiar la contraseña de admin.
2. Servir bajo **HTTPS** y poner `NODE_ENV=production` (activa la cookie segura).
3. Cambiar el número del gimnasio en `public/js/credencial.js` (`WHATSAPP_GYM`).
4. Programar respaldos periódicos de `app/data/pagoda.db`.
5. Añadir recuperación de contraseña para el socio (hoy no existe).
6. Si el hosting borra el disco en cada despliegue, montar un volumen
   persistente en `app/data/` o se pierden todos los socios.

> **Sobre los archivos estáticos:** el servidor expone únicamente `index.html`,
> `styles.css`, `script.js` y `assets/`. No montes la raíz del repositorio con
> `express.static`: dejaría `app/data/pagoda.db`, `app/.env` y `.git/`
> descargables desde el navegador.
