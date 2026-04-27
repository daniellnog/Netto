import { useEffect, useMemo, useRef, useState } from "react"
import {
  Animated,
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SectionList,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native"
import {
  ArrowLeftRight,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  Minus,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react-native"
import { AppIcon } from "../../lib/icons"
import { useAuth } from "../../context/auth"
import { useProfile } from "../../hooks/useProfile"
import { useLocale } from "../../context/locale"
import { supabase } from "../../lib/supabase"

// ─── Types ───────────────────────────────────────────────────────────────────

type TxRow = {
  id: string
  type: "income" | "expense"
  amount: number
  description: string
  category: string
  date: string
  accountId: string | null
  status: "confirmed" | "pending"
}

type AccountRow = {
  id: string
  name: string
  icon: string
  balance: number
}

type CategoryRow = {
  id: string
  name: string
  icon: string
  color: string
  type: string
}

type FormState = {
  description: string
  amount: string
  date: string
  accountId: string
  accountName: string
  status: "confirmed" | "pending"
  category: string
  notes: string
  recurring: boolean
  recurrence: "weekly" | "monthly" | "yearly"
  dueDay: string
  showNotes: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

function fmtDateDisplay(iso: string) {
  const [y, m, d] = iso.substring(0, 10).split("-")
  return `${d}/${m}/${y.slice(2)}`
}

function formatDateForInput(date: Date): string {
  const d = date.getDate().toString().padStart(2, "0")
  const m = (date.getMonth() + 1).toString().padStart(2, "0")
  return `${d}/${m}/${date.getFullYear()}`
}

function isoToDateInput(iso: string): string {
  const d = new Date(iso)
  const day = d.getDate().toString().padStart(2, "0")
  const m = (d.getMonth() + 1).toString().padStart(2, "0")
  return `${day}/${m}/${d.getFullYear()}`
}

function parseDateInput(str: string): Date | null {
  const parts = str.split("/")
  if (parts.length !== 3) return null
  const [d, m, y] = parts.map(Number)
  if (!d || !m || !y || d < 1 || d > 31 || m < 1 || m > 12) return null
  const year = y < 100 ? 2000 + y : y
  const date = new Date(year, m - 1, d)
  return isNaN(date.getTime()) ? null : date
}

function parseAmount(str: string): number | null {
  const normalized = str.replace(",", ".").replace(/[^\d.]/g, "")
  const val = parseFloat(normalized)
  return isNaN(val) || val <= 0 ? null : val
}

function getMonthRange(date: Date) {
  const from = new Date(date.getFullYear(), date.getMonth(), 1).toISOString()
  const to = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString()
  return { from, to }
}

function groupByDay(txs: TxRow[]) {
  const map = new Map<string, TxRow[]>()
  for (const tx of txs) {
    const day = tx.date.substring(0, 10)
    if (!map.has(day)) map.set(day, [])
    map.get(day)!.push(tx)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([day, data]) => ({
      title: fmtDateDisplay(day + "T00:00:00"),
      data,
      totalIncome: data.filter((tx) => tx.type === "income" && tx.status === "confirmed").reduce((s, tx) => s + tx.amount, 0),
      totalExpense: data.filter((tx) => tx.type === "expense" && tx.status === "confirmed").reduce((s, tx) => s + tx.amount, 0),
    }))
}

function generateBillPayments(
  billId: string, userId: string, startDate: Date, amount: number,
  recurrence: "weekly" | "monthly" | "yearly", dueDay?: number
) {
  return Array.from({ length: 11 }, (_, i) => {
    const d = new Date(startDate)
    if (recurrence === "monthly") {
      d.setMonth(d.getMonth() + i + 1)
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
      if (dueDay) d.setDate(Math.min(dueDay, lastDay))
    } else if (recurrence === "weekly") {
      d.setDate(d.getDate() + 7 * (i + 1))
    } else {
      d.setFullYear(d.getFullYear() + i + 1)
    }
    return { billId, userId, amount, dueDate: d.toISOString(), status: "pending" }
  })
}

function defaultForm(date?: Date): FormState {
  const d = date ?? new Date()
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const isFuture = d > today
  return {
    description: "",
    amount: "",
    date: formatDateForInput(d),
    accountId: "",
    accountName: "",
    category: "",
    notes: "",
    recurring: false,
    recurrence: "monthly",
    dueDay: d.getDate().toString(),
    showNotes: false,
    status: isFuture ? "pending" : "confirmed",
  }
}

// ─── Picker Modal ─────────────────────────────────────────────────────────────

function PickerModal({
  visible, title, items, onSelect, onClose, searchPlaceholder,
}: {
  visible: boolean
  title: string
  items: { id: string; name: string; icon?: string; color?: string }[]
  onSelect: (id: string, name: string) => void
  onClose: () => void
  searchPlaceholder: string
}) {
  const [search, setSearch] = useState("")
  const { width } = useWindowDimensions()
  const isDesktop = width >= 768
  const filtered = items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <Modal visible={visible} transparent={isDesktop} animationType={isDesktop ? "fade" : "slide"} onRequestClose={onClose}>
      {isDesktop ? (
        <TouchableOpacity
          className="flex-1 justify-center items-center"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          activeOpacity={1}
          onPress={() => { setSearch(""); onClose() }}
        >
          <TouchableOpacity activeOpacity={1} style={{ width: "100%", maxWidth: 420 }}>
            <View className="bg-white rounded-2xl overflow-hidden" style={{ maxHeight: 520 }}>
              <View className="flex-row items-center px-4 py-4 border-b border-gray-100">
                <Text className="flex-1 text-base font-semibold text-gray-900">{title}</Text>
                <TouchableOpacity onPress={() => { setSearch(""); onClose() }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              <View className="px-4 py-2 border-b border-gray-100">
                <TextInput
                  className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-800"
                  placeholder={searchPlaceholder}
                  value={search}
                  onChangeText={setSearch}
                  autoFocus
                />
              </View>
              <FlatList
                data={filtered}
                keyExtractor={(i) => i.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    className="flex-row items-center px-4 py-3.5 border-b border-gray-50"
                    onPress={() => { onSelect(item.id, item.name); setSearch(""); onClose() }}
                    activeOpacity={0.7}
                  >
                    {item.icon ? (
                      <View
                        className="w-9 h-9 rounded-full items-center justify-center mr-3"
                        style={{ backgroundColor: item.color ?? "#E5E7EB" }}
                      >
                        <AppIcon name={item.icon} size={16} color={item.color ? "white" : "#6B7280"} />
                      </View>
                    ) : null}
                    <Text className="text-sm font-medium text-gray-800">{item.name}</Text>
                  </TouchableOpacity>
                )}
                keyboardShouldPersistTaps="handled"
              />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      ) : (
        <View className="flex-1 bg-white">
          <View className="flex-row items-center px-4 py-4 border-b border-gray-100">
            <Text className="flex-1 text-base font-semibold text-gray-900">{title}</Text>
            <TouchableOpacity onPress={() => { setSearch(""); onClose() }}>
              <Text className="text-primary font-semibold">Fechar</Text>
            </TouchableOpacity>
          </View>
          <View className="px-4 py-2 border-b border-gray-100">
            <TextInput
              className="bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-800"
              placeholder={searchPlaceholder}
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="flex-row items-center px-4 py-3.5 border-b border-gray-50"
                onPress={() => { onSelect(item.id, item.name); setSearch(""); onClose() }}
                activeOpacity={0.7}
              >
                {item.icon ? (
                  <View
                    className="w-9 h-9 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: item.color ?? "#E5E7EB" }}
                  >
                    <Text style={{ fontSize: 16 }}>{item.icon}</Text>
                  </View>
                ) : null}
                <Text className="text-sm font-medium text-gray-800">{item.name}</Text>
              </TouchableOpacity>
            )}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}
    </Modal>
  )
}

// ─── Transaction Form Modal ───────────────────────────────────────────────────

function TransactionFormModal({
  visible, type, accounts, categories, currency, userId, onClose, onSaved, t, editTx,
}: {
  visible: boolean
  type: "expense" | "income"
  accounts: AccountRow[]
  categories: CategoryRow[]
  currency: string
  userId: string
  onClose: () => void
  onSaved: () => void
  t: ReturnType<typeof useLocale>["t"]["transactions"]
  editTx?: TxRow
}) {
  const [form, setForm] = useState<FormState>(defaultForm)
  const [saving, setSaving] = useState(false)
  const [showAccountPicker, setShowAccountPicker] = useState(false)
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)
  const { width } = useWindowDimensions()
  const isDesktop = width >= 768

  useEffect(() => {
    if (visible && editTx) {
      const acc = accounts.find((a) => a.id === editTx.accountId)
      setForm({
        description: editTx.description,
        amount: String(editTx.amount),
        date: isoToDateInput(editTx.date),
        accountId: editTx.accountId ?? "",
        accountName: acc?.name ?? "",
        category: editTx.category,
        notes: "",
        recurring: false,
        recurrence: "monthly",
        dueDay: "",
        showNotes: false,
        status: editTx.status,
      })
    } else if (visible && !editTx) {
      setForm(defaultForm())
    }
  }, [visible, editTx])

  const filteredCategories = categories
    .filter((c) => c.type === type)
    .map((c) => ({ id: c.id, name: c.name, icon: c.icon, color: c.color }))

  function patch(key: keyof FormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    const amount = parseAmount(form.amount)
    const date = parseDateInput(form.date)
    if (!form.description.trim() || !amount || !date || !form.accountId || !form.category) {
      Alert.alert(t.validationError, t.validationErrorMsg)
      return
    }
    setSaving(true)
    try {
      if (editTx) {
        // ── Edit mode ──
        const { error: txError } = await supabase
          .from("Transaction")
          .update({
            type,
            amount,
            description: form.description.trim(),
            category: form.category,
            accountId: form.accountId,
            date: date.toISOString(),
            status: form.status,
          })
          .eq("id", editTx.id)
        if (txError) throw new Error(txError.message)

        const wasConfirmed = editTx.status === "confirmed"
        const nowConfirmed = form.status === "confirmed"

        if (wasConfirmed && nowConfirmed) {
          // Both confirmed: reverse old impact, apply new impact
          if (editTx.accountId === form.accountId) {
            const { data: acc, error } = await supabase
              .from("Account").select("balance").eq("id", form.accountId).single()
            if (error) throw new Error(error.message)
            const reverse = editTx.type === "income" ? -editTx.amount : editTx.amount
            const apply = type === "income" ? amount : -amount
            await supabase.from("Account")
              .update({ balance: Number(acc!.balance) + reverse + apply })
              .eq("id", form.accountId)
          } else {
            if (editTx.accountId) {
              const { data: old } = await supabase.from("Account").select("balance").eq("id", editTx.accountId).single()
              const reverse = editTx.type === "income" ? -editTx.amount : editTx.amount
              await supabase.from("Account").update({ balance: Number(old!.balance) + reverse }).eq("id", editTx.accountId)
            }
            const { data: next } = await supabase.from("Account").select("balance").eq("id", form.accountId).single()
            const apply = type === "income" ? amount : -amount
            await supabase.from("Account").update({ balance: Number(next!.balance) + apply }).eq("id", form.accountId)
          }
        } else if (wasConfirmed && !nowConfirmed) {
          // Confirmed → Pending: reverse old impact only
          if (editTx.accountId) {
            const { data: acc } = await supabase.from("Account").select("balance").eq("id", editTx.accountId).single()
            if (acc) {
              const reverse = editTx.type === "income" ? -editTx.amount : editTx.amount
              await supabase.from("Account").update({ balance: Number(acc.balance) + reverse }).eq("id", editTx.accountId)
            }
          }
        } else if (!wasConfirmed && nowConfirmed) {
          // Pending → Confirmed: apply new impact only
          const { data: acc } = await supabase.from("Account").select("balance").eq("id", form.accountId).single()
          if (acc) {
            const apply = type === "income" ? amount : -amount
            await supabase.from("Account").update({ balance: Number(acc.balance) + apply }).eq("id", form.accountId)
          }
        }
        // Pending → Pending: no balance change
      } else {
        // ── Create mode ──
        const { error: txError } = await supabase.from("Transaction").insert({
          userId,
          type,
          amount,
          currency,
          description: form.description.trim(),
          category: form.category,
          accountId: form.accountId,
          date: date.toISOString(),
          status: form.status,
        })
        if (txError) throw new Error(txError.message)

        // Only update balance for confirmed transactions
        if (form.status === "confirmed") {
          const { data: acc, error: accError } = await supabase
            .from("Account").select("balance").eq("id", form.accountId).single()
          if (accError) throw new Error(accError.message)
          if (acc) {
            const delta = type === "income" ? amount : -amount
            const { error: balError } = await supabase
              .from("Account").update({ balance: Number(acc.balance) + delta }).eq("id", form.accountId)
            if (balError) throw new Error(balError.message)
          }
        }

        if (form.recurring) {
          const dueDay =
            form.recurrence === "monthly"
              ? parseInt(form.dueDay) || date.getDate()
              : undefined
          const { data: bill, error: billError } = await supabase
            .from("Bill")
            .insert({
              userId,
              name: form.description.trim(),
              amount,
              type,
              recurrence: form.recurrence,
              dueDay,
              startDate: date.toISOString(),
              category: form.category,
              isActive: true,
            })
            .select("id")
            .single()
          if (billError) throw new Error(billError.message)
          if (bill) {
            const payments = generateBillPayments(bill.id, userId, date, amount, form.recurrence, dueDay)
            if (payments.length > 0) {
              const { error: pmtError } = await supabase.from("BillPayment").insert(payments)
              if (pmtError) throw new Error(pmtError.message)
            }
          }
        }
      }

      onSaved()
      onClose()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Não foi possível guardar a transação."
      Alert.alert("Erro ao guardar", msg)
    } finally {
      setSaving(false)
    }
  }

  const title = type === "expense" ? t.newExpense : t.newIncome
  const amountColor = type === "income" ? "text-green-600" : "text-red-500"

  return (
    <Modal visible={visible} transparent animationType={isDesktop ? "fade" : "slide"} onRequestClose={onClose}>
      <KeyboardAvoidingView
        className={`flex-1 ${isDesktop ? "justify-center items-center" : "justify-end"}`}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      >
        <View
          className={`bg-white ${isDesktop ? "rounded-2xl" : "rounded-t-3xl"}`}
          style={isDesktop ? { width: "100%", maxWidth: 480 } : undefined}
        >
          {/* Handle — mobile only */}
          {!isDesktop && <View className="w-10 h-1 bg-gray-200 rounded-full self-center mt-3 mb-1" />}

          {/* Header */}
          <View className="flex-row items-center px-5 py-3 border-b border-gray-100">
            <Text className="flex-1 text-base font-semibold text-gray-900">{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <View className="px-5 pt-4 pb-2">
            {/* Description */}
            <TextInput
              className="bg-gray-50 rounded-xl px-3 py-3 text-sm text-gray-800 mb-3"
              placeholder={t.descriptionPlaceholder}
              value={form.description}
              onChangeText={(v) => patch("description", v)}
              autoFocus
            />

            {/* Amount + Date */}
            <View className="flex-row gap-3 mb-3">
              <View className="flex-1 bg-gray-50 rounded-xl px-3 py-3 flex-row items-center">
                <Text className="text-sm text-gray-400 mr-1">{currency}</Text>
                <TextInput
                  className={`flex-1 text-sm font-semibold ${amountColor}`}
                  placeholder="0,00"
                  value={form.amount}
                  onChangeText={(v) => patch("amount", v)}
                  keyboardType="decimal-pad"
                />
              </View>
              <View className="flex-1 bg-gray-50 rounded-xl px-3 py-3 flex-row items-center">
                <TextInput
                  className="flex-1 text-sm text-gray-700"
                  placeholder="DD/MM/AAAA"
                  value={form.date}
                  onChangeText={(v) => patch("date", v)}
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>
            </View>

            {/* Account + Category */}
            <View className="flex-row gap-3 mb-3">
              <TouchableOpacity
                className="flex-1 bg-gray-50 rounded-xl px-3 py-3 flex-row items-center"
                onPress={() => setShowAccountPicker(true)}
                activeOpacity={0.8}
              >
                <Text className="flex-1 text-sm text-gray-700" numberOfLines={1}>
                  {form.accountName || t.accountLabel}
                </Text>
                <ChevronDown size={14} color="#9CA3AF" />
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-gray-50 rounded-xl px-3 py-3 flex-row items-center"
                onPress={() => setShowCategoryPicker(true)}
                activeOpacity={0.8}
              >
                <Text className="flex-1 text-sm text-gray-700" numberOfLines={1}>
                  {form.category || t.categoryLabel}
                </Text>
                <ChevronDown size={14} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Status toggle */}
            <TouchableOpacity
              className={`flex-row items-center self-start px-4 py-2.5 rounded-xl gap-2 mb-2 ${
                form.status === "confirmed" ? "bg-green-50" : "bg-amber-50"
              }`}
              onPress={() => patch("status", form.status === "confirmed" ? "pending" : "confirmed")}
              activeOpacity={0.8}
            >
              {form.status === "confirmed"
                ? <CheckCircle2 size={16} color="#16A34A" />
                : <Clock size={16} color="#D97706" />
              }
              <Text className={`text-xs font-semibold ${form.status === "confirmed" ? "text-green-600" : "text-amber-600"}`}>
                {form.status === "confirmed" ? t.statusConfirmed : t.statusPending}
              </Text>
            </TouchableOpacity>

            {/* Action toggles */}
            <View className="flex-row gap-3 mb-2">
              <TouchableOpacity
                className={`flex-row items-center px-4 py-2.5 rounded-xl gap-2 ${form.recurring ? "bg-primary/10" : "bg-gray-50"}`}
                onPress={() => patch("recurring", !form.recurring)}
                activeOpacity={0.8}
              >
                <RefreshCw size={15} color={form.recurring ? "#4e80f5" : "#6B7280"} />
                <Text className={`text-xs font-medium ${form.recurring ? "text-primary" : "text-gray-500"}`}>
                  {t.recurringLabel}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-row items-center px-4 py-2.5 rounded-xl gap-2 ${form.showNotes ? "bg-primary/10" : "bg-gray-50"}`}
                onPress={() => patch("showNotes", !form.showNotes)}
                activeOpacity={0.8}
              >
                <FileText size={15} color={form.showNotes ? "#4e80f5" : "#6B7280"} />
                <Text className={`text-xs font-medium ${form.showNotes ? "text-primary" : "text-gray-500"}`}>
                  {t.notesLabel}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Recurrence options (expanded) */}
            {form.recurring && (
              <View className="bg-gray-50 rounded-xl px-4 py-3 mb-2">
                <Text className="text-xs font-semibold text-gray-400 uppercase mb-2">{t.recurrenceTypeLabel}</Text>
                <View className="flex-row gap-2 mb-2">
                  {(["weekly", "monthly", "yearly"] as const).map((r) => (
                    <TouchableOpacity
                      key={r}
                      className={`flex-1 py-2 rounded-lg items-center ${form.recurrence === r ? "bg-primary" : "bg-white border border-gray-200"}`}
                      onPress={() => patch("recurrence", r)}
                      activeOpacity={0.8}
                    >
                      <Text className={`text-xs font-semibold ${form.recurrence === r ? "text-white" : "text-gray-600"}`}>
                        {r === "weekly" ? t.weekly : r === "monthly" ? t.monthly : t.yearly}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {form.recurrence === "monthly" && (
                  <View className="flex-row items-center gap-2">
                    <Text className="text-xs text-gray-500">{t.dueDayLabel}:</Text>
                    <TextInput
                      className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-800 w-16 text-center"
                      value={form.dueDay}
                      onChangeText={(v) => patch("dueDay", v.replace(/[^0-9]/g, ""))}
                      keyboardType="numeric"
                      maxLength={2}
                    />
                  </View>
                )}
              </View>
            )}

            {/* Notes */}
            {form.showNotes && (
              <TextInput
                className="bg-gray-50 rounded-xl px-3 py-3 text-sm text-gray-700 mb-2"
                placeholder={t.notesPlaceholder}
                value={form.notes}
                onChangeText={(v) => patch("notes", v)}
                multiline
                numberOfLines={2}
              />
            )}
          </View>

          {/* Submit */}
          <View className="items-center pb-10 pt-2">
            <TouchableOpacity
              className="w-16 h-16 rounded-full bg-green-500 items-center justify-center shadow-md"
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? <ActivityIndicator color="white" /> : <Check size={28} color="white" strokeWidth={2.5} />}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Sub-modals */}
      <PickerModal
        visible={showAccountPicker}
        title={t.selectAccount}
        items={accounts.map((a) => ({ id: a.id, name: a.name, icon: a.icon }))}
        onSelect={(id, name) => { patch("accountId", id); patch("accountName", name) }}
        onClose={() => setShowAccountPicker(false)}
        searchPlaceholder="Pesquisar conta..."
      />
      <PickerModal
        visible={showCategoryPicker}
        title={t.selectCategory}
        items={filteredCategories}
        onSelect={(_, name) => patch("category", name)}
        onClose={() => setShowCategoryPicker(false)}
        searchPlaceholder={t.categorySearchPlaceholder}
      />
    </Modal>
  )
}

// ─── Transfer Form Modal ──────────────────────────────────────────────────────

function TransferFormModal({
  visible, accounts, currency, userId, onClose, onSaved, t,
}: {
  visible: boolean
  accounts: AccountRow[]
  currency: string
  userId: string
  onClose: () => void
  onSaved: () => void
  t: ReturnType<typeof useLocale>["t"]["transactions"]
}) {
  const [fromId, setFromId] = useState("")
  const [fromName, setFromName] = useState("")
  const [toId, setToId] = useState("")
  const [toName, setToName] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(formatDateForInput(new Date()))
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [showFromPicker, setShowFromPicker] = useState(false)
  const [showToPicker, setShowToPicker] = useState(false)
  const { width } = useWindowDimensions()
  const isDesktop = width >= 768

  function reset() {
    setFromId(""); setFromName(""); setToId(""); setToName("")
    setAmount(""); setDate(formatDateForInput(new Date())); setNotes("")
  }

  async function handleSave() {
    const parsedAmount = parseAmount(amount)
    const parsedDate = parseDateInput(date)
    if (!parsedAmount || !parsedDate || !fromId || !toId) {
      Alert.alert(t.validationError, "Preenche todos os campos da transferência.")
      return
    }
    if (fromId === toId) {
      Alert.alert("Erro", "A conta de origem e destino não podem ser iguais.")
      return
    }
    setSaving(true)
    try {
      const desc = notes.trim() || `Transferência → ${toName}`

      const { error: e1 } = await supabase.from("Transaction").insert({
        userId, type: "expense", amount: parsedAmount, currency,
        description: desc, category: "Transferência", accountId: fromId,
        date: parsedDate.toISOString(),
      })
      if (e1) throw new Error(e1.message)

      const { error: e2 } = await supabase.from("Transaction").insert({
        userId, type: "income", amount: parsedAmount, currency,
        description: `Transferência de ${fromName}`, category: "Transferência",
        accountId: toId, date: parsedDate.toISOString(),
      })
      if (e2) throw new Error(e2.message)

      const [{ data: fromAcc, error: e3 }, { data: toAcc, error: e4 }] = await Promise.all([
        supabase.from("Account").select("balance").eq("id", fromId).single(),
        supabase.from("Account").select("balance").eq("id", toId).single(),
      ])
      if (e3) throw new Error(e3.message)
      if (e4) throw new Error(e4.message)

      await Promise.all([
        supabase.from("Account").update({ balance: Number(fromAcc?.balance ?? 0) - parsedAmount }).eq("id", fromId),
        supabase.from("Account").update({ balance: Number(toAcc?.balance ?? 0) + parsedAmount }).eq("id", toId),
      ])

      reset()
      onSaved()
      onClose()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Não foi possível guardar a transferência."
      Alert.alert("Erro ao guardar", msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType={isDesktop ? "fade" : "slide"} onRequestClose={onClose}>
      <KeyboardAvoidingView
        className={`flex-1 ${isDesktop ? "justify-center items-center" : "justify-end"}`}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      >
        <View
          className={`bg-white ${isDesktop ? "rounded-2xl" : "rounded-t-3xl"}`}
          style={isDesktop ? { width: "100%", maxWidth: 480 } : undefined}
        >
          {!isDesktop && <View className="w-10 h-1 bg-gray-200 rounded-full self-center mt-3 mb-1" />}
          <View className="flex-row items-center px-5 py-3 border-b border-gray-100">
            <Text className="flex-1 text-base font-semibold text-gray-900">{t.newTransfer}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <View className="px-5 pt-4 pb-2">
            {/* From + To accounts */}
            <View className="flex-row gap-3 mb-3">
              <TouchableOpacity
                className="flex-1 bg-gray-50 rounded-xl px-3 py-3 flex-row items-center"
                onPress={() => setShowFromPicker(true)}
                activeOpacity={0.8}
              >
                <Text className="flex-1 text-sm text-gray-700" numberOfLines={1}>
                  {fromName || t.fromAccount}
                </Text>
                <ChevronDown size={14} color="#9CA3AF" />
              </TouchableOpacity>
              <View className="items-center justify-center px-1">
                <ArrowRight size={16} color="#9CA3AF" />
              </View>
              <TouchableOpacity
                className="flex-1 bg-gray-50 rounded-xl px-3 py-3 flex-row items-center"
                onPress={() => setShowToPicker(true)}
                activeOpacity={0.8}
              >
                <Text className="flex-1 text-sm text-gray-700" numberOfLines={1}>
                  {toName || t.toAccount}
                </Text>
                <ChevronDown size={14} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Amount + Date */}
            <View className="flex-row gap-3 mb-3">
              <View className="flex-1 bg-gray-50 rounded-xl px-3 py-3 flex-row items-center">
                <Text className="text-sm text-gray-400 mr-1">{currency}</Text>
                <TextInput
                  className="flex-1 text-sm font-semibold text-blue-600"
                  placeholder="0,00"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                />
              </View>
              <View className="flex-1 bg-gray-50 rounded-xl px-3 py-3">
                <TextInput
                  className="text-sm text-gray-700"
                  placeholder="DD/MM/AAAA"
                  value={date}
                  onChangeText={setDate}
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>
            </View>

            {/* Notes */}
            <TextInput
              className="bg-gray-50 rounded-xl px-3 py-3 text-sm text-gray-700 mb-2"
              placeholder={t.notesPlaceholder}
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          <View className="items-center pb-10 pt-2">
            <TouchableOpacity
              className="w-16 h-16 rounded-full bg-blue-500 items-center justify-center shadow-md"
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? <ActivityIndicator color="white" /> : <Check size={28} color="white" strokeWidth={2.5} />}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <PickerModal
        visible={showFromPicker}
        title={t.fromAccount}
        items={accounts.map((a) => ({ id: a.id, name: a.name, icon: a.icon }))}
        onSelect={(id, name) => { setFromId(id); setFromName(name) }}
        onClose={() => setShowFromPicker(false)}
        searchPlaceholder="Pesquisar..."
      />
      <PickerModal
        visible={showToPicker}
        title={t.toAccount}
        items={accounts.map((a) => ({ id: a.id, name: a.name, icon: a.icon }))}
        onSelect={(id, name) => { setToId(id); setToName(name) }}
        onClose={() => setShowToPicker(false)}
        searchPlaceholder="Pesquisar..."
      />
    </Modal>
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TransactionsScreen() {
  const { session } = useAuth()
  const { profile } = useProfile()
  const { t } = useLocale()

  const [currentDate, setCurrentDate] = useState(new Date())
  const [transactions, setTransactions] = useState<TxRow[]>([])
  const [accounts, setAccounts] = useState<AccountRow[]>([])
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [overdueCount, setOverdueCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState("")
  const [fabOpen, setFabOpen] = useState(false)
  const [formType, setFormType] = useState<"expense" | "income" | "transfer" | null>(null)
  const [editingTx, setEditingTx] = useState<TxRow | null>(null)

  const fabAnim = useRef(new Animated.Value(0)).current
  const itemAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current

  function openFab() {
    setFabOpen(true)
    Animated.parallel([
      Animated.timing(fabAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.stagger(55, [...itemAnims].reverse().map((a) =>
        Animated.spring(a, { toValue: 1, tension: 160, friction: 9, useNativeDriver: true })
      )),
    ]).start()
  }

  function closeFab(cb?: () => void) {
    setFabOpen(false)
    Animated.parallel([
      Animated.timing(fabAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      ...itemAnims.map((a) =>
        Animated.timing(a, { toValue: 0, duration: 140, useNativeDriver: true })
      ),
    ]).start(cb)
  }

  const currency = profile?.currency ?? "EUR"
  const uid = session?.user?.id ?? ""

  const monthLabel = currentDate.toLocaleString(undefined, { month: "long", year: "numeric" })

  function prevMonth() {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  }
  function nextMonth() {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  }

  async function handleDelete(tx: TxRow) {
    Alert.alert(
      "Eliminar transação",
      `Tens a certeza que queres eliminar "${tx.description}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              if (tx.accountId && tx.status === "confirmed") {
                const { data: acc } = await supabase.from("Account").select("balance").eq("id", tx.accountId).single()
                if (acc) {
                  const reverse = tx.type === "income" ? -tx.amount : tx.amount
                  await supabase.from("Account").update({ balance: Number(acc.balance) + reverse }).eq("id", tx.accountId)
                }
              }
              const { error } = await supabase.from("Transaction").delete().eq("id", tx.id)
              if (error) throw new Error(error.message)
              fetchTransactions()
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : "Não foi possível eliminar."
              Alert.alert("Erro", msg)
            }
          },
        },
      ]
    )
  }

  async function handleConfirm(tx: TxRow) {
    try {
      const { error: txError } = await supabase
        .from("Transaction")
        .update({ status: "confirmed" })
        .eq("id", tx.id)
      if (txError) throw new Error(txError.message)

      if (tx.accountId) {
        const { data: acc, error: accError } = await supabase
          .from("Account").select("balance").eq("id", tx.accountId).single()
        if (accError) throw new Error(accError.message)
        if (acc) {
          const delta = tx.type === "income" ? tx.amount : -tx.amount
          const { error: balError } = await supabase
            .from("Account").update({ balance: Number(acc.balance) + delta }).eq("id", tx.accountId)
          if (balError) throw new Error(balError.message)
        }
      }
      fetchTransactions()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Não foi possível confirmar."
      Alert.alert("Erro ao confirmar", msg)
    }
  }

  async function fetchTransactions() {
    if (!uid) return
    setLoading(true)
    const { from, to } = getMonthRange(currentDate)
    const { data, error } = await supabase
      .from("Transaction")
      .select("id, type, amount, description, category, date, accountId, status")
      .eq("userId", uid)
      .gte("date", from)
      .lte("date", to)
      .order("date", { ascending: false })
    if (error) {
      Alert.alert("Erro ao carregar transações", error.message)
      setLoading(false)
      return
    }
    setTransactions((data ?? []) as TxRow[])
    setLoading(false)
  }

  useEffect(() => {
    if (!uid) return

    // Accounts
    supabase
      .from("Account")
      .select("id, name, icon, balance")
      .eq("userId", uid)
      .order("createdAt")
      .then(({ data }) => setAccounts((data ?? []) as AccountRow[]))

    // Categories
    supabase
      .from("Category")
      .select("id, name, icon, color, type")
      .eq("userId", uid)
      .order("name")
      .then(({ data }) => setCategories((data ?? []) as CategoryRow[]))

    // Overdue bill payments count
    supabase
      .from("BillPayment")
      .select("id", { count: "exact", head: true })
      .eq("userId", uid)
      .in("status", ["pending", "overdue"])
      .lt("dueDate", new Date().toISOString())
      .then(({ count }) => setOverdueCount(count ?? 0))

    fetchTransactions()
  }, [uid])

  useEffect(() => {
    fetchTransactions()
  }, [currentDate])

  const filtered = useMemo(() => {
    if (!filter.trim()) return transactions
    const q = filter.toLowerCase()
    return transactions.filter(
      (tx) => tx.description.toLowerCase().includes(q) || tx.category.toLowerCase().includes(q)
    )
  }, [transactions, filter])

  const groups = useMemo(() => groupByDay(filtered), [filtered])

  const accountMap = useMemo(() => {
    const m: Record<string, AccountRow> = {}
    for (const a of accounts) m[a.id] = a
    return m
  }, [accounts])

  const categoryMap = useMemo(() => {
    const m: Record<string, CategoryRow> = {}
    for (const c of categories) m[c.name] = c
    return m
  }, [categories])

  return (
    <View className="flex-1 bg-background">

      {/* Overdue banner */}
      {overdueCount > 0 && (
        <View className="flex-row items-center px-4 py-2.5 bg-amber-50 border-b border-amber-100">
          <Text className="text-base mr-2">⚠️</Text>
          <Text className="flex-1 text-xs text-amber-700 font-medium">
            {t.transactions.overdueAlert(overdueCount)}
          </Text>
          <TouchableOpacity onPress={() => setOverdueCount(0)}>
            <Text className="text-amber-400 text-lg leading-none">×</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Month navigation */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100 bg-white">
        <TouchableOpacity onPress={prevMonth} hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}>
          <Text className="text-gray-500 text-lg">‹</Text>
        </TouchableOpacity>
        <Text className="flex-1 text-center text-sm font-semibold text-gray-800 capitalize">{monthLabel}</Text>
        <TouchableOpacity onPress={nextMonth} hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}>
          <Text className="text-gray-500 text-lg">›</Text>
        </TouchableOpacity>
      </View>

      {/* Filter bar */}
      <View className="px-4 py-2 bg-white border-b border-gray-100">
        <TextInput
          className="bg-gray-50 rounded-xl px-3 py-2 text-sm text-gray-700"
          placeholder={t.transactions.filterPlaceholder}
          value={filter}
          onChangeText={setFilter}
        />
      </View>

      {/* Transactions list */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : groups.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-sm text-gray-400">{t.transactions.noTransactions}</Text>
        </View>
      ) : (
        <SectionList
          sections={groups}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Text className="text-xs font-semibold text-gray-400 mb-2 mt-4 first:mt-0">
              {section.title}
            </Text>
          )}
          renderSectionFooter={({ section }) => {
            const net = section.totalIncome - section.totalExpense
            return (
              <View className="flex-row justify-end items-center py-2 mb-2 border-b border-gray-100">
                <Text className="text-xs text-gray-400 mr-2">{t.transactions.dayBalance}</Text>
                <Text className={`text-xs font-bold ${net >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {fmt(net, currency)}
                </Text>
              </View>
            )
          }}
          renderItem={({ item, index, section }) => {
            const cat = categoryMap[item.category]
            const acc = item.accountId ? accountMap[item.accountId] : null
            const isLast = index === section.data.length - 1
            const isPending = item.status === "pending"
            return (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setEditingTx(item)}
                style={{ opacity: isPending ? 0.6 : 1 }}
                className={`flex-row items-center bg-white px-3 py-3 ${
                  index === 0 ? "rounded-t-2xl" : ""
                } ${isLast ? "rounded-b-2xl" : "border-b border-gray-50"}`}
              >
                <View className="relative mr-3 flex-shrink-0">
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: cat?.color ?? "#E5E7EB" }}
                  >
                    <AppIcon name={cat?.icon ?? "FolderOpen"} size={18} color="white" />
                  </View>
                  {isPending && (
                    <View className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-amber-400 rounded-full items-center justify-center">
                      <Clock size={9} color="white" strokeWidth={3} />
                    </View>
                  )}
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-sm font-medium text-gray-800" numberOfLines={1}>
                    {item.description}
                  </Text>
                  {acc && (
                    <Text className="text-xs text-gray-400 mt-0.5">{acc.name}</Text>
                  )}
                </View>
                <Text className={`text-sm font-semibold ml-3 ${item.type === "income" ? "text-green-600" : "text-gray-800"}`}>
                  {item.type === "income" ? "+" : "−"}{fmt(item.amount, currency)}
                </Text>
                {isPending && (
                  <TouchableOpacity
                    onPress={(e) => { e.stopPropagation(); handleConfirm(item) }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    className="ml-2 pl-1"
                    activeOpacity={0.6}
                  >
                    <Check size={16} color="#FBBF24" strokeWidth={2.5} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={(e) => { e.stopPropagation(); handleDelete(item) }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  className="ml-2 pl-1"
                  activeOpacity={0.6}
                >
                  <Trash2 size={16} color="#D1D5DB" />
                </TouchableOpacity>
              </TouchableOpacity>
            )
          }}
        />
      )}

      {/* Speed Dial backdrop */}
      <Animated.View
        pointerEvents={fabOpen ? "auto" : "none"}
        className="absolute inset-0"
        style={{ opacity: fabAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.35] }), backgroundColor: "#000" }}
      >
        <TouchableOpacity className="flex-1" activeOpacity={1} onPress={() => closeFab()} />
      </Animated.View>

      {/* Speed Dial FAB */}
      <View className="absolute bottom-8 right-5 items-end" pointerEvents="box-none">
        {([
          ["transfer", t.transactions.transfer, ArrowLeftRight, "#3B82F6", itemAnims[2]],
          ["income",   t.transactions.income,   Plus,           "#22C55E", itemAnims[1]],
          ["expense",  t.transactions.expense,  Minus,          "#EF4444", itemAnims[0]],
        ] as const).map(([type, label, Icon, color, anim]) => (
          <Animated.View
            key={type}
            pointerEvents={fabOpen ? "auto" : "none"}
            style={{
              opacity: anim,
              marginBottom: 12,
              transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
            }}
          >
            <TouchableOpacity
              className="flex-row items-center"
              onPress={() => closeFab(() => setFormType(type))}
              activeOpacity={0.85}
            >
              <View className="bg-white rounded-xl px-3 py-1.5 mr-3 shadow">
                <Text className="text-sm font-medium text-gray-700">{label}</Text>
              </View>
              <View className="w-12 h-12 rounded-full items-center justify-center shadow" style={{ backgroundColor: color }}>
                <Icon size={22} color="white" strokeWidth={2} />
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}

        <TouchableOpacity
          className="w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg"
          onPress={fabOpen ? () => closeFab() : openFab}
          activeOpacity={0.85}
        >
          <Animated.View
            style={{ transform: [{ rotate: fabAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "45deg"] }) }] }}
          >
            <Plus size={28} color="white" strokeWidth={2} />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Expense / Income form */}
      {(formType === "expense" || formType === "income") && (
        <TransactionFormModal
          visible
          type={formType}
          accounts={accounts}
          categories={categories}
          currency={currency}
          userId={uid}
          onClose={() => setFormType(null)}
          onSaved={fetchTransactions}
          t={t.transactions}
        />
      )}

      {/* Transfer form */}
      {formType === "transfer" && (
        <TransferFormModal
          visible
          accounts={accounts}
          currency={currency}
          userId={uid}
          onClose={() => setFormType(null)}
          onSaved={fetchTransactions}
          t={t.transactions}
        />
      )}

      {/* Edit form */}
      {editingTx && (
        <TransactionFormModal
          visible
          type={editingTx.type}
          accounts={accounts}
          categories={categories}
          currency={currency}
          userId={uid}
          editTx={editingTx}
          onClose={() => setEditingTx(null)}
          onSaved={fetchTransactions}
          t={t.transactions}
        />
      )}
    </View>
  )
}
