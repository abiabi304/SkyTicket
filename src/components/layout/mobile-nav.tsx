'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, FileText, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems: Array<{ href: string; label: string; icon: typeof Home; matchPath?: string }> = [
  { href: '/', label: 'Beranda', icon: Home },
  { href: '/', label: 'Cari', icon: Search },
  { href: '/my-bookings', label: 'Pesanan', icon: FileText },
  { href: '/profile', label: 'Profil', icon: User },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-md md:hidden">
      <div className="flex items-center justify-around pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const isActive = item.matchPath
            ? pathname.startsWith(item.matchPath)
            : pathname === item.href
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-2 text-xs transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className="size-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
