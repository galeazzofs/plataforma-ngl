import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { buildCalendarPrompt } from '@/lib/ai/prompt'
import { parseCalendarResponse } from '@/lib/ai/parse-calendar'
import { randomUUID } from 'crypto'
import type { Client, Trend } from '@/types'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    }

    const { clientId } = await request.json()

    const { data: client } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()

    if (!client) {
      return NextResponse.json({ data: null, error: 'Client not found' }, { status: 404 })
    }

    const { data: trends } = await supabase
      .from('trends')
      .select('*')
      .eq('niche', (client as Client).niche)
      .gte('collected_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('collected_at', { ascending: false })
      .limit(30)

    const today = new Date()
    const daysUntilMonday = (8 - today.getDay()) % 7 || 7
    const startDate = new Date(today)
    startDate.setDate(today.getDate() + daysUntilMonday)
    const startDateStr = startDate.toISOString().split('T')[0]

    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + 13)
    const endDateStr = endDate.toISOString().split('T')[0]

    const { system, user: userPrompt } = buildCalendarPrompt(
      client as Client,
      (trends ?? []) as Trend[],
      startDateStr
    )

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: system,
    })

    const result = await model.generateContent(userPrompt)
    const responseText = result.response.text()

    const calendarId = randomUUID()
    let parseResult: ReturnType<typeof parseCalendarResponse> | null = null

    try {
      parseResult = parseCalendarResponse(responseText, calendarId, clientId, startDateStr)
    } catch {
      console.warn('First parse failed, retrying with stricter prompt...')
      const retryModel = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        systemInstruction: system + '\nIMPORTANTE: Responda APENAS com JSON valido. Sem markdown, sem texto extra, sem blocos de codigo.',
      })
      const retryResult = await retryModel.generateContent(userPrompt)
      const retryText = retryResult.response.text()
      parseResult = parseCalendarResponse(retryText, calendarId, clientId, startDateStr)
    }

    const { items, parsed: aiOutput } = parseResult

    // Delete existing draft calendars for this client
    const { data: existingDrafts } = await supabase
      .from('content_calendars')
      .select('id')
      .eq('client_id', clientId)
      .eq('status', 'draft')

    for (const draft of existingDrafts ?? []) {
      await supabase.from('content_items').delete().eq('calendar_id', draft.id)
      await supabase.from('content_calendars').delete().eq('id', draft.id)
    }

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
      return NextResponse.json({ data: null, error: calError.message }, { status: 500 })
    }

    if (items.length > 0) {
      const { error: itemsError } = await supabase.from('content_items').insert(items)
      if (itemsError) {
        console.error('Content items insert error:', itemsError)
      }
    }

    return NextResponse.json({
      data: { calendarId, items, period_start: startDateStr, period_end: endDateStr },
      error: null,
    })
  } catch (error) {
    console.error('Calendar generation error:', error)
    return NextResponse.json(
      { data: null, error: 'Failed to generate calendar' },
      { status: 500 }
    )
  }
}
