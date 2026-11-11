import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin } from 'vite'
import { devApiMiddleware } from './server/devApi.ts'

function devApi(): Plugin {
  return {
    name: "dev-api",
    configureServer(server) {
      server.middlewares.use(devApiMiddleware());
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [devApi(), react(), tailwindcss()],
})
