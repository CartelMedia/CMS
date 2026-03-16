import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const postType = searchParams.get('post_type') || 'post'
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('per_page') || '20')
    const authorId = searchParams.get('author_id')
    const orderBy = searchParams.get('order_by') || 'created_at'
    const order = searchParams.get('order') || 'desc'

    let query = supabase
      .from('posts')
      .select('*, author:users!author_id(id, name, email, avatar_url)', { count: 'exact' })
      .eq('type', postType)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    } else {
      query = query.neq('status', 'trash')
    }

    if (authorId) {
      query = query.eq('author_id', authorId)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content_html.ilike.%${search}%`)
    }

    const from = (page - 1) * perPage
    const to = from + perPage - 1

    query = query.order(orderBy, { ascending: order === 'asc' }).range(from, to)

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({ data, total: count, page, per_page: perPage })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const {
      title, content_json, content_html, excerpt, status = 'draft',
      post_type = 'post', author_id, featured_image, parent_id,
      template, page_order, comment_status, visibility, password,
      scheduled_at, slug: customSlug,
    } = body

    // Auto-generate slug
    let slug = customSlug || title?.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s]+/g, '-')
      .replace(/^-+|-+$/g, '')
    
    // Ensure slug uniqueness
    const { data: existing } = await supabase
      .from('posts')
      .select('slug')
      .eq('slug', slug)
      .maybeSingle()

    if (existing) {
      slug = `${slug}-${Date.now()}`
    }

    const postData = {
      title: title || '',
      slug,
      content_json,
      content_html,
      excerpt,
      status,
      type: post_type,
      author_id,
      featured_image,
      parent_id,
      template,
      page_order,
      comment_status: comment_status || 'open',
      visibility: visibility || 'public',
      password,
      scheduled_at,
      published_at: status === 'published' ? new Date().toISOString() : null,
    }

    // Remove undefined values
    Object.keys(postData).forEach(key => postData[key] === undefined && delete postData[key])

    const { data, error } = await supabase
      .from('posts')
      .insert([postData])
      .select('*, author:users!author_id(id, name, email)')
      .single()

    if (error) throw error

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
