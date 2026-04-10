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
    <div className="bg-card border border-border/50 rounded-xl p-6">
      <form action={action} className="space-y-5">
        {/* Name + Niche side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-muted-foreground mb-1.5">
              Nome
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={client?.name}
              placeholder="Nome do cliente"
              className="w-full bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-indigo-500/50 transition-colors duration-150"
            />
          </div>
          <div>
            <label htmlFor="niche" className="block text-sm font-medium text-muted-foreground mb-1.5">
              Nicho
            </label>
            <input
              id="niche"
              name="niche"
              type="text"
              required
              defaultValue={client?.niche}
              placeholder="ex: moda feminina, pet shop"
              className="w-full bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-indigo-500/50 transition-colors duration-150"
            />
          </div>
        </div>

        {/* Target audience */}
        <div>
          <label htmlFor="target_audience" className="block text-sm font-medium text-muted-foreground mb-1.5">
            Publico-alvo
          </label>
          <textarea
            id="target_audience"
            name="target_audience"
            rows={3}
            defaultValue={client?.target_audience}
            placeholder="Descreva o publico-alvo do cliente"
            className="w-full bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-indigo-500/50 transition-colors duration-150 resize-none"
          />
        </div>

        {/* Tone of voice */}
        <div>
          <label htmlFor="tone_of_voice" className="block text-sm font-medium text-muted-foreground mb-1.5">
            Tom de Voz
          </label>
          <input
            id="tone_of_voice"
            name="tone_of_voice"
            type="text"
            defaultValue={client?.tone_of_voice}
            placeholder="ex: descontraido, profissional, jovem"
            className="w-full bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-indigo-500/50 transition-colors duration-150"
          />
        </div>

        {/* Main products */}
        <div>
          <label htmlFor="main_products" className="block text-sm font-medium text-muted-foreground mb-1.5">
            Produtos Principais
          </label>
          <textarea
            id="main_products"
            name="main_products"
            rows={3}
            defaultValue={client?.main_products}
            placeholder="Liste os produtos ou servicos principais"
            className="w-full bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-indigo-500/50 transition-colors duration-150 resize-none"
          />
        </div>

        {/* Social Networks */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2.5">
            Redes Sociais Ativas
          </p>
          <div className="flex flex-wrap gap-2">
            {SOCIAL_NETWORKS.map((net) => {
              const isChecked = client?.social_networks?.[net.key] ?? false
              return (
                <label key={net.key} className="group relative cursor-pointer">
                  <input
                    type="checkbox"
                    name={net.key}
                    defaultChecked={isChecked}
                    className="peer sr-only"
                  />
                  <span className="inline-flex items-center rounded-lg px-3 py-1.5 text-sm border border-border/50 text-muted-foreground transition-all duration-150 peer-checked:bg-indigo-500/10 peer-checked:border-indigo-500/50 peer-checked:text-indigo-400 hover:border-indigo-500/30">
                    {net.label}
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Content examples */}
        <div>
          <label htmlFor="content_examples" className="block text-sm font-medium text-muted-foreground mb-1.5">
            Exemplos de Conteudo que Funcionou
          </label>
          <textarea
            id="content_examples"
            name="content_examples"
            rows={4}
            defaultValue={client?.content_examples}
            placeholder="Descreva conteudos anteriores que tiveram bom desempenho"
            className="w-full bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-indigo-500/50 transition-colors duration-150 resize-none"
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg px-5 py-2.5 transition-colors duration-150"
          >
            {client ? 'Salvar Alteracoes' : 'Criar Cliente'}
          </button>
        </div>
      </form>
    </div>
  )
}
