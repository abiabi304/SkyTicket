'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface CancelBookingButtonProps {
  bookingId: string
  bookingCode: string
}

export function CancelBookingButton({ bookingId, bookingCode }: CancelBookingButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleCancel = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/bookings/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Gagal membatalkan pesanan')
        return
      }

      toast.success(`Pesanan ${bookingCode} dibatalkan`)
      setOpen(false)
      router.refresh()
    } catch {
      toast.error('Gagal membatalkan pesanan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="w-full gap-2">
          <XCircle className="size-4" />
          Batalkan Pesanan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Batalkan Pesanan {bookingCode}?</DialogTitle>
          <DialogDescription>
            Pesanan akan dibatalkan dan tidak dapat dikembalikan. Kursi akan dikembalikan ke ketersediaan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Tidak</Button>
          <Button variant="destructive" onClick={handleCancel} disabled={loading}>
            {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Ya, Batalkan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
