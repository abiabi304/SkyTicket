'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail } from 'lucide-react'

interface ContactFormProps {
  email: string
  phone: string
  onEmailChange: (email: string) => void
  onPhoneChange: (phone: string) => void
}

export function ContactForm({ email, phone, onEmailChange, onPhoneChange }: ContactFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Mail className="size-5" />
          Informasi Kontak
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="contact-email">Email</Label>
          <Input
            id="contact-email"
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="email@contoh.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-phone">Nomor Telepon</Label>
          <Input
            id="contact-phone"
            type="tel"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="08xxxxxxxxxx"
          />
        </div>
      </CardContent>
    </Card>
  )
}
