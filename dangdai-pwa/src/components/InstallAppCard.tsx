import { useState } from 'react'
import { Download, Share, Plus, Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'

export function InstallAppCard() {
  const { canInstall, installed, platform, install } = useInstallPrompt()
  const [iosOpen, setIosOpen] = useState(false)

  if (installed) {
    return (
      <div className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Check className="size-5 text-primary" />
          <div>
            <p className="text-sm font-semibold">App installed</p>
            <p className="text-xs text-muted-foreground">
              You're running Dangdai as a standalone app.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // iOS Safari doesn't fire beforeinstallprompt — show manual instructions.
  if (platform === 'ios') {
    return (
      <>
        <button
          type="button"
          onClick={() => setIosOpen(true)}
          className="flex w-full items-center justify-between rounded-xl border bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted"
        >
          <div className="flex items-center gap-3">
            <Download className="size-5 text-primary" />
            <div>
              <p className="text-sm font-semibold">Install app</p>
              <p className="text-xs text-muted-foreground">
                Add to Home Screen for a full-screen experience.
              </p>
            </div>
          </div>
        </button>
        <Dialog open={iosOpen} onOpenChange={setIosOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Install on iOS</DialogTitle>
              <DialogDescription>
                Safari doesn't have a one-tap install, but it's quick:
              </DialogDescription>
            </DialogHeader>
            <ol className="flex flex-col gap-3 text-sm">
              <li className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  1
                </span>
                Tap the <Share className="inline size-4" /> Share button in
                Safari.
              </li>
              <li className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  2
                </span>
                Scroll down and tap{' '}
                <span className="inline-flex items-center gap-1 font-medium">
                  <Plus className="size-4" /> Add to Home Screen
                </span>
                .
              </li>
              <li className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  3
                </span>
                Tap <span className="font-medium">Add</span> in the top right.
              </li>
            </ol>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  if (!canInstall) {
    // Android Chrome before the browser fires beforeinstallprompt, or unsupported.
    return (
      <div className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Download className="size-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-semibold">Install app</p>
            <p className="text-xs text-muted-foreground">
              Use your browser menu and pick "Install app" or "Add to Home
              Screen".
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <Download className="size-5 text-primary" />
        <div>
          <p className="text-sm font-semibold">Install app</p>
          <p className="text-xs text-muted-foreground">
            Add Dangdai to your home screen for a full-screen experience.
          </p>
        </div>
      </div>
      <Button size="sm" onClick={() => void install()}>
        Install
      </Button>
    </div>
  )
}
