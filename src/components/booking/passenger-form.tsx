'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User } from 'lucide-react'
import type { PassengerInput } from '@/lib/types'

interface PassengerFormProps {
  passengers: PassengerInput[]
  onChange: (passengers: PassengerInput[]) => void
}

export function PassengerForm({ passengers, onChange }: PassengerFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const updatePassenger = (index: number, field: keyof PassengerInput, value: string) => {
    const updated = [...passengers]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
    // Clear error when user starts typing
    const key = `${index}-${field}`
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  const validateField = (index: number, field: keyof PassengerInput, value: string) => {
    const key = `${index}-${field}`
    if (field === 'full_name' && value.length > 0 && value.length < 3) {
      setErrors((prev) => ({ ...prev, [key]: 'Minimal 3 karakter' }))
    } else if (field === 'id_number' && value.length > 0 && value.length < 6) {
      setErrors((prev) => ({ ...prev, [key]: 'Minimal 6 karakter' }))
    } else {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="size-5" />
          Data Penumpang
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {passengers.map((passenger, index) => (
          <div key={index} className="space-y-4 rounded-lg border p-4">
            <h4 className="font-medium">Penumpang {index + 1}</h4>

            <div className="space-y-2">
              <Label htmlFor={`name-${index}`}>Nama Lengkap</Label>
              <Input
                id={`name-${index}`}
                value={passenger.full_name}
                onChange={(e) => updatePassenger(index, 'full_name', e.target.value)}
                onBlur={(e) => validateField(index, 'full_name', e.target.value)}
                placeholder="Sesuai KTP/Paspor"
                minLength={3}
              />
              {errors[`${index}-full_name`] && (
                <p className="text-xs text-destructive mt-1">{errors[`${index}-full_name`]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Tipe Identitas</Label>
              <RadioGroup
                value={passenger.id_type}
                onValueChange={(v) => updatePassenger(index, 'id_type', v)}
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="ktp" id={`ktp-${index}`} />
                  <Label htmlFor={`ktp-${index}`} className="cursor-pointer font-normal">
                    KTP
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="paspor" id={`paspor-${index}`} />
                  <Label htmlFor={`paspor-${index}`} className="cursor-pointer font-normal">
                    Paspor
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`id-${index}`}>
                Nomor {passenger.id_type === 'ktp' ? 'KTP' : 'Paspor'}
              </Label>
              <Input
                id={`id-${index}`}
                value={passenger.id_number}
                onChange={(e) => updatePassenger(index, 'id_number', e.target.value)}
                onBlur={(e) => validateField(index, 'id_number', e.target.value)}
                placeholder={passenger.id_type === 'ktp' ? '3171xxxxxxxxxxxx' : 'A12345678'}
              />
              {errors[`${index}-id_number`] && (
                <p className="text-xs text-destructive mt-1">{errors[`${index}-id_number`]}</p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
