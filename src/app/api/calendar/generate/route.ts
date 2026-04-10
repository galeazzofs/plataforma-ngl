import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { buildCalendarPrompt } from '@/lib/ai/prompt'
import { parseCalendarResponse } from '@/lib/ai/parse-calendar'
import { randomUUID } from 'crypto'
import type { Client, Trend } from '@/types'

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ data: null, error: `Auth failed: ${authError?.message || 'No user'}` }, { status: 401 })
    }

    const { clientId } = await request.json()

    // 2. Fetch client
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ data: null, error: `Client fetch failed: ${clientError?.message || 'Not found'}` }, { status: 404 })
    }

    // 3. Fetch trends
    const { data: trends } = await supabase
      .from('trends')
      .select('*')
      .eq('niche', (client as Client).niche)
      .gte('collected_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('collected_at', { ascending: false })
      .limit(30)

    // 4. Calculate dates
    const today = new Date()
    const daysUntilMonday = (8 - today.getDay()) % 7 || 7
    const startDate = new Date(today)
    startDate.setDate(today.getDate() + daysUntilMonday)
    const startDateStr = startDate.toISOString().split('T')[0]

    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + 13)
    const endDateStr = endDate.toISOString().split('T')[0]

    // 5. Build prompt
    const { system, user: userPrompt } = buildCalendarPrompt(
      client as Client,
      (trends ?? []) as Trend[],
      startDateStr
    )

    // 6. Call Gemini
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ data: null, error: 'GEMINI_API_KEY not configured' }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: system,
    })

    let responseText: string
    try {
      const result = await model.generateContent(userPrompt)
      responseText = result.response.text()
    } catch (aiError: unknown) {
      const msg = aiError instanceof Error ? aiError.message : String(aiError)
      return NextResponse.json({ data: null, error: `Gemini API error: ${msg}` }, { status: 500 })
    }

    // 7. Parse response
    const calendarId = randomUUID()
    let parseResult: ReturnType<typeof parseCalendarResponse>

    try {
      parseResult = parseCalendarResponse(responseText, calendarId, clientId, startDateStr)
    } catch {
      // Retry with stricter prompt
      try {
        const retryModel = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          systemInstruction: system + '\nIMPORTANTE: Responda APENAS com JSON valido. Sem markdown, sem texto extra, sem blocos de codigo.',
        })
        const retryResult = await retryModel.generateContent(userPrompt)
        const retryText = retryResult.response.text()
        parseResult = parseCalendarResponse(retryText, calendarId, clientId, startDateStr)
      } catch (retryError: unknown) {
        const msg = retryError instanceof Error ? retryError.message : String(retryError)
        return NextResponse.json({
          data: null,
          error: `Failed to parse AI response: ${msg}`,
          debug: responseText.substring(0, 500),
        }, { status: 500 })
      }
    }

    const { items, parsed: aiOutput } = parseResult

    // 8. Delete existing drafts
    const { data: existingDrafts } = await supabase
      .from('content_calendars')
      .select('id')
      .eq('client_id', clientId)
      .eq('status', 'draft')

    for (const draft of existingDrafts ?? []) {
      await supabase.from('content_items').delete().eq('calendar_id', draft.id)
      await supabase.from('content_calendars').delete().eq('id', draft.id)
    }

    // 9. Save calendar
    const { error: calError } = await supabase.from('content_calendars').insert({
      id: calendarId,
      client_id: clientId,
      generated_by: user.id,
      status: 'draft',
      period_start: startDateStr,
      period_end: endDateStr,
      raw_ai_response: aiOutput,
    })

    if (calError) {
      return NextResponse.json({ data: null, error: `Calendar save failed: ${calError.message}` }, { status: 500 })
    }

    // 10. Save items
    if (items.length > 0) {
      const { error: itemsError } = await supabase.from('content_items').insert(items)
      if (itemsError) {
        return NextResponse.json({ data: null, error: `Items save failed: ${itemsError.message}` }, { status: 500 })
      }
    }

    return NextResponse.json({
      data: { calendarId, items, period_start: startDateStr, period_end: endDateStr },
      error: null,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { data: null, error: `Unexpected error: ${msg}` },
      { status: 500 }
    )
  }
}
