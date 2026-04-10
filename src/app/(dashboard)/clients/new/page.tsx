import { ClientForm } from '@/components/client-form'
import { createClient } from '@/lib/actions/clients'

export default function NewClientPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Novo Cliente</h1>
      <ClientForm action={createClient} />
    </div>
  )
}
