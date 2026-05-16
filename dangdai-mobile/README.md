# dangdai-mobile (ARCHIVED)

> **This package is archived and no longer actively developed.**
>
> The React Native + Expo + Tamagui client has been replaced by `dangdai-pwa/` (Vite + React 19 + shadcn/ui + Tailwind v4 + TanStack Router), which is the active production client.
>
> - Do **not** add features or bug fixes here.
> - Do **not** re-index this directory with CodeGraphContext.
> - Supabase schema, FastAPI endpoints, and RAG content remain shared with the PWA.
> - Migration history (phases 1–6) is documented in `../dangdai-pwa/HANDOFF.md`.
>
> The source is kept on disk for historical reference only. If you need to recover behavior that was lost in the migration, mine this tree, then port the fix into `dangdai-pwa/` rather than reviving the mobile build.

---

## Original notes

note because this is in a monorepo had to remove react, react-dom, and react-native-web deps and change metro.config.js a bit.
