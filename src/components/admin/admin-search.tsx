'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface AdminSearchProps {
  placeholder: string
  basePath: string
}

export function AdminSearch({ placeholder, basePath }: AdminSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const params = new URLSearchParams(searchParams.toString())
    if (e.target.value) {
      params.set('search', e.target.value)
    } else {
      params.delete('search')
    }
    startTransition(() => {
      router.push(`${basePath}?${params.toString()}`)
    })
  }

  return (
    <div className="relative max-w-sm">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        defaultValue={searchParams.get('search') ?? ''}
        onChange={handleSearch}
        className="pl-9"
      />
    </div>
  )
}
