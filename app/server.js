/* ============================================================
   PAGODA — Servidor (registro de socios + panel admin)
============================================================ */
require('dotenv').config();

const path = require('path');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const {
  queries, listarSocios, estadisticas, decorarSocio, hoyISO, diasEntre,
} = require('./db');
const { paraSocio, linkWhatsApp } = require('./plantillas');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'cambia-esto-en-produccion';
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 1000 * 60 * 60 * 12, // 12 h
};

app.use(express.json());
app.use(cookieParser());

// Archivos de la app de socios (css, js de las pantallas).
app.use(express.static(path.join(__dirname, 'public')));

/* El sitio público vive un nivel arriba, junto al código del servidor.
   Se exponen SOLO sus archivos, nunca la carpeta completa: servir la raíz
   dejaría al alcance de cualquiera app/data/pagoda.db, app/.env y .git/. */
const RAIZ = path.join(__dirname, '..');
app.use('/assets', express.static(path.join(RAIZ, 'assets')));
app.get('/styles.css', (_req, res) => res.sendFile(path.join(RAIZ, 'styles.css')));
app.get('/script.js',  (_req, res) => res.sendFile(path.join(RAIZ, 'script.js')));

/* ------------------------------------------------------------
   UTILIDADES
------------------------------------------------------------ */
/** Normaliza a 10 dígitos; devuelve null si no es un celular MX válido. */
function normalizarTelefono(raw) {
  const d = String(raw || '').replace(/\D/g, '');
  const sinLada = d.length > 10 ? d.slice(-10) : d;
  return /^[1-9]\d{9}$/.test(sinLada) ? sinLada : null;
}

function firmar(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
}

/** Middleware: exige sesión de administrador. */
function requiereAdmin(req, res, next) {
  const token = req.cookies?.pagoda_admin;
  if (!token) return res.status(401).json({ error: 'No autenticado' });
  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    if (req.admin.rol !== 'admin') throw new Error('rol inválido');
    next();
  } catch {
    res.clearCookie('pagoda_admin');
    res.status(401).json({ error: 'Sesión expirada' });
  }
}

/** Middleware: exige sesión de socio. */
function requiereSocio(req, res, next) {
  const token = req.cookies?.pagoda_socio;
  if (!token) return res.status(401).json({ error: 'No autenticado' });
  try {
    req.socio = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.clearCookie('pagoda_socio');
    res.status(401).json({ error: 'Sesión expirada' });
  }
}

/* ============================================================
   API PÚBLICA — SOCIOS
============================================================ */

/** Alta de socio desde el QR. */
app.post('/api/registro', (req, res) => {
  const { nombre, apellidos, telefono, password } = req.body || {};

  if (!nombre?.trim() || !apellidos?.trim()) {
    return res.status(400).json({ error: 'Nombre y apellidos son obligatorios.' });
  }
  const tel = normalizarTelefono(telefono);
  if (!tel) {
    return res.status(400).json({ error: 'El teléfono debe tener 10 dígitos.' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'La contraseña necesita al menos 6 caracteres.' });
  }
  if (queries.porTelefono.get(tel)) {
    return res.status(409).json({ error: 'Ese teléfono ya está registrado. Inicia sesión.' });
  }

  const info = queries.crearSocio.run({
    nombre: nombre.trim(),
    apellidos: apellidos.trim(),
    telefono: tel,
    password_hash: bcrypt.hashSync(password, 10),
  });

  const socio = decorarSocio(queries.porId.get(info.lastInsertRowid));
  res.cookie('pagoda_socio', firmar({ id: socio.id, tel: socio.telefono }), COOKIE_OPTS);
  res.status(201).json({ ok: true, socio: publico(socio) });
});

/** Inicio de sesión del socio. */
app.post('/api/login', (req, res) => {
  const tel = normalizarTelefono(req.body?.telefono);
  const { password } = req.body || {};
  if (!tel || !password) {
    return res.status(400).json({ error: 'Teléfono y contraseña son obligatorios.' });
  }

  const fila = queries.porTelefono.get(tel);
  if (!fila || !bcrypt.compareSync(password, fila.password_hash)) {
    return res.status(401).json({ error: 'Teléfono o contraseña incorrectos.' });
  }

  const socio = decorarSocio(fila);
  res.cookie('pagoda_socio', firmar({ id: socio.id, tel: socio.telefono }), COOKIE_OPTS);
  res.json({ ok: true, socio: publico(socio) });
});

