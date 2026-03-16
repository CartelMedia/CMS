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
  const status = searchParams.get('status')
  const parent = searchParams.get('parent')
  const perPage = parseInt(searchParams.get('per_page') || '20')
  const page = parseInt(searchParams.get('page') || '1')

  let query = supabase
    .from('posts')
    .select('*, author:users(id, name, email, avatar_url)', { count: 'exact' })
    .eq('type', 'page')
    .order('created_at', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1)

  if (status) query = query.eq('status', status)
  if (parent) query = query.eq('parent_id', parent)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ pages: data, total: count, page, perPage })
}

export async function POST(request) {
  const supabase = getSupabase()
  try {
    const body = await request.json()
    const { title, slug, content_json, content_html, status = 'draft', author_id, parent_id, template, featured_image, excerpt } = body

    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

    const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const { data, error } = await supabase
      .from('posts')
      .insert({
        title, slug: finalSlug, content_json, content_html,
        status, author_id, parent_id, template,
        featured_image, excerpt, type: 'page',
        published_at: status === 'published' ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ page: data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
