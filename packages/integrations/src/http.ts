/** Every adapter takes an injectable fetch so it can be tested without the network. */
export type Fetch = typeof fetch;

export class ProviderError extends Error {
  constructor(public provider: string, public status: number, public body: unknown) {
    super(`${provider} request failed with ${status}`);
  }
}

export async function json<T>(provider: string, res: Response): Promise<T> {
  const text = await res.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    /* keep text */
  }
  if (!res.ok) throw new ProviderError(provider, res.status, body);
  return body as T;
}
