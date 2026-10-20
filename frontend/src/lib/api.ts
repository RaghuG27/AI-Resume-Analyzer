const API_URL =
  process.env.NEXT_PUBLIC_API_URL;

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

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
) {
  const method = (options.method ?? "GET").toUpperCase();
  const headers = new Headers(options.headers);

  if (options.body && !headers.has("Content-Type")) {
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
    return undefined;
  }

  return response.json();
}