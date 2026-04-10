'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createClient(formData: FormData) {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const socialNetworks: Record<string, boolean> = {}
  const networks = ['instagram', 'tiktok', 'youtube', 'facebook']
  networks.forEach((net) => {
    if (formData.get(net) === 'on') socialNetworks[net] = true
  })

  const { error } = await supabase.from('clients').insert({
    name: formData.get('name') as string,
    niche: formData.get('niche') as string,
    target_audience: formData.get('target_audience') as string,
    tone_of_voice: formData.get('tone_of_voice') as string,
    main_products: formData.get('main_products') as string,
    social_networks: socialNetworks,
    content_examples: formData.get('content_examples') as string,
    created_by: user.id,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/clients')
  redirect('/clients')
}

export async function updateClient(id: string, formData: FormData) {
  const supabase = await createServerSupabaseClient()

  const socialNetworks: Record<string, boolean> = {}
  const networks = ['instagram', 'tiktok', 'youtube', 'facebook']
  networks.forEach((net) => {
    if (formData.get(net) === 'on') socialNetworks[net] = true
  })

  const { error } = await supabase
    .from('clients')
    .update({
      name: formData.get('name') as string,
      niche: formData.get('niche') as string,
      target_audience: formData.get('target_audience') as string,
      tone_of_voice: formData.get('tone_of_voice') as string,
      main_products: formData.get('main_products') as string,
      social_networks: socialNetworks,
      content_examples: formData.get('content_examples') as string,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath(`/clients/${id}`)
  revalidatePath('/clients')
  redirect(`/clients/${id}`)
}

export async function deleteClient(id: string) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.from('clients').delete().eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/clients')
  redirect('/clients')
}
