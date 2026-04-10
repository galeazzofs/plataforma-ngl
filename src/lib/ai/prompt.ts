import type { Client, Trend } from '@/types'

export function buildCalendarPrompt(client: Client, trends: Trend[], startDate: string): { system: string; user: string } {
  const activeSocials = Object.entries(client.social_networks || {})
    .filter(([, active]) => active)
    .map(([name]) => name)
    .join(', ')

  const trendsText = trends.length > 0
    ? trends.map((t) => `- [${t.source}] ${t.title}${t.relevance_score ? ` (relevancia: ${t.relevance_score})` : ''}`).join('\n')
    : 'Nenhuma trend recente coletada.'

  const system = `Voce e um estrategista de conteudo em video para uma agencia de marketing.
Voce cria calendarios de conteudo de 14 dias para marcas de varejo entrando no digital.
Sempre responda em JSON valido seguindo o schema fornecido.
Responda em portugues brasileiro.`

  const user = `## Perfil do Cliente
- Nome: ${client.name}
- Nicho: ${client.niche}
- Publico-alvo: ${client.target_audience}
- Tom de Voz: ${client.tone_of_voice}
- Produtos Principais: ${client.main_products}
- Redes Sociais Ativas: ${activeSocials || 'Nenhuma definida'}
- Conteudo que Funcionou: ${client.content_examples || 'Nenhum exemplo fornecido'}

## Trends Atuais (${client.niche})
${trendsText}

## Tarefa
Gere um calendario de conteudo de 14 dias comecando em ${startDate}.
Cada dia pode ter 1-2 videos. Total: 14-21 videos.

Para cada video forneca:
- title: titulo chamativo para o video
- concept: 1-2 frases descrevendo a ideia
- hook: o que acontece nos primeiros 3 segundos para prender atencao
- script_outline: 3-5 topicos para o roteiro (texto, separados por \\n)
- suggested_audio: sugestao de audio trending ou estilo musical
- cta: call to action para o final
- format: "reels" | "shorts" | "tiktok"
- effort: 1 (simples/talking head) | 2 (medio/precisa b-roll) | 3 (complexo/producao)

Misture tipos de conteudo: educativo, entretenimento, bastidores, vitrine de produto, baseado em trends.
Incorpore trends relevantes naturalmente, nao force.
Equilibre os niveis de esforco — nem tudo deve ser esforco 3.

## Schema de Output
{
  "days": [
    {
      "day_number": 1,
      "date": "${startDate}",
      "videos": [
        {
          "title": "string",
          "concept": "string",
          "hook": "string",
          "script_outline": "string",
          "suggested_audio": "string",
          "cta": "string",
          "format": "reels | shorts | tiktok",
          "effort": 1
        }
      ]
    }
  ]
}

Responda APENAS com o JSON, sem texto adicional.`

  return { system, user }
}
