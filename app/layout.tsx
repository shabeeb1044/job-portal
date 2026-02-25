import React from "react"
import type { Metadata, Viewport } from 'next'
import dynamic from 'next/dynamic'
import { Inter, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const ThemeProviderWrapper = dynamic(
  () => import('@/components/theme-provider-wrapper'),
  { ssr: true }
)

const _inter = Inter({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'TalentBid - Smart Recruitment & Bidding Platform',
  description: 'Revolutionary job recruitment platform with bidding system for candidates, companies, and agencies',
  // generator: 'v0.app',
  icons: {
    icon: [
      { url: '/jobportal-logo.png', media: '(prefers-color-scheme: light)' },
      { url: '/jobportal-logo.png', media: '(prefers-color-scheme: dark)' },
      { url: '/jobportal-logo.png', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f8f8' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a1a' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProviderWrapper>
          {children}
        </ThemeProviderWrapper>
        <Analytics />
      </body>
    </html>
  )
}
