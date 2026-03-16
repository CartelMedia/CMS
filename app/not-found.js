import Link from 'next/link'
import { Home, Search, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #080810 0%, #0a0a18 40%, #080c18 70%, #060610 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '24px',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '480px' }}>
        {/* 404 Number */}
        <div style={{
          fontSize: '120px', fontWeight: 900, lineHeight: 1,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text', marginBottom: '8px',
          filter: 'drop-shadow(0 0 40px rgba(99,102,241,0.3))',
        }}>
          404
        </div>

        {/* Glow effect */}
        <div style={{
          width: '200px', height: '2px',
          background: 'linear-gradient(90deg, transparent, #6366f1, transparent)',
          margin: '0 auto 32px',
        }} />

        <h1 style={{ color: '#f1f5f9', fontSize: '26px', fontWeight: 700, margin: '0 0 12px', letterSpacing: '-0.01em' }}>
          Page Not Found
        </h1>
        <p style={{ color: '#64748b', fontSize: '15px', lineHeight: 1.65, margin: '0 0 36px' }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Try searching or go back home.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '11px 22px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white', textDecoration: 'none', fontSize: '14px', fontWeight: 600,
            boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
            transition: 'transform 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            <Home size={16} /> Go Home
          </Link>
          <Link href="/search" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '11px 22px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#94a3b8', textDecoration: 'none', fontSize: '14px', fontWeight: 500,
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = '#e2e8f0' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#94a3b8' }}
          >
            <Search size={16} /> Search Posts
          </Link>
        </div>

        <Link href="javascript:history.back()" style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          marginTop: '24px', color: '#475569', textDecoration: 'none', fontSize: '13px',
          transition: 'color 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'}
          onMouseLeave={e => e.currentTarget.style.color = '#475569'}
        >
          <ArrowLeft size={13} /> Go back
        </Link>
      </div>
    </div>
  )
}
