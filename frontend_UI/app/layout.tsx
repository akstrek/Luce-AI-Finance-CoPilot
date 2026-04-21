import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'
import ParticleCanvas from '@/components/ParticleCanvas'
import BackToTop from '@/components/BackToTop'

export const metadata: Metadata = {
  title: 'Luce — AI Finance Copilot',
  description: 'Financial intelligence, grounded in your data.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:opsz,wght@9..40,300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="fog f1" />
        <div className="fog f2" />
        <div className="fog f3" />
        <ParticleCanvas />
        <Nav />
        {children}
        <BackToTop />
      </body>
    </html>
  )
}
