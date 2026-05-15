# dangdai-pwa Handoff (Phase 3 onward)

You are picking up the migration of `dangdai-mobile/` (React Native + Expo + Tamagui) into `dangdai-pwa/` (Vite + React + shadcn/ui + Tailwind v4 + TanStack Router).

**Phases 1 (auth) and 2 (books + chapter navigation) are complete and live-tested.** Your next job is **Phase 3: quiz flow without DnD**. After that, continue through Phases 4–6 from the original plan (reproduced in §6 below).

The Supabase project and FastAPI backend are unchanged — same data, same endpoints. Only the client is being rebuilt.

---

## 0. What just got done (Phase 2)

### Bottom tab bar + tab screens

`src/routes/_authed/_tabs.tsx` is a pathless layout that renders `<Outlet />` plus a fixed-position `<nav aria-label="Primary">` at the bottom (`fixed inset-x-0 bottom-0 max-w-md mx-auto`). Active-tab detection is via `useLocation().pathname` — exact match for `/`, prefix match for `/books` and `/settings`. Icons from `lucide-react`. The whole layout is wrapped in `max-w-md mx-auto` so it stays phone-shaped on desktop. Main content gets `pb-20` to clear the tab bar.

Tab screens:
- `_authed/_tabs/index.tsx` — home placeholder: app name, signed-in email, "Browse books" CTA. Paused-quiz cards and stats land in Phase 3+.
- `_authed/_tabs/books.tsx` — `<BookCard>` list driven by `useBooks`.
- `_authed/_tabs/settings.tsx` — email + Sign out. Sign-out applies the §1 gap-fix: `await signOut()` → `await navigate({ to: '/login' })`. Full settings screen is Phase 5.

The Phase 1 `_authed/index.tsx` placeholder has been deleted — `_authed/_tabs/index.tsx` is the new `/` route.

### Chapter routes

| Route | Component |
|---|---|
| `_authed/chapter/$bookId.tsx` | Chapter list for one book, uses `useChapters` + `useChapterProgress` |
| `_authed/chapter/$chapterId/vocabulary.tsx` | Section list (Vocab I / Vocab II), uses `useVocabulary` |
| `_authed/chapter/$chapterId/grammar.tsx` | List of grammar points, uses `useGrammarPoints` |
| `_authed/chapter/$chapterId/dialogues.tsx` | Chat-bubble layout with Pinyin / English / Simplified toggles, uses `useDialogues` |

The vocabulary route file also exports four shared layout helpers (`ChapterSubheader`, `CenterLoader`, `CenterMessage`, `ErrorState`) that `grammar.tsx` and `dialogues.tsx` reuse. The chapter detail screens deliberately do **not** sit inside `_tabs` — they are full-screen detail views without the bottom tab bar, like the mobile app's `app/chapter/...` routes. Reach them by clicking a `<BookCard>` on `/books`, then a `<ChapterListItem>`.

### Chapter / book components

Rewritten with shadcn primitives in `src/components/chapter/`. None are direct copies — they use semantic Tailwind tokens (`bg-card`, `text-muted-foreground`, `border`, `bg-muted`) instead of Tamagui's `$gray11` / `$blue9` token system. Book cover colors map from Tamagui's `$blue9 / $green9 / $orange9 / $purple9` to literal Tailwind palette classes (`bg-blue-500`, `bg-emerald-500`, etc.) via a small lookup in `BookCard.tsx`.

- `BookCard.tsx` + `BookCardSkeleton.tsx` — interactive `<button>` (not a `<div onClick>`) for keyboard + a11y.
- `ChapterListItem.tsx` + `ChapterListSkeleton.tsx` — status badge (not-started / in-progress / mastered) drives badge color + inline progress bar.
- `VocabularyItem.tsx`, `GrammarPointCard.tsx`, `DialogueBubble.tsx` — plain rounded cards with `border bg-card shadow-sm`.

The `<Card>` shadcn component (with internal `py-6` and `px-6` from `CardHeader` / `CardContent`) is too padded for the tight mobile-first layouts these need — so the chapter components use raw `<div>` + Tailwind utility classes for layout. Use `<Card>` for the bigger Phase 3 quiz cards.

### Hooks ported

