import { createClient } from '@supabase/supabase-js'
import { getOrCreateDeviceId } from './device'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      'x-device-id': getOrCreateDeviceId()
    }
  }
})