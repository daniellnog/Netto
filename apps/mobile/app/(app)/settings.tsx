import { useState } from "react"
import { View, Text, TouchableOpacity } from "react-native"
import { supabase } from "../../lib/supabase"

type Section = "profile" | "currency" | "categories" | "account"

const SECTIONS: { id: Section; label: string; description: string }[] = [
  { id: "profile", label: "Profile", description: "Your name and email" },
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

function CurrencySection() {
  return (
    <View>
      <Text className="text-lg font-bold text-gray-900 mb-1">Currency</Text>
      <Text className="text-sm text-gray-500 mb-6">Set your default currency</Text>
      <View className="bg-gray-50 rounded-xl p-4">
        <Text className="text-xs text-gray-400 uppercase font-semibold mb-1">Coming soon</Text>
        <Text className="text-sm text-gray-600">Currency selector will be available here.</Text>
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
  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <View>
      <Text className="text-lg font-bold text-gray-900 mb-1">Account</Text>
      <Text className="text-sm text-gray-500 mb-6">Manage your account</Text>

      <TouchableOpacity
        className="border border-danger rounded-xl p-4 items-center"
        onPress={handleLogout}
      >
        <Text className="text-danger text-base font-semibold">Sign Out</Text>
      </TouchableOpacity>
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
