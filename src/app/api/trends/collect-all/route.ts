import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchGoogleTrends } from '@/lib/trends/google-trends'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { data: clients } = await supabase
    .from('clients')
    .select('niche')

  const niches = Array.from(new Set(clients?.map((c) => c.niche) ?? []))

  const results: { niche: string; count: number }[] = []

  for (const niche of niches) {
    const trends = await fetchGoogleTrends(niche)

    if (trends.length > 0) {
      let count = 0
      for (const row of trends) {
        const { data } = await supabase.from('trends').insert(row).select().single()
        if (data) count++
      }
      results.push({ niche, count })
    }

    await new Promise((r) => setTimeout(r, 1000))
  }

  return NextResponse.json({ data: results, error: null })
}
