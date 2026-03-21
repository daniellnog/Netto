import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { useAuth } from "../context/auth"

export type Profile = {
  id: string
  name: string | null
  email: string
  avatarUrl: string | null
  currency: string
}

export function useProfile() {
  const { session } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user) {
      setProfile(null)
      setLoading(false)
      return
    }

    supabase
      .from("User")
      .select("id, name, email, avatarUrl, currency")
      .eq("id", session.user.id)
      .single()
      .then(({ data }) => {
        setProfile(data)
        setLoading(false)
      })
  }, [session])

  async function updateCurrency(currency: string) {
    if (!session?.user) return
    const { data } = await supabase
      .from("User")
      .update({ currency })
      .eq("id", session.user.id)
      .select("id, name, email, avatarUrl, currency")
      .single()
    if (data) setProfile(data)
  }

  return { profile, loading, updateCurrency }
}
