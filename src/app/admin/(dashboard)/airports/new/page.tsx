import { AirportForm } from '@/components/admin/airport-form'
import { PageHeader } from '@/components/shared/page-header'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Tambah Bandara | Admin' }

export default function NewAirportPage() {
  return (
    <div className="space-y-6 pt-14 md:pt-0">
      <PageHeader title="Tambah Bandara" showBack />
      <AirportForm />
    </div>
  )
}
