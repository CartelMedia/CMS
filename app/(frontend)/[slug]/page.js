import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Calendar, User, Tag, MessageSquare, ArrowLeft, BookOpen } from 'lucide-react'
import CommentSection from '@/components/CommentSection'

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
  const { data } = await supabase.from('posts').select('title, excerpt, featured_image').eq('slug', slug).eq('status', 'published').maybeSingle()
  if (!data) return { title: 'Not Found' }
  return {
    title: data.title,
    description: data.excerpt || '',
    openGraph: { title: data.title, description: data.excerpt || '', images: data.featured_image ? [data.featured_image] : [] },
  }
}

export async function generateStaticParams() {
  const supabase = getSupabase()
  const { data } = await supabase.from('posts').select('slug').eq('status', 'published').limit(100)
  return (data || []).map(p => ({ slug: p.slug }))
}

async function getPost(slug) {
  const supabase = getSupabase()

  const { data: post, error } = await supabase
    .from('posts')
    .select(`
      *, author:users(id, name, email, avatar_url, bio),
      post_categories(categories(id, name, slug)),
      post_tags(tags(id, name, slug))
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error || !post) return null

  const { data: comments } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', post.id)
    .eq('status', 'approved')
    .order('created_at', { ascending: true })

  const { data: related } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, featured_image, published_at')
    .eq('status', 'published')
    .eq('type', post.type)
    .neq('id', post.id)
    .limit(3)

  return { post, comments: comments || [], related: related || [] }
}

function buildCommentTree(comments) {
  const map = {}
  const roots = []
  comments.forEach(c => { map[c.id] = { ...c, children: [] } })
  comments.forEach(c => {
    if (c.parent_id && map[c.parent_id]) map[c.parent_id].children.push(map[c.id])
    else roots.push(map[c.id])
  })
  return roots
}

function Comment({ comment, depth = 0 }) {
  const initials = (comment.author_name || 'A').slice(0, 2).toUpperCase()
  const date = new Date(comment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div style={{ marginLeft: depth > 0 ? '32px' : '0', marginBottom: '16px' }}>
      <div style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '12px', padding: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: '13px',
          }}>
            {initials}
          </div>
          <div>
            <p style={{ margin: 0, color: '#e2e8f0', fontSize: '14px', fontWeight: 600 }}>{comment.author_name}</p>
            <p style={{ margin: 0, color: '#475569', fontSize: '12px' }}>{date}</p>
          </div>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.65, margin: 0 }}>{comment.content}</p>
      </div>
      {comment.children?.map(child => <Comment key={child.id} comment={child} depth={depth + 1} />)}
    </div>
  )
}

export default async function SinglePostPage({ params }) {
  const { slug } = await params
  const data = await getPost(slug)

  if (!data) notFound()

  const { post, comments, related } = data
  const commentTree = buildCommentTree(comments)
  const cats = post.post_categories?.map(pc => pc.categories).filter(Boolean) || []
  const tags = post.post_tags?.map(pt => pt.tags).filter(Boolean) || []
  const publishDate = post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '40px', alignItems: 'start' }}>

        {/* Main Content */}
        <article>
          {/* Back */}
          <Link href="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            color: '#64748b', textDecoration: 'none', fontSize: '13px',
            padding: '6px 10px', borderRadius: '8px', marginBottom: '24px',
            transition: 'all 0.15s',
          }}
            onMouseEnter={undefined}
          >
            <ArrowLeft size={14} /> Back to Home
          </Link>

          {/* Categories */}
          {cats.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {cats.map(cat => (
                <Link key={cat.slug} href={`/category/${cat.slug}`} style={{
                  fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                  color: '#8b5cf6', background: 'rgba(139,92,246,0.12)',
                  padding: '3px 10px', borderRadius: '4px', textDecoration: 'none',
                  border: '1px solid rgba(139,92,246,0.2)', transition: 'all 0.15s',
                }}>
                  {cat.name}
                </Link>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 style={{ color: '#f1f5f9', fontSize: '36px', fontWeight: 800, lineHeight: 1.2, margin: '0 0 20px', letterSpacing: '-0.02em' }}>
            {post.title}
          </h1>

          {/* Meta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', color: '#64748b', fontSize: '13px', marginBottom: '32px', flexWrap: 'wrap' }}>
            {post.author?.name && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={13} /> {post.author.name}
              </span>
            )}
            {publishDate && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={13} /> {publishDate}
              </span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MessageSquare size={13} /> {comments.length} comment{comments.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Featured Image */}
          {post.featured_image && (
            <div style={{
              borderRadius: '16px', overflow: 'hidden', marginBottom: '36px',
              maxHeight: '460px', border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <img src={post.featured_image} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          )}

          {/* Content */}
          <div
            className="post-content"
            dangerouslySetInnerHTML={{ __html: post.content_html || '<p>No content.</p>' }}
            style={{ color: '#94a3b8', lineHeight: 1.8, fontSize: '16px' }}
          />

          {/* Tags */}
          {tags.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '36px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <Tag size={15} color="#475569" style={{ alignSelf: 'center' }} />
              {tags.map(tag => (
                <Link key={tag.slug} href={`/tag/${tag.slug}`} style={{
                  padding: '4px 12px', borderRadius: '6px',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                  color: '#64748b', textDecoration: 'none', fontSize: '12px', transition: 'all 0.15s',
                }}>
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}

          {/* Author Bio */}
          {post.author?.bio && (
            <div style={{
              marginTop: '40px', padding: '24px',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '16px', display: 'flex', gap: '18px', alignItems: 'flex-start',
            }}>
              <div style={{
                width: '60px', height: '60px', borderRadius: '50%', flexShrink: 0,
                background: post.author.avatar_url ? `url(${post.author.avatar_url}) center/cover` : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 700, fontSize: '20px',
              }}>
                {!post.author.avatar_url && (post.author.name || 'A').charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '16px', margin: '0 0 6px' }}>About {post.author.name}</p>
                <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.65, margin: 0 }}>{post.author.bio}</p>
              </div>
            </div>
          )}

          {/* Comments */}
          <section style={{ marginTop: '48px' }}>
            <h2 style={{ color: '#f1f5f9', fontSize: '20px', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={20} color="#6366f1" />
              {comments.length} Comment{comments.length !== 1 ? 's' : ''}
            </h2>

            {commentTree.length === 0 ? (
              <p style={{ color: '#475569', fontSize: '14px' }}>No comments yet. Be the first!</p>
            ) : (
              commentTree.map(c => <Comment key={c.id} comment={c} />)
            )}

            <CommentSection postId={post.id} />
          </section>
        </article>

        {/* Sidebar */}
        <aside style={{ position: 'sticky', top: '84px' }}>
          {/* Related Posts */}
          {related.length > 0 && (
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '16px', padding: '20px', marginBottom: '20px',
            }}>
              <h3 style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>
                Related Posts
              </h3>
              {related.map(p => (
                <Link key={p.id} href={`/${p.slug}`} style={{ display: 'block', textDecoration: 'none', marginBottom: '14px' }}>
                  <div style={{
                    padding: '12px', borderRadius: '10px',
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                    transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)' }}
                  >
                    <p style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: 600, margin: '0 0 4px', lineHeight: 1.4 }}>{p.title}</p>
                    {p.published_at && (
                      <p style={{ color: '#475569', fontSize: '11px', margin: 0 }}>
                        {new Date(p.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Categories Widget */}
          {cats.length > 0 && (
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '16px', padding: '20px',
            }}>
              <h3 style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
                Filed Under
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {cats.map(cat => (
                  <Link key={cat.slug} href={`/category/${cat.slug}`} style={{
                    padding: '5px 12px', borderRadius: '6px',
                    background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                    color: '#a5b4fc', textDecoration: 'none', fontSize: '12px', fontWeight: 500,
                  }}>
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      <style>{`
        .post-content h1, .post-content h2, .post-content h3, .post-content h4 { color: #f1f5f9; margin-top: 32px; margin-bottom: 12px; font-weight: 700; letter-spacing: -0.01em; }
        .post-content h1 { font-size: 28px; }
        .post-content h2 { font-size: 22px; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 8px; }
        .post-content h3 { font-size: 18px; }
        .post-content p { margin: 0 0 20px; }
        .post-content a { color: #a5b4fc; text-decoration: underline; }
        .post-content strong { color: #e2e8f0; font-weight: 700; }
        .post-content em { color: #94a3b8; font-style: italic; }
        .post-content code { background: rgba(99,102,241,0.15); color: #a5b4fc; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
        .post-content pre { background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; overflow-x: auto; margin: 20px 0; }
        .post-content pre code { background: none; color: #a5b4fc; padding: 0; }
        .post-content blockquote { border-left: 3px solid #6366f1; padding-left: 16px; color: #64748b; font-style: italic; margin: 20px 0; }
        .post-content ul, .post-content ol { padding-left: 24px; margin: 0 0 20px; }
        .post-content li { margin-bottom: 6px; }
        .post-content img { max-width: 100%; border-radius: 12px; margin: 16px 0; }
        .post-content table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .post-content th, .post-content td { padding: 10px 14px; border: 1px solid rgba(255,255,255,0.08); }
        .post-content th { background: rgba(99,102,241,0.1); color: #a5b4fc; font-weight: 600; }
        .post-content hr { border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 32px 0; }
        @media (max-width: 900px) { .post-layout { grid-template-columns: 1fr !important; } aside { position: static !important; } }
      `}</style>
    </div>
  )
}