app.post('/api/logout', (_req, res) => {
  res.clearCookie('pagoda_socio');
  res.json({ ok: true });
});

/** Datos de la credencial del socio en sesión. */
app.get('/api/yo', requiereSocio, (req, res) => {
  const socio = decorarSocio(queries.porId.get(req.socio.id));
  if (!socio) return res.status(404).json({ error: 'Socio no encontrado' });
  res.json({ socio: publico(socio), visitas: queries.visitasRecientes.all(socio.id) });
});

/** Proyección segura: nunca sale el hash. */
function publico(s) {
  const { password_hash, notas, ...resto } = s;
  return resto;
}

/* ============================================================
   API ADMIN
============================================================ */

app.post('/api/admin/login', (req, res) => {
  const { usuario, password } = req.body || {};
  const admin = queries.adminPorUsuario.get(String(usuario || '').trim().toLowerCase());

  if (!admin || !bcrypt.compareSync(String(password || ''), admin.password_hash)) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
  }

  res.cookie(
    'pagoda_admin',
    firmar({ id: admin.id, usuario: admin.usuario, nombre: admin.nombre, rol: 'admin' }),
    COOKIE_OPTS
  );
  res.json({ ok: true, admin: { usuario: admin.usuario, nombre: admin.nombre } });
});

app.post('/api/admin/logout', (_req, res) => {
  res.clearCookie('pagoda_admin');
  res.json({ ok: true });
});

app.get('/api/admin/sesion', requiereAdmin, (req, res) => {
  res.json({ admin: { usuario: req.admin.usuario, nombre: req.admin.nombre } });
});

/** Dashboard: métricas + listado filtrable. */
app.get('/api/admin/socios', requiereAdmin, (req, res) => {
  const { estado, q, orden } = req.query;
  let socios = listarSocios();

  if (estado && estado !== 'todos') {
    socios = estado === 'inactivos'
      ? socios.filter(s => s.inactivo && s.estado !== 'sin_plan')
      : socios.filter(s => s.estado === estado);
  }

  if (q?.trim()) {
    const t = q.trim().toLowerCase();
    socios = socios.filter(s =>
      s.nombre_completo.toLowerCase().includes(t) || s.telefono.includes(t.replace(/\D/g, ''))
    );
  }

  const ordenadores = {
    vencimiento: (a, b) => (a.fecha_fin || '9999').localeCompare(b.fecha_fin || '9999'),
    nombre:      (a, b) => a.nombre_completo.localeCompare(b.nombre_completo),
    inactividad: (a, b) => (b.dias_sin_venir ?? 9999) - (a.dias_sin_venir ?? 9999),
    reciente:    (a, b) => b.creado_en.localeCompare(a.creado_en),
  };
  socios.sort(ordenadores[orden] || ordenadores.reciente);

  res.json({ stats: estadisticas(), socios: socios.map(publico) });
});

/** Detalle de un socio + plantillas de WhatsApp resueltas. */
app.get('/api/admin/socios/:id', requiereAdmin, (req, res) => {
  const socio = decorarSocio(queries.porId.get(req.params.id));
  if (!socio) return res.status(404).json({ error: 'Socio no encontrado' });

  res.json({
    socio: publico(socio),
    notas: socio.notas,
    plantillas: paraSocio(socio),
    visitas: queries.visitasRecientes.all(socio.id),
    mensajes: queries.mensajesDeSocio.all(socio.id),
  });
});

