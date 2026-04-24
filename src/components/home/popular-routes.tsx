'use client'

import { useRouter } from 'next/navigation'
import { format, addDays } from 'date-fns'
import { Plane } from 'lucide-react'
import { motion } from 'framer-motion'
import { formatRupiah } from '@/lib/utils'

const routes = [
  { from: 'CGK', fromCity: 'Jakarta', to: 'DPS', toCity: 'Bali', price: 520000, gradient: 'from-blue-500 to-cyan-400' },
  { from: 'CGK', fromCity: 'Jakarta', to: 'SUB', toCity: 'Surabaya', price: 500000, gradient: 'from-emerald-500 to-teal-400' },
  { from: 'CGK', fromCity: 'Jakarta', to: 'JOG', toCity: 'Yogyakarta', price: 520000, gradient: 'from-violet-500 to-purple-400' },
  { from: 'CGK', fromCity: 'Jakarta', to: 'KNO', toCity: 'Medan', price: 620000, gradient: 'from-orange-500 to-amber-400' },
  { from: 'CGK', fromCity: 'Jakarta', to: 'UPG', toCity: 'Makassar', price: 890000, gradient: 'from-rose-500 to-pink-400' },
  { from: 'CGK', fromCity: 'Jakarta', to: 'BPN', toCity: 'Balikpapan', price: 950000, gradient: 'from-indigo-500 to-blue-400' },
  { from: 'SUB', fromCity: 'Surabaya', to: 'DPS', toCity: 'Bali', price: 420000, gradient: 'from-teal-500 to-emerald-400' },
  { from: 'CGK', fromCity: 'Jakarta', to: 'PLM', toCity: 'Palembang', price: 480000, gradient: 'from-sky-500 to-blue-400' },
]

export function PopularRoutes() {
  const router = useRouter()
  const dateStr = format(addDays(new Date(), 7), 'yyyy-MM-dd')

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <h2 className="mb-6 text-xl font-bold md:text-2xl">Rute Populer</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {routes.map((route, i) => (
          <motion.button
            key={`${route.from}-${route.to}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() =>
              router.push(
                `/flights?from=${route.from}&to=${route.to}&date=${dateStr}&pax=1&class=economy`
              )
            }
            className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${route.gradient} p-4 text-left text-white shadow-md transition-shadow hover:shadow-lg md:p-5`}
          >
            <Plane className="absolute -bottom-2 -right-2 size-16 rotate-45 text-white/10" />
            <div className="relative">
              <div className="mb-2 flex items-center gap-1 text-sm font-semibold md:text-base">
                <span>{route.fromCity}</span>
                <span className="text-white/70">→</span>
                <span>{route.toCity}</span>
              </div>
              <p className="text-xs text-white/80 md:text-sm">
                Mulai dari {formatRupiah(route.price)}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  )
}
