import { json, type Fetch } from "./http";

/** Email copies of statements and staff invites (Resend). */
export function createEmail(cfg: { apiKey: string; from: string; fetch?: Fetch }) {
  const f = cfg.fetch ?? fetch;
  return {
    async send(p: { to: string; subject: string; html: string; attachments?: { filename: string; content: string }[] }) {
      const res = await f("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${cfg.apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: cfg.from, ...p }) });
      return json<{ id: string }>("resend", res);
    },
  };
}
