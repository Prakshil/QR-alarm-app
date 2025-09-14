import { useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { IconSymbol } from '../components/ui/icon-symbol';

export default function ScanScreen() {
  const router = useRouter();

  const handleManualScan = () => {
    router.push('/scanner');
  };

  const handleImportScan = () => {
    router.push('/scan-options');
  };

  return (
    <ThemedView style={{ 
      flex: 1, 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: 24, 
      backgroundColor: '#000' 
    }}>
      <ThemedText type="title" style={{ marginBottom: 32, color: '#fff' }}>
        Scan QR Code
      </ThemedText>
      
      <ThemedText style={{ 
        textAlign: 'center', 
        color: '#aaa', 
        marginBottom: 48,
        fontSize: 16 
      }}>
        Choose how you'd like to scan the QR code
      </ThemedText>

      {/* Manual Scan Button */}
      <TouchableOpacity
        style={{
          backgroundColor: '#0a7ea4',
          borderRadius: 16,
          paddingVertical: 20,
          paddingHorizontal: 32,
          width: '100%',
          alignItems: 'center',
          marginBottom: 20,
          flexDirection: 'row',
          justifyContent: 'center'
        }}
        onPress={handleManualScan}
        activeOpacity={0.8}
      >
        <IconSymbol name="camera.fill" color="#fff" size={24} style={{ marginRight: 12 }} />
        <ThemedText style={{ 
          color: '#fff', 
          fontWeight: 'bold', 
          fontSize: 18 
        }}>
          Scan with Camera
        </ThemedText>
      </TouchableOpacity>

      {/* Import from Device Button */}
      <TouchableOpacity
        style={{
          backgroundColor: '#333',
          borderRadius: 16,
          paddingVertical: 20,
          paddingHorizontal: 32,
          width: '100%',
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'center'
        }}
        onPress={handleImportScan}
        activeOpacity={0.8}
      >
        <IconSymbol name="photo.fill" color="#fff" size={24} style={{ marginRight: 12 }} />
        <ThemedText style={{ 
          color: '#fff', 
          fontWeight: 'bold', 
          fontSize: 18 
        }}>
          Import from Gallery
        </ThemedText>
      </TouchableOpacity>

      <ThemedText style={{ 
        textAlign: 'center', 
        color: '#666', 
        marginTop: 32,
        fontSize: 14 
      }}>
        Scan your QR code to stop the alarm
      </ThemedText>
    </ThemedView>
  );
}