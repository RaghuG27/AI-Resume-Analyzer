const API_URL =
  process.env.NEXT_PUBLIC_API_URL;

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
) {
  const headers = new Headers(options.headers);

  const isFormData =
    options.body instanceof FormData;

  if (!isFormData) {
    headers.set(
      "Content-Type",
      "application/json"
    );
  }

 

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers,
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => null);

    throw new Error(
      error?.detail ||
        "Something went wrong"
    );
  }

  return response.json();
}