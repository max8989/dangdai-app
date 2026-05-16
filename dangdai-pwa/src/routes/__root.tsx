import { Outlet, createRootRoute } from '@tanstack/react-router';
import { Suspense, lazy, useEffect } from 'react';

import { Toaster } from '@/components/ui/sonner';
import { useSettingsStore } from '@/stores/useSettingsStore';

const TanStackRouterDevtools =
  import.meta.env.PROD
    ? () => null
    : lazy(() =>
        import('@tanstack/react-router-devtools').then((m) => ({
          default: m.TanStackRouterDevtools,
        })),
      );

export const Route = createRootRoute({
  component: RootComponent,
});

function applyThemeClass(theme: 'light' | 'dark' | 'system') {
  const resolved =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme;
  document.documentElement.classList.toggle('dark', resolved === 'dark');
}

function useThemeSync() {
  const theme = useSettingsStore((s) => s.theme);

  useEffect(() => {
    applyThemeClass(theme);
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyThemeClass('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);
}

function RootComponent() {
  useThemeSync();
  return (
    <>
      <Outlet />
      <Toaster richColors position="top-center" />
      <Suspense fallback={null}>
        <TanStackRouterDevtools position="bottom-right" />
      </Suspense>
    </>
  );
}
