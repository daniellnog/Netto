import "../global.css"
import { Stack, useRouter, useSegments } from "expo-router"
import { useEffect } from "react"
import { AuthProvider, useAuth } from "../context/auth"
import { LocaleProvider } from "../context/locale"

function RootLayoutNav() {
  const { session, loading } = useAuth()
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    if (loading) return

    const inAuthGroup = segments[0] === "login"

    if (!session && !inAuthGroup) {
      router.replace("/login")
    } else if (session && inAuthGroup) {
      router.replace("/(app)")
    }
  }, [session, loading, segments, router])

  return <Stack screenOptions={{ headerShown: false }} />
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <LocaleProvider>
        <RootLayoutNav />
      </LocaleProvider>
    </AuthProvider>
  )
}
