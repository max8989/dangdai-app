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

function useIosStandaloneSafeAreaFix() {
  useEffect(() => {
    // iOS standalone PWA bug: env(safe-area-inset-*) can return 0 on first
    // paint and only updates after the first user interaction. Nudging the
    // scroll position forces WebKit to recompute the insets so fixed-position
    // chrome (e.g. the bottom tab bar) sits above the home indicator on launch.
    const recompute = () => {
      window.scrollTo(0, 1);
      window.scrollTo(0, 0);
    };
    const raf = requestAnimationFrame(recompute);
    const timeout = window.setTimeout(recompute, 300);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timeout);
    };
  }, []);
}

function RootComponent() {
  useThemeSync();
  useIosStandaloneSafeAreaFix();
  return (
    <>
      <Outlet />
      <Toaster
        richColors
        position="top-center"
        offset="calc(env(safe-area-inset-top) + 16px)"
        mobileOffset="calc(env(safe-area-inset-top) + 12px)"
      />
      <Suspense fallback={null}>
        <TanStackRouterDevtools position="bottom-right" />
      </Suspense>
    </>
  );
}
