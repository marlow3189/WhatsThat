// Planer AI: „chcę wybrukować podjazd” → krótka mapa drogi (kroki) z zapytaniami do wyszukiwarki.
// Model tylko układa plan; oferty dopasowuje baza (listings_nearby), znajomi najpierw.
// Wdrożenie: supabase functions deploy plan && supabase secrets set ANTHROPIC_API_KEY=...
import Anthropic from 'npm:@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') })

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['goal', 'steps'],
  properties: {
    goal: { type: 'string', description: 'Cel użytkownika w jego języku, krótko' },
    steps: {
      type: 'array',
      description: '2–6 kroków w kolejności wykonania',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'kind', 'queries', 'categories'],
        properties: {
          title: { type: 'string', description: 'Co trzeba zdobyć albo zrobić, np. „Piasek pod podsypkę, ok. 3 t”' },
          kind: { type: 'string', enum: ['buy', 'rent', 'service', 'borrow'] },
          queries: { type: 'array', items: { type: 'string' }, description: '2–5 słów do wyszukania w ogłoszeniach, w języku ogłoszeń z okolicy' },
          categories: { type: 'array', items: { type: 'string' }, description: 'id kategorii z listy' },
        },
      },
    },
  },
} as const

const CATEGORIES = 'farm, cars, homes, services, jobs, tools, home, beauty, fashion, kids, electronics, sport, events, pets, community, other'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  const { query, lang = 'pl', country = 'PL' } = await req.json()
  if (typeof query !== 'string' || query.trim().length < 2 || query.length > 300) {
    return json({ error: 'query' }, 400)
  }

  const response = await client.beta.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 4000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
    system:
      `You help neighbours organise everyday tasks with what people nearby offer: borrowing, renting, buying locally, small services. ` +
      `Break the user's goal into the few things they need to get or have done. Prefer renting or borrowing tools over buying. ` +
      `Write titles in language "${lang}", queries in the main language of country "${country}". Categories: ${CATEGORIES}. ` +
      `If the request is a single product (e.g. eggs), return one step.`,
    messages: [{ role: 'user', content: query }],
  })

  if (response.stop_reason === 'refusal') return json({ error: 'refusal' }, 422)
  const text = response.content.find((b) => b.type === 'text')
  if (!text || text.type !== 'text') return json({ error: 'empty' }, 502)
  return json(JSON.parse(text.text))
})

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
