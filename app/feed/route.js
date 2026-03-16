import { createClient } from '@supabase/supabase-js'

export const revalidate = 3600

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

function escapeXml(str) {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET(request) {
  const supabase = getSupabase()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin

  const [settingsRes, postsRes] = await Promise.all([
    supabase.from('options').select('option_key, option_value').in('option_key', ['site_title', 'tagline']),
    supabase.from('posts')
      .select('id, title, slug, excerpt, content_html, published_at, author:users(name, email)')
      .eq('status', 'published').eq('type', 'post')
      .order('published_at', { ascending: false }).limit(20),
  ])

  const settings = {}
  settingsRes.data?.forEach(row => { settings[row.option_key] = row.option_value })

  const siteName = settings.site_title || 'ModernCMS'
  const tagline = settings.tagline || 'A modern content management system'
  const posts = postsRes.data || []

  const items = posts.map(post => {
    const excerpt = post.excerpt || (post.content_html || '').replace(/<[^>]+>/g, '').slice(0, 300)
    return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${siteUrl}/${post.slug}</link>
      <guid isPermaLink="true">${siteUrl}/${post.slug}</guid>
      <pubDate>${new Date(post.published_at).toUTCString()}</pubDate>
      <author>${escapeXml(post.author?.email || '')} (${escapeXml(post.author?.name || 'Author')})</author>
      <description>${escapeXml(excerpt)}</description>
      <content:encoded><![CDATA[${post.content_html || ''}]]></content:encoded>
    </item>`
  }).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${siteUrl}</link>
    <description>${escapeXml(tagline)}</description>
    <language>en-US</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed" rel="self" type="application/rss+xml" />
    <generator>ModernCMS</generator>
    ${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
    },
  })
}
