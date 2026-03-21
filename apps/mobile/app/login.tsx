import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native"
import { supabase } from "../lib/supabase"

export default function LoginScreen() {
  async function handleGoogleLogin() {
    const redirectTo = Platform.OS === "web"
      ? window.location.origin
      : "netto://login"

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    })
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Netto</Text>
      <Text style={styles.subtitle}>Personal Finance Manager</Text>

      <TouchableOpacity style={styles.button} onPress={handleGoogleLogin}>
        <Text style={styles.buttonText}>Continue with Google</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", padding: 24 },
  title: { fontSize: 36, fontWeight: "bold", color: "#111", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#666", marginBottom: 48 },
  button: { backgroundColor: "#4285F4", paddingVertical: 14, paddingHorizontal: 32, borderRadius: 8, width: "100%" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600", textAlign: "center" },
})
