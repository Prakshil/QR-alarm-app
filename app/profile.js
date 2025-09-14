import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Platform, TextInput, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { ThemedText } from "../components/themed-text";
import { ThemedView } from "../components/themed-view";
import { getSession, resendConfirmation, resetPassword, signIn, signOut, signUp } from "../src/lib/auth";
import { createProfileRow } from "../src/lib/db";
import { saveMyQrCode } from "../src/lib/storage";

export default function ProfileScreen() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Profile state
  const [name, setName] = useState("");
  const [qrValue, setQrValue] = useState("");
  const qrRef = useRef(null);
  
  // Auth state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(true);

  useEffect(() => {
    (async () => {
      const currentSession = await getSession();
      setSession(currentSession);
    })();
  }, []);

  // Auth handlers
  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    
    setLoading(true);
    try {
      const { session, error } = await signIn(email, password);
      if (error) throw error;
      setSession(session);
    } catch (error) {
      Alert.alert("Sign In Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    
    setLoading(true);
    try {
      const { session, error } = await signUp(email, password);
      if (error) throw error;
      
      if (session) {
        // Create profile row for new user
        await createProfileRow(session.user.id);
        setSession(session);
      } else {
        Alert.alert("Success", "Please check your email to confirm your account");
      }
    } catch (error) {
      Alert.alert("Sign Up Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email first");
      return;
    }
    
    try {
      const { error } = await resetPassword(email);
      if (error) throw error;
      Alert.alert("Success", "Password reset email sent");
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email first");
      return;
    }
    
    try {
      const { error } = await resendConfirmation(email);
      if (error) throw error;
      Alert.alert("Success", "Confirmation email sent");
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setSession(null);
      setEmail("");
      setPassword("");
      setName("");
      setQrValue("");
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  const generateQR = () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter your name first");
      return;
    }
    
    const uniqueId = Date.now().toString();
    setQrValue(uniqueId);
    saveMyQrCode(uniqueId);
  };

  const saveQRToGallery = async () => {
    if (!qrValue) {
      Alert.alert("Error", "Generate a QR code first");
      return;
    }

    if (Platform.OS === "web") {
      Alert.alert("Info", "QR save is not available on web platform");
      return;
    }

    try {
      const svg = qrRef.current;
      if (!svg) {
        Alert.alert("Error", "QR code not ready");
        return;
      }

      svg.toDataURL((data) => {
        if (Platform.OS === "android" || Platform.OS === "ios") {
          const MediaLibrary = require("expo-media-library");
          const FileSystem = require("expo-file-system");

          (async () => {
            try {
              const { status } = await MediaLibrary.requestPermissionsAsync();
              if (status !== "granted") {
                Alert.alert("Error", "Permission denied to save to gallery");
                return;
              }

              const filename = `${FileSystem.documentDirectory}qr-code-${Date.now()}.png`;
              await FileSystem.writeAsStringAsync(filename, data, {
                encoding: FileSystem.EncodingType.Base64,
              });

              const asset = await MediaLibrary.createAssetAsync(filename);
              await MediaLibrary.createAlbumAsync("QR Codes", asset, false);
              Alert.alert("Success", "QR code saved to gallery!");
            } catch (error) {
              console.error("Save error:", error);
              Alert.alert("Error", "Failed to save QR code");
            }
          })();
        }
      });
    } catch (error) {
      console.error("QR generation error:", error);
      Alert.alert("Error", "Failed to generate QR code for saving");
    }
  };

  // Show auth form if not logged in
  if (!session) {
    return (
      <ThemedView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#000' }}>
        <ThemedText type="title" style={{ marginBottom: 32, color: '#fff' }}>
          {isSignUp ? "Create Account" : "Sign In"}
        </ThemedText>
        
        <View style={{ width: '100%', marginBottom: 16 }}>
          <TextInput
            placeholder="Email"
            placeholderTextColor="#aaa"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={{ backgroundColor: '#121212', color: '#fff', padding: 16, borderRadius: 12, fontSize: 18 }}
          />
        </View>
        
        <View style={{ width: '100%', marginBottom: 24 }}>
          <TextInput
            placeholder="Password"
            placeholderTextColor="#aaa"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={{ backgroundColor: '#121212', color: '#fff', padding: 16, borderRadius: 12, fontSize: 18 }}
          />
        </View>
        
        <TouchableOpacity
          style={{ backgroundColor: '#0a7ea4', borderRadius: 12, paddingVertical: 14, width: '100%', alignItems: 'center', marginBottom: 16 }}
          onPress={isSignUp ? handleSignUp : handleSignIn}
          disabled={loading}
          activeOpacity={0.8}
        >
          <ThemedText style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>
            {loading ? "Loading..." : (isSignUp ? "Sign Up" : "Sign In")}
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={{ marginBottom: 16 }}
          onPress={() => setIsSignUp(!isSignUp)}
        >
          <ThemedText style={{ color: '#0a7ea4' }}>
            {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
          </ThemedText>
        </TouchableOpacity>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%' }}>
          <TouchableOpacity
            style={{ backgroundColor: '#333', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16 }}
            onPress={handleResetPassword}
          >
            <ThemedText style={{ color: '#fff', fontSize: 14 }}>Reset Password</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={{ backgroundColor: '#333', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16 }}
            onPress={handleResendConfirmation}
          >
            <ThemedText style={{ color: '#fff', fontSize: 14 }}>Resend Confirmation</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  // Show profile screen for authenticated users
  return (
    <ThemedView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#000' }}>
      <ThemedText type="title" style={{ marginBottom: 16 }}>Profile</ThemedText>
      <TouchableOpacity
        onPress={handleSignOut}
        style={{ position: 'absolute', top: 24, right: 16, backgroundColor: '#121212', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 }}
      >
        <ThemedText>Sign out</ThemedText>
      </TouchableOpacity>
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
        onPress={generateQR}
        activeOpacity={0.8}
      >
        <ThemedText style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>Generate QR</ThemedText>
      </TouchableOpacity>
      {qrValue ? (
        <View style={{ marginTop: 24, backgroundColor: '#fff', padding: 16, borderRadius: 16, alignItems: 'center' }}>
          <QRCode value={qrValue} backgroundColor="#ffffff" color="#000000" size={200} getRef={(c) => (qrRef.current = c)} />
          <ThemedText style={{ color: '#121212', marginTop: 12, fontSize: 16 }}>Your QR Code</ThemedText>
          <TouchableOpacity
            onPress={saveQRToGallery}
            style={{ marginTop: 12, backgroundColor: '#0a7ea4', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16 }}
          >
            <ThemedText style={{ color: '#fff', fontWeight: '600' }}>Save to Photos</ThemedText>
          </TouchableOpacity>
        </View>
      ) : null}
    </ThemedView>
  );
}
