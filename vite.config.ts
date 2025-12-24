
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Removed explicit define: { 'process.env': {} } to allow environment variable injection
});