`useBooks`, `useChapters` (+ `useChapter`), `useChapterProgress`, `useVocabulary` (+ `useVocabularyCount`), `useGrammarPoints` (+ `useGrammarPointsCount`), `useDialogues` (+ `useDialoguesCount`), `useSession`. All use `@/` path aliases and import `useAuth` from `@/providers/AuthProvider`. Logic is verbatim from mobile — same query keys, same 42P01 fallbacks, same staleTimes.

### shadcn added in Phase 2

`skeleton`, `scroll-area`, `separator`, `avatar`, `tabs` (skeleton + tabs are the only ones consumed so far — the others are queued for Phase 3+).

### Verified end-to-end in Chrome DevTools

- Sign in → home (`/`) renders, bottom tab bar visible
- `/books` → 4 BookCards render with default 0/N progress
- Book 1 → `/chapter/1` shows all 15 chapters with Chinese subtitle and "15 chapters" header
- Chapter 1 → `/chapter/101/vocabulary` shows 43 words across Vocab I (24) + Vocab II (19), with POS badges and "Name" indicators
- `/chapter/101/grammar` renders all 6 grammar points with Function/Structure/Usage/Examples sections
- `/chapter/101/dialogues` shows both dialogues; Pinyin/English/Simplified toggles work
- Settings → Sign out → auto-redirects to `/login`
- No console errors; `npm run build` green (583 KB main chunk gzipped to 169 KB — Phase 6 can split if needed)

### Phase 2 gotchas worth remembering

1. **Route tree is auto-generated, not auto-watched at type-check time.** When you add a new route file the `tsc` step in `npm run build` fails referencing the old tree. Fix: run `npx vite build` once first — the `@tanstack/router-plugin` Vite plugin regenerates `src/routeTree.gen.ts` before tsc runs in subsequent invocations. Or just run `npm run dev`. (Documented in §4 already; learned the hard way during Phase 2.)
2. **Link / navigate paths are typed.** TS errors about `"/chapter/$bookId"` not assignable to a literal union mean the route tree hasn't picked up the new file — same fix as above.
3. **Book cover colors live in `src/components/chapter/BookCard.tsx`.** If you add Book 5+ (or change palette), update the `coverColorMap` there. Don't rely on the `coverColor: '$blue9'` strings from `constants/books.ts` directly.
4. **Roman-numeral helper for dialogues** is inline in `dialogues.tsx` (`ROMAN` array + `toRoman`). If quiz screens need it too, pull it into `src/lib/roman.ts`.

---

## 1. What just got done (Phase 1)

### Shadcn components installed
`npx shadcn@latest add button input label card sonner` — see `src/components/ui/`. `sonner` pulled in `next-themes` and `sonner` as new deps (visible in `package.json`).

### Routing structure (TanStack file-based)
The Phase-0 plan called for `index.tsx` at `/` that redirects. **That structure was changed during Phase 1.** A pathless layout with no children conflicts with a sibling `index.tsx` at the same path — so the home placeholder was moved *inside* the guard:

```
src/routes/
├── __root.tsx           ← mounts <Toaster richColors position="top-center" /> + router devtools
├── _auth.tsx            ← pathless layout, beforeLoad redirects signed-in users to /
│                          renders <MaixinLogo width={180} /> + <Outlet />, centered max-w-md card
├── _auth/
│   ├── login.tsx        ← /login
│   ├── signup.tsx       ← /signup
│   ├── forgot-password.tsx  ← /forgot-password
│   └── reset-password.tsx   ← /reset-password
├── _authed.tsx          ← pathless layout, beforeLoad redirects unauthed → /login?redirect=<href>
└── _authed/
    └── index.tsx        ← / (home placeholder — replace with the real home tab in Phase 2)
```

**Why `_authed/index.tsx` instead of a top-level `index.tsx`:** TanStack treats a childless `_authed.tsx` as a route at `/`, which conflicts with `index.tsx` at `/`. Giving `_authed.tsx` a child (`_authed/index.tsx`) makes it a proper pathless layout. When you build the bottom tab bar, the home tab should live at `src/routes/_authed/_tabs/index.tsx` and the current placeholder at `_authed/index.tsx` should be deleted (or repurposed).

### Auth UI ported
All four forms rebuilt with shadcn primitives (Tamagui `<YStack>` / `<XStack>` / `<Input>` / `<Button>` / `<Spinner>` → `<div className="flex...">` / shadcn `<Input>` / shadcn `<Button>` / `Loader2` from lucide):

