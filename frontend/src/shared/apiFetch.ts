export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type ApiFetchOptions = {
  method?: HttpMethod;
  query?: Record<string, string | number | boolean | null | undefined>;
  headers?: Record<string, string>;
  body?: unknown;                   // objet → JSON auto, sinon passé tel quel (FormData, Blob, etc.)
  auth?: boolean;                   // route protégée (envoie cookies ou Authorization)
  token?: string | null;            // token explicite (si pas via cookie)
  signal?: AbortSignal | null;      // annulation externe
  timeoutMs?: number;               // annulation auto via timeout
  withCredentials?: boolean;        // forcer l’envoi des cookies
  responseType?: "json" | "text" | "blob" | "arrayBuffer"; // type de parsing
  acceptLanguage?: string;          // langue à forcer (sinon i18next/localStorage)
};

// Erreur homogène côté client pour les appels API
export class ApiError extends Error {
  status: number;
  url: string;
  details?: any;
  constructor(message: string, status: number, url: string, details?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.url = url;
    this.details = details;
  }
}

// Auth via cookie HttpOnly (sinon on utilise Authorization: Bearer)
const AUTH_VIA_COOKIE = true;

/** Base URL de l’API ne pas laisser "http://localhost:8000" en dur (Issues cree) */
function resolveBaseUrl(): string {
  const im = (import.meta as any)?.env ?? {};
  return (
    im.VITE_API_BASE_URL ||
    im.REACT_APP_API_URL ||
    (window as any).__API_URL__ ||
    "http://localhost:8000"
  );
}
const BASE_URL = resolveBaseUrl();

// Stockage minimal du token si on n’utilise pas les cookies
export const tokenStore = {
  get: () => localStorage.getItem("auth_token"),
  set: (t: string) => localStorage.setItem("auth_token", t),
  clear: () => localStorage.removeItem("auth_token"),
};

// Construit une URL complète + querystring
function buildUrl(path: string, query?: ApiFetchOptions["query"]) {
  const base = BASE_URL.endsWith("/") ? BASE_URL : BASE_URL + "/";
  const url = new URL(path.replace(/^\//, ""), base);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== null && v !== undefined) url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

// Détermine si le body doit être sérialisé en JSON
function isJsonBody(body: unknown) {
  if (!body) return false;
  if (typeof body === "string") return false;
  if (typeof FormData !== "undefined" && body instanceof FormData) return false;
  if (typeof Blob !== "undefined" && body instanceof Blob) return false;
  if (typeof ArrayBuffer !== "undefined" && body instanceof ArrayBuffer) return false;
  if (typeof ReadableStream !== "undefined" && body instanceof ReadableStream) return false;
  return true; // objet -> JSON
}

// Parsing de la réponse selon le type attendu (json par défaut)
async function parseByType(res: Response, type: ApiFetchOptions["responseType"]) {
  if (type === "text") return res.text();
  if (type === "blob") return res.blob();
  if (type === "arrayBuffer") return res.arrayBuffer();
  const txt = await res.text();
  if (!txt) return undefined;
  try { return JSON.parse(txt); } catch { return txt; }
}

// Appel API principal
export async function apiFetch<T = any>(route: string, opts: ApiFetchOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutId =
    typeof opts.timeoutMs === "number" && opts.timeoutMs > 0
      ? setTimeout(() => controller.abort(), opts.timeoutMs)
      : null;

  const signal = opts.signal ?? controller.signal;
  const url = buildUrl(route, opts.query);

  // En-têtes de base (JSON) + merge custom
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(opts.headers || {}),
  };

  // Langue (Accept-Language) : option, i18next, ou localStorage
  const lang =
    opts.acceptLanguage ||
    (typeof window !== "undefined"
      ? (window as any)?.i18next?.language || localStorage.getItem("i18nextLng") || undefined
      : undefined);
  if (lang) headers["Accept-Language"] = lang;

  // AUTH — si on est en mode cookie, on n’ajoute PAS Authorization
  const wantsAuth = !!opts.auth;
  const token = opts.token ?? (wantsAuth ? tokenStore.get() : null);
  if (!AUTH_VIA_COOKIE && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Body de requête : JSON auto si objet
  let bodyToSend: any = opts.body ?? undefined;
  if (isJsonBody(bodyToSend)) {
    headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
    bodyToSend = JSON.stringify(bodyToSend);
  }

  // Requête réseau
  let res: Response;
  try {
    res = await fetch(url, {
      method: opts.method ?? "GET",
      headers,
      body: bodyToSend,
      signal,
      // cookies envoyés automatiquement pour les requêtes 
      credentials: (opts.withCredentials || opts.auth) ? "include" : "same-origin",
    });
  } catch (e: any) {
    if (e?.name === "AbortError") throw e;
    throw new ApiError(e?.message || "Network error", 0, url);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }

  // Parsing & gestion d’erreur HTTP
  const data = await parseByType(res, opts.responseType ?? "json");
  if (!res.ok) {
    const msg =
      (data && (data.message || data.error || data.detail)) ||
      res.statusText ||
      `HTTP ${res.status}`;

    if (res.status === 401 && wantsAuth && typeof window !== "undefined") {
      // 401 uniquement sur une route marquée auth:true -> on broadcast
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }
    throw new ApiError(msg, res.status, url, data);
  }
  return data as T;
}

// Variante proteger “safe” : gère 401 globalement (clear token + redirect)
export async function safeApi<T = any>(...args: Parameters<typeof apiFetch<T>>): Promise<T> {
  try {
    return await apiFetch<T>(...args);
  } catch (e: any) {
    if (e?.status === 401) {
      tokenStore.clear();
      localStorage.removeItem("user_data");
      if (typeof window !== "undefined") window.location.href = "/login";
    }
    throw e;
  }
}
