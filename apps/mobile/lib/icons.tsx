import {
  Banknote,
  BookOpen,
  Briefcase,
  Building2,
  Car,
  ChartBar,
  Coffee,
  Coins,
  CreditCard,
  Dumbbell,
  Film,
  FolderOpen,
  Gamepad2,
  Gem,
  Gift,
  Globe,
  HeartPulse,
  House,
  Landmark,
  Lightbulb,
  Music,
  PawPrint,
  Pill,
  Pizza,
  Plane,
  Shirt,
  ShoppingCart,
  Smartphone,
  Star,
  Target,
  TrendingUp,
  Utensils,
  Wallet,
  Wrench,
} from "lucide-react-native"
import type { LucideIcon } from "lucide-react-native"
import React from "react"
import { View } from "react-native"

export const ICON_REGISTRY: Record<string, LucideIcon> = {
  Banknote,
  BookOpen,
  Briefcase,
  Building2,
  Car,
  ChartBar,
  Coffee,
  Coins,
  CreditCard,
  Dumbbell,
  Film,
  FolderOpen,
  Gamepad2,
  Gem,
  Gift,
  Globe,
  HeartPulse,
  House,
  Landmark,
  Lightbulb,
  Music,
  PawPrint,
  Pill,
  Pizza,
  Plane,
  Shirt,
  ShoppingCart,
  Smartphone,
  Star,
  Target,
  TrendingUp,
  Utensils,
  Wallet,
  Wrench,
}

export const ACCOUNT_ICON_NAMES = [
  "CreditCard",
  "Building2",
  "Coins",
  "Landmark",
  "Banknote",
  "ChartBar",
  "House",
  "Plane",
  "Target",
  "Briefcase",
  "Wallet",
  "Gem",
]

export const CATEGORY_ICON_NAMES = [
  "ShoppingCart",
  "Utensils",
  "Pizza",
  "Coffee",
  "Car",
  "Plane",
  "HeartPulse",
  "BookOpen",
  "Gamepad2",
  "Shirt",
  "Pill",
  "Wrench",
  "House",
  "Lightbulb",
  "Smartphone",
  "Film",
  "Music",
  "PawPrint",
  "Dumbbell",
  "Coins",
  "Banknote",
  "TrendingUp",
  "Briefcase",
  "Gift",
  "Star",
  "Target",
  "Building2",
  "Gem",
  "Globe",
  "FolderOpen",
]

export const CARD_ICON_NAMES = [
  "CreditCard",
  "Globe",
  "Gem",
  "Star",
  "Coins",
  "Banknote",
  "Target",
  "Briefcase",
]

export const DEFAULT_ACCOUNT_ICON = "CreditCard"
export const DEFAULT_CATEGORY_ICON = "FolderOpen"
export const DEFAULT_CARD_ICON = "CreditCard"

type AppIconProps = {
  name: string
  size?: number
  color?: string
  strokeWidth?: number
}

export function AppIcon({ name, size = 20, color = "#6B7280", strokeWidth = 2 }: AppIconProps) {
  const Icon = ICON_REGISTRY[name]
  if (!Icon) return <View style={{ width: size, height: size }} />
  return <Icon size={size} color={color} strokeWidth={strokeWidth} />
}
