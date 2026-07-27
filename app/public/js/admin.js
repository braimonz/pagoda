/* ============================================================
   PAGODA — Panel de administración
============================================================ */
const $  = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const ETIQUETAS_ESTADO = {
  activa:     'Activa',
  por_vencer: 'Por vencer',
  vencida:    'Vencida',
  sin_plan:   'Sin plan',
};

let socioAbierto = null;

/* ============================================================
   HELPERS
============================================================ */
async function api(url, opciones = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opciones,
  });
  if (res.status === 401) {
    mostrarLogin();
    throw new Error('Sesión expirada');
  }
  const cuerpo = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(cuerpo.error || 'Error inesperado');
  return cuerpo;
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('visible');
  clearTimeout(t._temporizador);
  t._temporizador = setTimeout(() => t.classList.remove('visible'), 3200);
}

function fechaCorta(iso) {
  if (!iso) return '—';
  return new Date(iso + 'T00:00:00')
    .toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
    .replace('.', '');
}

function iniciales(socio) {
  return ((socio.nombre[0] || '') + (socio.apellidos[0] || '')).toUpperCase();
}

/** Escapa texto antes de insertarlo como HTML. */
function esc(str) {
  const d = document.createElement('div');
  d.textContent = str ?? '';
  return d.innerHTML;
}

function textoInactividad(s) {
  if (s.dias_sin_venir === null) return 'Nunca';
  if (s.dias_sin_venir === 0) return 'Hoy';
  return `Hace ${s.dias_sin_venir} d`;
}

/* ============================================================
   AUTENTICACIÓN
============================================================ */
function mostrarLogin() {
  $('#vistaLogin').hidden = false;
  $('#vistaPanel').hidden = true;
}

function mostrarPanel(admin) {
  $('#vistaLogin').hidden = true;
  $('#vistaPanel').hidden = false;
  $('#adminNombre').textContent = admin?.nombre || admin?.usuario || 'Admin';
  cargarSocios();
}

$('#formAdminLogin').addEventListener('submit', async (e) => {
  e.preventDefault();
  const err = $('#loginError');
  const btn = $('#btnAdminLogin');
  err.hidden = true;
  btn.disabled = true;
  btn.textContent = 'Entrando…';

  try {
    const { admin } = await api('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({
        usuario: $('#adminUser').value.trim(),
        password: $('#adminPass').value,
      }),
    });
    mostrarPanel(admin);
  } catch (e2) {
    err.textContent = e2.message;
    err.hidden = false;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Entrar';
  }
});

$('#btnSalir').addEventListener('click', async () => {
  await fetch('/api/admin/logout', { method: 'POST' });
  location.reload();
});

/* ============================================================
   LISTADO
============================================================ */
const filtros = { estado: 'todos', q: '', orden: 'reciente' };

async function cargarSocios() {
  const params = new URLSearchParams(filtros);
  const { stats, socios } = await api(`/api/admin/socios?${params}`);
  pintarMetricas(stats);
  pintarTabla(socios);
}

function pintarMetricas(stats) {
  const tarjetas = [
    { k: 'todos',      n: stats.total,      l: 'Socios totales', clase: '' },
    { k: 'activa',     n: stats.activas,    l: 'Activas',        clase: 'metrica--ok' },
    { k: 'por_vencer', n: stats.por_vencer, l: 'Por vencer',     clase: 'metrica--warn' },
    { k: 'vencida',    n: stats.vencidas,   l: 'Vencidas',       clase: 'metrica--dan' },
    { k: 'inactivos',  n: stats.inactivos,  l: 'Sin asistir',    clase: 'metrica--pur' },
    { k: 'sin_plan',   n: stats.sin_plan,   l: 'Sin plan',       clase: '' },
  ];

  $('#metricas').innerHTML = tarjetas.map((t) => `
    <div class="metrica ${t.clase} ${filtros.estado === t.k ? 'activa' : ''}" data-filtro="${t.k}">
      <span class="metrica__n">${t.n}</span>
      <span class="metrica__l">${t.l}</span>
    </div>
  `).join('');

  $$('#metricas .metrica').forEach((el) => {
    el.addEventListener('click', () => {
      filtros.estado = el.dataset.filtro;
      $('#filtroEstado').value = el.dataset.filtro;
      cargarSocios();
    });
  });
}

