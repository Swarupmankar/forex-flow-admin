/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  /** Support WebSocket: wss://host/ws/support, or a same-origin path like /api/ws/support. */
  readonly VITE_SUPPORT_WS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
