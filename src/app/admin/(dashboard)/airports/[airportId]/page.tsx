import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AirportForm } from '@/components/admin/airport-form'
import { PageHeader } from '@/components/shared/page-header'
import type { Airport } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Edit Bandara | Admin' }

interface Props { params: { airportId: string } }

export default async function EditAirportPage({ params }: Props) {
  const supabase = await createClient()
  const { data: airport } = await supabase.from('airports').select('*').eq('id', params.airportId).single()
  if (!airport) redirect('/admin/airports')

  return (
    <div className="space-y-6 pt-14 md:pt-0">
      <PageHeader title="Edit Bandara" showBack />
      <AirportForm airport={airport as Airport} />
    </div>
  )
}
