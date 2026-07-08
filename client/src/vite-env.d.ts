/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADMIN_SETUP_ENABLED?: string;
  // add other VITE_ env vars here as you introduce them
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}