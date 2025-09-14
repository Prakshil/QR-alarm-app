import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { Linking, Modal, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
let BarCodeScannerModule = null; try { BarCodeScannerModule = require('expo-barcode-scanner'); } catch {}
let MediaLibrary = null; try { MediaLibrary = require('expo-media-library'); } catch {}

export default function PermissionsModal({ visible, onClose, onAllGranted }) {
  const [notif, setNotif] = useState('unknown');
  const [camera, setCamera] = useState('unknown');
  const [media, setMedia] = useState('unknown');

  const BarCodeScanner = BarCodeScannerModule?.BarCodeScanner;

  const refresh = async () => {
    // Notifications
    try {
      const perms = await Notifications.getPermissionsAsync();
      setNotif(perms?.granted ? 'granted' : (perms?.status || 'denied'));
    } catch { setNotif('denied'); }
    // Camera
    try {
      if (!BarCodeScanner) setCamera('denied');
      else {
        const p = await BarCodeScanner.getPermissionsAsync();
        setCamera(p?.granted ? 'granted' : (p?.status || 'denied'));
      }
    } catch { setCamera('denied'); }
    // Media Library
    try {
      if (!MediaLibrary) setMedia('denied');
      else {
        const p = await MediaLibrary.getPermissionsAsync();
        setMedia(p?.granted ? 'granted' : (p?.status || 'denied'));
      }
    } catch { setMedia('denied'); }
  };

  useEffect(() => { if (visible) refresh(); }, [visible]);

  useEffect(() => {
    // In a perfect world we want all three; in Expo Go, camera/media may not fully grant.
    const allGranted = notif === 'granted' && camera === 'granted' && media === 'granted';
    const criticalGranted = notif === 'granted';
    if (allGranted || criticalGranted) {
      onAllGranted?.();
      onClose?.();
    }
  }, [notif, camera, media]);

  const requestAll = async () => {
    try { await Notifications.requestPermissionsAsync(); } catch {}
    try { if (BarCodeScanner) await BarCodeScanner.requestPermissionsAsync(); } catch {}
    try { if (MediaLibrary) await MediaLibrary.requestPermissionsAsync(); } catch {}
    await refresh();
    // Close regardless to avoid trapping users in Expo Go; backend checks will prompt again if missing later
    onClose?.();
  };

  const openSettings = () => Linking.openSettings();

  const Row = ({ title, status, onPress }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 }}>
      <ThemedText style={{ fontSize: 16 }}>{title}</ThemedText>
      <TouchableOpacity onPress={onPress} disabled={status === 'granted'} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, backgroundColor: status === 'granted' ? '#0a7ea4' : '#1f1f1f' }}>
        <ThemedText style={{ color: status === 'granted' ? '#fff' : '#9BA1A6' }}>{status === 'granted' ? 'Granted' : 'Allow'}</ThemedText>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <ThemedView style={{ marginTop: 'auto', backgroundColor: '#0b0b0b', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
          <ThemedText type="title" style={{ textAlign: 'center', marginBottom: 8 }}>Permissions</ThemedText>
          <ThemedText style={{ textAlign: 'center', color: '#8b8f93', marginBottom: 16 }}>
            To ring in background, scan QR, and save images, allow these permissions.
          </ThemedText>
          <Row title="Notifications" status={notif} onPress={async () => { try { await Notifications.requestPermissionsAsync(); } catch {} refresh(); }} />
          <Row title="Camera" status={camera} onPress={async () => { try { if (BarCodeScanner) await BarCodeScanner.requestPermissionsAsync(); } catch {} refresh(); }} />
          <Row title="Photos / Media" status={media} onPress={async () => { try { if (MediaLibrary) await MediaLibrary.requestPermissionsAsync(); } catch {} refresh(); }} />

          <View style={{ height: 12 }} />
          <TouchableOpacity onPress={requestAll} style={{ backgroundColor: '#121212', padding: 14, borderRadius: 12, alignItems: 'center' }}>
            <ThemedText style={{ fontWeight: '700' }}>Allow All</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity onPress={openSettings} style={{ padding: 12, alignItems: 'center' }}>
            <ThemedText style={{ color: '#0a7ea4' }}>Open Settings</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={{ padding: 8, alignItems: 'center' }}>
            <ThemedText style={{ color: '#8b8f93' }}>Skip for now</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </View>
    </Modal>
  );
}
