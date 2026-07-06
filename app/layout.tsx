import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FlowPilot — AI Business Finance',
  description: 'AI-powered cash flow, invoicing, and payments for small businesses in Ghana.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
