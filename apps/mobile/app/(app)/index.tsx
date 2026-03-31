import { useEffect, useState } from "react"
import { View, Text, ScrollView } from "react-native"
import Svg, { Path } from "react-native-svg"
import { useAuth } from "../../context/auth"
import { useProfile } from "../../hooks/useProfile"
import { useLocale } from "../../context/locale"
import { supabase } from "../../lib/supabase"

// ─── Types ───────────────────────────────────────────────────────────────────

type Account = {
  id: string
  name: string
  icon: string
  balance: number
  excludeFromTotal: boolean
}

type CreditCard = {
  id: string
  name: string
  icon: string
  creditLimit: number | null
  closingDay: number
  dueDay: number
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

type CategorySpending = {
  category: string
  total: number
}

type BillInfo = { name: string; type: string; category: string }

type BillPaymentRow = {
  id: string
  amount: number
  dueDate: string
  status: string
  Bill: BillInfo[] | BillInfo | null
}

function billInfo(b: BillPaymentRow): BillInfo | null {
  if (!b.Bill) return null
  return Array.isArray(b.Bill) ? (b.Bill[0] ?? null) : b.Bill
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: "2-digit", month: "short" })
}

function monthRange() {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()
  return { from, to }
}

// ─── Donut Chart ─────────────────────────────────────────────────────────────

const CATEGORY_COLORS = ["#EF4444", "#F97316", "#EAB308", "#8B5CF6", "#6B7280"]
const GAP = 0.8 // degrees of gap between segments

