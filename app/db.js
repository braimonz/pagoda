/* ============================================================
   PAGODA — Capa de base de datos (SQLite)
============================================================ */
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'pagoda.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/* ------------------------------------------------------------
   ESQUEMA
------------------------------------------------------------ */
db.exec(`
  CREATE TABLE IF NOT EXISTS socios (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre        TEXT    NOT NULL,
    apellidos     TEXT    NOT NULL,
    telefono      TEXT    NOT NULL UNIQUE,      -- 10 dígitos, sin lada país
    password_hash TEXT    NOT NULL,
    plan          TEXT    CHECK(plan IN ('estudiante','normal')) DEFAULT NULL,
    fecha_inicio  TEXT    DEFAULT NULL,          -- ISO YYYY-MM-DD
    fecha_fin     TEXT    DEFAULT NULL,          -- ISO YYYY-MM-DD
    notas         TEXT    DEFAULT '',
    creado_en     TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS visitas (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    socio_id  INTEGER NOT NULL REFERENCES socios(id) ON DELETE CASCADE,
    fecha     TEXT    NOT NULL DEFAULT (date('now','localtime')),
    UNIQUE(socio_id, fecha)
  );

  CREATE TABLE IF NOT EXISTS mensajes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    socio_id   INTEGER NOT NULL REFERENCES socios(id) ON DELETE CASCADE,
    tipo       TEXT    NOT NULL,
    cuerpo     TEXT    NOT NULL,
    enviado_en TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS admins (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario       TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    nombre        TEXT    NOT NULL DEFAULT 'Admin'
  );

  CREATE INDEX IF NOT EXISTS idx_socios_tel      ON socios(telefono);
  CREATE INDEX IF NOT EXISTS idx_socios_fin      ON socios(fecha_fin);
  CREATE INDEX IF NOT EXISTS idx_visitas_socio   ON visitas(socio_id, fecha DESC);
  CREATE INDEX IF NOT EXISTS idx_mensajes_socio  ON mensajes(socio_id, enviado_en DESC);
`);

/* ------------------------------------------------------------
   HELPERS DE FECHA / ESTADO
------------------------------------------------------------ */
const DIAS_AVISO_PREVIO = 7;   // "por vencer" si faltan ≤ 7 días
const DIAS_INACTIVIDAD  = 7;   // "inactivo" si no viene hace > 7 días

function hoyISO() {
  return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD en zona local
}

function diasEntre(desdeISO, hastaISO) {
  const a = new Date(desdeISO + 'T00:00:00');
  const b = new Date(hastaISO + 'T00:00:00');
  return Math.round((b - a) / 86400000);
}

/**
 * Calcula el estado de membresía de un socio.
 * @returns {'sin_plan'|'activa'|'por_vencer'|'vencida'}
 */
function estadoMembresia(fechaFin) {
  if (!fechaFin) return 'sin_plan';
  const restantes = diasEntre(hoyISO(), fechaFin);
  if (restantes < 0) return 'vencida';
  if (restantes <= DIAS_AVISO_PREVIO) return 'por_vencer';
  return 'activa';
}

/** Enriquece una fila de socio con datos derivados que la UI necesita. */
function decorarSocio(row) {
  if (!row) return null;
  const hoy = hoyISO();
  const estado = estadoMembresia(row.fecha_fin);

  const diasRestantes = row.fecha_fin ? diasEntre(hoy, row.fecha_fin) : null;
  const diasSinVenir  = row.ultima_visita ? diasEntre(row.ultima_visita, hoy) : null;

  return {
    ...row,
    nombre_completo: `${row.nombre} ${row.apellidos}`.trim(),
    estado,
    dias_restantes: diasRestantes,
    dias_sin_venir: diasSinVenir,
    inactivo: diasSinVenir === null || diasSinVenir > DIAS_INACTIVIDAD,
    telefono_wa: `52${row.telefono}`,
  };
}

/* ------------------------------------------------------------
   CONSULTAS
------------------------------------------------------------ */
const SELECT_SOCIO_BASE = `
  SELECT
    s.*,
    (SELECT MAX(fecha) FROM visitas v WHERE v.socio_id = s.id)      AS ultima_visita,
    (SELECT COUNT(*)   FROM visitas v WHERE v.socio_id = s.id)      AS total_visitas,
    (SELECT COUNT(*)   FROM visitas v WHERE v.socio_id = s.id
       AND v.fecha >= date('now','localtime','start of month'))     AS visitas_mes
  FROM socios s
`;

const queries = {
  crearSocio: db.prepare(`
    INSERT INTO socios (nombre, apellidos, telefono, password_hash)
    VALUES (@nombre, @apellidos, @telefono, @password_hash)
  `),

  porTelefono: db.prepare(`${SELECT_SOCIO_BASE} WHERE s.telefono = ?`),
  porId:       db.prepare(`${SELECT_SOCIO_BASE} WHERE s.id = ?`),
  todos:       db.prepare(`${SELECT_SOCIO_BASE} ORDER BY s.creado_en DESC`),

  actualizarSuscripcion: db.prepare(`
    UPDATE socios
       SET plan = @plan, fecha_inicio = @fecha_inicio, fecha_fin = @fecha_fin, notas = @notas
     WHERE id = @id
  `),

  eliminarSocio: db.prepare(`DELETE FROM socios WHERE id = ?`),

  registrarVisita: db.prepare(`
    INSERT OR IGNORE INTO visitas (socio_id, fecha) VALUES (?, date('now','localtime'))
  `),

  visitasRecientes: db.prepare(`
    SELECT fecha FROM visitas WHERE socio_id = ? ORDER BY fecha DESC LIMIT 30
  `),

  registrarMensaje: db.prepare(`
    INSERT INTO mensajes (socio_id, tipo, cuerpo) VALUES (@socio_id, @tipo, @cuerpo)
  `),

  mensajesDeSocio: db.prepare(`
    SELECT tipo, cuerpo, enviado_en FROM mensajes
     WHERE socio_id = ? ORDER BY enviado_en DESC LIMIT 20
  `),

  adminPorUsuario: db.prepare(`SELECT * FROM admins WHERE usuario = ?`),
  crearAdmin:      db.prepare(`
    INSERT INTO admins (usuario, password_hash, nombre) VALUES (?, ?, ?)
  `),
  contarAdmins:    db.prepare(`SELECT COUNT(*) AS n FROM admins`),
};

/** Lista completa de socios ya decorados. */
function listarSocios() {
  return queries.todos.all().map(decorarSocio);
}

/** Métricas para el dashboard. */
function estadisticas() {
  const socios = listarSocios();
  return {
    total:      socios.length,
    activas:    socios.filter(s => s.estado === 'activa').length,
    por_vencer: socios.filter(s => s.estado === 'por_vencer').length,
    vencidas:   socios.filter(s => s.estado === 'vencida').length,
    sin_plan:   socios.filter(s => s.estado === 'sin_plan').length,
    inactivos:  socios.filter(s => s.inactivo && s.estado !== 'sin_plan').length,
    visitas_hoy: db.prepare(
      `SELECT COUNT(*) AS n FROM visitas WHERE fecha = date('now','localtime')`
    ).get().n,
    altas_mes: db.prepare(
      `SELECT COUNT(*) AS n FROM socios
        WHERE creado_en >= datetime('now','localtime','start of month')`
    ).get().n,
  };
}

module.exports = {
  db,
  queries,
  listarSocios,
  estadisticas,
  decorarSocio,
  estadoMembresia,
  hoyISO,
  diasEntre,
  DIAS_AVISO_PREVIO,
  DIAS_INACTIVIDAD,
};
