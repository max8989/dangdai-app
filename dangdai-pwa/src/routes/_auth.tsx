import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

import { supabase } from '@/lib/supabase';
import { MaixinLogo } from '@/components/MaixinLogo';

export const Route = createFileRoute('/_auth')({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      throw redirect({ to: '/' });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <main
      className="min-h-dvh flex flex-col items-center justify-center bg-background p-4"
      style={{
        paddingTop: 'max(1rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
      }}
    >
      <div className="w-full max-w-md flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2">
          <MaixinLogo width={180} />
        </div>
        <Outlet />
      </div>
    </main>
  );
}
