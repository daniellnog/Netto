import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { supabase } from "../../lib/supabase"

export default function SettingsScreen() {
  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", color: "#111", marginBottom: 32 },
  logoutButton: { borderWidth: 1, borderColor: "#dc2626", borderRadius: 8, padding: 14, alignItems: "center" },
  logoutText: { color: "#dc2626", fontSize: 16, fontWeight: "600" },
})
