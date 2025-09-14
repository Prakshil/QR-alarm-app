import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const KEY = 'alarms.v1';
const MY_QR_KEY = 'my.qr.v1';

// Cross-platform storage helper
const storage = {
  getItem: (key) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        return Promise.resolve(window.localStorage.getItem(key));
      }
      return Promise.resolve(null);
    }
    return AsyncStorage.getItem(key);
  },
  setItem: (key, value) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return Promise.resolve();
      }
      return Promise.resolve();
    }
    return AsyncStorage.setItem(key, value);
  }
};

export async function loadAlarms() {
  try {
    const raw = await storage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    // revive dates
    return arr.map(a => ({ ...a, time: new Date(a.time) }));
  } catch {
    return [];
  }
}

export async function saveAlarms(alarms) {
  try {
    await storage.setItem(KEY, JSON.stringify(alarms));
  } catch {}
}

export async function saveMyQrCode(code) {
  try { await storage.setItem(MY_QR_KEY, code || ''); } catch {}
}

export async function loadMyQrCode() {
  try { const v = await storage.getItem(MY_QR_KEY); return v || ''; } catch { return ''; }
}