function pintarTabla(socios) {
  const tbody = $('#cuerpoTabla');
  $('#sinResultados').hidden = socios.length > 0;

  tbody.innerHTML = socios.map((s) => `
    <tr data-id="${s.id}">
      <td>
        <div class="celda-socio">
          <div class="avatar">${esc(iniciales(s))}</div>
          <div>
            <strong>${esc(s.nombre_completo)}</strong>
            <span>+52 ${esc(s.telefono)}</span>
          </div>
        </div>
      </td>
      <td>${s.plan ? (s.plan === 'estudiante' ? 'Estudiante' : 'Normal') : '<span style="color:#555">—</span>'}</td>
      <td><span class="badge badge--${s.estado}">${ETIQUETAS_ESTADO[s.estado]}</span></td>
      <td>${fechaCorta(s.fecha_fin)}</td>
      <td style="${s.inactivo ? 'color:#c084fc' : ''}">${textoInactividad(s)}</td>
      <td>${s.visitas_mes ?? 0}</td>
      <td>
        <div class="acciones">
          <button class="btn btn--ghost btn--sm" data-accion="visita" data-id="${s.id}">+ Visita</button>
          <button class="btn btn--red btn--sm"   data-accion="abrir"  data-id="${s.id}">Ver</button>
        </div>
      </td>
    </tr>
  `).join('');

  // Fila completa abre el detalle
  tbody.querySelectorAll('tr').forEach((tr) => {
    tr.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      abrirSocio(tr.dataset.id);
    });
  });

  tbody.querySelectorAll('[data-accion]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const { accion, id } = btn.dataset;
      if (accion === 'abrir') return abrirSocio(id);
      if (accion === 'visita') {
        await api(`/api/admin/socios/${id}/visita`, { method: 'POST' });
        toast('Asistencia registrada.');
        cargarSocios();
      }
    });
  });
}

/* ---------- Filtros ---------- */
$('#filtroEstado').addEventListener('change', (e) => {
  filtros.estado = e.target.value;
  cargarSocios();
});

$('#ordenLista').addEventListener('change', (e) => {
  filtros.orden = e.target.value;
  cargarSocios();
});

let debounce;
$('#buscador').addEventListener('input', (e) => {
  clearTimeout(debounce);
  debounce = setTimeout(() => {
    filtros.q = e.target.value.trim();
    cargarSocios();
  }, 250);
});

/* ============================================================
   PANEL DE DETALLE
============================================================ */
function cerrarPanel() {
  $('#panelSocio').classList.remove('abierto');
  $('#overlay').classList.remove('abierto');
  $('#panelSocio').setAttribute('aria-hidden', 'true');
  socioAbierto = null;
}

$('#pCerrar').addEventListener('click', cerrarPanel);
$('#overlay').addEventListener('click', cerrarPanel);
document.addEventListener('keydown', (e) => e.key === 'Escape' && cerrarPanel());

async function abrirSocio(id) {
  const datos = await api(`/api/admin/socios/${id}`);
  socioAbierto = datos.socio;

  $('#pAvatar').textContent   = iniciales(datos.socio);
  $('#pNombre').textContent   = datos.socio.nombre_completo;
  $('#pTelefono').textContent = `+52 ${datos.socio.telefono}`;
  $('#pCuerpo').innerHTML     = plantillaDetalle(datos);

  conectarDetalle(datos);

  $('#panelSocio').classList.add('abierto');
  $('#overlay').classList.add('abierto');
  $('#panelSocio').setAttribute('aria-hidden', 'false');
}

