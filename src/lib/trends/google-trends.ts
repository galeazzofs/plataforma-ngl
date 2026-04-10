import type { Trend } from '@/types'

// Use Google Trends via direct HTTP instead of the npm package (which fails on serverless)
export async function fetchGoogleTrends(niche: string): Promise<Omit<Trend, 'id' | 'collected_at'>[]> {
  try {
    // Try daily trends for Brazil
    const url = `https://trends.google.com/trends/api/dailytrends?hl=pt-BR&tz=-180&geo=BR&ns=15`
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })

    if (!response.ok) {
      console.error('Google Trends HTTP error:', response.status)
      return []
    }

    const text = await response.text()
    // Google Trends API returns ")]}'\n" prefix before JSON
    const jsonText = text.replace(/^\)\]\}'\n/, '')
    const data = JSON.parse(jsonText)

    const trends: Omit<Trend, 'id' | 'collected_at'>[] = []
    const trendingSearches = data?.default?.trendingSearchesDays ?? []

    for (const day of trendingSearches) {
      for (const search of day.trendingSearches ?? []) {
        const title = search.title?.query
        if (!title) continue

        // Filter by relevance to niche (simple keyword match)
        const nicheWords = niche.toLowerCase().split(/\s+/)
        const titleLower = title.toLowerCase()
        const relatedTopics = (search.relatedQueries ?? []).map((q: { query: string }) => q.query?.toLowerCase() ?? '').join(' ')
        const allText = `${titleLower} ${relatedTopics}`

        // Include if any niche word appears, or include top trends regardless
        const isRelevant = nicheWords.some(w => allText.includes(w))

        if (isRelevant || trends.length < 5) {
          trends.push({
            niche,
            source: 'google_trends',
            title,
            description: search.articles?.[0]?.title ?? null,
            url: search.articles?.[0]?.url ?? null,
            relevance_score: parseInt(search.formattedTraffic?.replace(/[^0-9]/g, '') || '0') || null,
          })
        }

        if (trends.length >= 15) break
      }
      if (trends.length >= 15) break
    }

    return trends
  } catch (error) {
    console.error('Google Trends error:', error)
    return []
  }
}
