import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Pencil, Building2 } from 'lucide-react'
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
import { AdminPagination } from '@/components/admin/admin-pagination'
import type { Airline } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Kelola Maskapai | Admin' }

const ITEMS_PER_PAGE = 20

export default async function AdminAirlinesPage({
  searchParams,
}: {
  searchParams: { search?: string; page?: string }
}) {
  const supabase = await createClient()
  const currentPage = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1)
  const from = (currentPage - 1) * ITEMS_PER_PAGE
  const to = from + ITEMS_PER_PAGE - 1

  let query = supabase.from('airlines').select('*', { count: 'exact' }).order('name')

  if (searchParams.search) {
    query = query.or(`name.ilike.%${searchParams.search}%,code.ilike.%${searchParams.search}%`)
  }

  const { data: airlines, count } = await query.range(from, to)
  const typedAirlines = (airlines ?? []) as Airline[]
  const totalCount = count ?? 0
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  return (
    <div className="space-y-6 pt-14 md:pt-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Maskapai</h1>
          <p className="text-sm text-muted-foreground">Kelola data maskapai penerbangan</p>
        </div>
        <Button asChild>
          <Link href="/admin/airlines/new">
            <Plus className="mr-2 size-4" />
            Tambah Maskapai
          </Link>
        </Button>
      </div>

      {/* Search */}
      <AdminSearch placeholder="Cari nama atau kode maskapai..." basePath="/admin/airlines" />

      {/* Data Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            {totalCount} maskapai
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {typedAirlines.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted mb-3">
                <Building2 className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                Tidak ada maskapai ditemukan
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold">Kode</TableHead>
                    <TableHead className="font-semibold">Nama Maskapai</TableHead>
                    <TableHead className="font-semibold text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {typedAirlines.map((airline) => (
                    <TableRow key={airline.id}>
                      <TableCell>
                        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                          {airline.code}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{airline.name}</p>
                        <p className="text-xs text-muted-foreground">Kode: {airline.code}</p>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button variant="outline" size="icon" className="size-8" asChild>
                            <Link href={`/admin/airlines/${airline.id}`}>
                              <Pencil className="size-3.5" />
                            </Link>
                          </Button>
                          <DeleteItemButton table="airlines" itemId={airline.id} itemName={airline.name} />
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

      {/* Pagination */}
      <AdminPagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath="/admin/airlines"
      />
    </div>
  )
}
