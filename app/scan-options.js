import { useEffect, useState } from 'react';
import { Alert, Image, Platform, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';

let BarCodeScannerModule = null;
try { BarCodeScannerModule = require('expo-barcode-scanner'); } catch {}
let FileSystem = null;
let Sharing = null;
try { FileSystem = require('expo-file-system'); } catch {}
try { Sharing = require('expo-sharing'); } catch {}

export default function ScanOptionsScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const BarCodeScanner = BarCodeScannerModule?.BarCodeScanner;

  useEffect(() => {
    (async () => {
      if (!BarCodeScanner) return setHasPermission(false);
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  return (
    <ThemedView style={{ flex: 1, backgroundColor: '#000', paddingTop: 24 }}>
      <ThemedText type="title" style={{ textAlign: 'center', marginVertical: 12 }}>Stop Alarm</ThemedText>
      <ThemedText style={{ textAlign: 'center', color: '#aaa', marginBottom: 16 }}>Choose how to provide your QR</ThemedText>

      {/* Option 1: Scan with Camera */}
      <View style={{ flex: 1, borderRadius: 24, overflow: 'hidden', margin: 16, backgroundColor: '#121212' }}>
        {BarCodeScanner && hasPermission ? (
          <BarCodeScanner
            onBarCodeScanned={({ data }) => {
              // Delegate to the original scanner screen by reusing its logic via emitAlarmStop
              try { const { emitAlarmStop } = require('../src/lib/alarmBus'); emitAlarmStop(); } catch {}
              Alert.alert('Scanned', 'QR received. Alarm stopping...');
            }}
            style={{ flex: 1 }}
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ThemedText>No camera access</ThemedText>
          </View>
        )}
      </View>

      {/* Option 2: Import from Files (image with QR) */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
        <TouchableOpacity
          onPress={async () => {
            try {
              if (Platform.OS === 'web') {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const url = URL.createObjectURL(file);
                  await decodeQrFromImage(url);
                };
                input.click();
              } else {
                const DocumentPicker = require('expo-document-picker');
                const res = await DocumentPicker.getDocumentAsync({ type: 'image/*', copyToCacheDirectory: true });
                const uri = res?.assets?.[0]?.uri;
                if (uri) await decodeQrFromImage(uri);
              }
            } catch (e) {
              Alert.alert('Import failed', String(e?.message || e));
            }
          }}
          style={{ backgroundColor: '#1f1f1f', padding: 16, borderRadius: 12, alignItems: 'center' }}
        >
          <ThemedText>Import QR from Files</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

async function decodeQrFromImage(uri) {
  try {
    const { emitAlarmStop } = require('../src/lib/alarmBus');
    // Basic decode approach: load image into canvas (web) or fetch and decode with custom impl.
    if (typeof document !== 'undefined') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const { default: jsQR } = require('jsqr');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, canvas.width, canvas.height);
        if (code?.data) {
          emitAlarmStop();
          alert('QR decoded from image. Alarm stopping...');
        } else {
          alert('No QR found in image');
        }
      };
      img.src = uri;
      return;
    }
    // On native, a full decode needs image pixel access; keeping placeholder for now
    Alert.alert('Not implemented', 'Native image QR decoding would need a dedicated library.');
  } catch (e) {
    Alert.alert('Decode failed', String(e?.message || e));
  }
}
