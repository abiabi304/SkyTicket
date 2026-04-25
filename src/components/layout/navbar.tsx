'use client'

import Link from 'next/link'
import { Plane, Menu, LogOut, User, FileText, Shield, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Profile } from '@/lib/types'
import { useState } from 'react'

interface NavbarProps {
  user: Profile | null
}

export function Navbar({ user }: NavbarProps) {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    await supabase.auth.signOut()
    toast.success('Berhasil keluar')
    window.location.href = '/'
  }

  const navLinks = [
    { href: '/', label: 'Beranda' },
    { href: '/#search', label: 'Cari Penerbangan' },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-6">
        {/* Mobile: Hamburger */}
        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="size-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-primary">
                  <Plane className="size-5" />
                  SkyTicket
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                  >
                    {link.label}
                  </Link>
                ))}
                {user && user.role !== 'admin' && (
                  <>
                    <Link
                      href="/my-bookings"
                      onClick={() => setOpen(false)}
                      className="rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                    >
                      Pesanan Saya
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setOpen(false)}
                      className="rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
                    >
                      Profil
                    </Link>
                  </>
                )}
                {user && user.role === 'admin' && (
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-accent"
                  >
                    <span className="flex items-center gap-2">
                      <Shield className="size-4" />
                      Admin Panel
                    </span>
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-primary">
          <Plane className="size-5" />
          <span className="text-lg">SkyTicket</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          {user && user.role !== 'admin' && (
            <Link
              href="/my-bookings"
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Pesanan Saya
            </Link>
          )}
          {user && user.role === 'admin' && (
            <Link
              href="/admin"
              className="rounded-lg px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-accent"
            >
              Admin Panel
            </Link>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative size-8 rounded-full">
                  <Avatar className="size-8">
                    <AvatarImage src={user.avatar_url ?? undefined} alt={user.full_name} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {user.full_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="size-8">
                    <AvatarImage src={user.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {user.full_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <p className="text-sm font-medium">{user.full_name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                {user.role !== 'admin' ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/my-bookings" className="cursor-pointer">
                        <FileText className="mr-2 size-4" />
                        Pesanan Saya
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        <User className="mr-2 size-4" />
                        Profil
                      </Link>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer">
                      <Shield className="mr-2 size-4" />
                      Admin Panel
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} disabled={loggingOut} className="cursor-pointer text-destructive">
                  {loggingOut ? <Loader2 className="mr-2 size-4 animate-spin" /> : <LogOut className="mr-2 size-4" />}
                  {loggingOut ? 'Keluar...' : 'Keluar'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm">
              <Link href="/login">Masuk</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
