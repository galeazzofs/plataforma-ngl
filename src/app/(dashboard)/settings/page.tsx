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
        <h1 className="text-2xl font-bold text-white/90">Configuracoes</h1>
        <p className="text-white/40 text-sm mt-1">Gerenciamento da equipe</p>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <h3 className="text-base font-semibold text-white/90">Equipe</h3>
          <p className="text-white/30 text-sm mt-1">
            Para convidar novos membros, use o painel do Supabase (Authentication &rarr; Invite User).
          </p>
        </div>
        <div className="px-3 py-3 space-y-0.5">
          {(profiles as Profile[] ?? []).map((profile) => (
            <div
              key={profile.id}
              className="px-6 py-3 flex justify-between items-center hover:bg-white/[0.02] transition-colors duration-200 rounded-xl"
            >
              <p className="text-sm font-medium text-white/80">{profile.full_name}</p>
              <span className="bg-violet-500/10 text-violet-300 rounded-full px-3 py-1 text-xs font-medium">
                {profile.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
