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
    <div className="min-h-dvh mx-auto flex max-w-md flex-col bg-background">
      <main
        className="flex-1"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))',
        }}
      >
        <Outlet />
      </main>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
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
