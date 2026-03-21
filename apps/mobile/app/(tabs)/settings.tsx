import { View, Text, TouchableOpacity } from "react-native"
import { supabase } from "../../lib/supabase"

export default function SettingsScreen() {
  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <View className="flex-1 p-6 bg-white">
      <Text className="text-2xl font-bold text-gray-900 mb-8">Settings</Text>

      <TouchableOpacity
        className="border border-danger rounded-lg p-4 items-center"
        onPress={handleLogout}
      >
        <Text className="text-danger text-base font-semibold">Sign Out</Text>
      </TouchableOpacity>
    </View>
  )
}
