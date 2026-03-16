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
  const location = searchParams.get('location')

  let query = supabase.from('menus').select('*, items:menu_items(*)')
  if (location) query = query.eq('location', location)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const menus = data?.map(menu => ({
    ...menu,
    items: (menu.items || []).sort((a, b) => a.position - b.position),
  }))

  return NextResponse.json({ menus })
}

export async function PUT(request) {
  const supabase = getSupabase()
  try {
    const body = await request.json()
    const { menu_id, items } = body

    if (!menu_id || !items) return NextResponse.json({ error: 'menu_id and items are required' }, { status: 400 })

    await supabase.from('menu_items').delete().eq('menu_id', menu_id)

    if (items.length > 0) {
      const { error } = await supabase.from('menu_items').insert(
        items.map((item, idx) => ({ ...item, menu_id, position: idx }))
      )
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
