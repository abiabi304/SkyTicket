'use client'

import { MessageCircle } from 'lucide-react'
import { CS_WHATSAPP_NUMBER, CS_WHATSAPP_MESSAGE } from '@/lib/constants'

export function WhatsAppButton() {
  const url = `https://wa.me/${CS_WHATSAPP_NUMBER}?text=${encodeURIComponent(CS_WHATSAPP_MESSAGE)}`

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Hubungi Customer Service via WhatsApp"
      className="fixed bottom-20 right-4 z-40 flex size-12 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-transform hover:scale-110 active:scale-95 md:bottom-6 md:right-6 md:size-14"
    >
      <MessageCircle className="size-6 md:size-7" />
    </a>
  )
}
