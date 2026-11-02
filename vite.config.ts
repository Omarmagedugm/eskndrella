import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
 plugins: [react()],
 server: { allowedHosts: ['terminal.local'] },
 build: { rollupOptions: { output: { manualChunks: {
  firebase: ['firebase/app','firebase/auth','firebase/firestore','firebase/functions'],
  motion: ['framer-motion'], react: ['react','react-dom']
 } } } }
});
