import { Plane } from 'lucide-react'
import Link from 'next/link'

export function Footer() {
  return (
    <footer className="hidden border-t bg-muted/30 md:block">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2 font-bold text-primary">
            <Plane className="size-5" />
            <span>SkyTicket</span>
          </div>
          <nav className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/" className="transition-colors hover:text-foreground">
              Beranda
            </Link>
            <Link href="/my-bookings" className="transition-colors hover:text-foreground">
              Pesanan Saya
            </Link>
            <Link href="/profile" className="transition-colors hover:text-foreground">
              Profil
            </Link>
          </nav>
          <p className="text-sm text-muted-foreground">
            &copy; 2026 SkyTicket. Hak cipta dilindungi.
          </p>
        </div>
      </div>
    </footer>
  )
}
