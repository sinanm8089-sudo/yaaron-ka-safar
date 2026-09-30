'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { signOut } from '@/lib/auth/actions';
import { LayoutDashboard, Calendar, Zap, Camera, Bus, LogOut } from 'lucide-react';

const navItems = [
  { href: '/principal', label: 'Home', icon: LayoutDashboard },
  { href: '/principal/schedule', label: 'Schedule', icon: Calendar },
  { href: '/principal/activities', label: 'Activities', icon: Zap },
  { href: '/principal/photos', label: 'Photos', icon: Camera },
];

export default function PrincipalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/principal') return pathname === '/principal';
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 h-14 max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center">
              <Bus className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold gradient-text">YAARON KA SAFAR</span>
              <p className="text-[10px] text-[var(--color-text-muted)]">Principal View</p>
            </div>
          </div>

          <form action={signOut}>
            <button
              type="submit"
              className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)] transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </form>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full pb-24">
        {children}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-xl">
        <div className="flex items-center justify-around h-16 px-2 max-w-2xl mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors',
                  active ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
