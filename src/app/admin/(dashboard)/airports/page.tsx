import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Pencil, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DeleteItemButton } from '@/components/admin/delete-item-button'
import { AdminSearch } from '@/components/admin/admin-search'
import type { Airport } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Kelola Bandara | Admin' }

export default async function AdminAirportsPage({
  searchParams,
}: {
  searchParams: { search?: string }
}) {
  const supabase = await createClient()
  let query = supabase.from('airports').select('*').order('city')

  if (searchParams.search) {
    query = query.or(`city.ilike.%${searchParams.search}%,code.ilike.%${searchParams.search}%,name.ilike.%${searchParams.search}%`)
  }

  const { data: airports } = await query
  const typedAirports = (airports ?? []) as Airport[]

  return (
    <div className="space-y-6 pt-14 md:pt-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bandara</h1>
          <p className="text-sm text-muted-foreground">Kelola data bandara</p>
        </div>
        <Button asChild>
          <Link href="/admin/airports/new">
            <Plus className="mr-2 size-4" />
            Tambah Bandara
          </Link>
        </Button>
      </div>

      {/* Search */}
      <AdminSearch placeholder="Cari kota, kode, atau nama bandara..." basePath="/admin/airports" />

      {/* Data Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            {typedAirports.length} bandara
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {typedAirports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted mb-3">
                <MapPin className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                Tidak ada bandara ditemukan
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold">Kode</TableHead>
                    <TableHead className="font-semibold">Kota</TableHead>
                    <TableHead className="font-semibold">Nama Bandara</TableHead>
                    <TableHead className="font-semibold">Negara</TableHead>
                    <TableHead className="font-semibold text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {typedAirports.map((airport) => (
                    <TableRow key={airport.id}>
                      <TableCell>
                        <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 text-xs font-bold text-emerald-700">
                          {airport.code}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{airport.city}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground">{airport.name}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{airport.country}</p>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button variant="outline" size="icon" className="size-8" asChild>
                            <Link href={`/admin/airports/${airport.id}`}>
                              <Pencil className="size-3.5" />
                            </Link>
                          </Button>
                          <DeleteItemButton table="airports" itemId={airport.id} itemName={`${airport.code} - ${airport.city}`} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
