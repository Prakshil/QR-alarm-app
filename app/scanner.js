import { useEffect, useState } from "react";
import { Alert, View } from "react-native";
import { ThemedText } from "../components/themed-text";
import { ThemedView } from "../components/themed-view";
import { emitAlarmStop } from "../src/lib/alarmBus";
import { supabase } from "../src/lib/supabase";
let BarCodeScannerModule = null;
try {
  // Delay requiring native module until runtime to avoid crash if not available in Expo Go
  BarCodeScannerModule = require("expo-barcode-scanner");
} catch {}

export default function ScannerScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const BarCodeScanner = BarCodeScannerModule?.BarCodeScanner;

  useEffect(() => {
    (async () => {
      if (!BarCodeScanner) return setHasPermission(false);
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const handleScan = async ({ data }) => {
    let { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .eq("qr_code", data);

    if (profiles && profiles.length > 0) {
      emitAlarmStop();
      Alert.alert("✅ Success", "Alarm Stopped!");
    } else {
      Alert.alert("❌ Invalid", "Wrong QR Code!");
    }
  };

  if (hasPermission === null) return <ThemedText>Requesting camera permission...</ThemedText>;
  if (hasPermission === false || !BarCodeScanner) return <ThemedText>No access to camera</ThemedText>;

  return (
    <ThemedView style={{ flex: 1, backgroundColor: '#000' }}>
      <ThemedText type="title" style={{ textAlign: 'center', marginTop: 32, marginBottom: 12 }}>Scan QR to Stop Alarm</ThemedText>
      <ThemedText style={{ textAlign: 'center', color: '#aaa', marginBottom: 16 }}>Point your camera at your profile QR code</ThemedText>
  <View style={{ flex: 1, borderRadius: 24, overflow: 'hidden', margin: 16, backgroundColor: '#121212' }}>
        <BarCodeScanner
          onBarCodeScanned={handleScan}
          style={{ flex: 1 }}
        />
      </View>
    </ThemedView>
  );
}
