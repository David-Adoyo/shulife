import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./api";

/**
 * Receipts captured offline (§17 Stage 12). Each has a clientId, so replaying it is
 * safe: the server records each clientId once.
 */
export type PendingReceipt = { clientId: string; familyCode: string; amount: string; channel: "cash" | "cheque" | "bank_slip"; bookRef: string; photo: string; capturedAt: string };
const KEY = "pending-receipts";

export async function pending(): Promise<PendingReceipt[]> {
  return JSON.parse((await AsyncStorage.getItem(KEY)) ?? "[]");
}

export async function enqueue(r: PendingReceipt) {
  await AsyncStorage.setItem(KEY, JSON.stringify([...(await pending()), r]));
}

/** Try to send everything waiting. Returns how many were sent and how many remain. */
export async function sync(): Promise<{ sent: number; left: number }> {
  const list = await pending();
  const left: PendingReceipt[] = [];
  let sent = 0;
  for (const r of list) {
    try {
      await api("receipt", { method: "POST", body: r });
      sent++;
    } catch (e) {
      // Keep it unless the server rejected it for good (e.g. an unknown family code).
      if (!(e instanceof Error) || !/required|No family/.test(e.message)) left.push(r);
    }
  }
  await AsyncStorage.setItem(KEY, JSON.stringify(left));
  return { sent, left: left.length };
}
