/* ============================================================
   PAGODA — Crea el usuario administrador inicial
   Uso:  node seed.js [usuario] [password]
============================================================ */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { queries } = require('./db');

const usuario  = (process.argv[2] || process.env.ADMIN_USER || 'crys').toLowerCase();
const password = process.argv[3] || process.env.ADMIN_PASS || 'pagoda2025';
const nombre   = process.argv[4] || 'Crys';

if (queries.adminPorUsuario.get(usuario)) {
  console.log(`\n  ⚠️  El usuario "${usuario}" ya existe. No se hizo ningún cambio.\n`);
  process.exit(0);
}

queries.crearAdmin.run(usuario, bcrypt.hashSync(password, 10), nombre);

console.log(`
  ✅ Administrador creado

     Usuario:    ${usuario}
     Contraseña: ${password}

  ⚠️  Cambia la contraseña antes de poner el sistema en producción.
`);
