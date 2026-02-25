'use client'

import * as React from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { SessionProvider } from 'next-auth/react'

function ThemeProviderWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </SessionProvider>
  )
}

export default ThemeProviderWrapper
