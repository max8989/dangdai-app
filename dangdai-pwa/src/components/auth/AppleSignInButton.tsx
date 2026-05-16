import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

interface AppleSignInButtonProps {
  label?: string;
  disabled?: boolean;
}

export function AppleSignInButton({
  label = 'Continue with Apple',
  disabled = false,
}: AppleSignInButtonProps) {
  const { signInWithApple } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await signInWithApple();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      size="lg"
      onClick={handleClick}
      disabled={disabled || loading}
      className="bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-5"
          fill="currentColor"
        >
          <path d="M17.05 12.04c-.03-2.71 2.21-4.02 2.31-4.08-1.26-1.84-3.22-2.09-3.92-2.12-1.67-.17-3.25.98-4.1.98-.85 0-2.15-.96-3.54-.93-1.82.03-3.5 1.06-4.43 2.69-1.89 3.28-.48 8.13 1.36 10.79.9 1.3 1.97 2.76 3.37 2.71 1.35-.05 1.86-.88 3.5-.88 1.63 0 2.09.88 3.52.85 1.45-.03 2.37-1.32 3.26-2.63 1.03-1.51 1.45-2.97 1.47-3.05-.03-.01-2.82-1.08-2.85-4.33zM14.36 4.18c.74-.89 1.24-2.14 1.1-3.38-1.07.04-2.36.71-3.13 1.6-.68.78-1.29 2.04-1.13 3.26 1.2.09 2.42-.6 3.16-1.48z" />
        </svg>
      )}
      {loading ? 'Redirecting...' : label}
    </Button>
  );
}
