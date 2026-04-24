import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AirlineForm } from '@/components/admin/airline-form'
import { PageHeader } from '@/components/shared/page-header'
import type { Airline } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Edit Maskapai | Admin' }

interface Props { params: { airlineId: string } }

export default async function EditAirlinePage({ params }: Props) {
  const supabase = await createClient()
  const { data: airline } = await supabase.from('airlines').select('*').eq('id', params.airlineId).single()
  if (!airline) redirect('/admin/airlines')

  return (
    <div className="space-y-6 pt-14 md:pt-0">
      <PageHeader title="Edit Maskapai" showBack />
      <AirlineForm airline={airline as Airline} />
    </div>
  )
}
