export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type ApiFetchOptions = {
  method?: HttpMethod;
  query?: Record<string, string | number | boolean | null | undefined>;
  headers?: Record<string, string>;
  body?: unknown;
  auth?: boolean;
  token?: string | null;
  signal?: AbortSignal | null;
  timeoutMs?: number;
  withCredentials?: boolean;
  responseType?: "json" | "text" | "blob" | "arrayBuffer";
  acceptLanguage?: string;
};

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

// on passe en cookie HttpOnly pour les appels auth
const AUTH_VIA_COOKIE = true;

/** Où récupérer la base URL TODO: a modifier */
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

export const tokenStore = {
  get: () => localStorage.getItem("auth_token"),
  set: (t: string) => localStorage.setItem("auth_token", t),
  clear: () => localStorage.removeItem("auth_token"),
};

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

function isJsonBody(body: unknown) {
  if (!body) return false;
  if (typeof body === "string") return false;
  if (typeof FormData !== "undefined" && body instanceof FormData) return false;
  if (typeof Blob !== "undefined" && body instanceof Blob) return false;
  if (typeof ArrayBuffer !== "undefined" && body instanceof ArrayBuffer) return false;
  if (typeof ReadableStream !== "undefined" && body instanceof ReadableStream) return false;
  return true; // objet -> JSON
}

async function parseByType(res: Response, type: ApiFetchOptions["responseType"]) {
  if (type === "text") return res.text();
  if (type === "blob") return res.blob();
  if (type === "arrayBuffer") return res.arrayBuffer();
  const txt = await res.text();
  if (!txt) return undefined;
  try { return JSON.parse(txt); } catch { return txt; }
}

export async function apiFetch<T = any>(route: string, opts: ApiFetchOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutId =
    typeof opts.timeoutMs === "number" && opts.timeoutMs > 0
      ? setTimeout(() => controller.abort(), opts.timeoutMs)
      : null;

  const signal = opts.signal ?? controller.signal;
  const url = buildUrl(route, opts.query);

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(opts.headers || {}),
  };

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

  // Body
  let bodyToSend: any = opts.body ?? undefined;
  if (isJsonBody(bodyToSend)) {
    headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
    bodyToSend = JSON.stringify(bodyToSend);
  }

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

  const data = await parseByType(res, opts.responseType ?? "json");
  if (!res.ok) {
    const msg =
      (data && (data.message || data.error || data.detail)) ||
      res.statusText ||
      `HTTP ${res.status}`;

    if (res.status === 401 && typeof window !== "undefined") {
      // broadcast global pour AuthProvider
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }
    throw new ApiError(msg, res.status, url, data);
  }
  return data as T;
}

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
