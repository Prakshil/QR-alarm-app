import React from 'react';
import { Alert, Image, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';

let BarCodeScannerModule = null;
try { BarCodeScannerModule = require('expo-barcode-scanner'); } catch {}
let FileSystem = null;
let Sharing = null;
try { FileSystem = require('expo-file-system'); } catch {}
try { Sharing = require('expo-sharing'); } catch {}



import { useRouter } from 'expo-router';
import { getSession } from '../src/lib/auth';
import { verifyQr } from '../src/lib/db';
import { loadMyQrCode } from '../src/lib/storage';

export default function ScanOptionsScreen() {
  const router = useRouter();
  // require auth
  React.useEffect(() => {
    (async () => {
      const session = await getSession();
      if (!session) router.replace('/auth');
    })();
  }, []);

  const onUpload = async () => {
    Alert.alert(
      'Feature Coming Soon', 
      'QR image upload is under development. Please use the camera scanner for now.',
      [
        { text: 'OK' },
        { text: 'Use Camera', onPress: () => router.push('/scanner') }
      ]
    );
  };

  const verifyAndStop = async (data) => {
    try {
      console.log('Decoded QR data:', data);
      
      // Handle null/undefined/empty data
      if (!data || data === null || data === undefined || data === '') {
        Alert.alert('No QR Code Found', 'Could not read a QR code from this image. Please try:\n• A clearer image\n• Better lighting\n• Ensure the QR code is fully visible');
        return;
      }

      const my = await loadMyQrCode();
      console.log('My QR code:', my);
      
      if (!my) {
        Alert.alert('Setup Required', 'Please go to Profile tab and generate your QR code first.');
        return;
      }
      
      if (String(data) !== String(my)) {
        Alert.alert('❌ Wrong QR Code', 'This QR code doesn\'t match your profile. Make sure you\'re scanning your own QR code.');
        return;
      }
      
      const row = await verifyQr(data);
      if (row) {
        const { emitAlarmStop } = require('../src/lib/alarmBus');
        emitAlarmStop();
        Alert.alert('✅ Success', 'Alarm stopped successfully!');
        router.back();
      } else {
        Alert.alert('❌ Verification Failed', 'QR code could not be verified. Please try again.');
      }
    } catch (e) {
      console.error('QR verification error:', e);
      Alert.alert('Error', 'An error occurred while processing the QR code: ' + (e?.message || e));
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
          onPress={() => Alert.alert('Feature Coming Soon', 'QR image upload is under development. Please use the camera scanner for now.')}
          style={{ backgroundColor: '#1a1a1a', padding: 18, borderRadius: 14, opacity: 0.7 }}
        >
          <ThemedText style={{ fontSize: 16, fontWeight: '700', color: '#8b8f93' }}>Upload QR image</ThemedText>
          <ThemedText style={{ color: '#666', marginTop: 6 }}>Coming soon - Use camera for now</ThemedText>
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
