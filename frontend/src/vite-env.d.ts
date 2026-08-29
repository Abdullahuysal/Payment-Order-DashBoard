/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL_DEV: string;
  readonly VITE_API_BASE_URL_PREPROD: string;
  readonly VITE_API_BASE_URL_PRODUCTION: string;
  readonly VITE_DEFAULT_ENV?: 'dev' | 'preprod' | 'production';
  readonly VITE_HTTP_TIMEOUT_MS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
