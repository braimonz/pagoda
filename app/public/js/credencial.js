/* ============================================================
   PAGODA — Credencial digital del socio
============================================================ */
const WHATSAPP_GYM = '5212381234567'; // ← número del gimnasio

const ETIQUETAS_ESTADO = {
  activa:     'Membresía activa',
  por_vencer: 'Por vencer',
  vencida:    'Membresía vencida',
  sin_plan:   'Sin plan activo',
};

/** Mensaje humano según el estado de la membresía. */
function mensajeEstado(s) {
  switch (s.estado) {
    case 'activa':
      return `Te quedan ${s.dias_restantes} días. Sigue así 💪`;
    case 'por_vencer':
      return s.dias_restantes === 0
        ? 'Tu membresía vence hoy. Pásate a renovarla.'
        : `Vence en ${s.dias_restantes} ${s.dias_restantes === 1 ? 'día' : 'días'}. Renuévala para no perder el ritmo.`;
    case 'vencida':
      return `Venció hace ${Math.abs(s.dias_restantes)} días. Reactívala cuando quieras.`;
    default:
      return 'Pasa a recepción para activar tu plan y empezar.';
  }
}

function fechaCorta(iso) {
  if (!iso) return '—';
  return new Date(iso + 'T00:00:00')
    .toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' })
    .replace('.', '');
}

function render({ socio, visitas }) {
  const cont = document.getElementById('contenedor');
  const tpl = document.getElementById('tplCredencial').content.cloneNode(true);
  const set = (attr, valor) => {
    const el = tpl.querySelector(`[${attr}]`);
    if (el) el.textContent = valor;
  };

  set('data-nombre', socio.nombre_completo);
  set('data-folio', String(socio.id).padStart(4, '0'));
  set('data-plan', socio.plan ? (socio.plan === 'estudiante' ? 'Estudiante' : 'Normal') : 'Sin plan');
  set('data-vigencia', fechaCorta(socio.fecha_fin));
  set('data-visitas-mes', socio.visitas_mes ?? 0);
  set('data-visitas-total', socio.total_visitas ?? 0);
  set('data-mensaje', mensajeEstado(socio));

  // Badge de estado
  const badge = tpl.querySelector('[data-badge]');
  badge.className = `badge badge--${socio.estado}`;
  badge.textContent = ETIQUETAS_ESTADO[socio.estado];

  // Chips de visitas recientes
  if (visitas?.length) {
    tpl.querySelector('[data-bloque-visitas]').hidden = false;
    const chips = tpl.querySelector('[data-chips-visitas]');
    visitas.slice(0, 12).forEach((v) => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.textContent = fechaCorta(v.fecha);
      chips.appendChild(chip);
    });
  }

  // Enlace de WhatsApp al gym
  const saludo = `Hola, soy ${socio.nombre_completo} (socio #${String(socio.id).padStart(4, '0')}).`;
  tpl.querySelector('[data-wa]').href =
    `https://wa.me/${WHATSAPP_GYM}?text=${encodeURIComponent(saludo)}`;

  // Cerrar sesión
  tpl.querySelector('[data-salir]').addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/registro';
  });

  cont.innerHTML = '';
  cont.appendChild(tpl);
}

/* ---------- Carga inicial ---------- */
(window.__promesaYo || fetch('/api/yo'))
  .then((r) => {
    if (!r.ok) throw new Error('sin sesión');
    return r.json();
  })
  .then(render)
  .catch(() => (window.location.href = '/registro'));
