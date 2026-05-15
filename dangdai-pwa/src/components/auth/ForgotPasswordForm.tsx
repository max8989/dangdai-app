import { useState, useCallback } from 'react';
import { Link } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [validationError, setValidationError] = useState<string | undefined>();
  const [touched, setTouched] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { resetPassword, error: authError, clearError } = useAuth();

  const validateEmail = useCallback((value: string) => {
    if (!value) setValidationError(undefined);
    else if (!isValidEmail(value)) setValidationError('Please enter a valid email');
    else setValidationError(undefined);
  }, []);

  const handleBlur = () => {
    setTouched(true);
    validateEmail(email);
  };

  const handleChange = (value: string) => {
    if (authError) clearError();
    setEmail(value);
    if (touched) validateEmail(value);
  };

  const validateAll = (): boolean => {
    if (!email) {
      setValidationError('Email is required');
      setTouched(true);
      return false;
    }
    if (!isValidEmail(email)) {
      setValidationError('Please enter a valid email');
      setTouched(true);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateAll()) return;
    setSubmitting(true);
    try {
      const success = await resetPassword(email);
      if (success) setEmailSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  const emailError =
    (touched && validationError) ||
    (authError?.field === 'email' ? authError.message : undefined);
  const generalError = authError?.field === 'general' ? authError.message : undefined;

  if (emailSent) {
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm">
          <p className="font-semibold text-emerald-700 dark:text-emerald-400">Check your email</p>
          <p className="mt-1 text-emerald-700/90 dark:text-emerald-400/90">
            Reset link sent to your email.
          </p>
          <p className="mt-2 text-muted-foreground">
            If an account exists with this email, you will receive password reset instructions
            shortly. Check your spam folder if you don't see it.
          </p>
        </div>
        <Button asChild size="lg">
          <Link to="/login">Back to Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {generalError && (
        <div
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {generalError}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          autoComplete="email"
          aria-invalid={!!emailError}
          disabled={submitting}
        />
        {emailError && <p className="text-xs text-destructive">{emailError}</p>}
      </div>

      <Button type="submit" size="lg" disabled={submitting} className="mt-2">
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Sending...
          </>
        ) : (
          'Send Reset Link'
        )}
      </Button>

      <div className="flex justify-center pt-2 text-sm">
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Back to Login
        </Link>
      </div>
    </form>
  );
}
