import { Tabs } from "expo-router";
import { IconSymbol } from "../components/ui/icon-symbol";

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: '#000', borderTopColor: '#111' },
        tabBarActiveTintColor: '#ffb26b',
        tabBarInactiveTintColor: '#8b8f93',
        tabBarIcon: ({ color, size }) => {
          if (route.name === "alarm") return <IconSymbol name="house.fill" color={color} size={size} />;
          if (route.name === "profile") return <IconSymbol name="chevron.left.forwardslash.chevron.right" color={color} size={size} />;
          if (route.name === "scanner") return <IconSymbol name="paperplane.fill" color={color} size={size} />;
        },
      })}
    >
      <Tabs.Screen name="alarm" options={{ title: "Alarms" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
  <Tabs.Screen name="scanner" options={{ title: "Scan QR", tabBarStyle: { display: 'none' } }} />
  <Tabs.Screen name="scan-options" options={{ title: "Scan Options", tabBarStyle: { display: 'none' } }} />
    </Tabs>
  );
}
