import * as SecureStore from "expo-secure-store";

/** Talks to the school's Shulife server. The token lives in the device keystore. */
export type Session = { server: string; token: string; name: string; role: "director" | "bursar" };

export async function getSession(): Promise<Session | null> {
  const raw = await SecureStore.getItemAsync("session");
  return raw ? (JSON.parse(raw) as Session) : null;
}
export async function saveSession(s: Session) {
  await SecureStore.setItemAsync("session", JSON.stringify(s));
}
export async function signOut() {
  await SecureStore.deleteItemAsync("session");
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const s = await getSession();
  if (!s) throw new ApiError(401, "Please sign in");
  const res = await fetch(`${s.server.replace(/\/$/, "")}/api/mobile/${path}/`, {
    method: init.method ?? "GET",
    headers: { Authorization: `Bearer ${s.token}`, "Content-Type": "application/json" },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (json as { error?: string }).error ?? "Something went wrong");
  return json as T;
}

export async function demoSignIn(server: string, role: "director" | "bursar") {
  const res = await fetch(`${server.replace(/\/$/, "")}/api/mobile/login/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) });
  const json = (await res.json()) as { token?: string; name?: string; error?: string };
  if (!res.ok || !json.token) throw new Error(json.error ?? "Could not sign in");
  await saveSession({ server, token: json.token, name: json.name!, role });
}
