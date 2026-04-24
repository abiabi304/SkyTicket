import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FlightForm } from '@/components/admin/flight-form'
import { PageHeader } from '@/components/shared/page-header'
import type { Airline, Airport, Flight } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Edit Penerbangan | Admin' }

interface EditFlightPageProps {
  params: { flightId: string }
}

export default async function EditFlightPage({ params }: EditFlightPageProps) {
  const supabase = await createClient()
  const [{ data: flight }, { data: airlines }, { data: airports }] = await Promise.all([
    supabase.from('flights').select('*').eq('id', params.flightId).single(),
    supabase.from('airlines').select('*').order('name'),
    supabase.from('airports').select('*').order('city'),
  ])

  if (!flight) redirect('/admin/flights')

  return (
    <div className="space-y-6 pt-14 md:pt-0">
      <PageHeader title="Edit Penerbangan" showBack />
      <FlightForm
        airlines={(airlines ?? []) as Airline[]}
        airports={(airports ?? []) as Airport[]}
        flight={flight as Flight}
      />
    </div>
  )
}
