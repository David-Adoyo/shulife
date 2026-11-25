import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { demoSignIn, getSession } from "../lib/api";
import { c } from "../lib/theme";

/** Sign in. The demo server lets you choose director or bursar; a live school uses email, password and a code. */
export default function SignIn() {
  const [server, setServer] = useState("https://");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSession().then((s) => s && router.replace("/(tabs)/home"));
  }, []);

  const go = async (role: "director" | "bursar") => {
    setBusy(true);
    setError(null);
    try {
      await demoSignIn(server.trim(), role);
      router.replace("/(tabs)/home");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.navy }}>
      <View style={{ flex: 1, padding: 24, justifyContent: "center", gap: 14 }}>
        <Text style={{ color: c.cream, fontSize: 40, fontWeight: "800", letterSpacing: -1 }}>
          shul<Text style={{ color: "#FF6A45" }}>i</Text>fe
        </Text>
        <Text style={{ color: "#E3E8F4", fontSize: 16, marginBottom: 12 }}>Fees, receipts and your school at a glance.</Text>
        <Text style={{ color: c.gold, fontWeight: "700" }}>School server</Text>
        <TextInput value={server} onChangeText={setServer} autoCapitalize="none" keyboardType="url" style={{ backgroundColor: c.cream, borderRadius: 12, padding: 14, fontSize: 16 }} />
        {error && <Text style={{ color: "#FFB4A6" }}>{error}</Text>}
        {busy ? (
          <ActivityIndicator color={c.gold} />
        ) : (
          <>
            <Pressable onPress={() => go("director")} style={{ backgroundColor: c.gold, padding: 16, borderRadius: 999, alignItems: "center" }}>
              <Text style={{ color: c.navyDark, fontWeight: "700", fontSize: 16 }}>Sign in as director</Text>
            </Pressable>
            <Pressable onPress={() => go("bursar")} style={{ borderColor: c.cream, borderWidth: 2, padding: 14, borderRadius: 999, alignItems: "center" }}>
              <Text style={{ color: c.cream, fontWeight: "700", fontSize: 16 }}>Sign in as bursar</Text>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
