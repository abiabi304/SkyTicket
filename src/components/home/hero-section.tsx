import { SearchForm } from './search-form'
import type { Airport } from '@/lib/types'

interface HeroSectionProps {
  airports: Airport[]
}

export function HeroSection({ airports }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/80 px-4 pb-12 pt-8 md:px-6 md:pb-16 md:pt-12">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 -top-20 size-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-20 size-96 rounded-full bg-white/5" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="mb-8 text-center md:mb-10">
          <h1 className="mb-3 text-2xl font-bold text-white md:text-5xl">
            Temukan Penerbangan Terbaik
          </h1>
          <p className="text-sm text-white/80 md:text-lg">
            Pesan tiket pesawat dengan mudah dan cepat
          </p>
        </div>

        <div id="search">
          <SearchForm airports={airports} />
        </div>
      </div>
    </section>
  )
}
