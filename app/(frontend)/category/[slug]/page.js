import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Calendar, User, ArrowRight, FolderOpen, BookOpen } from 'lucide-react'

export const revalidate = 60

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const supabase = getSupabase()
  const { data } = await supabase.from('categories').select('name, description').eq('slug', slug).maybeSingle()
  if (!data) return { title: 'Category Not Found' }
  return { title: `${data.name} — Category`, description: data.description || `Posts in ${data.name}` }
}

export default async function CategoryPage({ params, searchParams }) {
  const { slug } = await params
  const page = parseInt((await searchParams)?.page || '1')
  const perPage = 9
  const supabase = getSupabase()

  const { data: category } = await supabase.from('categories').select('*').eq('slug', slug).maybeSingle()
  if (!category) notFound()

  const { data: postCats, count } = await supabase
    .from('post_categories')
    .select('post:posts(id, title, slug, excerpt, content_html, featured_image, published_at, author:users(name, avatar_url))', { count: 'exact' })
    .eq('category_id', category.id)
    .range((page - 1) * perPage, page * perPage - 1)

  const posts = (postCats || []).map(pc => pc.post).filter(p => p?.published_at)
  const totalPages = Math.ceil((count || 0) / perPage)

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
      {/* Header */}
      <div style={{
        padding: '40px', borderRadius: '20px', marginBottom: '40px',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 100%)',
        border: '1px solid rgba(99,102,241,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FolderOpen size={22} color="white" />
          </div>
          <div>
            <p style={{ color: '#6366f1', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Category</p>
            <h1 style={{ color: '#f1f5f9', fontSize: '28px', fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>{category.name}</h1>
          </div>
        </div>
        {category.description && (
          <p style={{ color: '#64748b', fontSize: '15px', lineHeight: 1.65, margin: '0 0 0 62px' }}>{category.description}</p>
        )}
        <p style={{ color: '#475569', fontSize: '13px', margin: '8px 0 0 62px' }}>
          {count || 0} post{count !== 1 ? 's' : ''} in this category
        </p>
      </div>

      {/* Posts Grid */}
      {posts.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '80px 20px',
          background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)',
          borderRadius: '16px', color: '#475569',
        }}>
          <BookOpen size={48} style={{ margin: '0 auto 16px', display: 'block', color: '#334155' }} />
          <p style={{ fontSize: '14px', margin: 0 }}>No posts in this category yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {posts.map(post => {
            const excerpt = post.excerpt || (post.content_html || '').replace(/<[^>]+>/g, '').slice(0, 120) + '...'
            const date = post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''
            return (
              <Link key={post.id} href={`/${post.slug}`} style={{ textDecoration: 'none' }}>
                <article style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '16px', overflow: 'hidden', height: '100%',
                  transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
                  display: 'flex', flexDirection: 'column',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  {post.featured_image ? (
                    <div style={{ height: '180px', background: `url(${post.featured_image}) center/cover` }} />
                  ) : (
                    <div style={{ height: '140px', background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.06))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BookOpen size={36} color="rgba(99,102,241,0.3)" />
                    </div>
                  )}
                  <div style={{ padding: '18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h2 style={{ color: '#f1f5f9', fontSize: '16px', fontWeight: 700, lineHeight: 1.35, margin: '0 0 10px' }}>{post.title}</h2>
                    <p style={{ color: '#64748b', fontSize: '13px', lineHeight: 1.6, margin: '0 0 14px', flex: 1 }}>{excerpt}</p>
                    <div style={{ display: 'flex', gap: '12px', color: '#475569', fontSize: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', marginTop: 'auto' }}>
                      {post.author?.name && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={11} /> {post.author.name}</span>}
                      {date && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={11} /> {date}</span>}
                      <span style={{ marginLeft: 'auto', color: '#6366f1', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>Read <ArrowRight size={11} /></span>
                    </div>
                  </div>
                </article>
              </Link>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '40px' }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <Link key={p} href={`/category/${slug}?page=${p}`} style={{
              width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '8px', border: '1px solid',
              borderColor: p === page ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)',
              background: p === page ? 'rgba(99,102,241,0.15)' : 'none',
              color: p === page ? '#a5b4fc' : '#64748b',
              textDecoration: 'none', fontSize: '13px', fontWeight: p === page ? 600 : 400,
              transition: 'all 0.15s',
            }}>
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
