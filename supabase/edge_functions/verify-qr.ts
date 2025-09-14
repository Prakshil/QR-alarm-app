// @ts-nocheck
// Supabase Edge Function: verify-qr
// Validates a QR code with RLS using the caller's Authorization (if any)
// Request:  { qr_code: string }
// Response: { valid: boolean, profile?: any, reason?: string }

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { qr_code } = await req.json()
    if (!qr_code) return json({ valid: false, reason: 'missing_qr' }, 400)

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
    const authHeader = req.headers.get('Authorization') || ''

    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data, error } = await client
      .from('profiles')
      .select('id, user_id, name, qr_code')
      .eq('qr_code', qr_code)
      .limit(1)

    if (error) return json({ valid: false, reason: 'db_error' }, 500)

    const row = Array.isArray(data) && data.length ? data[0] : null
    return json({ valid: !!row, profile: row || undefined }, 200)
  } catch (e) {
    return json({ valid: false, reason: 'exception', message: String(e) }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    status,
  })
}
