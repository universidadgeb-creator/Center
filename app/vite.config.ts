import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // relative base so the built assets work at https://<user>.github.io/<repo>/
  // regardless of the repo name, without hardcoding it here
  base: './',
})
