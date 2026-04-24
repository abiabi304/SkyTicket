import { AirlineForm } from '@/components/admin/airline-form'
import { PageHeader } from '@/components/shared/page-header'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Tambah Maskapai | Admin' }

export default function NewAirlinePage() {
  return (
    <div className="space-y-6 pt-14 md:pt-0">
      <PageHeader title="Tambah Maskapai" showBack />
      <AirlineForm />
    </div>
  )
}
