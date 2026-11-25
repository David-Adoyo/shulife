import { Tabs } from "expo-router";
import { c } from "../../lib/theme";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerStyle: { backgroundColor: c.navy }, headerTintColor: c.cream, tabBarActiveTintColor: c.navy, tabBarStyle: { backgroundColor: "#fff" } }}>
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="review" options={{ title: "Review" }} />
      <Tabs.Screen name="receipt" options={{ title: "Record cash" }} />
    </Tabs>
  );
}
