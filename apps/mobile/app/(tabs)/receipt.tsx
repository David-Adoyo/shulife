import { useCallback, useState } from "react";
import { Alert, Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { enqueue, pending, sync } from "../../lib/queue";
import { c } from "../../lib/theme";

/**
 * Manual receipt with a photo of the slip or cheque. Works offline: the receipt is
 * queued on the phone and sent when there is a connection (safe to retry).
 */
export default function Receipt() {
  const [familyCode, setFamilyCode] = useState("FAM-");
  const [amount, setAmount] = useState("");
  const [bookRef, setBookRef] = useState("");
  const [channel, setChannel] = useState<"cash" | "cheque" | "bank_slip">("cash");
  const [photo, setPhoto] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(0);

  const refresh = useCallback(async () => setWaiting((await pending()).length), []);
  useFocusEffect(useCallback(() => void sync().then(refresh), [refresh]));

  const snap = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return Alert.alert("Camera needed", "Allow camera access to photograph the slip.");
    const r = await ImagePicker.launchCameraAsync({ quality: 0.4, base64: true });
    if (!r.canceled && r.assets[0]?.base64) setPhoto(`data:image/jpeg;base64,${r.assets[0].base64}`);
  };

  const save = async () => {
    if (!/^\d+(\.\d{1,2})?$/.test(amount.replace(/,/g, "")) || !bookRef || !photo) return Alert.alert("Almost there", "Add the amount, the receipt-book number and a photo.");
    await enqueue({ clientId: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`, familyCode, amount: amount.replace(/,/g, ""), channel, bookRef, photo, capturedAt: new Date().toISOString() });
    const r = await sync();
    await refresh();
    Alert.alert(r.sent ? "Receipt sent to the family" : "Saved on this phone", r.sent ? "It’s in today’s cash-up." : "It will send automatically when you’re back online.");
    setAmount("");
    setBookRef("");
    setPhoto(null);
  };

  const input = { backgroundColor: "#fff", borderRadius: 12, padding: 14, fontSize: 16, borderColor: c.sand, borderWidth: 1 } as const;
  return (
    <ScrollView style={{ backgroundColor: c.cream }} contentContainerStyle={{ padding: 16, gap: 10 }}>
      {waiting > 0 && <Text style={{ color: c.goldDark, fontWeight: "700" }}>{waiting} receipt(s) waiting to send</Text>}
      <Text style={{ color: c.navy, fontWeight: "700" }}>Family code</Text>
      <TextInput value={familyCode} onChangeText={setFamilyCode} autoCapitalize="characters" style={input} />
      <Text style={{ color: c.navy, fontWeight: "700" }}>Amount (KSh)</Text>
      <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" style={input} placeholder="10,000" />
      <View style={{ flexDirection: "row", gap: 8 }}>
        {(["cash", "cheque", "bank_slip"] as const).map((ch) => (
          <Pressable key={ch} onPress={() => setChannel(ch)} style={{ flex: 1, padding: 12, borderRadius: 999, alignItems: "center", backgroundColor: channel === ch ? c.navy : "#fff", borderColor: c.sand, borderWidth: 1 }}>
            <Text style={{ color: channel === ch ? c.cream : c.navy, fontWeight: "600" }}>{ch === "bank_slip" ? "Bank slip" : ch[0].toUpperCase() + ch.slice(1)}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={{ color: c.navy, fontWeight: "700" }}>Receipt-book number</Text>
      <TextInput value={bookRef} onChangeText={setBookRef} style={input} placeholder="RB-4120" />
      <Pressable onPress={snap} style={{ padding: 14, borderRadius: 14, borderStyle: "dashed", borderWidth: 2, borderColor: c.gold, alignItems: "center" }}>
        {photo ? <Image source={{ uri: photo }} style={{ width: "100%", height: 160, borderRadius: 10 }} /> : <Text style={{ color: c.navy, fontWeight: "600" }}>Take a photo of the slip</Text>}
      </Pressable>
      <Pressable onPress={save} style={{ backgroundColor: c.navy, padding: 16, borderRadius: 999, alignItems: "center", marginTop: 6 }}>
        <Text style={{ color: c.cream, fontWeight: "700", fontSize: 16 }}>Record and send receipt</Text>
      </Pressable>
      <Text style={{ color: c.muted, fontSize: 12 }}>Every manual receipt is audited and appears in today’s cash-up.</Text>
    </ScrollView>
  );
}
