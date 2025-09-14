import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, TextInput, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { resendConfirmation, resetPassword, signIn, signUp } from '../src/lib/auth';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const doSignIn = async () => {
    try {
      setLoading(true);
      await signIn(email.trim(), password);
      router.back();
    } catch (e) {
      Alert.alert('Login failed', e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const doSignUp = async () => {
    try {
      setLoading(true);
      await signUp(email.trim(), password);
      Alert.alert('Check your email', 'We sent you a confirmation link. After confirming, sign in.');
    } catch (e) {
      Alert.alert('Sign up failed', e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={{ flex: 1, backgroundColor: '#000', padding: 24, justifyContent: 'center' }}>
      <ThemedText type="title" style={{ textAlign: 'center', marginBottom: 8 }}>Sign in</ThemedText>
      <ThemedText style={{ textAlign: 'center', color: '#8b8f93', marginBottom: 16 }}>Use email and password</ThemedText>
      <View style={{ gap: 12 }}>
        <TextInput
          autoCapitalize='none'
          keyboardType='email-address'
          placeholder='Email'
          placeholderTextColor='#6a6a6a'
          value={email}
          onChangeText={setEmail}
          style={{ backgroundColor: '#121212', color: '#fff', padding: 14, borderRadius: 12 }}
        />
        <TextInput
          placeholder='Password'
          placeholderTextColor='#6a6a6a'
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={{ backgroundColor: '#121212', color: '#fff', padding: 14, borderRadius: 12 }}
        />
        <TouchableOpacity onPress={doSignIn} disabled={loading} style={{ backgroundColor: '#0a7ea4', padding: 14, borderRadius: 12, alignItems: 'center' }}>
          <ThemedText style={{ color: '#fff', fontWeight: '700' }}>{loading ? 'Please wait…' : 'Sign in'}</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity onPress={doSignUp} disabled={loading} style={{ backgroundColor: '#121212', padding: 12, borderRadius: 12, alignItems: 'center' }}>
          <ThemedText>Create account</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={async () => {
            try {
              setLoading(true);
              if (!email.trim()) return Alert.alert('Email required', 'Enter your email first.');
              await resetPassword(email.trim());
              Alert.alert('Check your email', 'We sent a password reset link. Open it on this device.');
            } catch (e) {
              Alert.alert('Reset failed', e?.message || String(e));
            } finally { setLoading(false); }
          }}
          disabled={loading}
          style={{ backgroundColor: '#121212', padding: 12, borderRadius: 12, alignItems: 'center' }}
        >
          <ThemedText>Reset password</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={async () => {
            try {
              setLoading(true);
              if (!email.trim()) return Alert.alert('Email required', 'Enter your email first.');
              await resendConfirmation(email.trim());
              Alert.alert('Email sent', 'We re-sent your confirmation email.');
            } catch (e) {
              Alert.alert('Resend failed', e?.message || String(e));
            } finally { setLoading(false); }
          }}
          disabled={loading}
          style={{ backgroundColor: '#121212', padding: 12, borderRadius: 12, alignItems: 'center' }}
        >
          <ThemedText>Resend confirmation</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}
