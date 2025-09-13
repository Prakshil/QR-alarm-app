

import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { Alert, AppState, FlatList, Platform, StyleSheet, Switch, TextInput, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../components/themed-text";
import { ThemedView } from "../components/themed-view";
import { IconSymbol } from "../components/ui/icon-symbol";
import { onAlarmStop } from "../src/lib/alarmBus";
import { loadAlarms, saveAlarms } from "../src/lib/storage";

function Wheel({ count, value, onChange, step = 1 }) {
  const data = Array.from({ length: count }, (_, i) => i * step);
  const ITEM_H = 42;
  const PAD = ITEM_H * 2; // top/bottom padding to center selection
  const listRef = React.useRef(null);
  React.useEffect(() => {
    // scroll to the current value index
    const idx = data.findIndex(v => v === value);
    if (idx >= 0) {
      listRef.current?.scrollToOffset({ offset: PAD + idx * ITEM_H, animated: true });
    }
  }, [value]);
  return (
    <View style={{ height: ITEM_H * 5, width: 90, overflow: 'hidden' }}>
      <FlatList
        ref={listRef}
        data={data}
        keyExtractor={(item) => String(item)}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({ length: ITEM_H, offset: ITEM_H * index, index })}
        onMomentumScrollEnd={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          const idx = Math.round((y - PAD) / ITEM_H);
          const val = data[Math.min(Math.max(idx, 0), data.length - 1)];
          onChange(val);
        }}
        contentContainerStyle={{ paddingVertical: PAD }}
        renderItem={({ item }) => (
          <View style={{ height: ITEM_H, alignItems: 'center', justifyContent: 'center' }}>
            <ThemedText style={{ fontSize: 22, color: item === value ? '#fff' : '#6a6a6a', fontWeight: item === value ? '700' : '500' }}>
              {String(item).padStart(2,'0')}
            </ThemedText>
          </View>
        )}
      />
    </View>
  );
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function AlarmScreen() {
  const [alarms, setAlarms] = useState([]);
  const [pendingAlarm, setPendingAlarm] = useState(null); // {id, time}
  const [ringVisible, setRingVisible] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());
  const [editorLabel, setEditorLabel] = useState("");
  const [editorVibrate, setEditorVibrate] = useState(true);
  const [editorRepeat, setEditorRepeat] = useState([false, false, false, false, false, false, false]); // Sun..Sat
  const [editorSound, setEditorSound] = useState({ uri: null, name: "Default" });
  const router = useRouter();
  const alarmTimeout = useRef(null);
  const stoppedRef = useRef(false);
  const playingRef = useRef(null); // web Audio or expo-av Sound instance

  const getNextAlarm = (list) => {
    return list
      .filter(a => a.enabled)
      .sort((a,b) => a.time.getTime() - b.time.getTime())[0] || null;
  };

  const rescheduleNext = (list) => {
    if (alarmTimeout.current) {
      clearTimeout(alarmTimeout.current);
      alarmTimeout.current = null;
    }
    const next = getNextAlarm(list);
    if (!next) return;
    const ms = next.time.getTime() - Date.now();
    if (ms > 0) {
      alarmTimeout.current = setTimeout(() => ringAlarm(next), ms);
    }
  };

  // Helper to schedule a notification and set pending alarm
  const ringAlarm = (alarm) => {
    setPendingAlarm(alarm);
    setRingVisible(true);
    Notifications.scheduleNotificationAsync({
      content: {
        title: "⏰ Alarm Ringing!",
        body: "Scan your QR code to stop.",
        sound: "default",
      },
      trigger: null, // fire immediately
    });
    // Navigate to scanner
  setTimeout(() => router.push("/scanner"), 500);
    // Try to play custom sound if available
    try {
      if (alarm.sound?.uri) {
        if (Platform.OS === 'web') {
          const audio = new Audio(alarm.sound.uri);
          audio.loop = true;
          audio.play().catch(() => {});
          playingRef.current = { type: 'web', ref: audio };
        } else {
          // lazy import expo-av if available
          const { Audio } = require('expo-av');
          (async () => {
            const sound = new Audio.Sound();
            await sound.loadAsync({ uri: alarm.sound.uri });
            await sound.setIsLoopingAsync(true);
            await sound.playAsync();
            playingRef.current = { type: 'native', ref: sound };
          })();
        }
      }
    } catch {}
  };

  // Show time picker to add an alarm
  const addAlarm = () => {
    setPickerDate(new Date());
    setPickerVisible(true);
  };

  const confirmPicker = () => {
    const time = new Date(pickerDate);
    time.setSeconds(0, 0);
    // If time is in the past today, schedule for tomorrow
    const now = new Date();
    if (time <= now) {
      time.setDate(time.getDate() + 1);
    }
    const alarm = { id: Date.now(), time, enabled: true, label: editorLabel, vibrate: editorVibrate, repeat: editorRepeat, sound: editorSound };
    setAlarms(prev => {
      const next = [...prev, alarm];
      saveAlarms(next);
      return next;
    });
  // schedule next
  rescheduleNext([...alarms, alarm]);
    setPickerVisible(false);
    setEditorLabel("");
    setEditorVibrate(true);
    setEditorRepeat([false, false, false, false, false, false, false]);
    setEditorSound({ uri: null, name: "Default" });
  };

  const cancelPicker = () => setPickerVisible(false);

  // Toggle alarm on/off
  const toggleAlarm = (id) => {
    const updated = alarms.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a);
    setAlarms(updated);
    saveAlarms(updated);
    rescheduleNext(updated);
  };

  // Delete alarm
  const deleteAlarm = (id) => {
    const updated = alarms.filter(a => a.id !== id);
    setAlarms(updated);
    saveAlarms(updated);
    rescheduleNext(updated);
  };

  const editAlarm = (id) => {
    Alert.alert('Edit Alarm', 'Editing alarms coming soon!');
  };

  // Listen for app coming to foreground (simulate snooze if not stopped)
  React.useEffect(() => {
    const off = onAlarmStop(() => {
      // mark as stopped and clear pending
      stoppedRef.current = true;
      setPendingAlarm(null);
      if (alarmTimeout.current) {
        clearTimeout(alarmTimeout.current);
        alarmTimeout.current = null;
      }
      // stop any sound
      if (playingRef.current) {
        try {
          if (playingRef.current.type === 'web') {
            playingRef.current.ref.pause();
          } else if (playingRef.current.type === 'native') {
            playingRef.current.ref.stopAsync?.();
            playingRef.current.ref.unloadAsync?.();
          }
        } catch {}
        playingRef.current = null;
      }
      setRingVisible(false);
    });
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && pendingAlarm && !stoppedRef.current) {
        // If alarm is still pending, snooze for 2 min
        Notifications.scheduleNotificationAsync({
          content: {
            title: "⏰ Alarm Snoozed!",
            body: "Scan your QR code to stop.",
            sound: "default",
          },
          trigger: { seconds: 120 },
        });
        setPendingAlarm(null);
        setRingVisible(false);
      }
    });
    return () => { sub.remove(); off(); };
    // We intentionally only depend on pendingAlarm here
  }, [pendingAlarm]);

  // Load persisted alarms
  React.useEffect(() => {
    (async () => {
      const stored = await loadAlarms();
      if (stored.length) {
        setAlarms(stored);
        // schedule next alarm from stored
        rescheduleNext(stored);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nextAlarm = alarms
    .filter(a => a.enabled)
    .sort((a,b) => a.time.getTime()-b.time.getTime())[0];

  const eta = nextAlarm ? (() => {
    const ms = nextAlarm.time.getTime() - Date.now();
    const totalMin = Math.max(1, Math.round(ms/60000));
    const h = Math.floor(totalMin/60);
    const m = totalMin%60;
    return `${h ? `${h} hour${h>1?'s':''} `:''}${m} minute${m!==1?'s':''}`.trim();
  })() : null;

  return (
    <ThemedView style={styles.container}>
      <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 8 }}>
        {eta ? (
          <>
            <ThemedText style={{ fontSize: 28, fontWeight: '700', color: '#ffb26b', textAlign: 'center' }}>Alarm in {eta}</ThemedText>
            <ThemedText style={{ textAlign: 'center', color: '#8b8f93', marginTop: 6 }}>{nextAlarm.time.toLocaleString([], { weekday: 'short', day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' })}</ThemedText>
          </>
        ) : (
          <ThemedText style={{ fontSize: 20, color: '#8b8f93', textAlign: 'center' }}>No upcoming alarms</ThemedText>
        )}
      </View>
      <FlatList
        data={alarms}
        keyExtractor={item => item.id.toString()}
        ListEmptyComponent={<ThemedText style={styles.empty}>No alarms set</ThemedText>}
        renderItem={({ item }) => (
          <ThemedView style={styles.alarmRow}>
            <TouchableOpacity onPress={() => editAlarm(item.id)} style={styles.timeWrap}>
              <ThemedText type="title" style={styles.time}>{formatTime(item.time)}</ThemedText>
            </TouchableOpacity>
            <Switch
              value={item.enabled}
              onValueChange={() => toggleAlarm(item.id)}
              thumbColor={item.enabled ? '#fff' : '#444'}
              trackColor={{ false: '#444', true: '#0a7ea4' }}
            />
            <TouchableOpacity onPress={() => deleteAlarm(item.id)}>
              <IconSymbol name="chevron.right" size={24} color="#9BA1A6" />
            </TouchableOpacity>
          </ThemedView>
        )}
      />
      <TouchableOpacity style={styles.addBtn} onPress={addAlarm}>
        <IconSymbol name="paperplane.fill" size={28} color="#fff" />
      </TouchableOpacity>

      {pickerVisible && (
        <>
        <TouchableOpacity activeOpacity={1} onPress={cancelPicker} style={styles.pickerBackdrop} />
        <View style={styles.pickerSheet}>
          <View style={styles.pickerRow}>
            <TouchableOpacity onPress={cancelPicker}>
              <ThemedText style={{ color: '#0a7ea4', fontSize: 16 }}>Cancel</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity onPress={confirmPicker}>
              <ThemedText style={{ color: '#0a7ea4', fontSize: 16, fontWeight: '600' }}>Add</ThemedText>
            </TouchableOpacity>
          </View>
          {Platform.OS === 'web' ? (
            <input
              type="time"
              style={{ width: '100%', padding: 12, borderRadius: 12, background: '#23272b', color: 'white', border: '1px solid #2f3437' }}
              value={`${String(pickerDate.getHours()).padStart(2,'0')}:${String(pickerDate.getMinutes()).padStart(2,'0')}`}
              onChange={(e) => {
                const [hh, mm] = e.target.value.split(':').map(Number);
                const d = new Date(pickerDate);
                d.setHours(hh); d.setMinutes(mm);
                setPickerDate(d);
              }}
            />
          ) : (
            <View>
              {/* Custom wheel slider for iOS/Android */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginVertical: 8 }}>
                {/** Hours wheel */}
                <View style={{ alignItems: 'center' }}>
                  <ThemedText style={{ marginBottom: 8, color: '#8b8f93' }}>HOUR</ThemedText>
                  <Wheel
                    count={24}
                    value={pickerDate.getHours()}
                    onChange={(h) => setPickerDate(d => { const nd = new Date(d); nd.setHours(h); return nd; })}
                  />
                </View>
                {/** Minutes wheel */}
                <View style={{ alignItems: 'center' }}>
                  <ThemedText style={{ marginBottom: 8, color: '#8b8f93' }}>MIN</ThemedText>
                  <Wheel
                    count={60}
                    step={1}
                    value={pickerDate.getMinutes()}
                    onChange={(m) => setPickerDate(d => { const nd = new Date(d); nd.setMinutes(m); return nd; })}
                  />
                </View>
              </View>
            </View>
          )}

          {/* Repeat days */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
            {['S','M','T','W','T','F','S'].map((d, i) => (
              <TouchableOpacity key={i} onPress={() => setEditorRepeat(prev => prev.map((v, idx) => idx===i ? !v : v))} style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: editorRepeat[i] ? '#ffb26b' : '#1f1f1f' }}>
                <ThemedText style={{ color: editorRepeat[i] ? '#000' : '#8b8f93', fontWeight: '600' }}>{d}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          {/* Label */}
          <View style={{ marginTop: 12 }}>
            <ThemedText style={{ marginBottom: 6 }}>Alarm name</ThemedText>
            <TextInput
              value={editorLabel}
              onChangeText={setEditorLabel}
              placeholder="Alarm name"
              placeholderTextColor="#6a6a6a"
              style={{ backgroundColor: '#121212', color: '#fff', padding: 12, borderRadius: 12 }}
            />
          </View>

          {/* Sound picker */}
          <View style={{ marginTop: 12, gap: 8 }}>
            <ThemedText>Alarm sound</ThemedText>
            {Platform.OS === 'web' ? (
              <>
                <input id="file-audio" type="file" accept="audio/*" style={{ display: 'none' }} onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    const url = URL.createObjectURL(f);
                    setEditorSound({ uri: url, name: f.name });
                  }
                }} />
                <TouchableOpacity onPress={() => document.getElementById('file-audio')?.click()} style={{ backgroundColor: '#1f1f1f', padding: 12, borderRadius: 12 }}>
                  <ThemedText>{editorSound?.name || 'Default'}</ThemedText>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                onPress={async () => {
                  try {
                    const DocumentPicker = require('expo-document-picker');
                    const res = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true });
                    if (res?.assets?.[0]?.uri) {
                      setEditorSound({ uri: res.assets[0].uri, name: res.assets[0].name || 'Custom' });
                    }
                  } catch (_e) {
                    Alert.alert('Install required', 'Please add expo-document-picker and expo-av to select and play custom sounds.');
                  }
                }}
                style={{ backgroundColor: '#1f1f1f', padding: 12, borderRadius: 12 }}
              >
                <ThemedText>{editorSound?.name || 'Default'}</ThemedText>
              </TouchableOpacity>
            )}
          </View>

          {/* Vibration */}
          <View style={[styles.pickerRow, { marginTop: 12 }] }>
            <ThemedText>Vibration</ThemedText>
            <Switch value={editorVibrate} onValueChange={setEditorVibrate} />
          </View>
        </View>
        </>
      )}

      {ringVisible && pendingAlarm && (
        <View style={styles.ringOverlay}>
          <ThemedText style={styles.ringTime}>{formatTime(pendingAlarm.time)}</ThemedText>
          {!!pendingAlarm.label && (
            <ThemedText style={styles.ringLabel}>{pendingAlarm.label}</ThemedText>
          )}
          <TouchableOpacity onPress={() => router.push('/scan-options')} style={styles.ringBtn}>
            <ThemedText style={{ color: '#000', fontWeight: '700' }}>Scan QR to Stop</ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 60,
    paddingHorizontal: 0,
  },
  header: {
    textAlign: 'center',
    marginBottom: 24,
  },
  alarmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#121212',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  timeWrap: {
    flex: 1,
  },
  time: {
    fontSize: 36,
    fontWeight: '600',
    letterSpacing: 2,
  },
  empty: { textAlign: 'center', color: '#8b8f93', marginTop: 40 },
  addBtn: {
    position: 'absolute',
    right: 24,
    bottom: 40,
    backgroundColor: '#ffb26b',
    borderRadius: 32,
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ffb26b',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  pickerSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0b0b0b',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    gap: 12,
  },
  pickerBackdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ringOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  ringTime: {
    fontSize: 72,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#fff',
    textAlign: 'center',
  },
  ringLabel: {
    color: '#9BA1A6',
    fontSize: 18,
    marginBottom: 8,
  },
  ringBtn: {
    backgroundColor: '#ffb26b',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 8,
  },
});
