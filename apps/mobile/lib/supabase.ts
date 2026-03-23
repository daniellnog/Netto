import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBISHABLE_KEY!

export const supabase = createClient(supabaseUrl, supabasePublishableKey)
