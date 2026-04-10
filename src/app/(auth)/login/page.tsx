'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      toast.error('Erro ao fazer login', { description: error.message })
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#09090b] overflow-hidden font-[var(--font-jakarta)]">
      {/* Animated gradient mesh blobs */}
      <div className="absolute top-[-10%] left-[-5%] h-[600px] w-[600px] rounded-full bg-violet-500/10 blur-[128px] animate-float" />
      <div className="absolute bottom-[-15%] right-[-8%] h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[128px] animate-float-delayed" />
      <div className="absolute top-[25%] right-[10%] h-[400px] w-[400px] rounded-full bg-rose-500/[0.08] blur-[100px] animate-float" />

      {/* Login card */}
      <div className="relative z-10 w-full max-w-md animate-fade-up">
        <div className="glass-strong rounded-2xl p-10">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-gradient text-3xl font-extrabold tracking-tight">
              ContentOS
            </h1>
            <p className="mt-3 text-sm text-white/40">
              Plataforma criativa para agencias
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="animate-fade-up stagger-1">
              <label
                htmlFor="email"
                className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-2 block"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white/90 placeholder:text-white/25 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 outline-none transition-all duration-200"
              />
            </div>

            <div className="animate-fade-up stagger-2">
              <label
                htmlFor="password"
                className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-2 block"
              >
                Senha
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white/90 placeholder:text-white/25 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 outline-none transition-all duration-200"
              />
            </div>

            <div className="animate-fade-up stagger-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl py-3 font-semibold text-white bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