/** Alta o renovación de suscripción. */
app.patch('/api/admin/socios/:id', requiereAdmin, (req, res) => {
  const socio = queries.porId.get(req.params.id);
  if (!socio) return res.status(404).json({ error: 'Socio no encontrado' });

  const { plan, fecha_inicio, fecha_fin, notas } = req.body || {};
  if (plan && !['estudiante', 'normal'].includes(plan)) {
    return res.status(400).json({ error: 'Plan inválido.' });
  }
  if (fecha_inicio && fecha_fin && fecha_fin < fecha_inicio) {
    return res.status(400).json({ error: 'La fecha de fin no puede ser anterior al inicio.' });
  }

  queries.actualizarSuscripcion.run({
    id: socio.id,
    plan: plan ?? socio.plan,
    fecha_inicio: fecha_inicio ?? socio.fecha_inicio,
    fecha_fin: fecha_fin ?? socio.fecha_fin,
    notas: notas ?? socio.notas,
  });

  res.json({ ok: true, socio: publico(decorarSocio(queries.porId.get(socio.id))) });
});

/** Renovación rápida: suma N meses desde hoy (o desde el fin vigente). */
app.post('/api/admin/socios/:id/renovar', requiereAdmin, (req, res) => {
  const socio = decorarSocio(queries.porId.get(req.params.id));
  if (!socio) return res.status(404).json({ error: 'Socio no encontrado' });

  const meses = Number(req.body?.meses) || 1;
  const plan = req.body?.plan || socio.plan || 'normal';

  // Si aún tiene días vigentes, encadenamos; si no, arrancamos hoy.
  const base = socio.fecha_fin && diasEntre(hoyISO(), socio.fecha_fin) > 0
    ? socio.fecha_fin
    : hoyISO();

  const fin = new Date(base + 'T00:00:00');
  fin.setMonth(fin.getMonth() + meses);

  queries.actualizarSuscripcion.run({
    id: socio.id,
    plan,
    fecha_inicio: socio.fecha_inicio || hoyISO(),
    fecha_fin: fin.toLocaleDateString('en-CA'),
    notas: socio.notas,
  });

  res.json({ ok: true, socio: publico(decorarSocio(queries.porId.get(socio.id))) });
});

/** Registra asistencia de hoy (idempotente). */
app.post('/api/admin/socios/:id/visita', requiereAdmin, (req, res) => {
  if (!queries.porId.get(req.params.id)) {
    return res.status(404).json({ error: 'Socio no encontrado' });
  }
  queries.registrarVisita.run(req.params.id);
  res.json({ ok: true, socio: publico(decorarSocio(queries.porId.get(req.params.id))) });
});

/** Deja constancia de que se envió un mensaje. */
app.post('/api/admin/socios/:id/mensaje', requiereAdmin, (req, res) => {
  const socio = decorarSocio(queries.porId.get(req.params.id));
  if (!socio) return res.status(404).json({ error: 'Socio no encontrado' });

  const { tipo, cuerpo } = req.body || {};
  if (!cuerpo?.trim()) return res.status(400).json({ error: 'El mensaje va vacío.' });

  queries.registrarMensaje.run({
    socio_id: socio.id,
    tipo: tipo || 'manual',
    cuerpo: cuerpo.trim(),
  });

  res.json({ ok: true, link: linkWhatsApp(socio.telefono_wa, cuerpo.trim()) });
});

app.delete('/api/admin/socios/:id', requiereAdmin, (req, res) => {
  const r = queries.eliminarSocio.run(req.params.id);
  if (!r.changes) return res.status(404).json({ error: 'Socio no encontrado' });
  res.json({ ok: true });
});

/* ------------------------------------------------------------
   RUTAS DE PÁGINAS
------------------------------------------------------------ */
const pagina = (f) => (_req, res) => res.sendFile(path.join(__dirname, 'public', f));

// La raíz es el sitio público; la app de socios cuelga de sus propias rutas.
app.get('/',           (_req, res) => res.sendFile(path.join(RAIZ, 'index.html')));
app.get('/registro',   pagina('registro.html'));
app.get('/credencial', pagina('credencial.html'));
app.get('/admin',      pagina('admin.html'));

app.use((_req, res) => res.status(404).sendFile(path.join(RAIZ, 'index.html')));

app.listen(PORT, () => {
  console.log(`\n  🔴 PAGODA — sistema de socios`);
  console.log(`  ─────────────────────────────────────`);
  console.log(`  Registro (QR) →  http://localhost:${PORT}/registro`);
  console.log(`  Credencial    →  http://localhost:${PORT}/credencial`);
  console.log(`  Admin         →  http://localhost:${PORT}/admin\n`);
});