- `src/components/auth/LoginForm.tsx` — email + password, "Forgot Password?" link, "Sign Up" link
- `src/components/auth/SignupForm.tsx` — email + password + confirm
- `src/components/auth/ForgotPasswordForm.tsx` — email, success state shows green confirmation card
- `src/components/auth/ResetPasswordForm.tsx` — new password + confirm + strength hint

Each form keeps a **local `submitting` boolean** to drive the spinner and disabled state. **Don't reach for `isLoading` from `useAuth`** for submission state — `AuthProvider.loading` only tracks the initial `getSession()` call and is `false` during sign-in/up calls. The local-state pattern matches the mobile UX without changing the provider's surface.

### Supporting bits
- `src/components/MaixinLogo.tsx` — web port. Uses `<img src="/logo.png">` with the 440:172 aspect ratio. Assets copied into `public/`: `logo.png`, `maixin-chinese-logo.svg`.
- `src/hooks/useAuth.ts` — re-exports `useAuth` and `AuthError` from `@/providers/AuthProvider` so future hook ports can `import { useAuth } from '@/hooks/useAuth'` like mobile.
- `__root.tsx` mounts `<Toaster richColors position="top-center" />` once globally; sonner's default `useTheme()` from `next-themes` works without a ThemeProvider (defaults to `"system"`).

### Verified end-to-end in Chrome DevTools
- `/` → redirects to `/login?redirect=%2F`
- Login with `test@test.com` / `maxime11` → redirected to `/`, home renders user email
- Sign-out clears the session
- All four routes render without console errors (only a benign Chrome a11y hint about hidden username fields on password-only screens)
- `npm run build` is green; `npm run dev` boots clean

### Known gap to fix later (not blocking)
**Sign-out doesn't auto-redirect.** The `_authed.beforeLoad` guard only fires on navigation, so clicking Sign out clears the session but the user stays on `/` until they reload. Two clean fixes:
1. In the sign-out handler, call `navigate({ to: '/login' })` right after `supabase.auth.signOut()` resolves.
2. Listen for `onAuthStateChange` in `AuthProvider` and call `router.invalidate()` on `SIGNED_OUT`.

Pick (1) for the home placeholder you'll replace anyway; consider (2) when building the settings screen sign-out button, since it's the right long-term home.

---

## 2. Current state of the PWA (cumulative)

### Stack (unchanged from Phase 0)
- Vite 8 + React 19 + TypeScript 6 (strict mode, `verbatimModuleSyntax`)
- Tailwind v4 via `@tailwindcss/vite` + `tw-animate-css`
- shadcn/ui (new-york style, neutral base, CSS vars) — `components.json` in place
- TanStack Router (file-based, `autoCodeSplitting`) — routes in `src/routes/`
- TanStack Query + devtools, Zustand, `@supabase/supabase-js`
- vite-plugin-pwa (Workbox, autoUpdate, runtime caching for Supabase REST + storage)
- Path alias: `@/* → src/*`

### shadcn components added so far
`button`, `input`, `label`, `card`, `sonner` (Phase 1), `skeleton`, `scroll-area`, `separator`, `avatar`, `tabs` (Phase 2).

For Phase 3 add: `progress`, `dialog`, `alert-dialog`, `radio-group`
```bash
npx shadcn@latest add progress dialog alert-dialog radio-group
```

### Files that already exist (don't redo)

