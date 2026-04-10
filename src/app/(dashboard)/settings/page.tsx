import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Profile } from '@/types'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Configuracoes</h1>
        <p className="text-muted-foreground mt-1">Gerenciamento da equipe</p>
      </div>

      <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50">
          <h3 className="text-base font-semibold text-foreground">Equipe</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Para convidar novos membros, use o painel do Supabase (Authentication &rarr; Invite User).
          </p>
        </div>
        <div className="p-5 space-y-3">
          {(profiles as Profile[] ?? []).map((profile) => (
            <div
              key={profile.id}
              className="flex items-center justify-between border border-border/30 rounded-lg p-3"
            >
              <div>
                <p className="font-medium text-foreground">{profile.full_name}</p>
              </div>
              <span className="bg-indigo-500/10 text-indigo-400 rounded-full text-xs px-2.5 py-0.5 font-medium">
                {profile.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
