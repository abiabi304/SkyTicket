'use client'

export default function LoginError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 to-blue-100 p-4">
      <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-8 text-center shadow-xl">
        <h2 className="text-lg font-semibold text-red-600">Terjadi Kesalahan</h2>
        <p className="text-sm text-muted-foreground">{error.message || 'Gagal memuat halaman login'}</p>
        <button onClick={reset} className="rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90">
          Coba Lagi
        </button>
      </div>
    </div>
  )
}
