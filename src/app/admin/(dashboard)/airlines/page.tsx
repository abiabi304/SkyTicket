import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DeleteItemButton } from '@/components/admin/delete-item-button'
import type { Airline } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Kelola Maskapai | Admin' }

export default async function AdminAirlinesPage() {
  const supabase = await createClient()
  const { data: airlines } = await supabase.from('airlines').select('*').order('name')

  return (
    <div className="space-y-6 pt-14 md:pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Maskapai</h1>
          <p className="text-sm text-muted-foreground">{(airlines ?? []).length} maskapai</p>
        </div>
        <Button asChild>
          <Link href="/admin/airlines/new">
            <Plus className="mr-2 size-4" />
            Tambah Maskapai
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(airlines as Airline[] ?? []).map((airline) => (
          <Card key={airline.id}>
            <CardContent className="flex items-center justify-between pt-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {airline.code}
                </div>
                <div>
                  <p className="font-medium">{airline.name}</p>
                  <p className="text-xs text-muted-foreground">Kode: {airline.code}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" asChild>
                  <Link href={`/admin/airlines/${airline.id}`}><Pencil className="size-4" /></Link>
                </Button>
                <DeleteItemButton table="airlines" itemId={airline.id} itemName={airline.name} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