| Path | Status |
|---|---|
| `src/types/*.ts` | ✅ verbatim (quiz, chapter, paused-quiz, supabase) |
| `src/lib/queryClient.ts` | ✅ verbatim |
| `src/lib/queryKeys.ts` | ✅ verbatim |
| `src/lib/pinyinNormalize.ts` | ✅ verbatim |
| `src/lib/quizValidation.ts` | ✅ verbatim |
| `src/lib/validateFillInBlank.ts` | ✅ verbatim |
| `src/lib/premadeExerciseAdapter.ts` | ✅ + 1 cast fix at line 315 |
| `src/lib/supabase.ts` | ✅ web rewrite (localStorage, `detectSessionInUrl: true`) |
| `src/lib/api.ts` | ✅ env vars swapped `process.env.EXPO_PUBLIC_*` → `import.meta.env.VITE_*` |
| `src/lib/utils.ts` | ✅ shadcn's `cn()` |
| `src/stores/useUserStore.ts` | ✅ verbatim |
| `src/stores/useSettingsStore.ts` | ✅ verbatim |
| `src/stores/useQuizStore.ts` | ✅ AsyncStorage → localStorage in `persist({storage:...})` |
| `src/stores/index.ts` | ✅ verbatim |
| `src/constants/{books,chapters,tips,app}.ts` | ✅ verbatim |
| `src/providers/AuthProvider.tsx` | ✅ web rewrite, same `useAuth()` surface |
| `src/hooks/useAuth.ts` | ✅ re-exports from AuthProvider |
| `src/components/MaixinLogo.tsx` | ✅ web port (img tag) |
| `src/components/auth/*` | ✅ all four forms ported (Phase 1) |
| `src/routes/__root.tsx` | ✅ Toaster wired |
| `src/routes/_auth.tsx` + `_auth/*` | ✅ Phase 1 |
| `src/routes/_authed.tsx` | ✅ Phase 1 (guard) |
| `src/routes/_authed/_tabs.tsx` + `_authed/_tabs/*` | ✅ Phase 2 (tab bar + home/books/settings) |
| `src/routes/_authed/chapter/$bookId.tsx` | ✅ Phase 2 (chapter list) |
| `src/routes/_authed/chapter/$chapterId/{vocabulary,grammar,dialogues}.tsx` | ✅ Phase 2 |
| `src/hooks/{useBooks,useChapters,useChapterProgress,useVocabulary,useGrammarPoints,useDialogues,useSession}.ts` | ✅ Phase 2 |
| `src/components/chapter/*` | ✅ Phase 2 (BookCard + skeleton, ChapterListItem + skeleton, VocabularyItem, GrammarPointCard, DialogueBubble) |

### Env
`.env.local` is populated; `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL=http://localhost:8000`. Test account: **test@test.com / maxime11**.

---

## 3. Phase 2 plan — books + chapter navigation ✅ DONE

This section is preserved for reference. Phase 2 is complete; see §0 for what was actually shipped.

**Goal:** signed-in user can browse books → pick a book → see chapter list → tap a chapter to see vocabulary / grammar / dialogue browse screens. **No quizzes yet.**

### 3.1 Bottom tab bar

The mobile app uses Expo `(tabs)/_layout.tsx` with five tabs: Home, Books, Generate, Chat, Settings. Port as a pathless layout:

```
src/routes/_authed/_tabs.tsx          ← pathless layout, renders <Outlet /> + sticky bottom <nav>
src/routes/_authed/_tabs/index.tsx    ← / (home)
src/routes/_authed/_tabs/books.tsx    ← /books
src/routes/_authed/_tabs/settings.tsx ← /settings (Phase 5 fully — stub now)
```

Defer Generate and Chat tabs to Phase 5; just include Home / Books / Settings in the tab bar for now (and leave room for the other two).

**Implementation notes:**
- Bottom bar is a fixed-position `<nav>` at the bottom on mobile widths (`max-w-md mx-auto`). Use shadcn `<Button variant="ghost">` for tab items, or plain `<Link>` with active styling.
- Active tab styling: use TanStack Router's `useMatchRoute` or check `useLocation().pathname` against each tab's path. Render an underline / bold / colored icon for the active tab.
- Icons: `Home`, `BookOpen`, `Settings` from `lucide-react`. Mobile used `@tamagui/lucide-icons` — same names.
- **Delete** `src/routes/_authed/index.tsx` (the Phase 1 placeholder) when you create `_authed/_tabs/index.tsx`, otherwise you'll get a route-tree conflict on `/`.

### 3.2 Hooks to port (mostly verbatim)

