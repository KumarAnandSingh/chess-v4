/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL: string
  readonly VITE_WEBSOCKET_URL: string
  readonly VITE_NODE_ENV: string
  readonly VITE_ENABLE_ANALYTICS: string
  readonly VITE_ENABLE_CHAT: string
  readonly VITE_ENABLE_SPECTATOR_MODE: string
  readonly VITE_DEFAULT_TIME_CONTROL: string
  readonly VITE_MAX_ROOM_CODE_LENGTH: string
  readonly VITE_THEME: string
  readonly VITE_ENABLE_SOUND: string
  readonly VITE_ENABLE_ANIMATIONS: string
  readonly VITE_SENTRY_DSN: string
  readonly VITE_GOOGLE_ANALYTICS_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare const __BACKEND_URL__: string
declare const __NODE_ENV__: string