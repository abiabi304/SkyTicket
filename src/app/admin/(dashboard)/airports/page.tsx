import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DeleteItemButton } from '@/components/admin/delete-item-button'
import type { Airport } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Kelola Bandara | Admin' }

export default async function AdminAirportsPage() {
  const supabase = await createClient()
  const { data: airports } = await supabase.from('airports').select('*').order('city')

  return (
    <div className="space-y-6 pt-14 md:pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bandara</h1>
          <p className="text-sm text-muted-foreground">{(airports ?? []).length} bandara</p>
        </div>
        <Button asChild>
          <Link href="/admin/airports/new">
            <Plus className="mr-2 size-4" />
            Tambah Bandara
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(airports as Airport[] ?? []).map((airport) => (
          <Card key={airport.id}>
            <CardContent className="flex items-center justify-between pt-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100 text-sm font-bold text-emerald-700">
                  {airport.code}
                </div>
                <div>
                  <p className="font-medium">{airport.city}</p>
                  <p className="text-xs text-muted-foreground">{airport.name}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" asChild>
                  <Link href={`/admin/airports/${airport.id}`}><Pencil className="size-4" /></Link>
                </Button>
                <DeleteItemButton table="airports" itemId={airport.id} itemName={`${airport.code} - ${airport.city}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
