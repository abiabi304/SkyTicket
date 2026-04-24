'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { Airport } from '@/lib/types'

interface AirportSelectorProps {
  airports: Airport[]
  value: string
  onSelect: (code: string) => void
  placeholder: string
  label: string
}

export function AirportSelector({
  airports,
  value,
  onSelect,
  placeholder,
  label,
}: AirportSelectorProps) {
  const [open, setOpen] = useState(false)
  const selected = airports.find((a) => a.code === value)

  return (
    <div className="flex-1">
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground md:text-white/70">
        {label}
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-11 w-full justify-between bg-background text-left font-normal md:h-12"
          >
            {selected ? (
              <span className="flex items-center gap-2 truncate">
                <MapPin className="size-4 shrink-0 text-primary" />
                <span className="font-semibold">{selected.code}</span>
                <span className="hidden truncate text-muted-foreground sm:inline">
                  — {selected.city}
                </span>
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Cari kota atau kode bandara..." />
            <CommandList>
              <CommandEmpty>Bandara tidak ditemukan.</CommandEmpty>
              <CommandGroup>
                {airports.map((airport) => (
                  <CommandItem
                    key={airport.code}
                    value={`${airport.code} ${airport.city} ${airport.name}`}
                    onSelect={() => {
                      onSelect(airport.code)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 size-4',
                        value === airport.code ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-semibold">
                        {airport.code}{' '}
                        <span className="font-normal text-muted-foreground">
                          — {airport.city}
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {airport.name}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
