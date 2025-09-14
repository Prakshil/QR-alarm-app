import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Platform, TextInput, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { ThemedText } from "../components/themed-text";
import { ThemedView } from "../components/themed-view";
import { getSession, resetPassword, signIn, signOut, signUp } from "../src/lib/auth";
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
      console.log('Attempting sign in for:', email);
      const signInResult = await signIn(email, password);
      console.log('Sign in result:', signInResult);
      
      if (signInResult.session) {
        setSession(signInResult.session);
        Alert.alert("Welcome back!", "Successfully signed in! You can generate and download your QR code.", [
          {
            text: "OK",
            onPress: () => {
              setEmail("");
              setPassword("");
            }
          }
        ]);
      } else {
        Alert.alert("Error", "Failed to sign in. Please check your credentials.");
      }
    } catch (error) {
      console.log('Sign in error:', error);
      
      if (error.message.includes('Invalid login credentials')) {
        Alert.alert("Sign In Error", "Invalid email or password. Please check your credentials.");
      } else if (error.message.includes('Email not confirmed')) {
        Alert.alert("Email Not Confirmed", "Please check your email and confirm your account first.");
      } else {
        Alert.alert("Sign In Error", error.message);
      }
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
      console.log('Attempting signup for:', email);
      const signUpResult = await signUp(email, password);
      
      console.log('Signup result:', signUpResult);
      
      // Check if we got a session directly from signup
      if (signUpResult.session) {
        console.log('Got session from signup');
        // Create profile row for new user
        try {
          await createProfileRow(signUpResult.session.user.id);
        } catch (profileError) {
          console.log('Profile creation error (might already exist):', profileError);
        }
        setSession(signUpResult.session);
        Alert.alert("Welcome!", "Account created successfully! You can now generate and download your unique QR code.", [
          {
            text: "OK",
            onPress: () => {
              // Clear form fields
              setEmail("");
              setPassword("");
            }
          }
        ]);
      } else if (signUpResult.user && !signUpResult.session) {
        console.log('User created but no session, trying to sign in');
        // User was created but no session - try to sign in immediately
        try {
          const signInResult = await signIn(email, password);
          console.log('Sign in result:', signInResult);
          
          if (signInResult.session) {
            try {
              await createProfileRow(signInResult.session.user.id);
            } catch (profileError) {
              console.log('Profile creation error (might already exist):', profileError);
            }
            setSession(signInResult.session);
            Alert.alert("Welcome!", "Account created successfully! You can now generate and download your unique QR code.", [
              {
                text: "OK",
                onPress: () => {
                  setEmail("");
                  setPassword("");
                }
              }
            ]);
          } else {
            Alert.alert("Account Created", "Account created successfully! Please sign in with your credentials.");
            setIsSignUp(false);
          }
        } catch (signInError) {
          console.log('Auto sign in failed:', signInError);
          Alert.alert("Account Created", "Account created successfully! Please sign in with your credentials.");
          setIsSignUp(false);
        }
      }
    } catch (error) {
      console.log('Signup error:', error);
      
      // Check if user already exists
      if (error.message.includes('already registered') || error.message.includes('already been taken')) {
        Alert.alert("Error", "Email already exists. Please try signing in instead.");
        setIsSignUp(false);
      } else {
        Alert.alert("Sign Up Error", error.message);
      }
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
          (async () => {
            try {
              // Check if we're in Expo Go
              const Constants = require("expo-constants");
              const isExpoGo = Constants.appOwnership === 'expo';
              
              if (isExpoGo) {
                Alert.alert(
                  "Limited in Expo Go", 
                  "QR code saving to gallery is limited in Expo Go. You can:\n\n• Take a screenshot instead\n• Share the QR code via other apps\n• Build a development version for full functionality",
                  [
                    { text: "OK", style: "default" },
                    { text: "Share QR", onPress: () => shareQRCode(data) }
                  ]
                );
                return;
              }

              const MediaLibrary = require("expo-media-library");
              const FileSystem = require("expo-file-system");

              // Request permissions
              const { status } = await MediaLibrary.requestPermissionsAsync();
              if (status !== "granted") {
                Alert.alert(
                  "Permission Required", 
                  "Please allow access to photos to save your QR code.",
                  [
                    { text: "Cancel", style: "cancel" },
                    { text: "Open Settings", onPress: () => require("react-native").Linking.openSettings() }
                  ]
                );
                return;
              }

              // Create and save file
              const filename = `${FileSystem.documentDirectory}qr-code-${Date.now()}.png`;
              await FileSystem.writeAsStringAsync(filename, data, {
                encoding: FileSystem.EncodingType.Base64,
              });

              const asset = await MediaLibrary.createAssetAsync(filename);
              try {
                await MediaLibrary.createAlbumAsync("QR Codes", asset, false);
              } catch {
                // Album creation might fail, but asset is still saved
              }
              
              Alert.alert("Success", "QR code saved to your photos!");
            } catch (error) {
              console.error("Save error:", error);
              
              // Provide helpful error messages
              if (error.message?.includes("AUDIO")) {
                Alert.alert(
                  "Expo Go Limitation", 
                  "Media library access is limited in Expo Go. Please use a development build for full functionality, or take a screenshot instead."
                );
              } else {
                Alert.alert("Error", `Failed to save QR code: ${error.message || 'Unknown error'}`);
              }
            }
          })();
        }
      });
    } catch (error) {
      console.error("QR generation error:", error);
      Alert.alert("Error", "Failed to generate QR code for saving");
    }
  };

  const shareQRCode = async (base64Data) => {
    try {
      const Sharing = require("expo-sharing");
      const FileSystem = require("expo-file-system");
      
      const filename = `${FileSystem.cacheDirectory}qr-code-${Date.now()}.png`;
      await FileSystem.writeAsStringAsync(filename, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filename, {
          mimeType: 'image/png',
          dialogTitle: 'Share your QR Code'
        });
      } else {
        Alert.alert("Info", "Sharing not available on this device");
      }
    } catch (error) {
      console.error("Share error:", error);
      Alert.alert("Error", "Failed to share QR code");
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
        
        {/* Only show Forgot Password for Sign In mode */}
        {!isSignUp && (
          <TouchableOpacity
            style={{ backgroundColor: '#333', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 20, marginTop: 8 }}
            onPress={handleResetPassword}
          >
            <ThemedText style={{ color: '#fff', fontSize: 14 }}>Forgot Password?</ThemedText>
          </TouchableOpacity>
        )}
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
      
      {/* Expo Go Limitations Info */}
      <View style={{ marginTop: 16, backgroundColor: '#1a1a1a', padding: 12, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#ffb26b' }}>
        <ThemedText style={{ color: '#ffb26b', fontSize: 14, lineHeight: 20 }}>
          💡 <ThemedText style={{ fontWeight: '600' }}>Using Expo Go?</ThemedText> Some features like QR saving have limitations. For full functionality, create a development build or take screenshots as needed.
        </ThemedText>
      </View>
    </ThemedView>
  );
}
