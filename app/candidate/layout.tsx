import React from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function CandidateLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-background">{children}</main>
      <Footer />
    </div>
  )
}

