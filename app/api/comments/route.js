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
  const postId = searchParams.get('post_id')
  const perPage = parseInt(searchParams.get('per_page') || '20')
  const page = parseInt(searchParams.get('page') || '1')

  let query = supabase
    .from('comments')
    .select('*, post:posts(id, title, slug)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1)

  if (status) query = query.eq('status', status)
  if (postId) query = query.eq('post_id', postId)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comments: data, total: count, page, perPage })
}

export async function POST(request) {
  const supabase = getSupabase()
  try {
    const body = await request.json()
    const { post_id, author_name, author_email, author_url, content, parent_id } = body

    if (!post_id || !content) return NextResponse.json({ error: 'post_id and content are required' }, { status: 400 })
    if (!author_name || !author_email) return NextResponse.json({ error: 'author_name and author_email are required' }, { status: 400 })

    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id, author_name, author_email, author_url, content, parent_id, status: 'pending' })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ comment: data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
