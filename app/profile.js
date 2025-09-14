import { useRef, useState } from "react";
import { Platform, TextInput, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { ThemedText } from "../components/themed-text";
import { ThemedView } from "../components/themed-view";
import { supabase } from "../src/lib/supabase";

export default function ProfileScreen() {
  const [name, setName] = useState("");
  const [qrValue, setQrValue] = useState("");
  const qrRef = useRef(null);

  const createProfile = async () => {
    if (!name.trim()) return;
    const uniqueCode = `${name}-${Date.now()}`;
    setQrValue(uniqueCode);
    await supabase.from("profiles").insert([{ name, qr_code: uniqueCode }]);
  };

  return (
    <ThemedView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#000' }}>
      <ThemedText type="title" style={{ marginBottom: 16 }}>Profile</ThemedText>
      <ThemedText style={{ marginBottom: 8, color: '#aaa' }}>Enter your name to generate your unique QR code.</ThemedText>
      <View style={{ width: '100%', marginBottom: 16 }}>
        <TextInput
          placeholder="Enter name"
          placeholderTextColor="#aaa"
          value={name}
          onChangeText={setName}
          style={{ backgroundColor: '#121212', color: '#fff', padding: 16, borderRadius: 12, fontSize: 18 }}
        />
      </View>
      <TouchableOpacity
        style={{ backgroundColor: '#0a7ea4', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, marginBottom: 24 }}
        onPress={createProfile}
        activeOpacity={0.8}
      >
        <ThemedText style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>Generate QR</ThemedText>
      </TouchableOpacity>
      {qrValue ? (
        <View style={{ marginTop: 24, backgroundColor: '#fff', padding: 16, borderRadius: 16, alignItems: 'center' }}>
          <QRCode value={qrValue} backgroundColor="#ffffff" color="#000000" size={200} getRef={(c) => (qrRef.current = c)} />
          <ThemedText style={{ color: '#121212', marginTop: 12, fontSize: 16 }}>Your QR Code</ThemedText>
          <TouchableOpacity
            onPress={async () => {
              try {
                // Get PNG data from QR component
                const dataUrl = await new Promise((resolve, reject) => {
                  try { qrRef.current?.toDataURL((d) => resolve(d)); } catch (e) { reject(e); }
                });
                if (!dataUrl) return;

                if (Platform.OS === 'web') {
                  const a = document.createElement('a');
                  a.href = dataUrl; a.download = `${name || 'qr'}.png`; a.click();
                  return;
                }

                const FileSystem = require('expo-file-system');
                const MediaLibrary = require('expo-media-library');
                // Strip prefix and write to cache
                const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
                const fileUri = FileSystem.cacheDirectory + `${name || 'qr'}.png`;
                await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });

                // Ask for permission and save to gallery
                const { status } = await MediaLibrary.requestPermissionsAsync();
                if (status !== 'granted') {
                  alert('Permission needed to save to gallery.');
                  return;
                }
                await MediaLibrary.saveToLibraryAsync(fileUri);
                alert('QR saved to your Photos/Gallery.');
              } catch (e) {
                console.warn('QR save failed', e);
                alert('Failed to save QR.');
              }
            }}
            style={{ marginTop: 12, backgroundColor: '#0a7ea4', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16 }}
          >
            <ThemedText style={{ color: '#fff', fontWeight: '600' }}>Save to Photos</ThemedText>
          </TouchableOpacity>
        </View>
      ) : null}
    </ThemedView>
  );
}
