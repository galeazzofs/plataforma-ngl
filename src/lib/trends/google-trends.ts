import googleTrends from 'google-trends-api'
import type { Trend } from '@/types'

export async function fetchGoogleTrends(niche: string): Promise<Omit<Trend, 'id' | 'collected_at'>[]> {
  try {
    const results = await googleTrends.relatedQueries({
      keyword: niche,
      geo: 'BR',
      hl: 'pt-BR',
    })

    const parsed = JSON.parse(results)
    const queries = parsed?.default?.rankedList ?? []
    const trends: Omit<Trend, 'id' | 'collected_at'>[] = []

    for (const list of queries) {
      for (const item of list.rankedKeyword ?? []) {
        trends.push({
          niche,
          source: 'google_trends',
          title: item.query,
          description: null,
          url: null,
          relevance_score: item.value ?? null,
        })
      }
    }

    return trends.slice(0, 20)
  } catch (error) {
    console.error('Google Trends error:', error)
    return []
  }
}
