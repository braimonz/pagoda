import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  /* La app se publica bajo /rutinas del mismo dominio que el sitio y el
     sistema de socios (ver ARQUITECTURA.md §2). De aquí sale también
     import.meta.env.BASE_URL, que usa el servicio para armar la URL del JSON. */
  base: '/rutinas/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
