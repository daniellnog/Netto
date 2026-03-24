import { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, Pressable, TextInput, Modal, ScrollView } from "react-native"
import { useProfile } from "../../hooks/useProfile"
import { useAuth } from "../../context/auth"
import { useLocale } from "../../context/locale"
import { LANGUAGES } from "../../locales"
import { supabase } from "../../lib/supabase"

type Section = "account" | "finances" | "categories"

// ─── Account ────────────────────────────────────────────────────────────────

function AccountSection() {
  const { profile, updateAvatar } = useProfile()
  const { session } = useAuth()
  const { t, language, updateLanguage } = useLocale()
  const [uploading, setUploading] = useState(false)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const meta = session?.user?.user_metadata
  const avatarUrl = profile?.avatarUrl ?? meta?.avatar_url ?? meta?.picture ?? null
  const name = profile?.name ?? meta?.full_name ?? meta?.name ?? null
  const email = profile?.email ?? session?.user?.email ?? null

  const initials = name
    ? name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
    : email?.[0]?.toUpperCase() ?? "?"

  function handleAvatarClick() {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      setUploading(true)
      try {
        await updateAvatar(file)
      } finally {
        setUploading(false)
      }
    }
    input.click()
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    try {
      await supabase.rpc("delete_user")
      await supabase.auth.signOut()
    } finally {
      setDeleting(false)
      setDeleteModalVisible(false)
    }
  }

  return (
    <View>
      <Text className="text-lg font-bold text-gray-900 mb-1">{t.settings.account.title}</Text>
      <Text className="text-sm text-gray-500 mb-6">{t.settings.account.subtitle}</Text>

      <View className="flex-row items-center gap-4 mb-6">
        {/* @ts-ignore – onClick/cursor valid on web */}
        <div onClick={handleAvatarClick} style={{ position: "relative", cursor: "pointer", borderRadius: "50%", width: 64, height: 64 }}>
          {avatarUrl ? (
            // @ts-ignore
            <img src={avatarUrl} style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", display: "block" }} referrerPolicy="no-referrer" />
          ) : (
            <View className="w-16 h-16 rounded-full bg-primary items-center justify-center">
              <Text className="text-white text-xl font-bold">{initials}</Text>
            </View>
          )}
          {/* @ts-ignore */}
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", backgroundColor: uploading ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0)", display: "flex", alignItems: "center", justifyContent: "center", transition: "background-color 0.15s" }}
            onMouseEnter={(e: any) => { if (!uploading) e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.35)" }}
            onMouseLeave={(e: any) => { if (!uploading) e.currentTarget.style.backgroundColor = "rgba(0,0,0,0)" }}
          >
            {/* @ts-ignore */}
            <span style={{ color: "white", fontSize: 18, opacity: uploading ? 1 : 0, transition: "opacity 0.15s", userSelect: "none" }}
              onMouseEnter={(e: any) => { (e.currentTarget as any).style.opacity = "1" }}
              onMouseLeave={(e: any) => { if (!uploading) (e.currentTarget as any).style.opacity = "0" }}
            >
              {uploading ? "..." : "✎"}
            </span>
          </div>
        </div>
        <View>
          <Text className="text-base font-semibold text-gray-900">{name ?? "—"}</Text>
          <Text className="text-sm text-gray-500 mt-0.5">{email ?? "—"}</Text>
        </View>
      </View>

      <View className="h-px bg-gray-100 my-6" />

      <Text className="text-base font-semibold text-gray-900 mb-3">{t.settings.account.languageLabel}</Text>
      <View className="flex-row gap-2 flex-wrap mb-6">
        {LANGUAGES.map((lang) => (
          <Pressable
            key={lang.code}
            onPress={() => updateLanguage(lang.code)}
            className={`px-4 py-2 rounded-full border ${language === lang.code ? "bg-primary border-primary" : "bg-gray-50 border-gray-200 hover:bg-gray-100"}`}
          >
            <Text className={`text-sm font-medium ${language === lang.code ? "text-white" : "text-gray-700"}`}>
              {lang.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="h-px bg-gray-100 my-6" />

      <Text className="text-base font-semibold text-gray-900 mb-4">{t.settings.account.dangerZone}</Text>
      <TouchableOpacity
        onPress={() => setDeleteModalVisible(true)}
        className="bg-red-50 border border-red-200 rounded-xl px-4 py-3"
      >
        <Text className="text-sm font-semibold text-red-600">{t.settings.account.deleteAccount}</Text>
        <Text className="text-xs text-red-400 mt-0.5">{t.settings.account.deleteAccountSubtitle}</Text>
      </TouchableOpacity>

      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View className="flex-1 items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <View className="bg-white rounded-2xl p-6 w-80">
            <Text className="text-lg font-bold text-gray-900 mb-2">{t.settings.account.deleteConfirmTitle}</Text>
            <Text className="text-sm text-gray-500 mb-6">{t.settings.account.deleteConfirmBody}</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setDeleteModalVisible(false)}
                className="flex-1 bg-gray-100 rounded-xl py-3 items-center"
              >
                <Text className="text-sm font-semibold text-gray-700">{t.common.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 bg-red-500 rounded-xl py-3 items-center"
              >
                <Text className="text-sm font-semibold text-white">{deleting ? t.common.deleting : t.common.delete}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const selected = CURRENCIES.find((c) => c.code === profile?.currency)
  const filtered = CURRENCIES.filter(
    (c) =>
      c.label.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  )

  function handleSelect(code: string) {
    updateCurrency(code)
    setOpen(false)
    setSearch("")
  }

  return (
    <View>
      <Text className="text-sm font-bold text-gray-700 mb-3">{t.settings.currency.title}</Text>

      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 hover:bg-gray-100"
        style={{ alignSelf: "flex-start", minWidth: 220 }}
      >
        {selected ? (
          <>
            <Text className="text-base font-semibold text-gray-500 w-8">{selected.symbol}</Text>
            <View className="flex-1 ml-2">
              <Text className="text-sm font-medium text-gray-800">{selected.label}</Text>
              <Text className="text-xs text-gray-400">{selected.code}</Text>
            </View>
          </>
        ) : (
          <Text className="text-sm text-gray-400 flex-1">{t.settings.currency.selectPlaceholder}</Text>
        )}
        <Text className="text-gray-400 ml-3 text-xs">▼</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-black/40 items-center justify-center" onPress={() => { setOpen(false); setSearch("") }}>
          <Pressable className="bg-white rounded-2xl overflow-hidden" style={{ width: 440, maxHeight: 480 }} onPress={() => {}}>
            <View className="px-4 pt-4 pb-3 border-b border-gray-100">
              <Text className="text-sm font-bold text-gray-900 mb-3">{t.settings.currency.modalTitle}</Text>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={t.settings.currency.searchPlaceholder}
                autoFocus
                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800"
              />
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {filtered.map((c, i) => {
                const isSelected = profile?.currency === c.code
                return (
                  <Pressable
                    key={c.code}
                    onPress={() => handleSelect(c.code)}
                    className={`flex-row items-center px-4 py-3 ${i > 0 ? "border-t border-gray-100" : ""} ${isSelected ? "bg-primary/10" : "hover:bg-gray-50"}`}
                  >
                    <Text className="text-base font-semibold text-gray-500 w-8">{c.symbol}</Text>
                    <View className="flex-1 ml-2">
                      <Text className={`text-sm font-medium ${isSelected ? "text-primary" : "text-gray-800"}`}>{c.label}</Text>
                      <Text className="text-xs text-gray-400">{c.code}</Text>
                    </View>
                    {isSelected && <Text className="text-primary font-bold">✓</Text>}
                  </Pressable>
                )
              })}
              {filtered.length === 0 && (
                <View className="px-4 py-6 items-center">
                  <Text className="text-sm text-gray-400">{t.settings.currency.notFound}</Text>
                </View>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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
  const { t } = useLocale()
  const [accounts, setAccounts] = useState<AccountRow[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newName, setNewName] = useState("")
  const [newIcon, setNewIcon] = useState("💳")
  const [newExclude, setNewExclude] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.user) return
    supabase
      .from("Account")
      .select("id, name, icon, excludeFromTotal")
      .eq("userId", session.user.id)
      .order("createdAt")
      .then(({ data }) => setAccounts(data ?? []))
  }, [session])

  function handleOpenEdit(account: AccountRow) {
    setEditingId(account.id)
    setNewName(account.name)
    setNewIcon(account.icon)
    setNewExclude(account.excludeFromTotal)
    setModalVisible(true)
  }

  async function handleSave() {
    if (!newName.trim()) { setSaveError(t.common.errorNameRequired); return }
    if (!session?.user) return
    setSaveError(null)
    setSaving(true)
    if (editingId) {
      const { error } = await supabase
        .from("Account")
        .update({ name: newName.trim(), icon: newIcon, excludeFromTotal: newExclude })
        .eq("id", editingId)
      if (error) { setSaveError(error.message); setSaving(false); return }
      setAccounts((prev) => prev.map((a) => a.id === editingId ? { ...a, name: newName.trim(), icon: newIcon, excludeFromTotal: newExclude } : a))
    } else {
      const { data } = await supabase
        .from("Account")
        .insert({ userId: session.user.id, name: newName.trim(), icon: newIcon, excludeFromTotal: newExclude })
        .select("id, name, icon, excludeFromTotal")
        .single()
      if (data) setAccounts((prev) => [...prev, data])
    }
    handleCancel()
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
    setModalVisible(false)
    setEditingId(null)
    setNewName("")
    setNewIcon("💳")
    setNewExclude(false)
    setSaveError(null)
  }

  return (
    <View>
      <Text className="text-sm font-bold text-gray-700 mb-4">{t.settings.accounts.title}</Text>

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
                    {t.settings.accounts.excludeShort}
                  </Text>
                </Pressable>
                <Pressable onPress={() => handleOpenEdit(account)} className="hover:opacity-70 mr-3">
                  <Text className="text-gray-400 text-sm">✎</Text>
                </Pressable>
                <Pressable onPress={() => handleDelete(account.id)} className="hover:opacity-70">
                  <Text className="text-danger text-sm">✕</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <Pressable
          onPress={() => setModalVisible(true)}
          className="border border-dashed border-gray-300 rounded-xl py-3 items-center hover:bg-gray-50"
        >
          <Text className="text-sm text-gray-400 font-medium">{t.settings.accounts.addButton}</Text>
        </Pressable>
      </View>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={handleCancel}>
        <Pressable className="flex-1 bg-black/40 items-center justify-center" onPress={handleCancel}>
          <Pressable className="bg-white rounded-2xl p-6" style={{ width: 440 }} onPress={() => {}}>
            <Text className="text-base font-bold text-gray-900 mb-4">{editingId ? t.settings.accounts.editTitle : t.settings.accounts.addTitle}</Text>

            <Text className="text-xs text-gray-400 uppercase font-semibold mb-2">{t.common.icon}</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {ACCOUNT_ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  onPress={() => setNewIcon(icon)}
                  className={`w-9 h-9 rounded-lg items-center justify-center ${newIcon === icon ? "bg-primary/15 border border-primary" : "bg-gray-50 border border-gray-200"}`}
                >
                  <Text className="text-lg">{icon}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-xs text-gray-400 uppercase font-semibold mb-2">{t.common.name} <Text className="text-danger">*</Text></Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder={t.settings.accounts.namePlaceholder}
              autoFocus
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 mb-4"
            />

            <Pressable onPress={() => setNewExclude((v) => !v)} className="flex-row items-center gap-3 mb-6">
              <View className={`w-5 h-5 rounded border-2 items-center justify-center ${newExclude ? "bg-primary border-primary" : "border-gray-300 bg-white"}`}>
                {newExclude && <Text className="text-white text-xs font-bold">✓</Text>}
              </View>
              <Text className="text-sm text-gray-700">{t.settings.accounts.excludeFromTotal}</Text>
            </Pressable>

            <View className="flex-row gap-2">
              <TouchableOpacity onPress={handleSave} disabled={saving} className="flex-1 bg-primary rounded-lg py-2.5 items-center">
                <Text className="text-white text-sm font-semibold">{saving ? t.common.saving : editingId ? t.common.save : t.common.add}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCancel} className="flex-1 bg-gray-100 rounded-lg py-2.5 items-center">
                <Text className="text-gray-700 text-sm font-semibold">{t.common.cancel}</Text>
              </TouchableOpacity>
            </View>
            {saveError && <Text className="text-danger text-xs mt-3 text-center">{saveError}</Text>}
          </Pressable>
        </Pressable>
      </Modal>
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
          className={`w-8 h-8 rounded-lg items-center justify-center ${value === d ? "bg-primary" : "bg-gray-50 border border-gray-200 hover:bg-gray-100"}`}
        >
          <Text className={`text-xs font-semibold ${value === d ? "text-white" : "text-gray-600"}`}>{d}</Text>
        </Pressable>
      ))}
    </View>
  )
}

function CardIconPicker({ value, onChange }: { value: string; onChange: (icon: string) => void }) {
  const { t } = useLocale()
  const [tab, setTab] = useState<"generic" | "institution">(
    isInstitutionKey(value) ? "institution" : "generic"
  )

  return (
    <View>
      <View className="flex-row gap-1 mb-3">
        {(["generic", "institution"] as const).map((tabKey) => (
          <Pressable
            key={tabKey}
            onPress={() => setTab(tabKey)}
            className={`px-3 py-1 rounded-full ${tab === tabKey ? "bg-primary" : "bg-gray-200 hover:bg-gray-300"}`}
          >
            <Text className={`text-xs font-medium ${tab === tabKey ? "text-white" : "text-gray-600"}`}>
              {tabKey === "generic" ? t.settings.creditCards.iconGeneric : t.settings.creditCards.iconInstitutions}
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
  const { t } = useLocale()
  const [cards, setCards] = useState<CreditCardRow[]>([])
  const [accounts, setAccounts] = useState<{ id: string; name: string; icon: string }[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newName, setNewName] = useState("")
  const [newIcon, setNewIcon] = useState("💳")
  const [newLimit, setNewLimit] = useState("")
  const [newClosingDay, setNewClosingDay] = useState<number | null>(null)
  const [newDueDay, setNewDueDay] = useState<number | null>(null)
  const [newAccountId, setNewAccountId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

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

  function handleOpenEdit(card: CreditCardRow) {
    setEditingId(card.id)
    setNewName(card.name)
    setNewIcon(card.icon)
    setNewLimit(card.creditLimit ? String(card.creditLimit) : "")
    setNewClosingDay(card.closingDay)
    setNewDueDay(card.dueDay)
    setNewAccountId(card.defaultAccountId)
    setModalVisible(true)
  }

  async function handleSave() {
    if (!newName.trim()) { setSaveError(t.common.errorNameRequired); return }
    if (!newClosingDay) { setSaveError(t.settings.creditCards.errorClosingDay); return }
    if (!newDueDay) { setSaveError(t.settings.creditCards.errorDueDay); return }
    if (!session?.user) return
    const limitVal = newLimit.trim() ? parseFloat(newLimit.replace(",", ".")) : null
    if (limitVal !== null && (isNaN(limitVal) || limitVal <= 0)) { setSaveError(t.settings.creditCards.errorCreditLimit); return }
    setSaveError(null)
    setSaving(true)
    if (editingId) {
      const { error } = await supabase
        .from("CreditCard")
        .update({ name: newName.trim(), icon: newIcon, creditLimit: limitVal, closingDay: newClosingDay, dueDay: newDueDay, defaultAccountId: newAccountId })
        .eq("id", editingId)
      if (error) { setSaveError(error.message); setSaving(false); return }
    } else {
      const { error } = await supabase
        .from("CreditCard")
        .insert({ userId: session.user.id, name: newName.trim(), icon: newIcon, creditLimit: limitVal, closingDay: newClosingDay, dueDay: newDueDay, defaultAccountId: newAccountId })
      if (error) { setSaveError(error.message); setSaving(false); return }
    }
    const { data: refreshed } = await supabase
      .from("CreditCard")
      .select("id, name, icon, creditLimit, closingDay, dueDay, defaultAccountId")
      .eq("userId", session.user.id)
      .order("createdAt")
    setCards(refreshed ?? [])
    handleCancel()
    setSaving(false)
  }

  async function handleDelete(id: string) {
    await supabase.from("CreditCard").delete().eq("id", id)
    setCards((prev) => prev.filter((c) => c.id !== id))
  }

  function handleCancel() {
    setModalVisible(false)
    setEditingId(null)
    setNewName("")
    setNewIcon("💳")
    setNewLimit("")
    setNewClosingDay(null)
    setNewDueDay(null)
    setNewAccountId(null)
    setSaveError(null)
  }

  return (
    <View>
      <Text className="text-sm font-bold text-gray-700 mb-4">{t.settings.creditCards.title}</Text>

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
                      {t.settings.creditCards.closingInfo(card.closingDay, card.dueDay)}
                      {account ? ` · ${account.icon} ${account.name}` : ""}
                    </Text>
                  </View>
                  <Text className="text-sm font-semibold text-gray-500 mr-3">
                    {Number(card.creditLimit).toLocaleString()}
                  </Text>
                  <Pressable onPress={() => handleOpenEdit(card)} className="hover:opacity-70 mr-3">
                    <Text className="text-gray-400 text-sm">✎</Text>
                  </Pressable>
                  <Pressable onPress={() => handleDelete(card.id)} className="hover:opacity-70">
                    <Text className="text-danger text-sm">✕</Text>
                  </Pressable>
                </View>
              )
            })}
          </View>
        )}

        <Pressable
          onPress={() => setModalVisible(true)}
          className="border border-dashed border-gray-300 rounded-xl py-3 items-center hover:bg-gray-50"
        >
          <Text className="text-sm text-gray-400 font-medium">{t.settings.creditCards.addButton}</Text>
        </Pressable>
      </View>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={handleCancel}>
        <Pressable className="flex-1 bg-black/40 items-center justify-center" onPress={handleCancel}>
          <Pressable className="bg-white rounded-2xl max-h-[90%]" style={{ width: 540 }} onPress={() => {}}>
            <ScrollView contentContainerStyle={{ padding: 28 }} showsVerticalScrollIndicator={false}>
              <Text className="text-base font-bold text-gray-900 mb-5">{editingId ? t.settings.creditCards.editTitle : t.settings.creditCards.addTitle}</Text>

              {/* Icon + Name row */}
              <View className="flex-row gap-4 mb-5">
                <View className="flex-1">
                  <Text className="text-xs text-gray-400 uppercase font-semibold mb-2">{t.common.icon}</Text>
                  <CardIconPicker value={newIcon} onChange={setNewIcon} />
                </View>
              </View>

              {/* Name + Limit row */}
              <View className="flex-row gap-4 mb-5">
                <View className="flex-1">
                  <Text className="text-xs text-gray-400 uppercase font-semibold mb-2">{t.common.name} <Text className="text-danger">*</Text></Text>
                  <TextInput
                    value={newName}
                    onChangeText={setNewName}
                    placeholder={t.settings.creditCards.namePlaceholder}
                    autoFocus
                    className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800"
                  />
                </View>
                <View style={{ width: 140 }}>
                  <Text className="text-xs text-gray-400 uppercase font-semibold mb-2">{t.settings.creditCards.creditLimit}</Text>
                  <TextInput
                    value={newLimit}
                    onChangeText={setNewLimit}
                    placeholder="5000"
                    keyboardType="decimal-pad"
                    className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800"
                  />
                </View>
              </View>

              {/* Closing day + Due day side by side */}
              <View className="flex-row gap-4 mb-5">
                <View className="flex-1">
                  <Text className="text-xs text-gray-400 uppercase font-semibold mb-2">
                    {t.settings.creditCards.closingDay} <Text className="text-danger">*</Text>{newClosingDay ? <Text className="text-primary normal-case font-bold"> · {newClosingDay}</Text> : null}
                  </Text>
                  <DayPicker value={newClosingDay} onChange={setNewClosingDay} />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-400 uppercase font-semibold mb-2">
                    {t.settings.creditCards.dueDay} <Text className="text-danger">*</Text>{newDueDay ? <Text className="text-primary normal-case font-bold"> · {newDueDay}</Text> : null}
                  </Text>
                  <DayPicker value={newDueDay} onChange={setNewDueDay} />
                </View>
              </View>

              {/* Default account */}
              <Text className="text-xs text-gray-400 uppercase font-semibold mb-2">{t.settings.creditCards.defaultAccount}</Text>
              {accounts.length === 0 ? (
                <Text className="text-xs text-gray-400 mb-5">{t.settings.creditCards.noAccounts}</Text>
              ) : (
                <View className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden mb-6">
                  <Pressable
                    onPress={() => setNewAccountId(null)}
                    className={`px-3 py-2 ${!newAccountId ? "bg-primary/10" : "hover:bg-gray-50"}`}
                  >
                    <Text className={`text-sm ${!newAccountId ? "text-primary font-medium" : "text-gray-400"}`}>
                      {t.common.none}
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

              {/* Buttons */}
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={saving}
                  className="flex-1 bg-primary rounded-lg py-2.5 items-center"
                >
                  <Text className="text-white text-sm font-semibold">{saving ? t.common.saving : editingId ? t.common.save : t.common.add}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCancel} className="flex-1 bg-gray-100 rounded-lg py-2.5 items-center">
                  <Text className="text-gray-700 text-sm font-semibold">{t.common.cancel}</Text>
                </TouchableOpacity>
              </View>
              {saveError && (
                <Text className="text-danger text-xs mt-3 text-center">{saveError}</Text>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

// ─── Categories ──────────────────────────────────────────────────────────────

const CATEGORY_ICONS = ["🛒", "🍔", "🍕", "☕", "🚗", "✈️", "🏥", "📚", "🎮", "👗", "💊", "🔧", "🏠", "💡", "📱", "🎬", "🎵", "🐾", "🏋️", "💰", "💵", "📈", "💼", "🎁", "⭐", "🎯", "🏦", "💎", "🌍", "📂"]

const CATEGORY_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#06b6d4", "#64748b", "#1f2937",
]

type CategoryRow = { id: string; name: string; icon: string; color: string; type: string }

function CategoriesSection() {
  const { session } = useAuth()
  const { t } = useLocale()
  const [tab, setTab] = useState<"expense" | "income">("expense")
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newName, setNewName] = useState("")
  const [newIcon, setNewIcon] = useState("📂")
  const [newColor, setNewColor] = useState(CATEGORY_COLORS[0])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.user) return
    supabase
      .from("Category")
      .select("id, name, icon, color, type")
      .eq("userId", session.user.id)
      .order("createdAt")
      .then(({ data }) => setCategories(data ?? []))
  }, [session])

  const filtered = categories.filter((c) => c.type === tab)

  function handleOpenEdit(cat: CategoryRow) {
    setEditingId(cat.id)
    setNewName(cat.name)
    setNewIcon(cat.icon)
    setNewColor(cat.color)
    setModalVisible(true)
  }

  async function handleSave() {
    if (!newName.trim()) { setSaveError(t.common.errorNameRequired); return }
    if (!session?.user) return
    setSaveError(null)
    setSaving(true)
    if (editingId) {
      const { error } = await supabase
        .from("Category")
        .update({ name: newName.trim(), icon: newIcon, color: newColor })
        .eq("id", editingId)
      if (error) { setSaveError(error.message); setSaving(false); return }
    } else {
      const { error } = await supabase
        .from("Category")
        .insert({ userId: session.user.id, name: newName.trim(), icon: newIcon, color: newColor, type: tab })
      if (error) { setSaveError(error.message); setSaving(false); return }
    }
    const { data: refreshed } = await supabase
      .from("Category")
      .select("id, name, icon, color, type")
      .eq("userId", session.user.id)
      .order("createdAt")
    setCategories(refreshed ?? [])
    handleCancel()
    setSaving(false)
  }

  async function handleDelete(id: string) {
    await supabase.from("Category").delete().eq("id", id)
    setCategories((prev) => prev.filter((c) => c.id !== id))
  }

  function handleCancel() {
    setModalVisible(false)
    setEditingId(null)
    setNewName("")
    setNewIcon("📂")
    setNewColor(CATEGORY_COLORS[0])
    setSaveError(null)
  }

  return (
    <View>
      <Text className="text-lg font-bold text-gray-900 mb-1">{t.settings.categories.title}</Text>
      <Text className="text-sm text-gray-500 mb-6">{t.settings.categories.subtitle}</Text>

      {/* Tabs */}
      <View className="flex-row gap-2 mb-4">
        {(["expense", "income"] as const).map((tabKey) => (
          <Pressable
            key={tabKey}
            onPress={() => setTab(tabKey)}
            className={`px-4 py-1.5 rounded-full ${tab === tabKey ? "bg-primary" : "bg-gray-100 hover:bg-gray-200"}`}
          >
            <Text className={`text-sm font-medium ${tab === tabKey ? "text-white" : "text-gray-600"}`}>
              {tabKey === "expense" ? t.settings.categories.expense : t.settings.categories.income}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="w-[50%]">
        {filtered.length > 0 && (
          <View className="bg-gray-50 rounded-xl overflow-hidden mb-3">
            {filtered.map((cat, i) => (
              <View key={cat.id} className={`flex-row items-center px-4 py-3 ${i > 0 ? "border-t border-gray-100" : ""}`}>
                <View className="w-7 h-7 rounded-lg items-center justify-center mr-3" style={{ backgroundColor: cat.color + "22" }}>
                  <Text className="text-base">{cat.icon}</Text>
                </View>
                <View className="w-2 h-2 rounded-full mr-3" style={{ backgroundColor: cat.color }} />
                <Text className="flex-1 text-sm font-medium text-gray-800">{cat.name}</Text>
                <Pressable onPress={() => handleOpenEdit(cat)} className="hover:opacity-70 mr-3">
                  <Text className="text-gray-400 text-sm">✎</Text>
                </Pressable>
                <Pressable onPress={() => handleDelete(cat.id)} className="hover:opacity-70">
                  <Text className="text-danger text-sm">✕</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <Pressable
          onPress={() => setModalVisible(true)}
          className="border border-dashed border-gray-300 rounded-xl py-3 items-center hover:bg-gray-50"
        >
          <Text className="text-sm text-gray-400 font-medium">{t.settings.categories.addButton}</Text>
        </Pressable>
      </View>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={handleCancel}>
        <Pressable className="flex-1 bg-black/40 items-center justify-center" onPress={handleCancel}>
          <Pressable className="bg-white rounded-2xl p-6" style={{ width: 440 }} onPress={() => {}}>
            <Text className="text-base font-bold text-gray-900 mb-5">
              {t.settings.categories.modalTitle(editingId ? "edit" : "add", tab)}
            </Text>

            {/* Icon */}
            <Text className="text-xs text-gray-400 uppercase font-semibold mb-2">{t.common.icon}</Text>
            <View className="flex-row flex-wrap gap-2 mb-5">
              {CATEGORY_ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  onPress={() => setNewIcon(icon)}
                  className={`w-9 h-9 rounded-lg items-center justify-center ${newIcon === icon ? "bg-primary/15 border border-primary" : "bg-gray-50 border border-gray-200"}`}
                >
                  <Text className="text-lg">{icon}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Color */}
            <Text className="text-xs text-gray-400 uppercase font-semibold mb-2">{t.common.color}</Text>
            <View className="flex-row flex-wrap gap-2 mb-5">
              {CATEGORY_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  onPress={() => setNewColor(color)}
                  style={{ backgroundColor: color }}
                  className={`w-7 h-7 rounded-full items-center justify-center ${newColor === color ? "border-2 border-gray-800" : ""}`}
                >
                  {newColor === color && <Text className="text-white text-xs font-bold">✓</Text>}
                </TouchableOpacity>
              ))}
            </View>

            {/* Name */}
            <Text className="text-xs text-gray-400 uppercase font-semibold mb-2">{t.common.name} <Text className="text-danger">*</Text></Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder={t.settings.categories.namePlaceholder}
              autoFocus
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 mb-5"
            />

            <View className="flex-row gap-2">
              <TouchableOpacity onPress={handleSave} disabled={saving} className="flex-1 bg-primary rounded-lg py-2.5 items-center">
                <Text className="text-white text-sm font-semibold">{saving ? t.common.saving : editingId ? t.common.save : t.common.add}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCancel} className="flex-1 bg-gray-100 rounded-lg py-2.5 items-center">
                <Text className="text-gray-700 text-sm font-semibold">{t.common.cancel}</Text>
              </TouchableOpacity>
            </View>
            {saveError && <Text className="text-danger text-xs mt-3 text-center">{saveError}</Text>}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

// ─── Layout ──────────────────────────────────────────────────────────────────

function FinancesSection() {
  const { t } = useLocale()
  return (
    <View>
      <Text className="text-lg font-bold text-gray-900 mb-1">{t.settings.sections.finances.label}</Text>
      <Text className="text-sm text-gray-500 mb-6">{t.settings.sections.finances.description}</Text>
      <CurrencySection />
      <View className="h-px bg-gray-100 my-6" />
      <AccountsSection />
      <View className="h-px bg-gray-100 my-6" />
      <CreditCardsSection />
    </View>
  )
}

export default function SettingsScreen() {
  const { t } = useLocale()
  const [active, setActive] = useState<Section>("account")

  const SECTIONS: { id: Section; label: string; description: string }[] = [
    { id: "account", ...t.settings.sections.account },
    { id: "finances", ...t.settings.sections.finances },
    { id: "categories", ...t.settings.sections.categories },
  ]

  const SECTION_CONTENT: Record<Section, React.ReactNode> = {
    account: <AccountSection />,
    finances: <FinancesSection />,
    categories: <CategoriesSection />,
  }

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
