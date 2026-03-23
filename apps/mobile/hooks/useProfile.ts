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

    const meta = session.user.user_metadata

    supabase
      .from("User")
      .select("id, name, email, avatarUrl, currency")
      .eq("id", session.user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setProfile({
            ...data,
            avatarUrl: data.avatarUrl ?? meta?.avatar_url ?? meta?.picture ?? null,
            name: data.name ?? meta?.full_name ?? meta?.name ?? null,
          })
        } else {
          setProfile(null)
        }
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

  async function updateAvatar(file: File) {
    if (!session?.user) return
    const ext = file.name.split(".").pop() ?? "jpg"
    const path = `${session.user.id}/avatar.${ext}`
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type })
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path)
    // append cache-buster so the browser reloads the image after update
    const urlWithBust = `${publicUrl}?t=${Date.now()}`
    const { data } = await supabase
      .from("User")
      .update({ avatarUrl: urlWithBust })
      .eq("id", session.user.id)
      .select("id, name, email, avatarUrl, currency")
      .single()
    if (data) setProfile((prev) => ({ ...prev!, ...data, avatarUrl: urlWithBust }))
  }

  return { profile, loading, updateCurrency, updateAvatar }
}
