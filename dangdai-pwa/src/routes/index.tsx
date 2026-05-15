import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-3xl font-semibold tracking-tight">當代 Dangdai PWA</h1>
      <p className="text-muted-foreground text-center max-w-md">
        Scaffold ready. Port screens from <code>dangdai-mobile/app</code> into{' '}
        <code>src/routes/</code>.
      </p>
    </main>
  );
}
