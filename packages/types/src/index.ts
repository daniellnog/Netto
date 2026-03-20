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
