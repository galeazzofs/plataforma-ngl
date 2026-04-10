'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    <Card>
      <CardHeader>
        <CardTitle>{client ? 'Editar Cliente' : 'Novo Cliente'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" defaultValue={client?.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="niche">Nicho</Label>
              <Input
                id="niche"
                name="niche"
                placeholder="ex: moda feminina, pet shop"
                defaultValue={client?.niche}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_audience">Publico-alvo</Label>
            <Textarea
              id="target_audience"
              name="target_audience"
              placeholder="Descreva o publico-alvo do cliente"
              defaultValue={client?.target_audience}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tone_of_voice">Tom de Voz</Label>
            <Input
              id="tone_of_voice"
              name="tone_of_voice"
              placeholder="ex: descontraido, profissional, jovem"
              defaultValue={client?.tone_of_voice}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="main_products">Produtos Principais</Label>
            <Textarea
              id="main_products"
              name="main_products"
              placeholder="Liste os produtos ou servicos principais"
              defaultValue={client?.main_products}
            />
          </div>

          <div className="space-y-2">
            <Label>Redes Sociais Ativas</Label>
            <div className="flex flex-wrap gap-4">
              {SOCIAL_NETWORKS.map((net) => (
                <label key={net.key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name={net.key}
                    defaultChecked={client?.social_networks?.[net.key]}
                    className="rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-600">{net.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content_examples">Exemplos de Conteudo que Funcionou</Label>
            <Textarea
              id="content_examples"
              name="content_examples"
              placeholder="Descreva conteudos anteriores que tiveram bom desempenho"
              rows={4}
              defaultValue={client?.content_examples}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="submit">
              {client ? 'Salvar Alteracoes' : 'Criar Cliente'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
