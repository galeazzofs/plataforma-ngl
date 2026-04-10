'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Kanban,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clientes', icon: Users },
  { href: '/kanban', label: 'Kanban', icon: Kanban },
  { href: '/settings', label: 'Configuracoes', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error('Erro ao sair')
      return
    }
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="flex h-screen w-72 flex-col bg-white/[0.02] border-r border-white/[0.06]">
      {/* Logo */}
      <div className="flex h-20 items-center gap-2 px-6">
        <Link
          href="/dashboard"
          className="text-gradient text-xl font-extrabold tracking-tight transition-all duration-200"
        >
          ContentOS
        </Link>
        <Sparkles className="h-4 w-4 text-violet-400" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border-l-[3px] pl-[13px]',
                isActive
                  ? 'bg-gradient-to-r from-violet-500/10 to-transparent text-white border-violet-500'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03] border-transparent'
              )}
            >
              <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-white/[0.06] px-4 py-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/30 hover:text-rose-400 hover:bg-white/[0.03] transition-all duration-200 border-l-[3px] border-transparent pl-[13px]"
        >
          <LogOut className="h-[18px] w-[18px] flex-shrink-0" />
          Sair
        </button>
      </div>
    </aside>
  )
}
