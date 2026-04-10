import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'
import type { Client } from '@/types'

export const dynamic = 'force-dynamic'

export default async function ClientsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <p className="text-slate-500 mt-1">{clients?.length ?? 0} clientes cadastrados</p>
        </div>
        <Button asChild>
          <Link href="/clients/new">
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Link>
        </Button>
      </div>

      {!clients?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-slate-500 mb-4">Nenhum cliente cadastrado ainda</p>
            <Button asChild>
              <Link href="/clients/new">Adicionar primeiro cliente</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(clients as Client[]).map((client) => (
            <Link key={client.id} href={`/clients/${client.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-slate-900">{client.name}</h3>
                  <Badge variant="secondary" className="mt-2">
                    {client.niche}
                  </Badge>
                  <p className="text-sm text-slate-500 mt-3 line-clamp-2">
                    {client.target_audience}
                  </p>
                  <div className="flex gap-1 mt-3">
                    {Object.entries(client.social_networks || {})
                      .filter(([, active]) => active)
                      .map(([network]) => (
                        <Badge key={network} variant="outline" className="text-xs">
                          {network}
                        </Badge>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
