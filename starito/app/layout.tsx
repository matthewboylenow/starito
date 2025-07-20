import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, Nunito_Sans } from 'next/font/google'
import './globals.css'

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage-grotesque',
})

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  variable: '--font-nunito-sans',
})

export const metadata: Metadata = {
  title: 'Starito - Gamified Rewards for Kids',
  description: 'A fun reward system to encourage positive behaviors',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#4A90E2',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${bricolageGrotesque.variable} ${nunitoSans.variable}`}>
      <head>
        <link rel="icon" href="/icons/icon-placeholder.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon-placeholder.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Starito" />
      </head>
      <body className="font-body bg-background text-text antialiased">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js')
                  .then((registration) => {
                    console.log('SW registered: ', registration);
                  })
                  .catch((registrationError) => {
                    console.log('SW registration failed: ', registrationError);
                  });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}