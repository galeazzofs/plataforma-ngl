import * as cheerio from 'cheerio'
import type { Trend } from '@/types'

export async function fetchYouTubeTrending(): Promise<Omit<Trend, 'id' | 'collected_at' | 'niche'>[]> {
  // Try multiple approaches
  const results = await tryYouTubeRSS()
  if (results.length > 0) return results

  const fallback = await tryYouTubePage()
  if (fallback.length > 0) return fallback

  console.warn('YouTube: all methods returned 0 results')
  return []
}

async function tryYouTubeRSS(): Promise<Omit<Trend, 'id' | 'collected_at' | 'niche'>[]> {
  try {
    // YouTube trending RSS for Brazil
    const urls = [
      'https://www.youtube.com/feeds/videos.xml?chart=most_popular&gl=BR',
      'https://www.youtube.com/feeds/videos.xml?chart=most_popular&gl=BR&hl=pt',
    ]

    for (const url of urls) {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ContentOS/1.0)',
          'Accept': 'application/xml, text/xml, application/atom+xml',
        },
      })

      if (!response.ok) continue

      const xml = await response.text()
      if (!xml.includes('<entry>') && !xml.includes('<entry ')) continue

      const $ = cheerio.load(xml, { xmlMode: true })
      const trends: Omit<Trend, 'id' | 'collected_at' | 'niche'>[] = []

      $('entry').each((i, el) => {
        if (i >= 20) return false

        const title = $(el).find('title').text().trim()
        const link = $(el).find('link').attr('href')
        const author = $(el).find('author name').text().trim()

        if (title) {
          trends.push({
            source: 'youtube',
            title,
            description: author ? `Por: ${author}` : null,
            url: link ?? null,
            relevance_score: null,
          })
        }
      })

      if (trends.length > 0) return trends
    }

    return []
  } catch (error) {
    console.error('YouTube RSS error:', error)
    return []
  }
}

async function tryYouTubePage(): Promise<Omit<Trend, 'id' | 'collected_at' | 'niche'>[]> {
  try {
    const response = await fetch('https://www.youtube.com/feed/trending?gl=BR&hl=pt', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
    })

    if (!response.ok) return []

    const html = await response.text()

    // Try to extract video titles from the HTML
    const trends: Omit<Trend, 'id' | 'collected_at' | 'niche'>[] = []

    // YouTube embeds data in ytInitialData JSON
    const match = html.match(/var ytInitialData = ({[\s\S]*?});<\/script>/)
    if (match) {
      try {
        const data = JSON.parse(match[1])
        const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs ?? []
        for (const tab of tabs) {
          const items = tab?.tabRenderer?.content?.sectionListRenderer?.contents ?? []
          for (const section of items) {
            const shelf = section?.itemSectionRenderer?.contents ?? []
            for (const item of shelf) {
              const videos = item?.shelfRenderer?.content?.expandedShelfContentsRenderer?.items ?? []
              for (const video of videos) {
                const renderer = video?.videoRenderer
                if (renderer) {
                  const title = renderer.title?.runs?.[0]?.text
                  const videoId = renderer.videoId
                  if (title && trends.length < 20) {
                    trends.push({
                      source: 'youtube',
                      title,
                      description: renderer.shortBylineText?.runs?.[0]?.text ?? null,
                      url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : null,
                      relevance_score: null,
                    })
                  }
                }
              }
            }
          }
        }
      } catch {
        // JSON parse failed, skip
      }
    }

    return trends
  } catch (error) {
    console.error('YouTube page scraper error:', error)
    return []
  }
}
