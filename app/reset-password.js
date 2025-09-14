import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, TextInput, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { supabase } from '../src/lib/supabase';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { access_token, refresh_token } = useLocalSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Set the session from the tokens in the URL
    if (access_token && refresh_token) {
      supabase.auth.setSession({
        access_token: String(access_token),
        refresh_token: String(refresh_token),
      });
    }
  }, [access_token, refresh_token]);

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in both fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      Alert.alert('Success', 'Password updated successfully!', [
        {
          text: 'OK',
          onPress: () => router.replace('/profile')
        }
      ]);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
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
        Reset Password
      </ThemedText>
      
      <ThemedText style={{ 
        textAlign: 'center', 
        color: '#aaa', 
        marginBottom: 32,
        fontSize: 16 
      }}>
        Enter your new password
      </ThemedText>

      <View style={{ width: '100%', marginBottom: 16 }}>
        <TextInput
          placeholder="New Password"
          placeholderTextColor="#aaa"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          style={{ 
            backgroundColor: '#121212', 
            color: '#fff', 
            padding: 16, 
            borderRadius: 12, 
            fontSize: 18 
          }}
        />
      </View>

      <View style={{ width: '100%', marginBottom: 24 }}>
        <TextInput
          placeholder="Confirm Password"
          placeholderTextColor="#aaa"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          style={{ 
            backgroundColor: '#121212', 
            color: '#fff', 
            padding: 16, 
            borderRadius: 12, 
            fontSize: 18 
          }}
        />
      </View>

      <TouchableOpacity
        style={{
          backgroundColor: '#0a7ea4',
          borderRadius: 12,
          paddingVertical: 14,
          width: '100%',
          alignItems: 'center',
          marginBottom: 16
        }}
        onPress={handleResetPassword}
        disabled={loading}
        activeOpacity={0.8}
      >
        <ThemedText style={{ 
          color: '#fff', 
          fontWeight: 'bold', 
          fontSize: 18 
        }}>
          {loading ? 'Updating...' : 'Update Password'}
        </ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.replace('/profile')}
      >
        <ThemedText style={{ color: '#666', fontSize: 14 }}>
          Back to Profile
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}