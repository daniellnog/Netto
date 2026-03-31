// Shared types across apps

export type Currency = string // ISO 4217 (e.g. "BRL", "USD", "EUR")

export type TransactionType = "income" | "expense"

export interface User {
  id: string
  name: string
  email: string
  currency: Currency
  createdAt: Date
}

export interface Transaction {
  id: string
  userId: string
  type: TransactionType
  amount: number
  currency: Currency
  description: string
  category: string
  date: Date
  createdAt: Date
}

export interface SpendingLimit {
  id: string
  userId: string
  category: string
  amount: number
  currency: Currency
}

export type BillRecurrence = "once" | "weekly" | "monthly" | "yearly"

export type BillPaymentStatus = "pending" | "paid" | "overdue"

export interface Bill {
  id: string
  userId: string
  name: string
  amount: number
  type: TransactionType
  recurrence: BillRecurrence
  dueDay?: number
  startDate: Date
  category: string
  notes?: string
  isActive: boolean
  createdAt: Date
}

export interface BillPayment {
  id: string
  billId: string
  userId: string
  amount: number
  dueDate: Date
  paidAt?: Date
  status: BillPaymentStatus
  transactionId?: string
  createdAt: Date
}