All from `dangdai-mobile/hooks/` → `dangdai-pwa/src/hooks/`. Check imports for any `react-native` references (these don't use RN) and prefer `@/lib/...` / `@/types/...` aliases:

- `useBooks.ts` — pure Query
- `useChapters.ts` — pure Query
- `useChapterProgress.ts` — pure Query
- `useVocabulary.ts` — pure Query
- `useGrammarPoints.ts` — pure Query
- `useDialogues.ts` — pure Query
- `useSession.ts` — verify thin wrapper, port if used

### 3.3 Components to port (rewrite with shadcn — don't copy)

From `dangdai-mobile/components/chapter/` → `dangdai-pwa/src/components/chapter/`:

- `BookCard.tsx` + `BookCardSkeleton.tsx` — book cover + title + progress; use shadcn `<Card>` + `<Skeleton>`
- `ChapterListItem.tsx` + `ChapterListSkeleton.tsx` — row item; tap to go to chapter detail
- `VocabularyItem.tsx`
- `GrammarPointCard.tsx`
- `DialogueBubble.tsx`
- `ExerciseTypeCard.tsx` — used on the exercises landing (Phase 3); leave for now
- `PremadeExerciseCard.tsx` — Phase 3

### 3.4 Routes to create

| Mobile path | PWA path | Phase 2 contents |
|---|---|---|
| `app/(tabs)/index.tsx` | `src/routes/_authed/_tabs/index.tsx` | Home screen (your call — show last-played chapter, daily tip, etc.) |
| `app/(tabs)/books.tsx` | `src/routes/_authed/_tabs/books.tsx` | Grid/list of `<BookCard>` from `useBooks` |
| `app/(tabs)/settings.tsx` | `src/routes/_authed/_tabs/settings.tsx` | Minimal stub: email + Sign out (proper version in Phase 5) |
| `app/chapter/[bookId].tsx` | `src/routes/_authed/chapter/$bookId.tsx` | Chapter list for one book; uses `useChapters` |
| `app/chapter/[chapterId]/vocabulary.tsx` | `src/routes/_authed/chapter/$chapterId/vocabulary.tsx` | Vocabulary list |
| `app/chapter/[chapterId]/grammar.tsx` | `src/routes/_authed/chapter/$chapterId/grammar.tsx` | Grammar points |
| `app/chapter/[chapterId]/dialogues.tsx` | `src/routes/_authed/chapter/$chapterId/dialogues.tsx` | Dialogues |

**Dynamic params:** brackets `[bookId]` → `$bookId` in TanStack. Read with `Route.useParams()`.

**Chapter ID convention** (unchanged): `bookId * 100 + chapterNumber` (Book 2 Chapter 12 → 212). Documented in `AGENTS.md`.

### 3.5 Exit criteria for Phase 2

- Signed-in user lands on `/` → home tab visible
- Bottom tab bar lets you switch Home / Books / Settings without console errors
- `/books` loads books from Supabase (TanStack Query)
- Tapping a book → `/chapter/$bookId` shows chapter list
- Tapping a chapter or its content links → vocabulary / grammar / dialogue screens render content
- `npm run build` green; Lighthouse mobile audit not regressed
- Settings stub has Sign out that actually returns the user to `/login` (apply the gap-fix from §1)

---

## 4. Architectural reminders (unchanged from Phase 0 but easy to forget)

### TanStack Router
- Pathless layouts use `_name.tsx`; their children sit in `_name/`
- A pathless layout with **no children** is treated as a route at the parent path — give it at least one child or it'll conflict
- Dynamic params: `$param.tsx`, read via `Route.useParams()`; search params via `Route.useSearch()`
- `routeTree.gen.ts` is auto-generated on dev/build by `tanstackRouter` Vite plugin. **Don't edit it.** If `npm run build` fails on stale types, run `npx vite build` once first (it regenerates the tree before tsc would in a fresh `npm run build`), or just run dev.
- Protected routes: `beforeLoad` with `redirect()` — already done in `_authed.tsx`

### shadcn / Tailwind
- Theme tokens are in `src/index.css` (`--background`, `--foreground`, `--primary`, etc.). Don't add competing CSS vars.
- Tamagui token scale (`$1`..`$10`) ≈ Tailwind spacing scale (`1`..`10` = `4px * N`). Use judgment, not literal conversion.
- Mobile-first: design at 360–414px. Wrap each screen in `max-w-md mx-auto` to keep it phone-shaped on desktop.

### TS strictness gotchas
- `verbatimModuleSyntax`: use `import type { Foo } from 'bar'` for types
- `noUnusedLocals` + `erasableSyntaxOnly`: stricter than mobile — expect to trim imports or prefix unused vars with `_`
- `React.FormEvent<HTMLFormElement>` is marked deprecated (warning, not error) in TS 6 — ignore the hint, it still works. (The Phase 1 forms keep it.)

### Env / globals
- No `process.env` in source — use `import.meta.env.VITE_*`
- No `__DEV__` — use `import.meta.env.DEV` (boolean)

---

## 5. Drag and drop (Phase 4 only, but plan ahead)

Only `sentence_construction` needs DnD in the active set. Use `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`. See §5 of the original Phase 0 doc (now in `git log` if you need it) for the sentence-builder mapping. **Skip `matching` and `mixed` entirely** — `matching` is disabled in mobile due to a Reanimated bug; `mixed` is hidden for now. Keep them in the `ExerciseType` union but never render UI for them.

---

## 6. Remaining phases at a glance

After Phase 2, continue with the original plan:

### Phase 3 — Quiz flow without DnD
shadcn: `progress dialog alert-dialog radio-group`
Hooks: `useQuizGeneration`, `useQuizPersistence`, `useAnswerValidation`, `useQuestionTimer`
Components: `QuizQuestionCard`, `AnswerOptionGrid`, `FillInBlankSentence`, `WordBankSelector`, `DialogueCard`, `ReadingPassageCard`, `TextInputAnswer`, `QuizProgress`, `PointsCounter`, `FeedbackOverlay`, `CompletionScreen`, `ExitConfirmationModal`, `PausedQuizBanner`. **Skip `MatchingExercise.tsx`.**
Routes: `_authed/quiz/loading`, `ai-loading`, `premade`, `play`, `$chapterId`
Wire `QuizResumeDialog` in `__root.tsx`.

### Phase 4 — Sentence construction
`npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities` and build `SentenceBuilder.tsx` with two droppable zones (answer slot + word bank), `PointerSensor` + `KeyboardSensor`, `<DragOverlay>`. **Keep tap-to-place** as the primary interaction.

### Phase 5 — Generate, Chat, Settings
Port `generate.tsx`, `chat.tsx`, `settings.tsx`. `useSound` needs a web rewrite (mobile uses `expo-av` → use `HTMLAudioElement`).

### Phase 6 — Polish
Dark mode (`useResolvedColorScheme` web version + Tailwind `dark:`), PWA icons (`pwa-192x192.png`, `pwa-512x512.png`, `pwa-maskable-512x512.png`, `apple-touch-icon.png`, `favicon.svg`), Lighthouse audit. Apple Sign-in only if user confirms scope.

---

## 7. Out of scope (do NOT do unless user asks)

- Porting unit tests (`*.test.ts(x)`) from mobile
- Porting Playwright E2E tests
- Setting up CI for the PWA
- Apple Sign In on web
- Push notifications
- Native modules (camera, audio recording)
- `matching` and `mixed` exercise types
- `(tabs)/theme-demo` (dev-only)
- The `dangdai-rag/` or `dangdai-api/` directories
- The mobile codebase — leave `dangdai-mobile/` alone

When in doubt about scope, ask before adding.

---

## 8. Reference docs

Always prefer Context7 over training data:
- `/tanstack/router` — file-based routing, beforeLoad guards, typed params
- `/tanstack/query` — already familiar to mobile codebase
- `/clauderic/dnd-kit` — sortable, draggable, sensors, accessibility (Phase 4)
- `/shadcn-ui/ui` — shadcn/ui components
- `/tailwindlabs/tailwindcss` — Tailwind v4
- `/supabase/supabase` — Supabase JS client
- `/vite-pwa/vite-plugin-pwa` — manifest, Workbox runtime caching

For Supabase schema / RLS / migrations / type generation: use the **Supabase MCP** (`list_tables`, `execute_sql`, `apply_migration`, `generate_typescript_types`, `get_advisors`) — never hand-write SQL.

For structural questions across mobile + api (call graphs, who-calls-X): use the **CodeGraphContext MCP** (`find_code`, `analyze_code_relationships`). Don't use it for plain text search — that's what grep is for.

---

## 9. Verification per phase

```bash
cd /home/maxime/repos/dangdai-app/dangdai-pwa
npm run build          # tsc -b && vite build — must be green
npm run dev            # smoke test in browser at localhost:5173
```

In Chrome (or chrome-devtools MCP), verify after each phase:
- No console errors or React warnings
- Network: all requests 200; Supabase REST calls succeed
- Production build: SW registers, manifest valid
- Lighthouse mobile audit: PWA installable, performance green

Test login: **test@test.com / maxime11**.
