'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Plane,
  Building2,
  MapPin,
  LogOut,
  ArrowLeft,
  Menu,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'
import { useState } from 'react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/flights', label: 'Penerbangan', icon: Plane },
  { href: '/admin/airlines', label: 'Maskapai', icon: Building2 },
  { href: '/admin/airports', label: 'Bandara', icon: MapPin },
]

interface AdminSidebarProps {
  profile: Profile
}

function SidebarContent({ profile, pathname, onLogout }: {
  profile: Profile
  pathname: string
  onLogout: () => void
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center gap-2">
          <Plane className="size-5 text-primary" />
          <span className="font-bold text-primary">SkyTicket</span>
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
            Admin
          </span>
        </div>
      </div>

      <Separator />

      {/* Nav */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <Separator />

      {/* Footer */}
      <div className="p-4 space-y-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Kembali ke Website
        </Link>
        <div className="flex items-center gap-3">
          <Avatar className="size-8">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="bg-primary text-xs text-primary-foreground">
              {profile.full_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium">{profile.full_name}</p>
            <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onLogout}>
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export function AdminSidebar({ profile }: AdminSidebarProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <>
      {/* Mobile: hamburger + sheet */}
      <div className="fixed left-0 top-0 z-50 flex h-14 w-full items-center border-b bg-background px-4 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Admin Menu</SheetTitle>
            </SheetHeader>
            <SidebarContent profile={profile} pathname={pathname} onLogout={handleLogout} />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2 ml-2">
          <Plane className="size-4 text-primary" />
          <span className="font-bold text-sm">Admin Panel</span>
        </div>
      </div>

      {/* Desktop: fixed sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-background md:block">
        <div className="sticky top-0 h-screen">
          <SidebarContent profile={profile} pathname={pathname} onLogout={handleLogout} />
        </div>
      </aside>
    </>
  )
}