function plantillaDetalle({ socio, notas, plantillas, visitas, mensajes }) {
  const sugeridas = plantillas.filter((p) => p.sugerida);
  const resto     = plantillas.filter((p) => !p.sugerida);

  return `
    <!-- Estado -->
    <div class="bloque">
      <h3>Membresía</h3>
      <div style="margin-bottom:16px">
        <span class="badge badge--${socio.estado}">${ETIQUETAS_ESTADO[socio.estado]}</span>
        ${socio.inactivo && socio.estado !== 'sin_plan'
          ? '<span class="badge badge--inactivo" style="margin-left:6px">Sin asistir</span>' : ''}
      </div>
      <div class="datos-grid">
        <div class="dato"><span>Plan</span><strong>${socio.plan ? (socio.plan === 'estudiante' ? 'Estudiante' : 'Normal') : '—'}</strong></div>
        <div class="dato"><span>Vence</span><strong>${fechaCorta(socio.fecha_fin)}</strong></div>
        <div class="dato"><span>Visitas del mes</span><strong>${socio.visitas_mes ?? 0}</strong></div>
        <div class="dato"><span>Última visita</span><strong>${textoInactividad(socio)}</strong></div>
      </div>
    </div>

    <!-- Renovación -->
    <div class="bloque">
      <h3>Renovar suscripción</h3>
      <div class="renov-rapida">
        <button class="btn btn--red btn--sm"   data-renovar="1">+ 1 mes</button>
        <button class="btn btn--ghost btn--sm" data-renovar="3">+ 3 meses</button>
        <button class="btn btn--ghost btn--sm" data-renovar="6">+ 6 meses</button>
        <button class="btn btn--ghost btn--sm" data-renovar="12">+ 1 año</button>
      </div>

      <div class="campo">
        <label for="dPlan">Plan</label>
        <select id="dPlan">
          <option value="">Sin plan</option>
          <option value="estudiante" ${socio.plan === 'estudiante' ? 'selected' : ''}>Estudiante</option>
          <option value="normal"     ${socio.plan === 'normal'     ? 'selected' : ''}>Normal</option>
        </select>
      </div>

      <div class="datos-grid" style="gap:12px">
        <div class="campo">
          <label for="dInicio">Inicio</label>
          <input type="date" id="dInicio" value="${socio.fecha_inicio || ''}" />
        </div>
        <div class="campo">
          <label for="dFin">Fin</label>
          <input type="date" id="dFin" value="${socio.fecha_fin || ''}" />
        </div>
      </div>

      <div class="campo">
        <label for="dNotas">Notas internas</label>
        <textarea id="dNotas" placeholder="Lesiones, objetivos, acuerdos de pago…">${esc(notas)}</textarea>
      </div>

      <button class="btn btn--red btn--full btn--sm" data-guardar>Guardar cambios</button>
    </div>

    <!-- WhatsApp -->
    <div class="bloque">
      <h3>Enviar por WhatsApp</h3>
      ${sugeridas.length
        ? `<p class="sub" style="margin-bottom:12px">Sugerencias según su situación actual:</p>
           ${sugeridas.map(bloquePlantilla).join('')}`
        : ''}
      ${resto.length
        ? `<p class="sub" style="margin:18px 0 12px">Otras plantillas:</p>
           ${resto.map(bloquePlantilla).join('')}`
        : ''}
    </div>

    <!-- Historial -->
    <div class="bloque">
      <h3>Mensajes enviados</h3>
      ${mensajes.length
        ? mensajes.map((m) => `
            <div class="historial-item">
              <div class="meta">${esc(m.tipo)} · ${esc(m.enviado_en)}</div>
              ${esc(m.cuerpo.slice(0, 110))}${m.cuerpo.length > 110 ? '…' : ''}
            </div>`).join('')
        : '<p class="sub">Todavía no se le ha enviado ningún mensaje.</p>'}
    </div>

    <!-- Visitas -->
    <div class="bloque">
      <h3>Asistencia reciente</h3>
      ${visitas.length
        ? `<div class="chips">${visitas.map((v) => `<span class="chip">${fechaCorta(v.fecha)}</span>`).join('')}</div>`
        : '<p class="sub">Sin visitas registradas.</p>'}
      <button class="btn btn--ghost btn--full btn--sm" data-visita style="margin-top:12px">
        Registrar visita de hoy
      </button>
    </div>

    <!-- Zona de riesgo -->
    <div class="bloque">
      <button class="btn btn--ghost btn--full btn--sm" data-eliminar
              style="border-color:rgba(225,6,0,.35);color:#ff8079">
        Eliminar socio
      </button>
    </div>
  `;
}

