import { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, Pressable, TextInput } from "react-native"
import { useProfile } from "../../hooks/useProfile"
import { useAuth } from "../../context/auth"
import { supabase } from "../../lib/supabase"

type Section = "profile" | "currency" | "accounts" | "cards" | "categories" | "account"

const SECTIONS: { id: Section; label: string; description: string }[] = [
  { id: "profile", label: "Profile", description: "Your personal information" },
  { id: "currency", label: "Currency", description: "Default currency" },
  { id: "accounts", label: "Accounts", description: "Bank accounts & wallets" },
  { id: "cards", label: "Credit Cards", description: "Manage your cards" },
  { id: "categories", label: "Categories", description: "Manage categories" },
  { id: "account", label: "Account", description: "Account actions" },
]

// ─── Profile ────────────────────────────────────────────────────────────────

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

// ─── Currency ───────────────────────────────────────────────────────────────

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
              {isSelected && <Text className="text-primary font-bold text-base">✓</Text>}
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

// ─── Accounts ───────────────────────────────────────────────────────────────

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
      setNewExclude(false)
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

            <Pressable onPress={() => setNewExclude((v) => !v)} className="flex-row items-center gap-3 mb-4">
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
              <TouchableOpacity onPress={handleCancel} className="flex-1 bg-gray-200 rounded-lg py-2 items-center">
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

// ─── Credit Cards ────────────────────────────────────────────────────────────

const CARD_GENERIC_ICONS = ["💳", "🌐", "💎", "⭐", "🪙", "💵", "🎯", "💼"]

const CARD_INSTITUTIONS = [
  // International
  { key: "VISA", label: "Visa", bg: "#1A1F71", color: "#FFFFFF" },
  { key: "MC", label: "Mastercard", bg: "#EB001B", color: "#FFFFFF" },
  { key: "AMEX", label: "Amex", bg: "#2E77BC", color: "#FFFFFF" },
  { key: "PAYPAL", label: "PayPal", bg: "#003087", color: "#FFFFFF" },
  // Brazil
  { key: "ELO", label: "Elo", bg: "#FFD100", color: "#000000" },
  { key: "HIPER", label: "Hiper", bg: "#E3000F", color: "#FFFFFF" },
  { key: "NUBANK", label: "Nu", bg: "#8A05BE", color: "#FFFFFF" },
  { key: "ITAU", label: "Itaú", bg: "#EC7000", color: "#FFFFFF" },
  { key: "BRADESCO", label: "Bradesco", bg: "#CC092F", color: "#FFFFFF" },
  { key: "CEF", label: "Caixa", bg: "#0070AF", color: "#FFFFFF" },
  { key: "BB", label: "BB", bg: "#F8C200", color: "#003882" },
  { key: "SANTANDER", label: "Santander", bg: "#EC0000", color: "#FFFFFF" },
  { key: "BTG", label: "BTG", bg: "#1B1B1B", color: "#FFFFFF" },
  { key: "INTER", label: "Inter", bg: "#FF6600", color: "#FFFFFF" },
  { key: "C6", label: "C6", bg: "#2C2C2C", color: "#FFFFFF" },
  // Portugal
  { key: "CGD", label: "CGD", bg: "#006B3F", color: "#FFFFFF" },
  { key: "BPI", label: "BPI", bg: "#003DA5", color: "#FFFFFF" },
  { key: "BCP", label: "BCP", bg: "#C8102E", color: "#FFFFFF" },
  { key: "NB", label: "Novo Banco", bg: "#E30613", color: "#FFFFFF" },
  { key: "MONTEPIO", label: "Montepio", bg: "#004B87", color: "#FFFFFF" },
  { key: "ACTIVO", label: "Activo", bg: "#00A8A8", color: "#FFFFFF" },
]

function isInstitutionKey(icon: string) {
  return CARD_INSTITUTIONS.some((i) => i.key === icon)
}

function CardIconBadge({ icon }: { icon: string }) {
  const inst = CARD_INSTITUTIONS.find((i) => i.key === icon)
  if (inst) {
    return (
      <View className="rounded px-1.5 py-0.5 items-center justify-center" style={{ backgroundColor: inst.bg }}>
        <Text className="font-bold" style={{ color: inst.color, fontSize: 10 }} numberOfLines={1}>
          {inst.label}
        </Text>
      </View>
    )
  }
  return <Text className="text-xl">{icon}</Text>
}

