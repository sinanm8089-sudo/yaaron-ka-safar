'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { signOut } from '@/lib/auth/actions';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Zap,
  ClipboardCheck,
  Wallet,
  Camera,
  Bell,
  Settings,
  Bus,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ClipboardList,
  FileText,
} from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/students', label: 'Students', icon: Users },
  { href: '/admin/schedule', label: 'Schedule', icon: Calendar },
  { href: '/admin/activities', label: 'Activities', icon: Zap },
  { href: '/admin/attendance', label: 'Attendance', icon: ClipboardCheck },
  { href: '/admin/attendance-requests', label: 'Attendance Requests', icon: ClipboardList },
  { href: '/admin/student-reports', label: 'Student Reports', icon: FileText },
  { href: '/admin/funds', label: 'Funds', icon: Wallet },
  { href: '/admin/photos', label: 'Photos', icon: Camera },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 border-r border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[var(--radius-lg)] bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center shadow-md">
              <Bus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold gradient-text">YAARON KA SAFAR</h1>
              <p className="text-[10px] text-[var(--color-text-muted)]">Admin Control Center</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-lg)] text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-[var(--color-primary-glow)] text-[var(--color-primary)] border border-[var(--color-primary)]/10'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)]'
                )}
              >
                <Icon className="w-[18px] h-[18px]" />
                <span>{item.label}</span>
                {active && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
              </Link>
            );
          })}
        </nav>

        {/* Sign Out */}
        <div className="p-3 border-t border-[var(--color-border)]">
          <form action={signOut}>
            <button
              type="submit"
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-[var(--radius-lg)] text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)] transition-all duration-200"
            >
              <LogOut className="w-[18px] h-[18px]" />
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 lg:hidden border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 h-14">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-[var(--radius-md)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)]"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center">
                <Bus className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold gradient-text">YKS</span>
            </div>

            <Link
              href="/admin/notifications"
              className="p-2 rounded-[var(--radius-md)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] relative"
            >
              <Bell className="w-5 h-5" />
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-xl lg:hidden safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {[
            { href: '/admin', label: 'Home', icon: LayoutDashboard },
            { href: '/admin/schedule', label: 'Schedule', icon: Calendar },
            { href: '/admin/attendance', label: 'Attend', icon: ClipboardCheck },
            { href: '/admin/photos', label: 'Photos', icon: Camera },
            { href: '/admin/students', label: 'More', icon: Menu },
          ].map((item) => {
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
