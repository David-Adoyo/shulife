import { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { api, ApiError, signOut } from "../../lib/api";
import { c, ksh, short } from "../../lib/theme";

type Summary = { user: { name: string; role: string }; term: string; pct: number; collected: number; billed: number; collectedToday: number; paymentsToday: number; outstanding: number; autoMatchRate: number; review: number; heat: { grade: string; streams: { name: string; pct: number }[] }[]; feed: { id: string; at: string; amount: number; family: string; learners: string[]; badge: string }[]; projection: { total: number; notes: string[] } };

const heat = (p: number) => (p >= 100 ? c.paid : p >= 85 ? "#5E9E80" : p >= 70 ? "#D8B26A" : p >= 55 ? "#EAD3A2" : "#B97E98");

export default function Home() {
  const [d, setD] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setD(await api<Summary>("summary"));
      setError(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        await signOut();
        router.replace("/");
      } else setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useFocusEffect(useCallback(() => void load(), [load]));

  return (
    <ScrollView style={{ backgroundColor: c.cream }} contentContainerStyle={{ padding: 16, gap: 14 }} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      {error && <Text style={{ color: c.due }}>{error} — pull to retry.</Text>}
      {!d ? (
        <Text style={{ color: c.muted }}>Loading…</Text>
      ) : (
        <>
          <Text style={{ color: c.muted }}>
            {d.term} · {d.user.name}
          </Text>
          <View style={{ backgroundColor: c.navy, borderRadius: 18, padding: 20 }}>
            <Text style={{ color: c.gold, fontWeight: "700", letterSpacing: 1 }}>TERM COLLECTION</Text>
            <Text style={{ color: c.cream, fontSize: 48, fontWeight: "700" }}>{d.pct}%</Text>
            <Text style={{ color: "#E3E8F4" }}>
              KSh {short(d.collected)} of {short(d.billed)}
            </Text>
            <View style={{ height: 10, backgroundColor: "#26386F", borderRadius: 999, marginTop: 12 }}>
              <View style={{ width: `${d.pct}%`, height: 10, backgroundColor: c.gold, borderRadius: 999 }} />
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {[
              ["Today", ksh(d.collectedToday), `${d.paymentsToday} payments`],
              ["Auto-matched", `${d.autoMatchRate}%`, `${d.review} to review`],
            ].map(([l, v, h]) => (
              <View key={l} style={{ flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 14, borderColor: c.sand, borderWidth: 1 }}>
                <Text style={{ color: c.muted, fontSize: 12, fontWeight: "700" }}>{l.toUpperCase()}</Text>
                <Text style={{ color: c.navy, fontSize: 22, fontWeight: "700", marginTop: 4 }}>{v}</Text>
                <Text style={{ color: c.muted, fontSize: 12 }}>{h}</Text>
              </View>
            ))}
          </View>
          <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 14, borderColor: c.sand, borderWidth: 1 }}>
            <Text style={{ color: c.navy, fontWeight: "700", marginBottom: 8 }}>Class heatmap</Text>
            {d.heat.map((h) => (
              <View key={h.grade} style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 }}>
                <Text style={{ width: 60, color: c.navy, fontSize: 12, fontWeight: "600" }}>{h.grade}</Text>
                {h.streams.map((s, i) => (
                  <View key={i} style={{ flex: 1, backgroundColor: heat(s.pct), borderRadius: 6, paddingVertical: 6, alignItems: "center" }}>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: s.pct >= 85 || s.pct < 55 ? "#fff" : c.navyDark }}>{s.pct}%</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
          <View style={{ backgroundColor: "#fff", borderRadius: 14, padding: 14, borderColor: c.sand, borderWidth: 1 }}>
            <Text style={{ color: c.navy, fontWeight: "700", marginBottom: 6 }}>Latest payments</Text>
            {d.feed.map((f) => (
              <View key={f.id} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomColor: c.sand, borderBottomWidth: 1 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.navy, fontWeight: "600" }}>{f.family}</Text>
                  <Text style={{ color: c.muted, fontSize: 12 }}>
                    {f.learners.join(", ")} · {f.badge}
                  </Text>
                </View>
                <Text style={{ color: c.navy, fontWeight: "700" }}>{ksh(f.amount)}</Text>
              </View>
            ))}
          </View>
          <Text style={{ color: c.muted }}>
            Next 30 days: about KSh {short(d.projection.total)}. {d.projection.notes[0] ?? ""}
          </Text>
          <Pressable onPress={async () => (await signOut(), router.replace("/"))}>
            <Text style={{ color: c.navy, textAlign: "center", padding: 12, fontWeight: "600" }}>Sign out</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}
