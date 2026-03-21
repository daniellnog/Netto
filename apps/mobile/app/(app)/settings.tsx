import { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, Pressable, TextInput } from "react-native"
import { useProfile } from "../../hooks/useProfile"
import { useAuth } from "../../context/auth"
import { supabase } from "../../lib/supabase"

type Section = "profile" | "currency" | "accounts" | "categories" | "account"

const SECTIONS: { id: Section; label: string; description: string }[] = [
  { id: "profile", label: "Profile", description: "Your personal information" },
  { id: "currency", label: "Currency", description: "Default currency" },
  { id: "accounts", label: "Accounts", description: "Bank accounts & wallets" },
  { id: "categories", label: "Categories", description: "Manage categories" },
  { id: "account", label: "Account", description: "Account actions" },
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

const ACCOUNT_ICONS = ["💳", "🏦", "💰", "🏧", "💵", "📊", "🏠", "✈️", "🎯", "💼"]

type AccountRow = {
  id: string
  name: string
  icon: string
  excludeFromTotal: boolean
}

function AccountsSection() {
  const { session } = useAuth()
  const [accounts, setAccounts] = useState<AccountRow[]>([])
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState("")
  const [newIcon, setNewIcon] = useState("💳")
  const [newExclude, setNewExclude] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!session?.user) return
    supabase
      .from("Account")
      .select("id, name, icon, excludeFromTotal")
      .eq("userId", session.user.id)
      .order("createdAt")
      .then(({ data }) => setAccounts(data ?? []))
  }, [session])

  async function handleAdd() {
    if (!newName.trim() || !session?.user) return
    setSaving(true)
    const { data } = await supabase
      .from("Account")
      .insert({ userId: session.user.id, name: newName.trim(), icon: newIcon, excludeFromTotal: newExclude })
      .select("id, name, icon, excludeFromTotal")
      .single()
    if (data) {
      setAccounts((prev) => [...prev, data])
      setNewName("")
      setNewIcon("💳")
      setAdding(false)
    }
    setSaving(false)
  }

  async function handleToggleExclude(id: string, current: boolean) {
    await supabase.from("Account").update({ excludeFromTotal: !current }).eq("id", id)
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, excludeFromTotal: !current } : a)))
  }

  async function handleDelete(id: string) {
    await supabase.from("Account").delete().eq("id", id)
    setAccounts((prev) => prev.filter((a) => a.id !== id))
  }

  function handleCancel() {
    setAdding(false)
    setNewName("")
    setNewIcon("💳")
    setNewExclude(false)
  }

  return (
    <View>
      <Text className="text-lg font-bold text-gray-900 mb-1">Accounts</Text>
      <Text className="text-sm text-gray-500 mb-6">Manage your bank accounts and wallets</Text>

      <View className="w-[50%]">
        {accounts.length > 0 && (
          <View className="bg-gray-50 rounded-xl overflow-hidden mb-3">
            {accounts.map((account, i) => (
              <View
                key={account.id}
                className={`flex-row items-center px-4 py-3 ${i > 0 ? "border-t border-gray-100" : ""}`}
              >
                <Text className="text-xl w-8">{account.icon}</Text>
                <Text className="flex-1 text-sm font-medium text-gray-800 mx-3">{account.name}</Text>
                <Pressable
                  onPress={() => handleToggleExclude(account.id, account.excludeFromTotal)}
                  className={`px-2 py-1 rounded-md mr-3 ${account.excludeFromTotal ? "bg-amber-100" : "bg-gray-200"}`}
                >
                  <Text className={`text-xs font-medium ${account.excludeFromTotal ? "text-amber-700" : "text-gray-400"}`}>
                    Excl. total
                  </Text>
                </Pressable>
                <Pressable onPress={() => handleDelete(account.id)} className="hover:opacity-70">
                  <Text className="text-danger text-sm">✕</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {adding ? (
          <View className="bg-gray-50 rounded-xl p-4">
            <Text className="text-xs text-gray-400 uppercase font-semibold mb-2">Icon</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {ACCOUNT_ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  onPress={() => setNewIcon(icon)}
                  className={`w-9 h-9 rounded-lg items-center justify-center ${newIcon === icon ? "bg-primary/15 border border-primary" : "bg-white border border-gray-200"}`}
                >
                  <Text className="text-lg">{icon}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-xs text-gray-400 uppercase font-semibold mb-2">Name</Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="e.g. Main checking account"
              className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 mb-4"
            />

            <Pressable
              onPress={() => setNewExclude((v) => !v)}
              className="flex-row items-center gap-3 mb-4"
            >
              <View className={`w-5 h-5 rounded border-2 items-center justify-center ${newExclude ? "bg-primary border-primary" : "border-gray-300 bg-white"}`}>
                {newExclude && <Text className="text-white text-xs font-bold">✓</Text>}
              </View>
              <Text className="text-sm text-gray-700">Exclude from total balance</Text>
            </Pressable>

            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={handleAdd}
                disabled={!newName.trim() || saving}
                className="flex-1 bg-primary rounded-lg py-2 items-center"
              >
                <Text className="text-white text-sm font-semibold">{saving ? "Saving..." : "Add"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCancel}
                className="flex-1 bg-gray-200 rounded-lg py-2 items-center"
              >
                <Text className="text-gray-700 text-sm font-semibold">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={() => setAdding(true)}
            className="border border-dashed border-gray-300 rounded-xl py-3 items-center hover:bg-gray-50"
          >
            <Text className="text-sm text-gray-400 font-medium">+ Add account</Text>
          </Pressable>
        )}
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
  accounts: <AccountsSection />,
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
