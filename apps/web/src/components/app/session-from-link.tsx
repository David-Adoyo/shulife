"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase's default invite and reset emails send people back with the session in the
 * URL fragment (#access_token=…), which only the browser can read. Store it as a cookie
 * session, then reload so the server sees the signed-in user.
 */
export function SessionFromLink({ url, anonKey }: { url: string; anonKey: string }) {
  const [message, setMessage] = useState("Signing you in…");
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const access_token = hash.get("access_token");
    const refresh_token = hash.get("refresh_token");
    const error = hash.get("error_description");
    if (error) return setMessage(error.replace(/\+/g, " "));
    if (!access_token || !refresh_token) return setMessage("This link has expired. Ask your director to send a new invitation.");
    createBrowserClient(url, anonKey)
      .auth.setSession({ access_token, refresh_token })
      .then(({ error: e }) => {
        if (e) setMessage(e.message);
        else window.location.replace(window.location.pathname);
      });
  }, [url, anonKey]);
  return <p className="text-ink-600">{message}</p>;
}
