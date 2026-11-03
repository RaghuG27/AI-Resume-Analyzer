
const API_URL = process.env.API_URL?.replace(/\/$/, "");

function getCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const prefix = `${name}=`;

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(prefix));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.slice(prefix.length));
}

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!API_URL) {
    throw new Error("API_URL is not configured");
  }

  const method = (options.method ?? "GET").toUpperCase();
  const headers = new Headers(options.headers);

  const isFormData =
    typeof FormData !== "undefined" &&
    options.body instanceof FormData;

  if (
    options.body &&
    !isFormData &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const isStateChanging = ![
    "GET",
    "HEAD",
    "OPTIONS",
  ].includes(method);

  if (isStateChanging) {
    const csrfToken = getCookie("csrf_token");

    if (csrfToken) {
      headers.set("X-CSRF-Token", csrfToken);
    }
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    method,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    throw new Error(
      typeof error?.detail === "string"
        ? error.detail
        : JSON.stringify(error?.detail ?? "Something went wrong")
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
