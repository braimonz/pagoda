/* ============================================================
   PAGODA — Plantillas de mensajes de WhatsApp
   Cada plantilla recibe el socio decorado y devuelve el texto.
============================================================ */

const GYM = {
  nombre: 'Pagoda Fitness Center',
  direccion: 'C. Josefa Ortiz de Domínguez 104-110, Guadalupe Hidalgo, Tehuacán',
};

/** "12 de marzo" a partir de un ISO YYYY-MM-DD */
function fechaLarga(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' });
}

/** "3 días" / "1 día" / "hoy" */
function plural(n, sing, plur) {
  return `${n} ${n === 1 ? sing : plur}`;
}

const PLANTILLAS = {
  bienvenida: {
    etiqueta: 'Bienvenida',
    icono: '👋',
    descripcion: 'Al dar de alta a un socio nuevo.',
    aplica: (s) => s.total_visitas === 0 && s.estado === 'sin_plan',
    texto: (s) =>
`¡Hola ${s.nombre}! 👊 Bienvenido a ${GYM.nombre}.

Aquí no entrenas solo — cualquier duda que tengas, con confianza nos escribes por aquí.

Tu primera semana viene con acompañamiento de un coach asignado. Cuando quieras arrancamos con tu test físico y armamos tu rutina.

¡Nos vemos en el gym! 🔴⚫`,
  },

  por_vencer: {
    etiqueta: 'Próxima a vencer',
    icono: '⏳',
    descripcion: 'Faltan pocos días para que termine su membresía.',
    aplica: (s) => s.estado === 'por_vencer',
    texto: (s) =>
`¡Hola ${s.nombre}! 💪

Te escribo de ${GYM.nombre} para recordarte que tu membresía vence el ${fechaLarga(s.fecha_fin)} — ${
  s.dias_restantes === 0 ? 'es hoy' : `faltan ${plural(s.dias_restantes, 'día', 'días')}`
}.

Vas muy bien, no pares ahora. Si quieres la renovamos hoy mismo y le seguimos sin interrupciones.

¿Te la dejo lista? 🔴`,
  },

  vencida: {
    etiqueta: 'Membresía vencida',
    icono: '🔴',
    descripcion: 'Su membresía ya terminó.',
    aplica: (s) => s.estado === 'vencida',
    texto: (s) =>
`¡Hola ${s.nombre}!

Tu membresía en ${GYM.nombre} venció el ${fechaLarga(s.fecha_fin)} y no queremos que pierdas el avance que ya llevas.

Reactivarla toma un minuto y sigues justo donde te quedaste. Aquí seguimos esperándote 👊

¿La reactivamos?`,
  },

  inactividad: {
    etiqueta: 'Hace días que no viene',
    icono: '👀',
    descripcion: 'Tiene membresía activa pero dejó de asistir.',
    aplica: (s) => s.inactivo && s.estado === 'activa',
    texto: (s) =>
`¡Hola ${s.nombre}! 👋

Te andamos extrañando en ${GYM.nombre} — ${
  s.dias_sin_venir === null
    ? 'todavía no registramos tu primera visita'
    : `hace ${plural(s.dias_sin_venir, 'día', 'días')} que no te vemos`
}.

Todo bien? Si necesitas ajustar tu rutina o cambiar tu horario, dinos y lo acomodamos. Tu membresía sigue activa, no la desaproveches.

¡Te esperamos! 🔴⚫`,
  },

  renovada: {
    etiqueta: 'Confirmación de renovación',
    icono: '✅',
    descripcion: 'Confirma que su membresía quedó activa.',
    aplica: (s) => s.estado === 'activa',
    texto: (s) =>
`¡Listo ${s.nombre}! ✅

Tu membresía en ${GYM.nombre} quedó activa hasta el ${fechaLarga(s.fecha_fin)}.

Plan: ${s.plan === 'estudiante' ? 'Estudiante' : 'Normal'}

Nos vemos en el gym 👊🔴`,
  },

  felicitacion: {
    etiqueta: 'Felicitación por constancia',
    icono: '🏆',
    descripcion: 'Reconoce su asistencia del mes.',
    aplica: (s) => s.visitas_mes >= 8,
    texto: (s) =>
`¡${s.nombre}, esto merece reconocimiento! 🏆

Llevas ${plural(s.visitas_mes, 'entrenamiento', 'entrenamientos')} este mes. Esa constancia es justo lo que hace la diferencia.

Sigue así y vas directo al muro de transformaciones 💪

— El equipo de ${GYM.nombre}`,
  },

  test_fisico: {
    etiqueta: 'Invitación a test físico',
    icono: '📋',
    descripcion: 'Ofrece la evaluación gratuita.',
    aplica: (s) => s.total_visitas === 0,
    texto: (s) =>
`¡Hola ${s.nombre}! 📋

¿Ya hiciste tu test físico en ${GYM.nombre}? Es gratis y te sirve para saber exactamente en dónde estás parado y a dónde puedes llegar.

Medimos composición corporal, resistencia, fuerza base y movilidad. Toma 20 minutos.

¿Qué día te queda bien? 🔴`,
  },
};

/** Construye el link wa.me listo para abrir. */
function linkWhatsApp(telefonoWa, texto) {
  return `https://wa.me/${telefonoWa}?text=${encodeURIComponent(texto)}`;
}

/** Devuelve las plantillas con su texto ya resuelto para un socio. */
function paraSocio(socio) {
  return Object.entries(PLANTILLAS).map(([id, p]) => {
    const texto = p.texto(socio);
    return {
      id,
      etiqueta: p.etiqueta,
      icono: p.icono,
      descripcion: p.descripcion,
      sugerida: p.aplica(socio),
      texto,
      link: linkWhatsApp(socio.telefono_wa, texto),
    };
  });
}

module.exports = { PLANTILLAS, paraSocio, linkWhatsApp, GYM };
