import { View, ScrollView } from "react-native"
import { Slot } from "expo-router"
import { Header } from "../../components/Header"

export default function AppLayout() {
  return (
    <View className="flex-1 bg-background">
      <Header />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="w-full max-w-6xl mx-auto px-6 py-6 flex-1">
          <Slot />
        </View>
      </ScrollView>
    </View>
  )
}
