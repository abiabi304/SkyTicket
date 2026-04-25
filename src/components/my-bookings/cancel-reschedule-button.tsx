'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface CancelRescheduleButtonProps {
  bookingId: string
}

export function CancelRescheduleButton({ bookingId }: CancelRescheduleButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleCancel = async () => {
    setLoading(true)
    try {
      // Find the pending reschedule for this booking, then expire it
      const response = await fetch('/api/reschedule/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Gagal membatalkan reschedule')
        return
      }

      toast.success('Reschedule dibatalkan. Booking dikembalikan ke status semula.')
      setOpen(false)
      router.refresh()
    } catch {
      toast.error('Gagal membatalkan reschedule')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full gap-2 border-blue-300 text-blue-700 hover:bg-blue-100">
          <XCircle className="size-4" />
          Batalkan Reschedule
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Batalkan Reschedule?</DialogTitle>
          <DialogDescription>
            Reschedule akan dibatalkan dan booking akan dikembalikan ke penerbangan semula. Kursi pada penerbangan baru akan dilepas.
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
