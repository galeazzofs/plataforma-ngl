'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
      const { data, error } = await res.json()

      if (error) {
        toast.error('Erro ao coletar trends', { description: error })
        return
      }

      toast.success(`${data.length} trends coletados`)
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
        <p className="text-sm text-muted-foreground">{trends.length} trends coletados</p>
        <Button
          onClick={collectTrends}
          disabled={loading}
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-500 text-white transition-colors duration-150"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Coletando...' : 'Coletar Agora'}
        </Button>
      </div>

      {!trends.length ? (
        <div className="bg-card border border-border/50 rounded-xl flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">Nenhuma trend coletada para este nicho</p>
          <Button
            onClick={collectTrends}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white transition-colors duration-150"
          >
            Coletar Trends
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {trends.map((trend) => (
            <div
              key={trend.id}
              className="bg-card border border-border/50 rounded-xl hover:border-border transition-colors duration-150 px-4 py-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground text-sm">{trend.title}</span>
                    <span
                      className={
                        trend.source === 'google_trends'
                          ? 'bg-blue-500/10 text-blue-400 text-xs px-2 py-0.5 rounded-full'
                          : 'bg-red-500/10 text-red-400 text-xs px-2 py-0.5 rounded-full'
                      }
                    >
                      {trend.source === 'google_trends' ? 'Google' : 'YouTube'}
                    </span>
                    {trend.relevance_score && (
                      <span className="bg-secondary text-muted-foreground text-xs px-2 py-0.5 rounded-full">
                        {trend.relevance_score}
                      </span>
                    )}
                  </div>
                  {trend.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{trend.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                  <span className="text-xs text-muted-foreground/60">{formatDate(trend.collected_at)}</span>
                  {trend.url && (
                    <a href={trend.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 text-muted-foreground/50 hover:text-foreground transition-colors duration-150" />
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
