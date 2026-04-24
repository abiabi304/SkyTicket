import { createClient } from '@/lib/supabase/server'
import { FlightForm } from '@/components/admin/flight-form'
import { PageHeader } from '@/components/shared/page-header'
import type { Airline, Airport } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Tambah Penerbangan | Admin' }

export default async function NewFlightPage() {
  const supabase = await createClient()
  const [{ data: airlines }, { data: airports }] = await Promise.all([
    supabase.from('airlines').select('*').order('name'),
    supabase.from('airports').select('*').order('city'),
  ])

  return (
    <div className="space-y-6 pt-14 md:pt-0">
      <PageHeader title="Tambah Penerbangan" showBack />
      <FlightForm airlines={(airlines ?? []) as Airline[]} airports={(airports ?? []) as Airport[]} />
    </div>
  )
}
