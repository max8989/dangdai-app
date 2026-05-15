import { createFileRoute } from '@tanstack/react-router';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export const Route = createFileRoute('/_authed/')({
  component: HomePage,
});

function HomePage() {
  const { user, signOut } = useAuth();

  return (
    <main className="min-h-dvh mx-auto flex max-w-md flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-3xl font-semibold tracking-tight">當代 Dangdai</h1>
      <p className="text-muted-foreground text-center">
        Signed in as <span className="font-medium text-foreground">{user?.email}</span>
      </p>
      <p className="text-muted-foreground text-center text-sm">
        Auth flow ready. Books, chapters, and quiz screens come next.
      </p>
      <Button variant="outline" onClick={() => signOut()}>
        Sign out
      </Button>
    </main>
  );
}
