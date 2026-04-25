'use client'

export default function AdminLoginError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md space-y-4 rounded-2xl bg-gray-800 p-8 text-center shadow-xl">
        <h2 className="text-lg font-semibold text-red-400">Terjadi Kesalahan</h2>
        <p className="text-sm text-gray-400">{error.message || 'Gagal memuat halaman login'}</p>
        <button onClick={reset} className="rounded-lg bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-700">
          Coba Lagi
        </button>
      </div>
    </div>
  )
}
