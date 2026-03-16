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
  const { data, error } = await supabase.from('comments').select('*, post:posts(id, title, slug)').eq('id', id).single()
  if (error) return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
  return NextResponse.json({ comment: data })
}

export async function PUT(request, { params }) {
  const supabase = getSupabase()
  const { id } = await params
  try {
    const body = await request.json()
    const { content, status, author_name, author_email } = body
    const updates = {}
    if (content !== undefined) updates.content = content
    if (status !== undefined) updates.status = status
    if (author_name !== undefined) updates.author_name = author_name
    if (author_email !== undefined) updates.author_email = author_email

    const { data, error } = await supabase.from('comments').update(updates).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ comment: data })
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
    const { error } = await supabase.from('comments').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  const { data, error } = await supabase.from('comments').update({ status: 'trash' }).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comment: data })
}
