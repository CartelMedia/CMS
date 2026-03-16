import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export async function GET(request) {
  const supabase = getSupabase()
  const { searchParams } = new URL(request.url)
  const keys = searchParams.get('keys')

  let query = supabase.from('options').select('option_key, option_value')
  if (keys) query = query.in('option_key', keys.split(','))

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const settings = {}
  data?.forEach(row => {
    try { settings[row.option_key] = JSON.parse(row.option_value) }
    catch { settings[row.option_key] = row.option_value }
  })

  return NextResponse.json({ settings })
}

export async function PUT(request) {
  const supabase = getSupabase()
  try {
    const body = await request.json()
    const entries = Object.entries(body).map(([key, value]) => ({
      option_key: key,
      option_value: typeof value === 'string' ? value : JSON.stringify(value),
    }))

    const { error } = await supabase
      .from('options')
      .upsert(entries, { onConflict: 'option_key' })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
