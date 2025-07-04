import { createClient } from '@supabase/supabase-js'
import 'react-native-url-polyfill/auto'

export const supabaseUrl = 'https://prvfvlyzfyprjliqniki.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBydmZ2bHl6ZnlwcmpsaXFuaWtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNjk5MjUsImV4cCI6MjA2NDY0NTkyNX0.R3TRC1-FOlEuihuIW7oDTNGYYalpzC4v7qn46wOa1dw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})