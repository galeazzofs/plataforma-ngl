declare module 'google-trends-api' {
  interface TrendsOptions {
    keyword: string
    geo?: string
    hl?: string
    startTime?: Date
    endTime?: Date
    category?: number
  }

  const googleTrends: {
    relatedQueries(options: TrendsOptions): Promise<string>
    relatedTopics(options: TrendsOptions): Promise<string>
    interestOverTime(options: TrendsOptions): Promise<string>
    dailyTrends(options: { geo?: string; trendDate?: Date }): Promise<string>
  }

  export default googleTrends
}
