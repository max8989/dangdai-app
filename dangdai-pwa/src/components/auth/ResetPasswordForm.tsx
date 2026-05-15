import { useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';

interface ValidationErrors {
  password?: string;
  confirmPassword?: string;
}

const validatePasswordStrength = (password: string): string[] => {
  const errors: string[] = [];
  if (password.length < 8) errors.push('At least 8 characters');
  return errors;
};

const isValidPassword = (password: string): boolean => password.length >= 8;

export function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const { updatePassword, error: authError, clearError } = useAuth();
  const navigate = useNavigate();

  const passwordStrengthErrors = validatePasswordStrength(password);
  const passwordIsValid = isValidPassword(password);

  const validateField = useCallback(
    (field: string, value: string) => {
      const errors: ValidationErrors = { ...validationErrors };

      switch (field) {
        case 'password':
          if (!value) errors.password = undefined;
          else if (!isValidPassword(value))
            errors.password = 'Password must be at least 8 characters';
          else errors.password = undefined;
          if (confirmPassword && value !== confirmPassword) {
            errors.confirmPassword = "Passwords don't match";
          } else if (confirmPassword) {
            errors.confirmPassword = undefined;
          }
          break;
        case 'confirmPassword':
          if (!value) errors.confirmPassword = undefined;
          else if (value !== password) errors.confirmPassword = "Passwords don't match";
          else errors.confirmPassword = undefined;
          break;
      }

      setValidationErrors(errors);
      return errors;
    },
    [validationErrors, password, confirmPassword],
  );

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const value = field === 'password' ? password : confirmPassword;
    validateField(field, value);
  };

  const handleChange = (field: string, value: string) => {
    if (authError) clearError();
    if (field === 'password') setPassword(value);
    else setConfirmPassword(value);
    if (touched[field]) validateField(field, value);
  };

  const validateAll = (): boolean => {
    const errors: ValidationErrors = {};
    if (!password) errors.password = 'Password is required';
    else if (!isValidPassword(password))
      errors.password = 'Password must be at least 8 characters';
    if (!confirmPassword) errors.confirmPassword = 'Please confirm your password';
    else if (confirmPassword !== password) errors.confirmPassword = "Passwords don't match";
    setValidationErrors(errors);
    setTouched({ password: true, confirmPassword: true });
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateAll()) return;
    setSubmitting(true);
    try {
      const ok = await updatePassword(password);
      if (ok) await navigate({ to: '/login' });
    } finally {
      setSubmitting(false);
    }
  };

  const passwordError =
    (touched.password && validationErrors.password) ||
    (authError?.field === 'password' ? authError.message : undefined);
  const confirmPasswordError = touched.confirmPassword && validationErrors.confirmPassword;
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
        <Label htmlFor="password">New Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => handleChange('password', e.target.value)}
          onBlur={() => handleBlur('password')}
          autoComplete="new-password"
          aria-invalid={!!passwordError}
          disabled={submitting}
        />
        {passwordError ? (
          <p className="text-xs text-destructive">{passwordError}</p>
        ) : password.length > 0 ? (
          <div className="flex flex-col gap-0.5">
            {passwordStrengthErrors.length > 0 ? (
              passwordStrengthErrors.map((err) => (
                <p key={err} className="text-xs text-amber-600 dark:text-amber-400">
                  {err}
                </p>
              ))
            ) : (
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                Password meets requirements
              </p>
            )}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChange={(e) => handleChange('confirmPassword', e.target.value)}
          onBlur={() => handleBlur('confirmPassword')}
          autoComplete="new-password"
          aria-invalid={!!confirmPasswordError}
          disabled={submitting}
        />
        {confirmPasswordError && (
          <p className="text-xs text-destructive">{confirmPasswordError}</p>
        )}
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={submitting || !passwordIsValid}
        className="mt-2"
      >
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Updating...
          </>
        ) : (
          'Update Password'
        )}
      </Button>
    </form>
  );
}
