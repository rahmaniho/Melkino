/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_TENANT_ID?: string;
  readonly VITE_DEFAULT_BRANCH_ID?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_PUBLIC_LANDING?: string;
  readonly VITE_LOCAL_MODE?: string;
}
interface ImportMeta { readonly env: ImportMetaEnv; }
