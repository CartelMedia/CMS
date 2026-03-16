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
  const type = searchParams.get('type')
  const search = searchParams.get('search')
  const perPage = parseInt(searchParams.get('per_page') || '20')
  const page = parseInt(searchParams.get('page') || '1')

  let query = supabase
    .from('media')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1)

  if (type && type !== 'all') query = query.ilike('file_type', `${type}%`)
  if (search) query = query.ilike('file_name', `%${search}%`)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ media: data, total: count, page, perPage })
}

export async function POST(request) {
  const supabase = getSupabase()
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const altText = formData.get('alt_text') || ''
    const caption = formData.get('caption') || ''
    const uploadedBy = formData.get('uploaded_by')

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const filePath = `uploads/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, buffer, { contentType: file.type })

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(filePath)

    const { data, error } = await supabase
      .from('media')
      .insert({
        file_name: file.name, file_url: publicUrl,
        file_type: file.type, file_size: file.size,
        alt_text: altText, caption, uploaded_by: uploadedBy,
        storage_path: filePath,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ media: data }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  const supabase = getSupabase()
  try {
    const { ids } = await request.json()
    if (!ids || !ids.length) return NextResponse.json({ error: 'No IDs provided' }, { status: 400 })

    const { data: mediaItems } = await supabase.from('media').select('storage_path').in('id', ids)
    if (mediaItems?.length) {
      const paths = mediaItems.map(m => m.storage_path).filter(Boolean)
      if (paths.length) await supabase.storage.from('media').remove(paths)
    }

    const { error } = await supabase.from('media').delete().in('id', ids)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, deleted: ids.length })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
