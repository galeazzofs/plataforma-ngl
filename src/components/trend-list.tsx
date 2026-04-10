'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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

  const sourceColors: Record<string, string> = {
    google_trends: 'bg-blue-100 text-blue-700',
    youtube: 'bg-red-100 text-red-700',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">{trends.length} trends coletados</p>
        <Button onClick={collectTrends} disabled={loading} size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Coletando...' : 'Coletar Agora'}
        </Button>
      </div>

      {!trends.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-slate-500 mb-4">Nenhuma trend coletada para este nicho</p>
            <Button onClick={collectTrends} disabled={loading}>
              Coletar Trends
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {trends.map((trend) => (
            <Card key={trend.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{trend.title}</span>
                    <Badge className={sourceColors[trend.source] ?? ''} variant="secondary">
                      {trend.source === 'google_trends' ? 'Google' : 'YouTube'}
                    </Badge>
                    {trend.relevance_score && (
                      <Badge variant="outline">{trend.relevance_score}</Badge>
                    )}
                  </div>
                  {trend.description && (
                    <p className="text-sm text-slate-500 mt-1 line-clamp-1">{trend.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">{formatDate(trend.collected_at)}</span>
                  {trend.url && (
                    <a href={trend.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
