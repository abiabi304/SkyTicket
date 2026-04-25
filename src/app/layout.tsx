import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import { Toaster } from "@/components/ui/sonner"
import { WhatsAppButton } from "@/components/shared/whatsapp-button"
import { cn } from "@/lib/utils"
import "./globals.css"

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
})

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-mono",
  weight: "100 900",
})

export const metadata: Metadata = {
  title: {
    default: "SkyTicket — Pesan Tiket Pesawat Online",
    template: "%s | SkyTicket",
  },
  description:
    "Pesan tiket pesawat domestik dengan mudah dan cepat. Temukan penerbangan terbaik dengan harga terjangkau di SkyTicket.",
  keywords: ["tiket pesawat", "booking pesawat", "penerbangan domestik", "SkyTicket"],
  authors: [{ name: "SkyTicket" }],
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1A73E8",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className={cn(geistSans.variable, geistMono.variable)} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
        <WhatsAppButton />
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  )
}
