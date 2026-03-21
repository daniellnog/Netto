import { View, Text, TouchableOpacity } from "react-native"
import { useRouter, usePathname } from "expo-router"

const NAV_ITEMS = [
  { label: "Dashboard", href: "/(app)" },
  { label: "Transactions", href: "/(app)/transactions" },
  { label: "Reports", href: "/(app)/reports" },
  { label: "Limits", href: "/(app)/limits" },
  { label: "Settings", href: "/(app)/settings" },
]

export function Header() {
  const router = useRouter()
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === "/(app)") return pathname === "/" || pathname === "/index"
    return pathname.includes(href.replace("/(app)", ""))
  }

  return (
    <View className="bg-primary w-full">
      <View className="flex-row items-center h-14 w-full max-w-6xl mx-auto px-6">
        <Text className="text-white text-lg font-bold mr-10">Netto</Text>

        <View className="flex-row flex-1 gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href)
            return (
              <TouchableOpacity
                key={item.href}
                onPress={() => router.push(item.href as any)}
                className={`px-4 py-1.5 rounded-full ${active ? "bg-white/20" : ""}`}
              >
                <Text className={`text-sm font-medium ${active ? "text-white font-semibold" : "text-white/75"}`}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>
    </View>
  )
}
