import { Alert, Image, Platform, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';

let BarCodeScannerModule = null;
try { BarCodeScannerModule = require('expo-barcode-scanner'); } catch {}
let FileSystem = null;
let Sharing = null;
try { FileSystem = require('expo-file-system'); } catch {}
try { Sharing = require('expo-sharing'); } catch {}

import { useRouter } from 'expo-router';
import { supabase } from '../src/lib/supabase';

export default function ScanOptionsScreen() {
  const router = useRouter();

  const onUpload = async () => {
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const url = URL.createObjectURL(file);
          const decoded = await decodeWebQr(url);
          await verifyAndStop(decoded);
        };
        input.click();
      } else {
        const DocumentPicker = require('expo-document-picker');
        const res = await DocumentPicker.getDocumentAsync({ type: 'image/*', copyToCacheDirectory: true });
        const uri = res?.assets?.[0]?.uri;
        if (!uri) return;
        const QRLocalImage = require('react-native-qrcode-local-image');
        const decoded = await QRLocalImage.decode(uri);
        await verifyAndStop(decoded);
      }
    } catch (e) {
      Alert.alert('Upload failed', String(e?.message || e));
    }
  };

  const verifyAndStop = async (data) => {
    try {
      if (!data) return Alert.alert('No QR found', 'Could not read a QR from the image.');
      const { data: profiles } = await supabase.from('profiles').select('*').eq('qr_code', data);
      if (profiles && profiles.length > 0) {
        const { emitAlarmStop } = require('../src/lib/alarmBus');
        emitAlarmStop();
        Alert.alert('✅ Success', 'Alarm stopped!');
        router.back();
      } else {
        Alert.alert('❌ Invalid', 'Wrong QR Code!');
      }
    } catch (e) {
      Alert.alert('Error', String(e?.message || e));
    }
  };

  return (
    <ThemedView style={{ flex: 1, backgroundColor: '#000', paddingTop: 48, paddingHorizontal: 20 }}>
      <ThemedText type="title" style={{ textAlign: 'center', marginBottom: 28 }}>Stop Alarm</ThemedText>
      <ThemedText style={{ textAlign: 'center', color: '#8b8f93', marginBottom: 32 }}>Choose an option</ThemedText>

      <View style={{ gap: 14 }}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push('/scanner')}
          style={{ backgroundColor: '#121212', padding: 18, borderRadius: 14 }}
        >
          <ThemedText style={{ fontSize: 16, fontWeight: '700' }}>Scan manually (camera)</ThemedText>
          <ThemedText style={{ color: '#8b8f93', marginTop: 6 }}>Open camera and scan your QR</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onUpload}
          style={{ backgroundColor: '#121212', padding: 18, borderRadius: 14 }}
        >
          <ThemedText style={{ fontSize: 16, fontWeight: '700' }}>Upload QR image</ThemedText>
          <ThemedText style={{ color: '#8b8f93', marginTop: 6 }}>Pick an image containing your QR code</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

async function decodeWebQr(url) {
  return new Promise((resolve) => {
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
      resolve(code?.data || null);
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}
