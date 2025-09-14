import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, View } from "react-native";
import { ThemedText } from "../components/themed-text";
import { ThemedView } from "../components/themed-view";
import { emitAlarmStop } from "../src/lib/alarmBus";
import { getSession } from "../src/lib/auth";
import { verifyQr } from "../src/lib/db";
import { loadMyQrCode } from "../src/lib/storage";
let BarCodeScannerModule = null;
try {
  // Delay requiring native module until runtime to avoid crash if not available in Expo Go
  BarCodeScannerModule = require("expo-barcode-scanner");
} catch {}

export default function ScannerScreen() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState(null);
  const BarCodeScanner = BarCodeScannerModule?.BarCodeScanner;

  useEffect(() => {
    (async () => {
      const session = await getSession();
      if (!session) return router.replace('/auth');
      if (!BarCodeScanner) return setHasPermission(false);
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const handleScan = async ({ data }) => {
    try {
      const my = await loadMyQrCode();
      if (!my) {
        Alert.alert('No profile QR', 'Create your profile first to bind a QR to this device.');
        return;
      }
      if (data !== my) {
        Alert.alert('❌ Not your QR', 'This QR belongs to another user or device.');
        return;
      }
      const row = await verifyQr(data);
      if (row) {
        emitAlarmStop();
        Alert.alert("✅ Success", "Alarm Stopped!");
      } else {
        Alert.alert("❌ Invalid", "Wrong QR Code!");
      }
    } catch (e) {
      Alert.alert('Error', e?.message || String(e));
    }
  };

  if (hasPermission === null) return (
    <ThemedView style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
      <ThemedText>Requesting camera permission...</ThemedText>
    </ThemedView>
  );
  if (hasPermission === false || !BarCodeScanner) return (
    <ThemedView style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
      <ThemedText>No access to camera</ThemedText>
    </ThemedView>
  );

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
