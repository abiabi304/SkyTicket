'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface PageHeaderProps {
  title: string
  subtitle?: string
  showBack?: boolean
  fallbackHref?: string
}

export function PageHeader({ title, subtitle, showBack = false, fallbackHref = '/' }: PageHeaderProps) {
  const router = useRouter()

  return (
    <div className="flex items-start gap-3">
      {showBack && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            const hasSameOriginReferrer =
              typeof document !== 'undefined' &&
              document.referrer &&
              document.referrer.startsWith(window.location.origin)
            if (window.history.length > 1 && hasSameOriginReferrer) {
              router.back()
            } else {
              router.push(fallbackHref)
            }
          }}
          className="mt-0.5 shrink-0"
        >
          <ArrowLeft className="size-5" />
          <span className="sr-only">Kembali</span>
        </Button>
      )}
      <div>
        <h1 className="text-xl font-bold md:text-2xl">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  )
}
