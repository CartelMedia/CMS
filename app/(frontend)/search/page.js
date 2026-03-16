import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { Calendar, User, ArrowRight, Search, BookOpen } from 'lucide-react'

export const dynamic = 'force-dynamic'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export async function generateMetadata({ searchParams }) {
  const q = (await searchParams)?.q || ''
  return { title: q ? `Search: "${q}"` : 'Search' }
}

export default async function SearchPage({ searchParams }) {
  const params = await searchParams
  const q = params?.q || ''
  const page = parseInt(params?.page || '1')
  const perPage = 10
  const supabase = getSupabase()

  let results = [], total = 0

  if (q.trim().length >= 2) {
    const { data, count } = await supabase
      .from('posts')
      .select('id, title, slug, excerpt, content_html, featured_image, published_at, type, author:users(name, avatar_url)', { count: 'exact' })
      .eq('status', 'published')
      .or(`title.ilike.%${q}%,excerpt.ilike.%${q}%`)
      .order('published_at', { ascending: false })
      .range((page - 1) * perPage, page * perPage - 1)

    results = data || []
    total = count || 0
  }

  const totalPages = Math.ceil(total / perPage)

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
      {/* Search Header */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Search size={20} color="white" />
          </div>
          <div>
            <h1 style={{ color: '#f1f5f9', fontSize: '24px', fontWeight: 800, margin: 0 }}>
              {q ? `Search results for "${q}"` : 'Search'}
            </h1>
            {q && (
              <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
                {total} result{total !== 1 ? 's' : ''} found
              </p>
            )}
          </div>
        </div>

        {/* Search Form */}
        <form method="GET" action="/search">
          <div style={{ position: 'relative', maxWidth: '560px' }}>
            <Search size={16} style={{
              position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
              color: '#475569', pointerEvents: 'none',
            }} />
            <input
              type="search" name="q" defaultValue={q}
              placeholder="Search posts and pages..."
              style={{
                width: '100%', padding: '12px 100px 12px 44px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px', color: '#e2e8f0', fontSize: '15px', outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
            <button type="submit" style={{
              position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none', borderRadius: '8px', padding: '8px 16px',
              color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            }}>
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Results */}
      {!q.trim() ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#475569' }}>
          <Search size={48} style={{ margin: '0 auto 16px', display: 'block', color: '#334155' }} />
          <p style={{ fontSize: '15px' }}>Enter a search term to find posts.</p>
        </div>
      ) : q.trim().length < 2 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#475569' }}>
          <p>Please enter at least 2 characters to search.</p>
        </div>
      ) : results.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)',
          borderRadius: '16px', color: '#475569',
        }}>
          <BookOpen size={48} style={{ margin: '0 auto 16px', display: 'block', color: '#334155' }} />
          <h3 style={{ color: '#64748b', marginBottom: '8px' }}>No results found</h3>
          <p style={{ fontSize: '14px', margin: 0 }}>No posts match &ldquo;{q}&rdquo;. Try different keywords.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {results.map(post => {
            const excerpt = post.excerpt || (post.content_html || '').replace(/<[^>]+>/g, '').slice(0, 200)
            const date = post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''

            // Highlight search term in title and excerpt
            function highlight(text, query) {
              if (!query) return text
              const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
              return parts.map((part, i) =>
                part.toLowerCase() === query.toLowerCase()
                  ? <mark key={i} style={{ background: 'rgba(99,102,241,0.3)', color: '#a5b4fc', borderRadius: '2px', padding: '0 2px' }}>{part}</mark>
                  : part
              )
            }

            return (
              <Link key={post.id} href={`/${post.slug}`} style={{ textDecoration: 'none' }}>
                <article style={{
                  display: 'flex', gap: '16px',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '16px', padding: '20px', overflow: 'hidden',
                  transition: 'transform 0.2s, border-color 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
                >
                  {post.featured_image && (
                    <div style={{ width: '120px', height: '90px', flexShrink: 0, borderRadius: '10px', background: `url(${post.featured_image}) center/cover`, overflow: 'hidden' }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{
                        fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                        color: post.type === 'page' ? '#f59e0b' : '#6366f1',
                        background: post.type === 'page' ? 'rgba(245,158,11,0.12)' : 'rgba(99,102,241,0.12)',
                        padding: '2px 7px', borderRadius: '4px',
                      }}>
                        {post.type}
                      </span>
                    </div>
                    <h2 style={{ color: '#f1f5f9', fontSize: '17px', fontWeight: 700, lineHeight: 1.3, margin: '0 0 8px' }}>
                      {highlight(post.title, q)}
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '13px', lineHeight: 1.6, margin: '0 0 12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {excerpt}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: '#475569', fontSize: '12px' }}>
                      {post.author?.name && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={11} /> {post.author.name}</span>}
                      {date && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={11} /> {date}</span>}
                      <span style={{ marginLeft: 'auto', color: '#6366f1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                        Read <ArrowRight size={11} />
                      </span>
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
            <Link key={p} href={`/search?q=${encodeURIComponent(q)}&page=${p}`} style={{
              width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '8px', border: '1px solid',
              borderColor: p === page ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)',
              background: p === page ? 'rgba(99,102,241,0.15)' : 'none',
              color: p === page ? '#a5b4fc' : '#64748b',
              textDecoration: 'none', fontSize: '13px', fontWeight: p === page ? 600 : 400,
            }}>
              {p}
            </Link>
          ))}
        </div>
      )}
      <style>{`input::placeholder { color: #475569; } input[type="search"]::-webkit-search-cancel-button { display: none; }`}</style>
    </div>
  )
}
