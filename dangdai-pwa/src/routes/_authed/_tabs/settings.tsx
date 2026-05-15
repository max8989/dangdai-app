import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export const Route = createFileRoute('/_authed/_tabs/settings')({
  component: SettingsPage,
});

function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const ok = await signOut();
    if (ok) {
      await navigate({ to: '/login' });
    }
  };

  return (
    <section className="flex flex-col gap-6 p-4 pt-6">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Account</p>
        <p className="mt-1 truncate text-base font-medium">{user?.email}</p>
      </div>

      <Button variant="outline" onClick={handleSignOut} className="gap-2">
        <LogOut className="size-4" />
        Sign out
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Full settings screen ships in Phase 5.
      </p>
    </section>
  );
}
