import { useCallback, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { api } from "../../lib/api";
import { c, ksh } from "../../lib/theme";

type Card = { id: string; amount: number; at: string; billRef: string | null; payer: string; suggestions: { familyId: string; family?: string; code?: string; score: number; reasons: string[] }[] };

/** The bursar's review queue on the phone: one tap assigns the payment and splits it between the children. */
export default function Review() {
  const [queue, setQueue] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setQueue(await api<Card[]>("review"));
    } finally {
      setLoading(false);
    }
  }, []);
  useFocusEffect(useCallback(() => void load(), [load]));

  const resolve = async (card: Card, familyId?: string) => {
    try {
      const r = await api<{ receipt: string | null }>("review", { method: "POST", body: familyId ? { paymentId: card.id, familyId } : { paymentId: card.id, notOurs: true } });
      if (r.receipt) Alert.alert("Receipt sent", r.receipt);
      setQueue((q) => q.filter((x) => x.id !== card.id));
    } catch (e) {
      Alert.alert("Couldn’t save", (e as Error).message);
    }
  };

  const card = queue[0];
  return (
    <ScrollView style={{ backgroundColor: c.cream }} contentContainerStyle={{ padding: 16, gap: 12 }} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      <Text style={{ color: c.muted }}>{queue.length ? `${queue.length} payments to review` : "All caught up — every payment is matched."}</Text>
      {card && (
        <>
          <View style={{ backgroundColor: c.navy, borderRadius: 18, padding: 18 }}>
            <Text style={{ color: c.cream, fontSize: 32, fontWeight: "700" }}>{ksh(card.amount)}</Text>
            <Text style={{ color: "#E3E8F4", marginTop: 4 }}>
              “{card.billRef || "(blank)"}” · {card.payer}
            </Text>
          </View>
          {card.suggestions.map((s, i) => (
            <Pressable key={s.familyId} onPress={() => resolve(card, s.familyId)} style={{ backgroundColor: i === 0 ? "#F6E9C9" : "#fff", borderRadius: 14, padding: 14, borderColor: i === 0 ? c.gold : c.sand, borderWidth: 1 }}>
              <Text style={{ color: c.navy, fontWeight: "700" }}>
                {s.family} · {s.code}
              </Text>
              {s.reasons.map((r) => (
                <Text key={r} style={{ color: c.muted, fontSize: 12 }}>
                  • {r}
                </Text>
              ))}
              <Text style={{ color: c.goldDark, fontWeight: "700", marginTop: 6 }}>Score {s.score} · Tap to assign and split</Text>
            </Pressable>
          ))}
          <Pressable onPress={() => resolve(card)} style={{ padding: 14, borderRadius: 999, borderWidth: 1, borderColor: c.sand, alignItems: "center" }}>
            <Text style={{ color: c.navy, fontWeight: "600" }}>Not our payment</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}
