import { useEffect, useState } from "react"
import { View, Text, ScrollView } from "react-native"
import { useAuth } from "../../context/auth"
import { useProfile } from "../../hooks/useProfile"
import { useLocale } from "../../context/locale"
import { supabase } from "../../lib/supabase"

type Account = {
  id: string
  name: string
  icon: string
  balance: number
  excludeFromTotal: boolean
}

type Transaction = {
  id: string
  type: "income" | "expense"
  amount: number
  description: string
  category: string
  date: string
}

type SpendingLimit = {
  id: string
  category: string
  amount: number
  spent: number
}

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

function monthRange() {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()
  return { from, to }
}

export default function OverviewScreen() {
  const { session } = useAuth()
  const { profile } = useProfile()
  const { t } = useLocale()

  const [accounts, setAccounts] = useState<Account[]>([])
  const [income, setIncome] = useState(0)
  const [expenses, setExpenses] = useState(0)
  const [recentTxs, setRecentTxs] = useState<Transaction[]>([])
  const [limits, setLimits] = useState<SpendingLimit[]>([])

  const currency = profile?.currency ?? "EUR"
  const name = profile?.name?.split(" ")[0] ?? ""

  useEffect(() => {
    if (!session?.user) return
    const uid = session.user.id
    const { from, to } = monthRange()

    // Accounts
    supabase
      .from("Account")
      .select("id, name, icon, balance, excludeFromTotal")
      .eq("userId", uid)
      .order("createdAt")
      .then(({ data }) => setAccounts((data ?? []) as Account[]))

    // Month transactions
    supabase
      .from("Transaction")
      .select("id, type, amount, description, category, date")
      .eq("userId", uid)
      .gte("date", from)
      .lte("date", to)
      .order("date", { ascending: false })
      .then(({ data }) => {
        const txs = (data ?? []) as Transaction[]
        setIncome(txs.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0))
        setExpenses(txs.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0))
        setRecentTxs(txs.slice(0, 5))
      })

    // Spending limits + this month's expense per category
    supabase
      .from("SpendingLimit")
      .select("id, category, amount")
      .eq("userId", uid)
      .then(async ({ data: limitsData }) => {
        if (!limitsData?.length) { setLimits([]); return }

        const { data: catTxs } = await supabase
          .from("Transaction")
          .select("category, amount")
          .eq("userId", uid)
          .eq("type", "expense")
          .gte("date", from)
          .lte("date", to)

        const spentByCategory: Record<string, number> = {}
        for (const tx of catTxs ?? []) {
          spentByCategory[tx.category] = (spentByCategory[tx.category] ?? 0) + Number(tx.amount)
        }

        setLimits(
          limitsData.map((l) => ({
            id: l.id,
            category: l.category,
            amount: Number(l.amount),
            spent: spentByCategory[l.category] ?? 0,
          }))
        )
      })
  }, [session])

  const net = income - expenses
  const now = new Date()
  const monthLabel = now.toLocaleString(undefined, { month: "long", year: "numeric" })

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 24 }}>
      {/* Header */}
      <View className="mb-6">
        {name ? (
          <Text className="text-2xl font-bold text-gray-900">{t.overview.greeting(name)}</Text>
        ) : null}
        <Text className="text-sm text-gray-400 mt-0.5 capitalize">{monthLabel}</Text>
      </View>

      {/* Accounts */}
      <Text className="text-xs font-semibold text-gray-400 uppercase mb-3">{t.overview.accounts}</Text>
      <View className="bg-surface rounded-2xl overflow-hidden mb-8">
        {accounts.length === 0 ? (
          <View className="px-4 py-6 items-center">
            <Text className="text-sm text-gray-400">{t.overview.noAccounts}</Text>
          </View>
        ) : (
          <>
            {accounts.map((acc, i) => (
              <View key={acc.id} className={`flex-row items-center px-4 py-3 ${i > 0 ? "border-t border-gray-100" : ""}`}>
                <Text className="text-xl w-8">{acc.icon}</Text>
                <Text className="flex-1 text-sm font-medium text-gray-800 ml-3">{acc.name}</Text>
                {acc.excludeFromTotal && (
                  <Text className="text-xs text-amber-500 mr-3">—</Text>
                )}
                <Text className={`text-sm font-semibold ${Number(acc.balance) < 0 ? "text-red-500" : "text-gray-800"}`}>
                  {fmt(Number(acc.balance), currency)}
                </Text>
              </View>
            ))}
            {(() => {
              const total = accounts
                .filter((a) => !a.excludeFromTotal)
                .reduce((s, a) => s + Number(a.balance), 0)
              return (
                <View className="flex-row items-center px-4 py-3 border-t border-gray-200 bg-gray-50">
                  <Text className="flex-1 text-sm font-bold text-gray-700">{t.overview.totalBalance}</Text>
                  <Text className={`text-sm font-bold ${total < 0 ? "text-red-500" : "text-gray-900"}`}>
                    {fmt(total, currency)}
                  </Text>
                </View>
              )
            })()}
          </>
        )}
      </View>

      {/* Month summary */}
      <Text className="text-xs font-semibold text-gray-400 uppercase mb-3">{t.overview.thisMonth}</Text>
      <View className="flex-row gap-3 mb-8">
        {/* Income */}
        <View className="flex-1 bg-surface rounded-2xl p-4">
          <Text className="text-xs font-medium text-gray-400 mb-1">{t.overview.income}</Text>
          <Text className="text-lg font-bold text-green-600">{fmt(income, currency)}</Text>
        </View>
        {/* Expenses */}
        <View className="flex-1 bg-surface rounded-2xl p-4">
          <Text className="text-xs font-medium text-gray-400 mb-1">{t.overview.expenses}</Text>
          <Text className="text-lg font-bold text-red-500">{fmt(expenses, currency)}</Text>
        </View>
        {/* Net */}
        <View className="flex-1 bg-surface rounded-2xl p-4">
          <Text className="text-xs font-medium text-gray-400 mb-1">{t.overview.net}</Text>
          <Text className={`text-lg font-bold ${net >= 0 ? "text-green-600" : "text-red-500"}`}>
            {fmt(net, currency)}
          </Text>
        </View>
      </View>

      {/* Recent transactions */}
      <Text className="text-xs font-semibold text-gray-400 uppercase mb-3">{t.overview.recentTransactions}</Text>
      <View className="bg-surface rounded-2xl overflow-hidden mb-8">
        {recentTxs.length === 0 ? (
          <View className="px-4 py-6 items-center">
            <Text className="text-sm text-gray-400">{t.overview.noTransactions}</Text>
          </View>
        ) : (
          recentTxs.map((tx, i) => (
            <View
              key={tx.id}
              className={`flex-row items-center px-4 py-3 ${i > 0 ? "border-t border-gray-100" : ""}`}
            >
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-800">{tx.description}</Text>
                <Text className="text-xs text-gray-400 mt-0.5">{tx.category}</Text>
              </View>
              <Text className={`text-sm font-semibold ${tx.type === "income" ? "text-green-600" : "text-red-500"}`}>
                {tx.type === "income" ? "+" : "-"}{fmt(Number(tx.amount), currency)}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Spending limits */}
      <Text className="text-xs font-semibold text-gray-400 uppercase mb-3">{t.overview.spendingLimits}</Text>
      <View className="bg-surface rounded-2xl overflow-hidden">
        {limits.length === 0 ? (
          <View className="px-4 py-6 items-center">
            <Text className="text-sm text-gray-400">{t.overview.noLimits}</Text>
          </View>
        ) : (
          limits.map((limit, i) => {
            const pct = Math.min(limit.spent / limit.amount, 1)
            const over = limit.spent > limit.amount
            return (
              <View key={limit.id} className={`px-4 py-3 ${i > 0 ? "border-t border-gray-100" : ""}`}>
                <View className="flex-row items-center justify-between mb-1.5">
                  <Text className="text-sm font-medium text-gray-800">{limit.category}</Text>
                  <Text className={`text-xs font-semibold ${over ? "text-red-500" : "text-gray-500"}`}>
                    {t.overview.limitOf(fmt(limit.spent, currency), fmt(limit.amount, currency))}
                  </Text>
                </View>
                <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <View
                    className={`h-full rounded-full ${over ? "bg-red-500" : "bg-primary"}`}
                    style={{ width: `${pct * 100}%` }}
                  />
                </View>
              </View>
            )
          })
        )}
      </View>
    </ScrollView>
  )
}
