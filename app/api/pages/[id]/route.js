import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export async function GET(request, { params }) {
  const supabase = getSupabase()
  const { id } = await params

  const isSlug = isNaN(parseInt(id))
  const query = isSlug
    ? supabase.from('posts').select('*, author:users(id, name, email, avatar_url)').eq('slug', id).eq('type', 'page').single()
    : supabase.from('posts').select('*, author:users(id, name, email, avatar_url)').eq('id', id).eq('type', 'page').single()

  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Page not found' }, { status: 404 })
  return NextResponse.json({ page: data })
}

export async function PUT(request, { params }) {
  const supabase = getSupabase()
  const { id } = await params
  try {
    const body = await request.json()
    const { title, slug, content_json, content_html, status, parent_id, template, featured_image, excerpt } = body

    const updates = { title, slug, content_json, content_html, status, parent_id, template, featured_image, excerpt, updated_at: new Date().toISOString() }
    if (status === 'published') updates.published_at = new Date().toISOString()

    const { data, error } = await supabase.from('posts').update(updates).eq('id', id).eq('type', 'page').select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ page: data })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

export async function DELETE(request, { params }) {
  const supabase = getSupabase()
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const permanent = searchParams.get('permanent') === 'true'

  if (permanent) {
    const { error } = await supabase.from('posts').delete().eq('id', id).eq('type', 'page')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  const { data, error } = await supabase.from('posts').update({ status: 'trash' }).eq('id', id).eq('type', 'page').select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ page: data })
}
