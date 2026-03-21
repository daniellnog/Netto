import { useState } from "react"
import { View, Text, TouchableOpacity, Pressable } from "react-native"
import { useProfile } from "../../hooks/useProfile"

type Section = "profile" | "currency" | "categories" | "account"

const SECTIONS: { id: Section; label: string; description: string }[] = [
  { id: "profile", label: "Profile", description: "Your personal information" },
  { id: "currency", label: "Currency", description: "Default currency" },
  { id: "categories", label: "Categories", description: "Manage categories" },
  { id: "account", label: "Account", description: "Sign out and account actions" },
]

function ProfileSection() {
  return (
    <View>
      <Text className="text-lg font-bold text-gray-900 mb-1">Profile</Text>
      <Text className="text-sm text-gray-500 mb-6">Manage your personal information</Text>
      <View className="bg-gray-50 rounded-xl p-4">
        <Text className="text-xs text-gray-400 uppercase font-semibold mb-1">Coming soon</Text>
        <Text className="text-sm text-gray-600">Profile editing will be available here.</Text>
      </View>
    </View>
  )
}

const CURRENCIES = [
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "GBP", label: "British Pound", symbol: "£" },
  { code: "BRL", label: "Brazilian Real", symbol: "R$" },
  { code: "JPY", label: "Japanese Yen", symbol: "¥" },
  { code: "CAD", label: "Canadian Dollar", symbol: "CA$" },
  { code: "AUD", label: "Australian Dollar", symbol: "A$" },
  { code: "CHF", label: "Swiss Franc", symbol: "Fr" },
  { code: "CNY", label: "Chinese Yuan", symbol: "¥" },
  { code: "INR", label: "Indian Rupee", symbol: "₹" },
]

function CurrencySection() {
  const { profile, updateCurrency } = useProfile()

  return (
    <View>
      <Text className="text-lg font-bold text-gray-900 mb-1">Currency</Text>
      <Text className="text-sm text-gray-500 mb-6">Choose your default currency for transactions</Text>
      <View className="bg-gray-50 rounded-xl overflow-hidden w-[40%]">
        {CURRENCIES.map((c, i) => {
          const isSelected = profile?.currency === c.code
          return (
            <Pressable
              key={c.code}
              onPress={() => updateCurrency(c.code)}
              className={`flex-row items-center px-4 py-3 ${i > 0 ? "border-t border-gray-100" : ""} ${isSelected ? "bg-primary/10" : "hover:bg-gray-100"}`}
            >
              <View className="w-10 items-center">
                <Text className="text-base font-semibold text-gray-500">{c.symbol}</Text>
              </View>
              <View className="flex-1 ml-2">
                <Text className={`text-sm font-medium ${isSelected ? "text-primary" : "text-gray-800"}`}>{c.label}</Text>
                <Text className="text-xs text-gray-400">{c.code}</Text>
              </View>
              {isSelected && (
                <Text className="text-primary font-bold text-base">✓</Text>
              )}
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

function CategoriesSection() {
  return (
    <View>
      <Text className="text-lg font-bold text-gray-900 mb-1">Categories</Text>
      <Text className="text-sm text-gray-500 mb-6">Manage your income and expense categories</Text>
      <View className="bg-gray-50 rounded-xl p-4">
        <Text className="text-xs text-gray-400 uppercase font-semibold mb-1">Coming soon</Text>
        <Text className="text-sm text-gray-600">Category management will be available here.</Text>
      </View>
    </View>
  )
}

function AccountSection() {
  return (
    <View>
      <Text className="text-lg font-bold text-gray-900 mb-1">Account</Text>
      <Text className="text-sm text-gray-500 mb-6">Manage your account</Text>

      <View className="bg-gray-50 rounded-xl p-4">
        <Text className="text-xs text-gray-400 uppercase font-semibold mb-1">Delete account</Text>
        <Text className="text-sm text-gray-600">Will be available here.</Text>
      </View>
    </View>
  )
}

const SECTION_CONTENT: Record<Section, React.ReactNode> = {
  profile: <ProfileSection />,
  currency: <CurrencySection />,
  categories: <CategoriesSection />,
  account: <AccountSection />,
}

export default function SettingsScreen() {
  const [active, setActive] = useState<Section>("profile")

  return (
    <View className="flex-1 flex-row gap-6">
      {/* Sidebar */}
      <View className="w-56 bg-surface rounded-2xl p-2 self-start">
        {SECTIONS.map((section) => {
          const isActive = active === section.id
          return (
            <TouchableOpacity
              key={section.id}
              onPress={() => setActive(section.id)}
              className={`rounded-xl px-4 py-3 mb-1 ${isActive ? "bg-primary" : ""}`}
            >
              <Text className={`text-sm font-semibold ${isActive ? "text-white" : "text-gray-700"}`}>
                {section.label}
              </Text>
              <Text className={`text-xs mt-0.5 ${isActive ? "text-white/75" : "text-gray-400"}`}>
                {section.description}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Detail */}
      <View className="flex-1 bg-surface rounded-2xl p-6">
        {SECTION_CONTENT[active]}
      </View>
    </View>
  )
}
