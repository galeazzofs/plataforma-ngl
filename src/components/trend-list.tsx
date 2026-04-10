'use client'

import { useState } from 'react'
import { RefreshCw, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import type { Trend } from '@/types'
import { formatDate } from '@/lib/utils'

interface TrendListProps {
  clientId: string
  initialTrends: Trend[]
}

export function TrendList({ clientId, initialTrends }: TrendListProps) {
  const [trends, setTrends] = useState(initialTrends)
  const [loading, setLoading] = useState(false)

  async function collectTrends() {
    setLoading(true)
    try {
      const res = await fetch('/api/trends/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      })
      const result = await res.json()

      if (result.error) {
        toast.error('Erro ao coletar trends', { description: String(result.error) })
        return
      }

      const data = result.data ?? []
      const debug = result.debug
      const msg = debug
        ? `Google: ${debug.googleCount}, YouTube: ${debug.youtubeCount}, Salvos: ${debug.insertedCount}`
        : `${data.length} trends coletados`
      toast.success(msg)
      setTrends((prev) => {
        const ids = new Set(prev.map((t) => t.id))
        const newOnes = (data as Trend[]).filter((t) => !ids.has(t.id))
        return [...newOnes, ...prev]
      })
    } catch {
      toast.error('Erro ao coletar trends')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-white/40">{trends.length} trends coletados</p>
        <button
          onClick={collectTrends}
          disabled={loading}
          className="bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-xl font-medium hover:from-violet-500 hover:to-cyan-500 px-4 py-2 text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Coletando...' : 'Coletar Agora'}
        </button>
      </div>

      {!trends.length ? (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl flex flex-col items-center justify-center py-12">
          <p className="text-white/40 mb-4">Nenhuma trend coletada para este nicho</p>
          <button
            onClick={collectTrends}
            disabled={loading}
            className="bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-xl font-medium hover:from-violet-500 hover:to-cyan-500 px-5 py-2.5 text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Coletar Trends
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {trends.map((trend) => (
            <div
              key={trend.id}
              className="bg-white/[0.03] border border-white/[0.06] rounded-2xl px-5 py-3.5 hover:border-white/[0.12] transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-white/90 text-sm">{trend.title}</span>
                    <span
                      className={
                        trend.source === 'google_trends'
                          ? 'bg-cyan-500/10 text-cyan-300 text-xs px-2.5 py-0.5 rounded-full font-medium'
                          : 'bg-rose-500/10 text-rose-300 text-xs px-2.5 py-0.5 rounded-full font-medium'
                      }
                    >
                      {trend.source === 'google_trends' ? 'Google' : 'YouTube'}
                    </span>
                    {trend.relevance_score && (
                      <span className="bg-white/[0.06] text-white/40 text-xs px-2.5 py-0.5 rounded-full">
                        {trend.relevance_score}
                      </span>
                    )}
                  </div>
                  {trend.description && (
                    <p className="text-xs text-white/30 mt-1 line-clamp-1">{trend.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                  <span className="text-[11px] text-white/25">{formatDate(trend.collected_at)}</span>
                  {trend.url && (
                    <a href={trend.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 text-white/20 hover:text-white/60 transition-colors duration-200" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
