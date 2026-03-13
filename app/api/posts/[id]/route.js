import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const { data, error } = await supabase
      .from('posts')
      .select('*, author:users!author_id(id, display_name, email, avatar_url)')
      .eq('id', id)
      .single()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    // Fetch categories and tags
    const [catRes, tagRes] = await Promise.all([
      supabase.from('post_categories').select('category_id, categories(id, name, slug)').eq('post_id', id),
      supabase.from('post_tags').select('tag_id, tags(id, name, slug)').eq('post_id', id),
    ])

    data.categories = catRes.data?.map(r => r.categories) || []
    data.tags = tagRes.data?.map(r => r.tags) || []

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { categories, tags, ...updates } = body

    // Handle publish date
    if (updates.status === 'publish') {
      const { data: existing } = await supabase
        .from('posts')
        .select('published_at, status')
        .eq('id', id)
        .single()

      if (existing && !existing.published_at) {
        updates.published_at = new Date().toISOString()
      }
    }

    // Remove undefined values
    Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key])

    const { data, error } = await supabase
      .from('posts')
      .update(updates)
      .eq('id', id)
      .select('*, author:users!author_id(id, display_name, email)')
      .single()

    if (error) throw error

    // Update categories if provided
    if (categories !== undefined) {
      await supabase.from('post_categories').delete().eq('post_id', id)
      if (categories.length > 0) {
        await supabase.from('post_categories').insert(
          categories.map(cid => ({ post_id: parseInt(id), category_id: cid }))
        )
      }
    }

    // Update tags if provided
    if (tags !== undefined) {
      await supabase.from('post_tags').delete().eq('post_id', id)
      if (tags.length > 0) {
        await supabase.from('post_tags').insert(
          tags.map(tid => ({ post_id: parseInt(id), tag_id: tid }))
        )
      }
    }

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
