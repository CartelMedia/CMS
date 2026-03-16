/**
 * Root homepage — NOTE: app/(frontend)/page.js also resolves to '/' due to the route group.
 * Next.js will use this file for '/' and ignore app/(frontend)/page.js for that route.
 * To resolve the route conflict cleanly, delete app/(frontend)/page.js.
 */
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import { Calendar, User, ArrowRight, BookOpen } from 'lucide-react'

export const revalidate = 60

async function getData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const [settingsRes, postsRes, categoriesRes, featuredRes] = await Promise.all([
    supabase.from('options').select('option_key, option_value').in('option_key', ['site_title', 'tagline']),
    supabase.from('posts')
      .select('id, title, slug, excerpt, content_html, featured_image, published_at, author:users(name, avatar_url), post_categories(categories(name, slug))')
      .eq('status', 'published').eq('type', 'post')
      .order('published_at', { ascending: false }).limit(9),
    supabase.from('categories').select('id, name, slug').limit(8),
    supabase.from('posts')
      .select('id, title, slug, excerpt, featured_image, published_at, author:users(name, avatar_url)')
      .eq('status', 'published').eq('type', 'post').eq('is_featured', true)
      .order('published_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  const settings = {}
  settingsRes.data?.forEach(row => { settings[row.option_key] = row.option_value })

  return {
    settings,
    posts: postsRes.data || [],
    categories: categoriesRes.data || [],
    featured: featuredRes.data,
  }
}

export async function generateMetadata() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const { data } = await supabase.from('options').select('option_key, option_value').in('option_key', ['site_title', 'tagline'])
  const s = {}
  data?.forEach(row => { s[row.option_key] = row.option_value })
  return { title: s.site_title || 'ModernCMS', description: s.tagline || 'A modern CMS' }
}

function PostCard({ post, featured = false }) {
  const date = post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''
  const cats = post.post_categories?.map(pc => pc.categories).filter(Boolean) || []
  const excerpt = post.excerpt || (post.content_html || '').replace(/<[^>]+>/g, '').slice(0, 150) + '...'

  if (featured) {
    return (
      <Link href={`/${post.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
        <div style={{
          position: 'relative', borderRadius: '20px', overflow: 'hidden',
          background: post.featured_image
            ? `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(8,8,20,0.95)), url(${post.featured_image}) center/cover`
            : 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))',
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '40px', minHeight: '360px',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white', padding: '4px 12px', borderRadius: '20px',
            fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em',
            textTransform: 'uppercase', marginBottom: '14px', width: 'fit-content',
          }}>Featured</span>
          <h2 style={{ color: '#f1f5f9', fontSize: '28px', fontWeight: 800, lineHeight: 1.25, margin: '0 0 12px', letterSpacing: '-0.01em' }}>{post.title}</h2>
          <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: 1.6, margin: '0 0 20px' }}>{excerpt}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#64748b', fontSize: '13px' }}>
            {post.author?.name && <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={13} /> {post.author.name}</span>}
            {date && <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={13} /> {date}</span>}
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', marginLeft: 'auto', color: '#a5b4fc', fontWeight: 600 }}>
              Read More <ArrowRight size={14} />
            </span>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link href={`/${post.slug}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      <article style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '16px', overflow: 'hidden', height: '100%',
        display: 'flex', flexDirection: 'column',
      }}>
        {post.featured_image ? (
          <div style={{ height: '200px', background: `url(${post.featured_image}) center/cover` }} />
        ) : (
          <div style={{ height: '160px', background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.06))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={40} color="rgba(99,102,241,0.3)" />
          </div>
        )}
        <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          {cats.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
              {cats.slice(0, 2).map(cat => (
                <span key={cat.slug} style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#8b5cf6', background: 'rgba(139,92,246,0.12)', padding: '2px 8px', borderRadius: '4px' }}>
                  {cat.name}
                </span>
              ))}
            </div>
          )}
          <h3 style={{ color: '#f1f5f9', fontSize: '17px', fontWeight: 700, lineHeight: 1.35, margin: '0 0 10px' }}>{post.title}</h3>
          <p style={{ color: '#64748b', fontSize: '13px', lineHeight: 1.65, margin: '0 0 16px', flex: 1 }}>{excerpt.slice(0, 120)}{excerpt.length > 120 ? '...' : ''}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#475569', fontSize: '12px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 'auto' }}>
            {post.author?.name && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={11} /> {post.author.name}</span>}
            {date && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={11} /> {date}</span>}
            <span style={{ marginLeft: 'auto', color: '#6366f1', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>Read <ArrowRight size={11} /></span>
          </div>
        </div>
      </article>
    </Link>
  )
}

export default async function HomePage() {
  const { settings, posts, categories, featured } = await getData()
  const [heroPost, ...restPosts] = posts
  const displayFeatured = featured || heroPost

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #080810 0%, #0a0a18 40%, #080c18 70%, #060610 100%)', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <SiteHeader />
      <main style={{ flex: 1 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
          {displayFeatured && (
            <section style={{ marginBottom: '56px' }}>
              <PostCard post={displayFeatured} featured />
            </section>
          )}

          {categories.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '32px', alignItems: 'center' }}>
              <Link href="/" style={{ padding: '6px 16px', borderRadius: '20px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>All</Link>
              {categories.map(cat => (
                <Link key={cat.slug} href={`/category/${cat.slug}`} style={{ padding: '6px 16px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', textDecoration: 'none', fontSize: '13px' }}>
                  {cat.name}
                </Link>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h2 style={{ color: '#f1f5f9', fontSize: '20px', fontWeight: 700, margin: 0 }}>Latest Posts</h2>
            <Link href="/search" style={{ color: '#6366f1', textDecoration: 'none', fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>View all <ArrowRight size={13} /></Link>
          </div>

          {posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '16px', color: '#475569' }}>
              <BookOpen size={48} style={{ margin: '0 auto 16px', display: 'block', color: '#334155' }} />
              <h3 style={{ color: '#64748b', marginBottom: '8px' }}>No posts yet</h3>
              <p style={{ fontSize: '14px', margin: 0 }}>Check back soon for new content.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              {(displayFeatured ? restPosts : posts).map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
