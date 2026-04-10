import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { fetchGoogleTrends } from '@/lib/trends/google-trends'
import { fetchYouTubeTrending } from '@/lib/trends/youtube-scraper'

export async function POST(request: NextRequest) {
  const errors: string[] = []

  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: `Auth failed: ${authError?.message || 'No user'}` }, { status: 401 })
    }

    const { clientId } = await request.json()

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('niche')
      .eq('id', clientId)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ data: null, error: `Client fetch failed: ${clientError?.message || 'Not found'}` }, { status: 404 })
    }

    // Fetch trends — catch each source independently
    let googleTrends: Awaited<ReturnType<typeof fetchGoogleTrends>> = []
    let youtubeTrends: Awaited<ReturnType<typeof fetchYouTubeTrending>> = []

    try {
      googleTrends = await fetchGoogleTrends(client.niche)
    } catch (e: unknown) {
      errors.push(`Google Trends error: ${e instanceof Error ? e.message : String(e)}`)
    }

    try {
      youtubeTrends = await fetchYouTubeTrending()
    } catch (e: unknown) {
      errors.push(`YouTube error: ${e instanceof Error ? e.message : String(e)}`)
    }

    const rows = [
      ...googleTrends,
      ...youtubeTrends.map((t) => ({ ...t, niche: client.niche })),
    ]

    if (rows.length === 0) {
      return NextResponse.json({
        data: [],
        error: errors.length > 0 ? errors.join('; ') : null,
        message: `Google returned ${googleTrends.length}, YouTube returned ${youtubeTrends.length} trends`,
      })
    }

    // Insert one by one, skip duplicates
    const inserted: unknown[] = []
    const insertErrors: string[] = []

    for (const row of rows) {
      const { data, error } = await supabase
        .from('trends')
        .insert(row)
        .select()
        .single()

      if (data) {
        inserted.push(data)
      } else if (error && !error.code?.includes('23505')) {
        insertErrors.push(`${error.code}: ${error.message}`)
      }
    }

    return NextResponse.json({
      data: inserted,
      error: null,
      debug: {
        googleCount: googleTrends.length,
        youtubeCount: youtubeTrends.length,
        insertedCount: inserted.length,
        fetchErrors: errors,
        insertErrors: insertErrors.slice(0, 3),
      },
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { data: null, error: `Unexpected error: ${msg}`, fetchErrors: errors },
      { status: 500 }
    )
  }
}
