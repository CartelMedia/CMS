import { createClient } from '@supabase/supabase-js'

export const revalidate = 3600

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export default async function sitemap() {
  const supabase = getSupabase()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'

  const [postsRes, categoriesRes, tagsRes] = await Promise.all([
    supabase.from('posts').select('slug, updated_at, type').eq('status', 'published').order('updated_at', { ascending: false }),
    supabase.from('categories').select('slug, updated_at'),
    supabase.from('tags').select('slug, updated_at'),
  ])

  const staticRoutes = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/search`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
  ]

  const postRoutes = (postsRes.data || []).map(post => ({
    url: `${siteUrl}/${post.slug}`,
    lastModified: post.updated_at ? new Date(post.updated_at) : new Date(),
    changeFrequency: 'weekly',
    priority: post.type === 'page' ? 0.8 : 0.7,
  }))

  const categoryRoutes = (categoriesRes.data || []).map(cat => ({
    url: `${siteUrl}/category/${cat.slug}`,
    lastModified: cat.updated_at ? new Date(cat.updated_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  const tagRoutes = (tagsRes.data || []).map(tag => ({
    url: `${siteUrl}/tag/${tag.slug}`,
    lastModified: tag.updated_at ? new Date(tag.updated_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.4,
  }))

  return [...staticRoutes, ...postRoutes, ...categoryRoutes, ...tagRoutes]
}
