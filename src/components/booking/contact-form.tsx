'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail } from 'lucide-react'

interface ContactFormProps {
  email: string
  phone: string
  onEmailChange: (email: string) => void
  onPhoneChange: (phone: string) => void
  showErrors?: boolean
}

export function ContactForm({ email, phone, onEmailChange, onPhoneChange, showErrors = false }: ContactFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const validateEmail = (value: string) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setErrors((prev) => ({ ...prev, email: 'Format email tidak valid' }))
    } else {
      clearError('email')
    }
  }

  const validatePhone = (value: string) => {
    if (value && !/^(08|\+62|62)/.test(value)) {
      setErrors((prev) => ({ ...prev, phone: 'Format nomor telepon tidak valid' }))
    } else {
      clearError('phone')
    }
  }

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
            onChange={(e) => {
              onEmailChange(e.target.value)
              clearError('email')
            }}
            onBlur={(e) => validateEmail(e.target.value)}
            placeholder="email@contoh.com"
          />
          {(errors.email || (showErrors && !email)) && (
            <p className="text-xs text-destructive mt-1">{errors.email || 'Email wajib diisi'}</p>
          )}
          {showErrors && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !errors.email && (
            <p className="text-xs text-destructive mt-1">Format email tidak valid</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-phone">Nomor Telepon</Label>
          <Input
            id="contact-phone"
            type="tel"
            value={phone}
            onChange={(e) => {
              onPhoneChange(e.target.value)
              clearError('phone')
            }}
            onBlur={(e) => validatePhone(e.target.value)}
            placeholder="08xxxxxxxxxx"
          />
          {(errors.phone || (showErrors && !phone)) && (
            <p className="text-xs text-destructive mt-1">{errors.phone || 'Nomor telepon wajib diisi'}</p>
          )}
          {showErrors && phone && !/^(08|\+62|62)\d{7,12}$/.test(phone) && !errors.phone && (
            <p className="text-xs text-destructive mt-1">Format nomor telepon tidak valid</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
