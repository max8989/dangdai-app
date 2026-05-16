import { useState, useCallback } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { AppleSignInButton } from '@/components/auth/AppleSignInButton';

interface ValidationErrors {
  email?: string;
  password?: string;
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const { signIn, error: authError, clearError } = useAuth();
  const navigate = useNavigate();

  const validateField = useCallback(
    (field: string, value: string) => {
      const errors: ValidationErrors = { ...validationErrors };

      switch (field) {
        case 'email':
          if (!value) {
            errors.email = undefined;
          } else if (!isValidEmail(value)) {
            errors.email = 'Please enter a valid email';
          } else {
            errors.email = undefined;
          }
          break;
        case 'password':
          errors.password = undefined;
          break;
      }

      setValidationErrors(errors);
      return errors;
    },
    [validationErrors],
  );

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const value = field === 'email' ? email : password;
    validateField(field, value);
  };

  const handleChange = (field: string, value: string) => {
    if (authError) clearError();
    if (field === 'email') setEmail(value);
    else setPassword(value);
    if (touched[field]) validateField(field, value);
  };

  const validateAll = (): boolean => {
    const errors: ValidationErrors = {};
    if (!email) errors.email = 'Email is required';
    else if (!isValidEmail(email)) errors.email = 'Please enter a valid email';
    if (!password) errors.password = 'Password is required';
    setValidationErrors(errors);
    setTouched({ email: true, password: true });
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateAll()) return;
    setSubmitting(true);
    try {
      const ok = await signIn(email, password);
      if (ok) {
        await navigate({ to: '/' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const emailError =
    (touched.email && validationErrors.email) ||
    (authError?.field === 'email' ? authError.message : undefined);

  const passwordError =
    (touched.password && validationErrors.password) ||
    (authError?.field === 'password' ? authError.message : undefined);

  const generalError = authError?.field === 'general' ? authError.message : undefined;

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
          onChange={(e) => handleChange('email', e.target.value)}
          onBlur={() => handleBlur('email')}
          autoComplete="email"
          aria-invalid={!!emailError}
          disabled={submitting}
        />
        {emailError && <p className="text-xs text-destructive">{emailError}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link to="/forgot-password" className="text-sm text-primary hover:underline">
            Forgot Password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => handleChange('password', e.target.value)}
          onBlur={() => handleBlur('password')}
          autoComplete="current-password"
          aria-invalid={!!passwordError}
          disabled={submitting}
        />
        {passwordError && <p className="text-xs text-destructive">{passwordError}</p>}
      </div>

      <Button type="submit" size="lg" disabled={submitting} className="mt-2">
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Signing in...
          </>
        ) : (
          'Sign In'
        )}
      </Button>

      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      <AppleSignInButton label="Sign in with Apple" disabled={submitting} />

      <div className="flex justify-center pt-2 text-sm">
        <Link to="/signup" className="font-semibold text-primary hover:underline">
          Don't have an account? Sign Up
        </Link>
      </div>
    </form>
  );
}
