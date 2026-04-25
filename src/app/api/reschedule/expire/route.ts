import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { rescheduleId } = await request.json()

    if (!rescheduleId) {
      return NextResponse.json({ error: 'Missing rescheduleId' }, { status: 400 })
    }

    const serviceClient = await createServiceClient()
    const { data: expired } = await serviceClient.rpc('expire_reschedule', {
      p_reschedule_id: rescheduleId,
    })

    if (!expired) {
      return NextResponse.json({
        error: 'Reschedule tidak dapat di-expire',
      }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Expire reschedule error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
