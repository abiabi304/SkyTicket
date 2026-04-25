'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

const SEGMENT_LABELS: Record<string, string> = {
  admin: 'Dashboard',
  flights: 'Penerbangan',
  airlines: 'Maskapai',
  airports: 'Bandara',
  new: 'Tambah Baru',
}

function getSegmentLabel(segment: string): string {
  return SEGMENT_LABELS[segment] ?? 'Edit'
}

export function AdminBreadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  // Build breadcrumb items from segments
  const items = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/')
    const label = getSegmentLabel(segment)
    const isLast = index === segments.length - 1
    return { href, label, isLast }
  })

  if (items.length <= 1) return null

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1.5 text-sm">
        {items.map((item, index) => (
          <li key={item.href} className="flex items-center gap-1.5">
            {index > 0 && (
              <ChevronRight className="size-3.5 text-muted-foreground/60" />
            )}
            {item.isLast ? (
              <span className="font-medium text-foreground">{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
