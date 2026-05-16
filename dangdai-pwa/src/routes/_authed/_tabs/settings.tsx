import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  Loader2,
  LogOut,
  Monitor,
  Moon,
  Sun,
  Volume2,
  VolumeX,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { playSound } from '@/hooks/useSound'

export const Route = createFileRoute('/_authed/_tabs/settings')({
  component: SettingsPage,
})

interface ThemeOptionDef {
  value: 'light' | 'dark' | 'system'
  label: string
  Icon: LucideIcon
}

const THEME_OPTIONS: ThemeOptionDef[] = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'system', label: 'System', Icon: Monitor },
]

function SettingsPage() {
  const navigate = useNavigate()
  const { user, signOut, error } = useAuth()
  const theme = useSettingsStore((s) => s.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)
  const soundEnabled = useSettingsStore((s) => s.soundEnabled)
  const toggleSound = useSettingsStore((s) => s.toggleSound)

  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    if (!window.confirm('Are you sure you want to sign out?')) return
    setSigningOut(true)
    const ok = await signOut()
    setSigningOut(false)
    if (ok) await navigate({ to: '/login' })
  }

  const handleSoundToggle = (next: boolean) => {
    toggleSound()
    if (next) {
      // Play a confirm sound after the user enables sound so they immediately
      // hear it's working. Reads soundEnabled at call time, so we have to
      // schedule the play after the store update commits.
      window.setTimeout(() => void playSound('correct'), 0)
    }
  }

  return (
    <section className="flex flex-col gap-5 p-4 pt-6">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

      {/* Account */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Signed in as
        </p>
        <p className="mt-1 truncate text-base font-medium">
          {user?.email ?? 'Loading…'}
        </p>
      </div>

      <Separator />

      {/* Theme */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold">Color Theme</p>
        <div className="grid grid-cols-3 gap-2">
          {THEME_OPTIONS.map(({ value, label, Icon }) => {
            const active = theme === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-md border p-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background hover:bg-muted',
                )}
                aria-pressed={active}
              >
                <Icon className="size-4" />
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Sound */}
      <div className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          {soundEnabled ? (
            <Volume2 className="size-5 text-primary" />
          ) : (
            <VolumeX className="size-5 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-semibold">Sound effects</p>
            <p className="text-xs text-muted-foreground">
              Play correct / incorrect ding during quizzes.
            </p>
          </div>
        </div>
        <Switch
          checked={soundEnabled}
          onCheckedChange={handleSoundToggle}
          aria-label="Toggle sound effects"
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {error && (
        <div
          className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          {error.message}
        </div>
      )}

      <Button
        variant="destructive"
        onClick={handleSignOut}
        disabled={signingOut}
        className="gap-2"
      >
        {signingOut ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <LogOut className="size-4" />
        )}
        {signingOut ? 'Signing Out…' : 'Sign Out'}
      </Button>
    </section>
  )
}
