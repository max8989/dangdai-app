import { Link, Outlet, createFileRoute, useLocation } from '@tanstack/react-router';
import { BookOpen, Home, MessageSquare, Settings, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_authed/_tabs')({
  component: TabsLayout,
});

interface TabDef {
  to: '/' | '/books' | '/generate' | '/chat' | '/settings';
  label: string;
  Icon: LucideIcon;
}

const TABS: TabDef[] = [
  { to: '/', label: 'Home', Icon: Home },
  { to: '/books', label: 'Books', Icon: BookOpen },
  { to: '/generate', label: 'Generate', Icon: Sparkles },
  { to: '/chat', label: 'Chat', Icon: MessageSquare },
  { to: '/settings', label: 'Settings', Icon: Settings },
];

function TabsLayout() {
  const { pathname } = useLocation();

  return (
    <div className="h-app mx-auto flex max-w-md flex-col overflow-hidden bg-background">
      <main className="min-h-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>

      <nav
        aria-label="Primary"
        className="shrink-0 border-t bg-background/95 pb-safe backdrop-blur supports-[backdrop-filter]:bg-background/80"
      >
        <ul className="flex h-16 items-stretch justify-around px-2">
          {TABS.map(({ to, label, Icon }) => {
            const active = to === '/' ? pathname === '/' : pathname.startsWith(to);
            return (
              <li key={to} className="flex flex-1">
                <Link
                  to={to}
                  className={cn(
                    'flex flex-1 flex-col items-center justify-center gap-0.5 rounded-md text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="size-5" />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
