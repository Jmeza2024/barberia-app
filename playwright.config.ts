import { defineConfig, devices } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

// Lee .env.local igual que Next, para que las pruebas usen la misma base.
loadEnvConfig(process.cwd());

// Pruebas de punta a punta. Corre con: npm run test:e2e
// Las pruebas que crean datos (reservar, cancelar) solo corren con E2E_ESCRIBIR=1,
// para no llenar de citas de prueba la base real.
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  // El servidor de desarrollo compila cada página la primera vez: se le da más margen.
  expect: { timeout: 15_000 },
  retries: 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.E2E_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
  },
  projects: [
    { name: "celular", use: { ...devices["Pixel 7"] } },
    { name: "computador", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: process.env.E2E_URL
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000/ingresar",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
