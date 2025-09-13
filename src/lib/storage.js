import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'alarms.v1';

export async function loadAlarms() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
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
    await AsyncStorage.setItem(KEY, JSON.stringify(alarms));
  } catch {}
}
