import * as cheerio from 'cheerio'
import type { Trend } from '@/types'

const YOUTUBE_RSS_URL = 'https://www.youtube.com/feeds/videos.xml?chart=most_popular&gl=BR'

export async function fetchYouTubeTrending(): Promise<Omit<Trend, 'id' | 'collected_at' | 'niche'>[]> {
  try {
    const response = await fetch(YOUTUBE_RSS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ContentOS/1.0)',
      },
    })

    if (!response.ok) {
      console.error('YouTube RSS fetch failed:', response.status)
      return []
    }

    const xml = await response.text()
    const $ = cheerio.load(xml, { xmlMode: true })
    const trends: Omit<Trend, 'id' | 'collected_at' | 'niche'>[] = []

    $('entry').each((i, el) => {
      if (i >= 25) return false

      const title = $(el).find('title').text()
      const url = $(el).find('link').attr('href') ?? null
      const description = $(el).find('media\\:description, description').text().slice(0, 200) || null

      if (title) {
        trends.push({
          source: 'youtube',
          title,
          description,
          url,
          relevance_score: null,
        })
      }
    })

    return trends
  } catch (error) {
    console.error('YouTube scraper error:', error)
    return []
  }
}
