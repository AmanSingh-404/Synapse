const API_BASE = "http://127.0.0.1:8001";

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include", // sends the httpOnly refresh cookie
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  register: (email: string, password: string) =>
    request("/auth/register", { method: "POST", body: JSON.stringify({ email, password }) }),

  login: async (email: string, password: string) => {
    const data = await request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    setAccessToken(data.access_token);
    return data;
  },

  refresh: async () => {
    const data = await request("/auth/refresh", { method: "POST" });
    setAccessToken(data.access_token);
    return data;
  },

  logout: async () => {
    await request("/auth/logout", { method: "POST" });
    setAccessToken(null);
  },

  me: () => request("/auth/me"),

  githubLogin: () => request("/auth/github/login"),

  connectRepo: (githubUrl: string) =>
    request("/repos/connect", { method: "POST", body: JSON.stringify({ github_url: githubUrl }) }),

    listGithubRepos: () => request("/repos/github/list"),

  getRepoGraph: (repoId: string) => request(`/repos/${repoId}/graph`),

  ingestRepo: (repoId: string) =>
    request(`/repos/${repoId}/ingest`, { method: "POST" }),

  getRepoStatus: (repoId: string) =>
    request(`/repos/${repoId}/status`),

  query: (repoId: string, question: string) =>
    request("/query", { method: "POST", body: JSON.stringify({ repo_id: repoId, question }) }),
};