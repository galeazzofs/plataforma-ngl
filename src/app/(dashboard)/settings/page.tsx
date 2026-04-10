import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Profile } from '@/types'

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Configuracoes</h1>
        <p className="text-slate-500 mt-1">Gerenciamento da equipe</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Equipe</CardTitle>
          <CardDescription>
            Para convidar novos membros, use o painel do Supabase (Authentication &rarr; Invite User).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(profiles as Profile[] ?? []).map((profile) => (
              <div
                key={profile.id}
                className="flex items-center justify-between py-2 px-3 rounded-lg border border-slate-200"
              >
                <div>
                  <p className="font-medium text-slate-900">{profile.full_name}</p>
                </div>
                <Badge variant="secondary">{profile.role}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
