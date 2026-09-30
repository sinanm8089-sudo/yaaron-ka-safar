'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { signOut } from '@/lib/auth/actions';
import {
  LayoutDashboard,
  Calendar,
  ClipboardCheck,
  Wallet,
  Camera,
  User,
  Bus,
  LogOut,
  Bell,
  Menu,
} from 'lucide-react';

const navItems = [
  { href: '/student', label: 'Home', icon: LayoutDashboard },
  { href: '/student/schedule', label: 'Schedule', icon: Calendar },
  { href: '/student/attendance', label: 'Attend', icon: ClipboardCheck },
  { href: '/student/photos', label: 'Photos', icon: Camera },
  { href: '/student/payments', label: 'Pay', icon: Wallet },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/student') return pathname === '/student';
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center">
              <Bus className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold gradient-text">YAARON KA SAFAR</span>
          </div>

          <div className="flex items-center gap-1">
            <Link
              href="/student/notifications"
              className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)]"
            >
              <Bell className="w-5 h-5" />
            </Link>
            <Link
              href="/student/profile"
              className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)]"
            >
              <User className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full pb-24">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-xl">
        <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
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
