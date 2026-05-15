import { Link, createFileRoute } from '@tanstack/react-router';
import { BookOpen } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { APP_NAME } from '@/constants/app';
import { useAuth } from '@/hooks/useAuth';

export const Route = createFileRoute('/_authed/_tabs/')({
  component: HomePage,
});

function HomePage() {
  const { user } = useAuth();

  return (
    <section className="flex flex-col gap-6 p-4 pt-8">
      <header className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-3xl font-bold tracking-tight">{APP_NAME}</h1>
        <p className="text-sm text-muted-foreground">Learn Chinese through quizzes</p>
      </header>

      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <p className="text-sm text-muted-foreground">Signed in as</p>
        <p className="truncate text-base font-medium">{user?.email}</p>
      </div>

      <Button asChild size="lg" className="gap-2">
        <Link to="/books">
          <BookOpen className="size-5" />
          Browse books
        </Link>
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Quizzes, stats, and paused-quiz cards arrive in upcoming phases.
      </p>
    </section>
  );
}
