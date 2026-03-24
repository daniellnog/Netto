import { useState, useRef } from "react"
import { View, Text, TouchableOpacity, Modal, Pressable } from "react-native"
import { useRouter, usePathname } from "expo-router"
import { useProfile } from "../hooks/useProfile"
import { useAuth } from "../context/auth"
import { useLocale } from "../context/locale"
import { supabase } from "../lib/supabase"

function AvatarImage() {
  const { profile } = useProfile()
  const { session } = useAuth()

  const meta = session?.user?.user_metadata
  const avatarUrl = profile?.avatarUrl ?? meta?.avatar_url ?? meta?.picture ?? null

  const initials = (profile?.name ?? meta?.full_name ?? meta?.name ?? "")
    .split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase() || "?"

  if (avatarUrl) {
    return (
      // @ts-ignore – img is valid on web
      <img src={avatarUrl} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} referrerPolicy="no-referrer" />
    )
  }

  return (
    <View className="w-8 h-8 rounded-full bg-white/30 items-center justify-center">
      <Text className="text-white text-xs font-bold">{initials}</Text>
    </View>
  )
}

function UserMenu() {
  const [open, setOpen] = useState(false)
  const { profile } = useProfile()
  const { t } = useLocale()
  const router = useRouter()
  const avatarRef = useRef<View>(null)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })

  function handleAvatarPress() {
    avatarRef.current?.measureInWindow((x, y, width, height) => {
      setMenuPos({ top: y + height + 8, left: x + width - 200 })
      setOpen(true)
    })
  }

  async function handleLogout() {
    setOpen(false)
    await supabase.auth.signOut()
  }

  function handleSettings() {
    setOpen(false)
    router.push("/(app)/settings" as any)
  }

  return (
    <View>
      <TouchableOpacity ref={avatarRef} onPress={handleAvatarPress} className="ml-4">
        <AvatarImage />
      </TouchableOpacity>

      <Modal transparent visible={open} onRequestClose={() => setOpen(false)} animationType="fade">
        <Pressable className="flex-1" onPress={() => setOpen(false)}>
          <View
            className="absolute bg-surface rounded-xl shadow-lg overflow-hidden"
            style={{ top: menuPos.top, left: menuPos.left, minWidth: 200 }}
          >
            <View className="px-4 py-3 border-b border-gray-100">
              <Text className="text-sm font-semibold text-gray-900">{profile?.name ?? t.common.user}</Text>
              <Text className="text-xs text-gray-500 mt-0.5">{profile?.email}</Text>
            </View>

            <TouchableOpacity className="flex-row items-center px-4 py-3 gap-3" onPress={handleSettings}>
              <Text className="text-sm text-gray-700">{t.header.settings}</Text>
            </TouchableOpacity>

            <View className="h-px bg-gray-100" />

            <TouchableOpacity className="flex-row items-center px-4 py-3 gap-3" onPress={handleLogout}>
              <Text className="text-sm text-danger">{t.header.signOut}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  )
}

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useLocale()

  const NAV_ITEMS = [
    { label: t.nav.overview, href: "/(app)" },
    { label: t.nav.transactions, href: "/(app)/transactions" },
    { label: t.nav.reports, href: "/(app)/reports" },
    { label: t.nav.limits, href: "/(app)/limits" },
    { label: t.nav.settings, href: "/(app)/settings" },
  ]

  function isActive(href: string) {
    if (href === "/(app)") return pathname === "/" || pathname === "/index"
    return pathname.includes(href.replace("/(app)", ""))
  }

  return (
    <View className="bg-primary w-full">
      <View className="flex-row items-center h-14 w-full max-w-6xl mx-auto px-6">
        <Text className="text-white text-lg font-bold mr-10">Netto</Text>

        <View className="flex-row flex-1 gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href)
            return (
              <TouchableOpacity
                key={item.href}
                onPress={() => router.push(item.href as any)}
                className={`px-4 py-1.5 rounded-full ${active ? "bg-white/20" : ""}`}
              >
                <Text className={`text-sm font-medium ${active ? "text-white font-semibold" : "text-white/75"}`}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        <UserMenu />
      </View>
    </View>
  )
}
