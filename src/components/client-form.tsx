'use client'

import type { Client } from '@/types'

interface ClientFormProps {
  action: (formData: FormData) => Promise<void>
  client?: Client
}

const SOCIAL_NETWORKS = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'facebook', label: 'Facebook' },
]

export function ClientForm({ action, client }: ClientFormProps) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8">
      <form action={action} className="space-y-6">
        {/* Name + Niche */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label
              htmlFor="name"
              className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-2 block"
            >
              Nome
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={client?.name}
              placeholder="Nome do cliente"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white/90 placeholder:text-white/25 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 outline-none transition-all duration-200"
            />
          </div>
          <div>
            <label
              htmlFor="niche"
              className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-2 block"
            >
              Nicho
            </label>
            <input
              id="niche"
              name="niche"
              type="text"
              required
              defaultValue={client?.niche}
              placeholder="ex: moda feminina, pet shop"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white/90 placeholder:text-white/25 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 outline-none transition-all duration-200"
            />
          </div>
        </div>

        {/* Target audience */}
        <div>
          <label
            htmlFor="target_audience"
            className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-2 block"
          >
            Publico-alvo
          </label>
          <textarea
            id="target_audience"
            name="target_audience"
            rows={3}
            defaultValue={client?.target_audience}
            placeholder="Descreva o publico-alvo do cliente"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white/90 placeholder:text-white/25 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 outline-none transition-all duration-200 resize-none"
          />
        </div>

        {/* Tone of voice */}
        <div>
          <label
            htmlFor="tone_of_voice"
            className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-2 block"
          >
            Tom de Voz
          </label>
          <input
            id="tone_of_voice"
            name="tone_of_voice"
            type="text"
            defaultValue={client?.tone_of_voice}
            placeholder="ex: descontraido, profissional, jovem"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white/90 placeholder:text-white/25 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 outline-none transition-all duration-200"
          />
        </div>

        {/* Main products */}
        <div>
          <label
            htmlFor="main_products"
            className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-2 block"
          >
            Produtos Principais
          </label>
          <textarea
            id="main_products"
            name="main_products"
            rows={3}
            defaultValue={client?.main_products}
            placeholder="Liste os produtos ou servicos principais"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white/90 placeholder:text-white/25 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 outline-none transition-all duration-200 resize-none"
          />
        </div>

        {/* Social Networks — toggle chips */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-2 block">
            Redes Sociais Ativas
          </p>
          <div className="flex flex-wrap gap-2.5">
            {SOCIAL_NETWORKS.map((net) => {
              const isChecked = client?.social_networks?.[net.key] ?? false
              return (
                <label key={net.key} className="relative cursor-pointer">
                  <input
                    type="checkbox"
                    name={net.key}
                    defaultChecked={isChecked}
                    className="peer sr-only"
                  />
                  <span className="inline-flex items-center bg-white/[0.04] border border-white/[0.08] rounded-full px-4 py-2 text-sm text-white/40 cursor-pointer transition-all duration-200 peer-checked:bg-violet-500/15 peer-checked:border-violet-500/40 peer-checked:text-violet-300 hover:border-white/[0.15] hover:text-white/60">
                    {net.label}
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Content examples */}
        <div>
          <label
            htmlFor="content_examples"
            className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-2 block"
          >
            Exemplos de Conteudo que Funcionou
          </label>
          <textarea
            id="content_examples"
            name="content_examples"
            rows={4}
            defaultValue={client?.content_examples}
            placeholder="Descreva conteudos anteriores que tiveram bom desempenho"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white/90 placeholder:text-white/25 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 outline-none transition-all duration-200 resize-none"
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-3">
          <button
            type="submit"
            className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white rounded-xl font-semibold px-6 py-3 transition-all duration-200"
          >
            {client ? 'Salvar Alteracoes' : 'Criar Cliente'}
          </button>
        </div>
      </form>
    </div>
  )
}
