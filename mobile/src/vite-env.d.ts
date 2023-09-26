/// <reference types="vite/client" />
/// <reference types="workbox-precaching" />
/// <reference types="vite-plugin-pwa/client" />
/// <reference types="vite-plugin-pwa/info" />
/// <reference types="vite-plugin-pwa/vue" />

interface ImportMetaEnv {
    readonly VITE_LOGGING_ENABLED: "false"|"true",
    readonly VITE_USE_MANAGED_REFS: "false"|"true",
    readonly VITE_FIREBASE_API_KEY: string,
    readonly VITE_FIREBASE_AUTH_DOMAIN: string,
    readonly VITE_FIREBASE_PROJECT_ID: string,
    readonly VITE_FIREBASE_STORAGE_BUCKET: string,
    readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string,
    readonly VITE_FIREBASE_APP_ID: string,
    readonly VITE_USE_LOCAL_FIREBASE_INSTANCE: string,
    readonly VITE_USE_LOCAL_FIREBASE_INSTANCE_FOR_AUTH: string,
    readonly VITE_VIEWABLE_USER_DASHBOARD: "false"|"true",
    readonly VITE_WHITE_LABEL_NAME: string,
    readonly VITE_WHITE_LABEL_PAGE_TITLE: string,
    readonly VITE_WHITE_LABEL_PUBLIC_URL: string,
    readonly VITE_WHITE_LABEL_FILTERING_EVENT_FAMILIES: string,
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