function DayPicker({ value, onChange }: { value: number | null; onChange: (d: number) => void }) {
  const days = Array.from({ length: 31 }, (_, i) => i + 1)
  return (
    <View className="flex-row flex-wrap gap-1">
      {days.map((d) => (
        <Pressable
          key={d}
          onPress={() => onChange(d)}
          className={`w-7 h-7 rounded items-center justify-center ${value === d ? "bg-primary" : "bg-white border border-gray-200 hover:bg-gray-100"}`}
        >
          <Text className={`text-xs font-medium ${value === d ? "text-white" : "text-gray-700"}`}>{d}</Text>
        </Pressable>
      ))}
    </View>
  )
}

function CardIconPicker({ value, onChange }: { value: string; onChange: (icon: string) => void }) {
  const [tab, setTab] = useState<"generic" | "institution">(
    isInstitutionKey(value) ? "institution" : "generic"
  )

  return (
    <View>
      <View className="flex-row gap-1 mb-3">
        {(["generic", "institution"] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            className={`px-3 py-1 rounded-full ${tab === t ? "bg-primary" : "bg-gray-200 hover:bg-gray-300"}`}
          >
            <Text className={`text-xs font-medium ${tab === t ? "text-white" : "text-gray-600"}`}>
              {t === "generic" ? "Generic" : "Institutions"}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === "generic" ? (
        <View className="flex-row flex-wrap gap-2">
          {CARD_GENERIC_ICONS.map((icon) => (
            <TouchableOpacity
              key={icon}
              onPress={() => onChange(icon)}
              className={`w-9 h-9 rounded-lg items-center justify-center ${value === icon ? "bg-primary/15 border border-primary" : "bg-white border border-gray-200"}`}
            >
              <Text className="text-lg">{icon}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View className="flex-row flex-wrap gap-2">
          {CARD_INSTITUTIONS.map((inst) => (
            <TouchableOpacity
              key={inst.key}
              onPress={() => onChange(inst.key)}
              className={`rounded-lg px-2 py-1.5 items-center justify-center min-w-14 border-2 ${value === inst.key ? "border-primary" : "border-transparent"}`}
              style={{ backgroundColor: inst.bg }}
            >
              <Text className="font-bold text-xs" style={{ color: inst.color }}>
                {inst.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  )
}

type CreditCardRow = {
  id: string
  name: string
  icon: string
  creditLimit: number
  closingDay: number
  dueDay: number
  defaultAccountId: string | null
}

function CreditCardsSection() {
  const { session } = useAuth()
  const [cards, setCards] = useState<CreditCardRow[]>([])
  const [accounts, setAccounts] = useState<{ id: string; name: string; icon: string }[]>([])
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState("")
  const [newIcon, setNewIcon] = useState("💳")
  const [newLimit, setNewLimit] = useState("")
  const [newClosingDay, setNewClosingDay] = useState<number | null>(null)
  const [newDueDay, setNewDueDay] = useState<number | null>(null)
  const [newAccountId, setNewAccountId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!session?.user) return
    supabase
      .from("CreditCard")
      .select("id, name, icon, creditLimit, closingDay, dueDay, defaultAccountId")
      .eq("userId", session.user.id)
      .order("createdAt")
      .then(({ data }) => setCards(data ?? []))

    supabase
      .from("Account")
      .select("id, name, icon")
      .eq("userId", session.user.id)
      .order("createdAt")
      .then(({ data }) => setAccounts(data ?? []))
  }, [session])

  async function handleAdd() {
    if (!newName.trim() || !newClosingDay || !newDueDay || !session?.user) return
    const limitVal = parseFloat(newLimit.replace(",", "."))
    if (isNaN(limitVal) || limitVal <= 0) return
    setSaving(true)
    const { data } = await supabase
      .from("CreditCard")
      .insert({
        userId: session.user.id,
        name: newName.trim(),
        icon: newIcon,
        creditLimit: limitVal,
        closingDay: newClosingDay,
        dueDay: newDueDay,
        defaultAccountId: newAccountId,
      })
      .select("id, name, icon, creditLimit, closingDay, dueDay, defaultAccountId")
      .single()
    if (data) {
      setCards((prev) => [...prev, data])
      handleCancel()
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    await supabase.from("CreditCard").delete().eq("id", id)
    setCards((prev) => prev.filter((c) => c.id !== id))
  }

  function handleCancel() {
    setAdding(false)
    setNewName("")
    setNewIcon("💳")
    setNewLimit("")
    setNewClosingDay(null)
    setNewDueDay(null)
    setNewAccountId(null)
  }

  return (
    <View>
      <Text className="text-lg font-bold text-gray-900 mb-1">Credit Cards</Text>
      <Text className="text-sm text-gray-500 mb-6">Manage your credit cards</Text>

      <View className="w-[50%]">
        {cards.length > 0 && (
          <View className="bg-gray-50 rounded-xl overflow-hidden mb-3">
            {cards.map((card, i) => {
              const account = accounts.find((a) => a.id === card.defaultAccountId)
              return (
                <View
                  key={card.id}
                  className={`flex-row items-center px-4 py-3 ${i > 0 ? "border-t border-gray-100" : ""}`}
                >
                  <View className="mr-3">
                    <CardIconBadge icon={card.icon} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-800">{card.name}</Text>
                    <Text className="text-xs text-gray-400 mt-0.5">
                      Closes {card.closingDay} · Due {card.dueDay}
                      {account ? ` · ${account.icon} ${account.name}` : ""}
                    </Text>
                  </View>
                  <Text className="text-sm font-semibold text-gray-500 mr-3">
                    {Number(card.creditLimit).toLocaleString()}
                  </Text>
                  <Pressable onPress={() => handleDelete(card.id)} className="hover:opacity-70">
                    <Text className="text-danger text-sm">✕</Text>
                  </Pressable>
                </View>
              )
            })}
          </View>
        )}

        {adding ? (
          <View className="bg-gray-50 rounded-xl p-4 gap-4">
            {/* Icon */}
            <View>
              <Text className="text-xs text-gray-400 uppercase font-semibold mb-2">Icon</Text>
              <CardIconPicker value={newIcon} onChange={setNewIcon} />
            </View>

            {/* Name */}
            <View>
              <Text className="text-xs text-gray-400 uppercase font-semibold mb-2">Name</Text>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="e.g. Nubank Gold"
                className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800"
              />
            </View>

            {/* Credit limit */}
            <View>
              <Text className="text-xs text-gray-400 uppercase font-semibold mb-2">Credit limit</Text>
              <TextInput
                value={newLimit}
                onChangeText={setNewLimit}
                placeholder="5000"
                keyboardType="decimal-pad"
                className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800"
              />
            </View>

            {/* Closing day */}
            <View>
              <Text className="text-xs text-gray-400 uppercase font-semibold mb-2">Closing day</Text>
              <DayPicker value={newClosingDay} onChange={setNewClosingDay} />
            </View>

            {/* Due day */}
            <View>
              <Text className="text-xs text-gray-400 uppercase font-semibold mb-2">Due day</Text>
              <DayPicker value={newDueDay} onChange={setNewDueDay} />
            </View>

            {/* Default account */}
            <View>
              <Text className="text-xs text-gray-400 uppercase font-semibold mb-2">Default payment account</Text>
              {accounts.length === 0 ? (
                <Text className="text-xs text-gray-400">No accounts yet. Add one in Accounts.</Text>
              ) : (
                <View className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <Pressable
                    onPress={() => setNewAccountId(null)}
                    className={`px-3 py-2 ${!newAccountId ? "bg-primary/10" : "hover:bg-gray-50"}`}
                  >
                    <Text className={`text-sm ${!newAccountId ? "text-primary font-medium" : "text-gray-400"}`}>
                      None
                    </Text>
                  </Pressable>
                  {accounts.map((acc) => (
                    <Pressable
                      key={acc.id}
                      onPress={() => setNewAccountId(acc.id)}
                      className={`flex-row items-center px-3 py-2 border-t border-gray-100 ${newAccountId === acc.id ? "bg-primary/10" : "hover:bg-gray-50"}`}
                    >
                      <Text className="text-base mr-2">{acc.icon}</Text>
                      <Text className={`flex-1 text-sm ${newAccountId === acc.id ? "text-primary font-medium" : "text-gray-700"}`}>
                        {acc.name}
                      </Text>
                      {newAccountId === acc.id && <Text className="text-primary font-bold">✓</Text>}
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Buttons */}
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={handleAdd}
                disabled={!newName.trim() || !newClosingDay || !newDueDay || saving}
                className="flex-1 bg-primary rounded-lg py-2 items-center"
              >
                <Text className="text-white text-sm font-semibold">{saving ? "Saving..." : "Add"}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCancel} className="flex-1 bg-gray-200 rounded-lg py-2 items-center">
                <Text className="text-gray-700 text-sm font-semibold">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={() => setAdding(true)}
            className="border border-dashed border-gray-300 rounded-xl py-3 items-center hover:bg-gray-50"
          >
            <Text className="text-sm text-gray-400 font-medium">+ Add card</Text>
          </Pressable>
        )}
      </View>
    </View>
  )
}

// ─── Categories ──────────────────────────────────────────────────────────────

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

// ─── Account ─────────────────────────────────────────────────────────────────

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

// ─── Layout ──────────────────────────────────────────────────────────────────

const SECTION_CONTENT: Record<Section, React.ReactNode> = {
  profile: <ProfileSection />,
  currency: <CurrencySection />,
  accounts: <AccountsSection />,
  cards: <CreditCardsSection />,
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
