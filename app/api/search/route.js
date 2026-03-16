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
  const q = searchParams.get('q')
  const type = searchParams.get('type') || 'post'
  const perPage = parseInt(searchParams.get('per_page') || '10')
  const page = parseInt(searchParams.get('page') || '1')

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ results: [], total: 0, query: q })
  }

  const { data, error, count } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, content_html, type, status, published_at, author:users(name, avatar_url)', { count: 'exact' })
    .eq('status', 'published')
    .eq('type', type)
    .or(`title.ilike.%${q}%,excerpt.ilike.%${q}%,content_html.ilike.%${q}%`)
    .order('published_at', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ results: data, total: count, query: q, page, perPage })
}
