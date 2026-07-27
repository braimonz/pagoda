/* ============================================================
   PAGODA — Registro e inicio de sesión del socio
============================================================ */
const $ = (sel) => document.querySelector(sel);

const formRegistro = $('#formRegistro');
const formLogin    = $('#formLogin');
const alertaError  = $('#alertaError');
const alertaOk     = $('#alertaOk');
const titulo       = $('#tituloVista');
const sub          = $('#subVista');
const kicker       = $('#kickerVista');

/* ---------- Utilidades de UI ---------- */
function limpiarAlertas() {
  alertaError.hidden = true;
  alertaOk.hidden = true;
}

function error(msg) {
  limpiarAlertas();
  alertaError.textContent = msg;
  alertaError.hidden = false;
}

function exito(msg) {
  limpiarAlertas();
  alertaOk.textContent = msg;
  alertaOk.hidden = false;
}

function cargando(btn, activo, textoOriginal) {
  // Guarda el HTML original la primera vez para no perder la flecha del botón
  if (!btn.dataset.htmlOriginal) btn.dataset.htmlOriginal = btn.innerHTML;
  btn.disabled = activo;
  if (activo) {
    btn.textContent = 'Un momento…';
  } else {
    btn.innerHTML = btn.dataset.htmlOriginal;
  }
}

/* ---------- Alternar vistas ---------- */
function mostrarLogin() {
  limpiarAlertas();
  formRegistro.hidden = true;
  formLogin.hidden = false;
  titulo.innerHTML = 'BIENVENIDO <em>DE VUELTA</em>';
  sub.textContent = 'Entra para ver tu credencial y tu membresía.';
  if (kicker) kicker.textContent = 'Acceso de socios';
}

function mostrarRegistro() {
  limpiarAlertas();
  formLogin.hidden = true;
  formRegistro.hidden = false;
  titulo.innerHTML = 'ÚNETE A <em>PAGODA</em>';
  sub.textContent = 'Regístrate una vez y llevamos tu progreso contigo.';
  if (kicker) kicker.textContent = 'Registro de socios';
}

$('#irLogin').addEventListener('click', mostrarLogin);
$('#irRegistro').addEventListener('click', mostrarRegistro);

/* ---------- Solo dígitos en los teléfonos ---------- */
document.querySelectorAll('input[type="tel"]').forEach((input) => {
  input.addEventListener('input', () => {
    input.value = input.value.replace(/\D/g, '').slice(0, 10);
  });
});

/* ---------- Petición al API ---------- */
async function enviar(url, datos) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
  const cuerpo = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(cuerpo.error || 'Algo salió mal. Inténtalo de nuevo.');
  return cuerpo;
}

/* ---------- Alta ---------- */
formRegistro.addEventListener('submit', async (e) => {
  e.preventDefault();
  limpiarAlertas();

  const btn = $('#btnRegistro');
  const datos = {
    nombre:    $('#nombre').value.trim(),
    apellidos: $('#apellidos').value.trim(),
    telefono:  $('#telefono').value.trim(),
    password:  $('#password').value,
  };

  if (!datos.nombre || !datos.apellidos)   return error('Completa tu nombre y apellidos.');
  if (datos.telefono.length !== 10)        return error('El teléfono debe tener 10 dígitos.');
  if (datos.password.length < 6)           return error('La contraseña necesita al menos 6 caracteres.');

  cargando(btn, true);
  try {
    await enviar('/api/registro', datos);
    exito('¡Listo! Te llevamos a tu credencial…');
    setTimeout(() => (window.location.href = '/credencial'), 900);
  } catch (err) {
    error(err.message);
    cargando(btn, false, 'Crear mi cuenta');
  }
});

/* ---------- Ingreso ---------- */
formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  limpiarAlertas();

  const btn = $('#btnLogin');
  const datos = {
    telefono: $('#loginTel').value.trim(),
    password: $('#loginPass').value,
  };

  if (datos.telefono.length !== 10) return error('El teléfono debe tener 10 dígitos.');
  if (!datos.password)              return error('Escribe tu contraseña.');

  cargando(btn, true);
  try {
    await enviar('/api/login', datos);
    window.location.href = '/credencial';
  } catch (err) {
    error(err.message);
    cargando(btn, false, 'Entrar');
  }
});

/* ---------- Si ya hay sesión, saltamos directo ---------- */
fetch('/api/yo')
  .then((r) => (r.ok ? (window.location.href = '/credencial') : null))
  .catch(() => {});
