/**
 * Supabase Storage helpers
 */

export function getStorageUrl(bucket: string, path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
}

export function getAirlineLogoUrl(filename: string | null): string | null {
  if (!filename) return null
  // If already a full URL, return as-is
  if (filename.startsWith('http')) return filename
  // If it's a storage path like "GA.png", build the URL
  return getStorageUrl('airlines', filename)
}

export function getAvatarUrl(userId: string, filename: string): string {
  return getStorageUrl('avatars', `${userId}/${filename}`)
}
