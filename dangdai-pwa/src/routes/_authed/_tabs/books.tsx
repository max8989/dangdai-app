import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { BookCard } from '@/components/chapter/BookCard';
import { BookCardSkeleton } from '@/components/chapter/BookCardSkeleton';
import { BOOKS } from '@/constants/books';
import { useBooks } from '@/hooks/useBooks';

export const Route = createFileRoute('/_authed/_tabs/books')({
  component: BooksPage,
});

function BooksPage() {
  const navigate = useNavigate();
  const { data: progress, isLoading, error } = useBooks();

  return (
    <section className="flex flex-col gap-4 p-4 pt-6">
      <h1 className="text-3xl font-bold tracking-tight">Books</h1>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          <BookCardSkeleton count={4} />
        </div>
      ) : error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-center text-sm text-destructive">
          Failed to load book progress. Please try again.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {BOOKS.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              progress={
                progress?.[book.id] ?? {
                  bookId: book.id,
                  chaptersCompleted: 0,
                  totalChapters: book.chapterCount,
                }
              }
              onClick={() => navigate({ to: '/chapter/$bookId', params: { bookId: String(book.id) } })}
            />
          ))}
        </div>
      )}
    </section>
  );
}