function bloquePlantilla(p) {
  return `
    <div class="plantilla ${p.sugerida ? 'sugerida' : ''}">
      <div class="plantilla__head">
        <span>${p.icono}</span>
        <strong>${esc(p.etiqueta)}</strong>
        ${p.sugerida ? '<span class="plantilla__pill">Sugerido</span>' : ''}
      </div>
      <p class="plantilla__desc">${esc(p.descripcion)}</p>
      <textarea class="plantilla__texto" data-texto="${p.id}">${esc(p.texto)}</textarea>
      <button class="btn btn--wa btn--full btn--sm" data-enviar="${p.id}">
        Abrir WhatsApp y enviar
      </button>
    </div>
  `;
}

/* ---------- Interacciones del detalle ---------- */
function conectarDetalle({ socio }) {
  const cuerpo = $('#pCuerpo');

  // Renovación rápida
  cuerpo.querySelectorAll('[data-renovar]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const meses = Number(btn.dataset.renovar);
      await api(`/api/admin/socios/${socio.id}/renovar`, {
        method: 'POST',
        body: JSON.stringify({ meses, plan: $('#dPlan').value || undefined }),
      });
      toast(`Membresía extendida ${meses} ${meses === 1 ? 'mes' : 'meses'}.`);
      await cargarSocios();
      abrirSocio(socio.id);
    });
  });

  // Guardar cambios manuales
  cuerpo.querySelector('[data-guardar]').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    try {
      await api(`/api/admin/socios/${socio.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          plan: $('#dPlan').value || null,
          fecha_inicio: $('#dInicio').value || null,
          fecha_fin: $('#dFin').value || null,
          notas: $('#dNotas').value,
        }),
      });
      toast('Cambios guardados.');
      await cargarSocios();
      abrirSocio(socio.id);
    } catch (err) {
      toast(err.message);
    } finally {
      btn.disabled = false;
    }
  });

  // Envío por WhatsApp
  cuerpo.querySelectorAll('[data-enviar]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.enviar;
      const texto = cuerpo.querySelector(`[data-texto="${id}"]`).value.trim();
      if (!texto) return toast('El mensaje está vacío.');

      // Abrimos primero para no perder el gesto del usuario (bloqueo de pop-ups).
      const ventana = window.open('', '_blank');
      try {
        const { link } = await api(`/api/admin/socios/${socio.id}/mensaje`, {
          method: 'POST',
          body: JSON.stringify({ tipo: id, cuerpo: texto }),
        });
        if (ventana) ventana.location.href = link;
        toast('WhatsApp abierto. Mensaje guardado en el historial.');
        abrirSocio(socio.id);
      } catch (err) {
        ventana?.close();
        toast(err.message);
      }
    });
  });

  // Registrar visita
  cuerpo.querySelector('[data-visita]').addEventListener('click', async () => {
    await api(`/api/admin/socios/${socio.id}/visita`, { method: 'POST' });
    toast('Asistencia registrada.');
    await cargarSocios();
    abrirSocio(socio.id);
  });

  // Eliminar
  cuerpo.querySelector('[data-eliminar]').addEventListener('click', async () => {
    if (!confirm(`¿Eliminar a ${socio.nombre_completo}? Esta acción no se puede deshacer.`)) return;
    await api(`/api/admin/socios/${socio.id}`, { method: 'DELETE' });
    toast('Socio eliminado.');
    cerrarPanel();
    cargarSocios();
  });
}

/* ============================================================
   ARRANQUE
============================================================ */
api('/api/admin/sesion')
  .then(({ admin }) => mostrarPanel(admin))
  .catch(() => mostrarLogin());
