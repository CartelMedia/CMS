import '@/styles/globals.css'
import { ToastProvider } from '@/components/ToastProvider'

export const metadata = {
  title: { template: '%s | ModernCMS', default: 'ModernCMS' },
  description: 'A modern WordPress-like CMS built with Next.js and Supabase',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider />
        {children}
      </body>
    </html>
  )
}
