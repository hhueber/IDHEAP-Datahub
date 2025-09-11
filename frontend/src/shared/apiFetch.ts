export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiFetchOptions = {
  method?: HttpMethod;
  query?: Record<string, string | number | boolean | null | undefined>;
  headers?: Record<string, string>;
  body?: unknown;                 // objet (JSON), string, FormData, Blob, ArrayBuffer, ReadableStream...
  auth?: boolean;                 // si true, ajoute le JWT du store
  token?: string | null;          // prioritaire si fourni
  signal?: AbortSignal | null;    // annulation externe
  timeoutMs?: number;             // ex: 20000
  withCredentials?: boolean;      // envoie les cookies (CORS côté serveur requis)
  responseType?: "json" | "text" | "blob" | "arrayBuffer"; // par défaut: "json"
  acceptLanguage?: string;        // pour surcharger la langue envoyée
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

/** Où récupérer la base URL (supporte Vite + CRA/Docker + runtime window.__API_URL__) */
function resolveBaseUrl(): string {
  const im = (import.meta as any)?.env ?? {};
  return (
    im.VITE_API_BASE_URL ||       // Vite (recommandé)
    im.REACT_APP_API_URL ||       // compat CRA / ARG Docker
    (window as any).__API_URL__ ||// runtime override éventuel
    "http://localhost:8000" ||
    "/api"                        // fallback local
  );      // TODO: a modifier pour pas garder en dur localhost
}

const BASE_URL = resolveBaseUrl();
console.log(BASE_URL)

/** JWT store simple */
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
  return true; // objet => JSON
}

async function parseByType(res: Response, type: ApiFetchOptions["responseType"]) {
  if (type === "text") return res.text();
  if (type === "blob") return res.blob();
  if (type === "arrayBuffer") return res.arrayBuffer();

  // JSON par défaut
  const txt = await res.text();
  if (!txt) return undefined;
  try {
    return JSON.parse(txt);
  } catch {
    // serveur non-JSON: renvoie le texte brut (évite les crash)
    return txt;
  }
}

/** Appel générique — <T = any>  */
export async function apiFetch<T = any>(route: string, opts: ApiFetchOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutId =
    typeof opts.timeoutMs === "number" && opts.timeoutMs > 0
      ? setTimeout(() => controller.abort(), opts.timeoutMs)
      : null;

  // merge signal
  const signal = opts.signal ?? controller.signal;

  const url = buildUrl(route, opts.query);

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(opts.headers || {}),
  };

  // langue (essaie i18next, sinon param)
  const lang =
    opts.acceptLanguage ||
    (typeof window !== "undefined"
      ? (window as any)?.i18next?.language || localStorage.getItem("i18nextLng") || undefined
      : undefined);
  if (lang) headers["Accept-Language"] = lang;

  // Auth
  const token = opts.token ?? (opts.auth ? tokenStore.get() : null);
  if (token) headers.Authorization = `Bearer ${token}`;

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
      credentials: opts.withCredentials ? "include" : "same-origin",
    });
  } catch (e: any) {
    if (e?.name === "AbortError") throw e;
    throw new ApiError(e?.message || "Network error", 0, url);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }

  // Erreurs HTTP -> ApiError avec payload quand possible
  const data = await parseByType(res, opts.responseType ?? "json");
  if (!res.ok) {
    const msg =
      (data && (data.message || data.error || data.detail)) ||
      res.statusText ||
      `HTTP ${res.status}`;
    throw new ApiError(msg, res.status, url, data);
  }

  return data as T;
}

export function makeAborter() {
  const c = new AbortController();
  return { signal: c.signal, abort: () => c.abort() };
}

/** Stream NDJSON (grosses réponses, y compris GeoJSON *ligne par ligne*) */
export async function apiStreamNDJSON<T = any>(
  route: string,
  opts: Omit<ApiFetchOptions, "responseType"> = {}
): Promise<AsyncGenerator<T, void, unknown>> {
  const controller = new AbortController();
  const signal = opts.signal ?? controller.signal;
  const url = buildUrl(route, opts.query);

  const headers: Record<string, string> = {
    Accept: "application/x-ndjson, application/json;q=0.9, */*;q=0.1",
    ...(opts.headers || {}),
  };

  const token = opts.token ?? (opts.auth ? tokenStore.get() : null);
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body as any,
    signal,
    credentials: opts.withCredentials ? "include" : "same-origin",
  });

  if (!res.ok || !res.body) {
    const text = await res.text();
    const msg = text || res.statusText || `HTTP ${res.status}`;
    throw new ApiError(msg, res.status, url);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  async function* iter() {
    let buf = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (line) {
          try {
            yield JSON.parse(line) as T;
          } catch {
            // ignore ligne invalide
          }
        }
      }
    }
    const tail = buf.trim();
    if (tail) {
      try {
        yield JSON.parse(tail) as T;
      } catch {}
    }
  }

  // @ts-ignore – TS n’aime pas trop générateur retourné dynamiquement
  return iter();
}