function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function segmentPath(cx: number, cy: number, outerR: number, innerR: number, startDeg: number, endDeg: number) {
  const p1 = polarToCartesian(cx, cy, outerR, startDeg)
  const p2 = polarToCartesian(cx, cy, outerR, endDeg)
  const p3 = polarToCartesian(cx, cy, innerR, endDeg)
  const p4 = polarToCartesian(cx, cy, innerR, startDeg)
  const large = endDeg - startDeg > 180 ? 1 : 0
  return [
    `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
    `L ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${p4.x.toFixed(2)} ${p4.y.toFixed(2)}`,
    "Z",
  ].join(" ")
}

function DonutChart({ data }: { data: CategorySpending[] }) {
  const size = 130
  const cx = size / 2
  const cy = size / 2
  const outerR = 58
  const innerR = 36
  const total = data.reduce((s, d) => s + d.total, 0)

  if (total === 0) return <View style={{ width: size, height: size }} />

  let startDeg = 0
  const segments = data.map((item, i) => {
    const sweep = (item.total / total) * 360
    const path = segmentPath(cx, cy, outerR, innerR, startDeg + GAP / 2, startDeg + sweep - GAP / 2)
    startDeg += sweep
    return { path, color: CATEGORY_COLORS[i] }
  })

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {segments.map((seg, i) => (
        <Path key={i} d={seg.path} fill={seg.color} />
      ))}
    </Svg>
  )
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function OverviewScreen() {
  const { session } = useAuth()
  const { profile } = useProfile()
  const { t } = useLocale()

  const [accounts, setAccounts] = useState<Account[]>([])
  const [creditCards, setCreditCards] = useState<CreditCard[]>([])
  const [income, setIncome] = useState(0)
  const [expenses, setExpenses] = useState(0)
  const [recentTxs, setRecentTxs] = useState<Transaction[]>([])
  const [limits, setLimits] = useState<SpendingLimit[]>([])
  const [topCategories, setTopCategories] = useState<CategorySpending[]>([])
  const [billsToPay, setBillsToPay] = useState<BillPaymentRow[]>([])
  const [billsToReceive, setBillsToReceive] = useState<BillPaymentRow[]>([])

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

    // Credit cards
    supabase
      .from("CreditCard")
      .select("id, name, icon, creditLimit, closingDay, dueDay")
      .eq("userId", uid)
      .order("createdAt")
      .then(({ data }) => setCreditCards((data ?? []) as CreditCard[]))

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
        setIncome(txs.filter((tx) => tx.type === "income").reduce((s, tx) => s + Number(tx.amount), 0))
        setExpenses(txs.filter((tx) => tx.type === "expense").reduce((s, tx) => s + Number(tx.amount), 0))
        setRecentTxs(txs.slice(0, 5))

        // Top 5 spending categories
        const byCategory: Record<string, number> = {}
        for (const tx of txs.filter((tx) => tx.type === "expense")) {
          byCategory[tx.category] = (byCategory[tx.category] ?? 0) + Number(tx.amount)
        }
        setTopCategories(
          Object.entries(byCategory)
            .map(([category, total]) => ({ category, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5)
        )
      })

    // Spending limits
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

    // Bill payments (pending/overdue) — join with Bill to get name and type
    supabase
      .from("BillPayment")
      .select("id, amount, dueDate, status, Bill(name, type, category)")
      .eq("userId", uid)
      .in("status", ["pending", "overdue"])
      .order("dueDate")
      .limit(50)
      .then(({ data }) => {
        const rows = (data ?? []) as unknown as BillPaymentRow[]
        setBillsToPay(rows.filter((r) => billInfo(r)?.type === "expense"))
        setBillsToReceive(rows.filter((r) => billInfo(r)?.type === "income"))
      })
  }, [session])

  const net = income - expenses
  const now = new Date()
  const monthLabel = now.toLocaleString(undefined, { month: "long", year: "numeric" })
  const todayISO = now.toISOString()

  const totalBalance = accounts
    .filter((a) => !a.excludeFromTotal)
    .reduce((s, a) => s + Number(a.balance), 0)

  const overdueToPay = billsToPay.filter((b) => b.dueDate < todayISO)
  const upcomingToPay = billsToPay.filter((b) => b.dueDate >= todayISO)
  const overdueToReceive = billsToReceive.filter((b) => b.dueDate < todayISO)
  const upcomingToReceive = billsToReceive.filter((b) => b.dueDate >= todayISO)

  const totalExpenses = topCategories.reduce((s, c) => s + c.total, 0)

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 16 }}>

      {/* ── Header ── */}
      <View className="mb-4">
        {name ? (
          <Text className="text-2xl font-bold text-gray-900">{t.overview.greeting(name)}</Text>
        ) : null}
        <Text className="text-xs text-gray-400 mt-0.5 capitalize">{monthLabel}</Text>
      </View>

{/* ── Month Summary ── */}
      <Text className="text-[10px] font-semibold text-gray-400 uppercase mb-2">{t.overview.thisMonth}</Text>
      <View className="flex-row gap-2 mb-6">
        <View className="flex-1 bg-surface rounded-2xl p-3">
          <Text className="text-[10px] font-medium text-gray-400 mb-1">{t.overview.income}</Text>
          <Text className="text-sm font-bold text-green-600" numberOfLines={1}>{fmt(income, currency)}</Text>
        </View>
        <View className="flex-1 bg-surface rounded-2xl p-3">
          <Text className="text-[10px] font-medium text-gray-400 mb-1">{t.overview.expenses}</Text>
          <Text className="text-sm font-bold text-red-500" numberOfLines={1}>{fmt(expenses, currency)}</Text>
        </View>
        <View className="flex-1 bg-surface rounded-2xl p-3">
          <Text className="text-[10px] font-medium text-gray-400 mb-1">{t.overview.net}</Text>
          <Text className={`text-sm font-bold ${net >= 0 ? "text-green-600" : "text-red-500"}`} numberOfLines={1}>
            {fmt(net, currency)}
          </Text>
        </View>
      </View>

      {/* ── Two-column section ── */}
      <View className="flex-row gap-3 mb-6">

        {/* Left column: Accounts + Cards */}
        <View className="flex-1">

          {/* Accounts */}
          <Text className="text-[10px] font-semibold text-gray-400 uppercase mb-2">{t.overview.accounts}</Text>
          <View className="bg-surface rounded-2xl overflow-hidden mb-4">
            {accounts.length === 0 ? (
              <View className="px-3 py-4 items-center">
                <Text className="text-[11px] text-gray-400 text-center">{t.overview.noAccounts}</Text>
              </View>
            ) : (
              <>
                {accounts.map((acc, i) => (
                  <View key={acc.id} className={`flex-row items-center px-3 py-2 ${i > 0 ? "border-t border-gray-100" : ""}`}>
                    <Text className="text-base">{acc.icon}</Text>
                    <Text className="flex-1 text-[11px] font-medium text-gray-800 ml-2" numberOfLines={1}>{acc.name}</Text>
                    <Text className={`text-[11px] font-semibold ml-1 ${Number(acc.balance) < 0 ? "text-red-500" : "text-gray-800"}`} numberOfLines={1}>
                      {fmt(Number(acc.balance), currency)}
                    </Text>
                  </View>
                ))}
                <View className="flex-row items-center px-3 py-2 border-t border-gray-200 bg-gray-50">
                  <Text className="flex-1 text-[11px] font-bold text-gray-700">{t.overview.totalBalance}</Text>
                  <Text className={`text-[11px] font-bold ml-1 ${totalBalance < 0 ? "text-red-500" : "text-gray-900"}`} numberOfLines={1}>
                    {fmt(totalBalance, currency)}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* My Cards */}
          <Text className="text-[10px] font-semibold text-gray-400 uppercase mb-2">{t.overview.myCards}</Text>
          <View className="bg-surface rounded-2xl overflow-hidden">
            {creditCards.length === 0 ? (
              <View className="px-3 py-4 items-center">
                <Text className="text-[11px] text-gray-400 text-center">{t.overview.comingSoon}</Text>
              </View>
            ) : (
              creditCards.map((card, i) => (
                <View key={card.id} className={`px-3 py-2.5 ${i > 0 ? "border-t border-gray-100" : ""}`}>
                  <View className="flex-row items-center">
                    <Text className="text-base">{card.icon}</Text>
                    <Text className="flex-1 text-[11px] font-medium text-gray-800 ml-2" numberOfLines={1}>{card.name}</Text>
                  </View>
                  {card.creditLimit != null && (
                    <Text className="text-[10px] text-gray-400 mt-0.5 ml-7">
                      Limite {fmt(card.creditLimit, currency)}
                    </Text>
                  )}
                </View>
              ))
            )}
          </View>
        </View>

        {/* Right column: Bills to Pay + Bills to Receive + Spending Limits */}
        <View className="flex-1">

          {/* Bills to Pay */}
          <Text className="text-[10px] font-semibold text-gray-400 uppercase mb-2">{t.overview.billsToPay}</Text>
          <View className="bg-surface rounded-2xl overflow-hidden mb-4">
            {billsToPay.length === 0 ? (
              <View className="px-3 py-4 items-center">
                <Text className="text-[11px] text-gray-400 text-center">{t.overview.noBills}</Text>
              </View>
            ) : (
              <>
                {overdueToPay.length > 0 && (
                  <>
                    <View className="px-3 py-1.5 bg-red-50">
                      <Text className="text-[10px] font-semibold text-red-500">{t.overview.overdue}</Text>
                    </View>
                    {overdueToPay.map((b, i) => (
                      <View key={b.id} className={`flex-row items-center px-3 py-2 ${i > 0 ? "border-t border-gray-100" : "border-t border-red-100"}`}>
                        <View className="flex-1">
                          <Text className="text-[11px] font-medium text-gray-800" numberOfLines={1}>{billInfo(b)?.name}</Text>
                          <Text className="text-[10px] text-red-400">{fmtDate(b.dueDate)}</Text>
                        </View>
                        <Text className="text-[11px] font-semibold text-red-500 ml-1" numberOfLines={1}>
                          {fmt(Number(b.amount), currency)}
                        </Text>
                      </View>
                    ))}
                  </>
                )}
                {upcomingToPay.length > 0 && (
                  <>
                    <View className="px-3 py-1.5 bg-gray-50 border-t border-gray-100">
                      <Text className="text-[10px] font-semibold text-gray-400">{t.overview.upcoming}</Text>
                    </View>
                    {upcomingToPay.map((b, i) => (
                      <View key={b.id} className={`flex-row items-center px-3 py-2 ${i > 0 ? "border-t border-gray-100" : ""}`}>
                        <View className="flex-1">
                          <Text className="text-[11px] font-medium text-gray-800" numberOfLines={1}>{billInfo(b)?.name}</Text>
                          <Text className="text-[10px] text-gray-400">{fmtDate(b.dueDate)}</Text>
                        </View>
                        <Text className="text-[11px] font-semibold text-gray-700 ml-1" numberOfLines={1}>
                          {fmt(Number(b.amount), currency)}
                        </Text>
                      </View>
                    ))}
                  </>
                )}
              </>
            )}
          </View>

          {/* Bills to Receive */}
          <Text className="text-[10px] font-semibold text-gray-400 uppercase mb-2">{t.overview.billsToReceive}</Text>
          <View className="bg-surface rounded-2xl overflow-hidden mb-4">
            {billsToReceive.length === 0 ? (
              <View className="px-3 py-4 items-center">
                <Text className="text-[11px] text-gray-400 text-center">{t.overview.noBills}</Text>
              </View>
            ) : (
              <>
                {overdueToReceive.length > 0 && (
                  <>
                    <View className="px-3 py-1.5 bg-red-50">
                      <Text className="text-[10px] font-semibold text-red-500">{t.overview.overdue}</Text>
                    </View>
                    {overdueToReceive.map((b, i) => (
                      <View key={b.id} className={`flex-row items-center px-3 py-2 ${i > 0 ? "border-t border-gray-100" : "border-t border-red-100"}`}>
                        <View className="flex-1">
                          <Text className="text-[11px] font-medium text-gray-800" numberOfLines={1}>{billInfo(b)?.name}</Text>
                          <Text className="text-[10px] text-red-400">{fmtDate(b.dueDate)}</Text>
                        </View>
                        <Text className="text-[11px] font-semibold text-red-500 ml-1" numberOfLines={1}>
                          {fmt(Number(b.amount), currency)}
                        </Text>
                      </View>
                    ))}
                  </>
                )}
                {upcomingToReceive.length > 0 && (
                  <>
                    <View className="px-3 py-1.5 bg-gray-50 border-t border-gray-100">
                      <Text className="text-[10px] font-semibold text-gray-400">{t.overview.upcoming}</Text>
                    </View>
                    {upcomingToReceive.map((b, i) => (
                      <View key={b.id} className={`flex-row items-center px-3 py-2 ${i > 0 ? "border-t border-gray-100" : ""}`}>
                        <View className="flex-1">
                          <Text className="text-[11px] font-medium text-gray-800" numberOfLines={1}>{billInfo(b)?.name}</Text>
                          <Text className="text-[10px] text-gray-400">{fmtDate(b.dueDate)}</Text>
                        </View>
                        <Text className="text-[11px] font-semibold text-green-600 ml-1" numberOfLines={1}>
                          {fmt(Number(b.amount), currency)}
                        </Text>
                      </View>
                    ))}
                  </>
                )}
              </>
            )}
          </View>

          {/* Spending Limits */}
          <Text className="text-[10px] font-semibold text-gray-400 uppercase mb-2">{t.overview.spendingLimits}</Text>
          <View className="bg-surface rounded-2xl overflow-hidden">
            {limits.length === 0 ? (
              <View className="px-3 py-4 items-center">
                <Text className="text-[11px] text-gray-400 text-center">{t.overview.noLimits}</Text>
              </View>
            ) : (
              limits.map((limit, i) => {
                const pct = Math.min(limit.spent / limit.amount, 1)
                const over = limit.spent > limit.amount
                return (
                  <View key={limit.id} className={`px-3 py-2.5 ${i > 0 ? "border-t border-gray-100" : ""}`}>
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-[11px] font-medium text-gray-800 flex-1" numberOfLines={1}>{limit.category}</Text>
                      <Text className={`text-[10px] font-semibold ml-1 ${over ? "text-red-500" : "text-gray-400"}`}>
                        {Math.round(pct * 100)}%
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
        </View>
      </View>

      {/* ── Top 5 Spending Categories ── */}
      <Text className="text-[10px] font-semibold text-gray-400 uppercase mb-2">{t.overview.topSpending}</Text>
      <View className="bg-surface rounded-2xl p-4 mb-6">
        {topCategories.length === 0 ? (
          <Text className="text-sm text-gray-400 text-center py-2">{t.overview.noTransactions}</Text>
        ) : (
          <View className="flex-row items-center gap-4">
            {/* Donut */}
            <DonutChart data={topCategories} />

            {/* Legend */}
            <View className="flex-1 gap-2">
              {topCategories.map((cat, i) => {
                const pct = totalExpenses > 0 ? ((cat.total / totalExpenses) * 100).toFixed(1) : "0"
                return (
                  <View key={cat.category} className="flex-row items-center">
                    <View
                      className="w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[i] }}
                    />
                    <Text className="text-[11px] text-gray-700 flex-1" numberOfLines={1}>{cat.category}</Text>
                    <Text className="text-[11px] font-semibold text-gray-500 ml-1">{pct}%</Text>
                  </View>
                )
              })}
            </View>
          </View>
        )}
      </View>

      {/* ── Recent Transactions ── */}
      <Text className="text-[10px] font-semibold text-gray-400 uppercase mb-2">{t.overview.recentTransactions}</Text>
      <View className="bg-surface rounded-2xl overflow-hidden mb-6">
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
                {tx.type === "income" ? "+" : "−"}{fmt(Number(tx.amount), currency)}
              </Text>
            </View>
          ))
        )}
      </View>

    </ScrollView>
  )
}
