import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { fetchGoogleTrends } from '@/lib/trends/google-trends'
import { fetchYouTubeTrending } from '@/lib/trends/youtube-scraper'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }

    const { clientId } = await request.json()

    const { data: client } = await supabase
      .from('clients')
      .select('niche')
      .eq('id', clientId)
      .single()

    if (!client) {
      return NextResponse.json({ data: null, error: 'Client not found' }, { status: 404 })
    }

    const [googleTrends, youtubeTrends] = await Promise.all([
      fetchGoogleTrends(client.niche),
      fetchYouTubeTrending(),
    ])

    const rows = [
      ...googleTrends,
      ...youtubeTrends.map((t) => ({ ...t, niche: client.niche })),
    ]

    if (rows.length === 0) {
      return NextResponse.json({ data: [], error: null })
    }

    const inserted: unknown[] = []
    for (const row of rows) {
      const { data, error } = await supabase
        .from('trends')
        .insert(row)
        .select()
        .single()

      if (data) inserted.push(data)
      if (error && !error.code?.includes('23505')) {
        console.error('Trend insert error:', error)
      }
    }

    return NextResponse.json({ data: inserted, error: null })
  } catch (error) {
    console.error('Trend collection error:', error)
    return NextResponse.json(
      { data: null, error: 'Failed to collect trends' },
      { status: 500 }
    )
  }
}
