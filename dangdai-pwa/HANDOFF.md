# dangdai-pwa Handoff

You are picking up the migration of `dangdai-mobile/` (React Native + Expo + Tamagui) into `dangdai-pwa/` (Vite + React + shadcn/ui + Tailwind v4 + TanStack Router). The scaffold and all shared logic are in place. **Your job: port every screen, component, and hook from `dangdai-mobile/` to `dangdai-pwa/`**, except the two commented-out exercise types listed below.

The Supabase project and FastAPI backend are unchanged — same data, same endpoints. Only the client is being rebuilt.

---

## 1. Scope: what to port vs skip

### Port (active exercise types)
- `vocabulary`
- `grammar`
- `fill_in_blank`
- `dialogue_completion`
- `sentence_construction` (needs drag-and-drop — see §5)
- `reading_comprehension`

### Skip (commented out in mobile, do NOT migrate)
- `matching` — disabled in mobile due to a Reanimated color bug. **Skip the entire `MatchingExercise.tsx` component and any references.**
- `mixed` — hidden for now.

Source of truth: `dangdai-mobile/app/chapter/[chapterId]/exercises.tsx` (`AI_GENERATABLE_TYPES_LIST` array — both skipped types are commented out there).

When porting `EXERCISE_TYPE_LABELS` / `ExerciseType` from `types/quiz.ts`, **leave** `matching` and `mixed` in the union (the backend still returns them in places) but **never render UI for them** and never include them in the user-facing list.

---

## 2. Current state of the PWA

### Stack (already wired in `package.json`, `vite.config.ts`)
- Vite 8 + React 19 + TypeScript 6 (strict mode, `verbatimModuleSyntax`)
- Tailwind v4 via `@tailwindcss/vite` + `tw-animate-css`
- shadcn/ui configured (new-york style, neutral base color, CSS vars). Add components with `npx shadcn@latest add <name>`. `components.json` is in place.
- TanStack Router (file-based, `autoCodeSplitting`) — routes live in `src/routes/`
- TanStack Query + devtools, Zustand, `@supabase/supabase-js`
- vite-plugin-pwa (Workbox, autoUpdate, runtime caching for Supabase REST + storage)
- Path alias: `@/* → src/*`

### What's already ported (don't redo these)

| Path in PWA | Status | Notes |
|---|---|---|
| `src/types/*.ts` | ✅ Copied verbatim | quiz, chapter, paused-quiz, supabase |
| `src/lib/queryClient.ts` | ✅ Copied verbatim | |
| `src/lib/queryKeys.ts` | ✅ Copied verbatim | |
| `src/lib/pinyinNormalize.ts` | ✅ Copied verbatim | Pure logic |
| `src/lib/quizValidation.ts` | ✅ Copied verbatim | Pure logic |
| `src/lib/validateFillInBlank.ts` | ✅ Copied verbatim | Pure logic |
| `src/lib/premadeExerciseAdapter.ts` | ✅ Copied + 1 cast fix at line 315 (`exerciseType as QuizQuestion['exercise_type']`) | Pre-existing TS bug in mobile |
| `src/lib/supabase.ts` | ✅ Rewritten for web | Drops AsyncStorage/Platform; uses Supabase default localStorage, `detectSessionInUrl: true` |
| `src/lib/api.ts` | ✅ Ported | Env vars swapped: `process.env.EXPO_PUBLIC_*` → `import.meta.env.VITE_*` |
| `src/lib/utils.ts` | ✅ Created | shadcn's `cn()` helper |
| `src/stores/useUserStore.ts` | ✅ Copied verbatim | |
| `src/stores/useSettingsStore.ts` | ✅ Copied verbatim | |
| `src/stores/useQuizStore.ts` | ✅ Ported | `AsyncStorage` → `localStorage` (line in `persist({storage:...})`) |
| `src/stores/index.ts` | ✅ Copied verbatim | |
| `src/constants/{books,chapters,tips,app}.ts` | ✅ Copied verbatim | |
| `src/providers/AuthProvider.tsx` | ✅ Rewritten | Same `useAuth()` API surface. **Routing moved out** — see §3.3. No toast calls (re-add via shadcn `sonner` later). |
| `src/routes/__root.tsx` | ✅ Created | Mounts router + devtools |
| `src/routes/index.tsx` | ⚠️ Placeholder | Replace with home tab once `(tabs)` group is ported |

### Env
- `.env.local` is already populated with the same Supabase project as mobile (`qhsjaybldyqsavjimxes`) and `VITE_API_URL=http://localhost:8000`
- `.env.example` documents the keys

### Verified working
- `npm run build` is green (TS clean, PWA service worker emitted, manifest generated)
- `npm run dev` boots and renders without console errors
- Tested via chrome-devtools MCP — clean console, all assets load, Zustand quiz store hydrates from localStorage

---

## 3. Architectural decisions (already locked)

### 3.1 Routing: TanStack Router, file-based
Routes live in `src/routes/`. Conventions:
- `__root.tsx` — root layout, wraps everything
- `index.tsx` → `/`
- `_layout.tsx` files don't exist in TanStack Router; instead, **layout routes** are folders with a `route.tsx` that uses `<Outlet />`
- Route groups (Expo `(auth)`) become **pathless layout routes**: name the parent file `_auth.tsx` (underscore prefix = pathless). Example: `routes/_auth.tsx` is the layout, `routes/_auth/login.tsx` is `/login`.
- Dynamic params use `$` not brackets: `routes/chapter/$bookId.tsx` not `[bookId].tsx`
- Authenticated routes should use `beforeLoad` to redirect to `/login` if no session

The plugin auto-generates `src/routeTree.gen.ts` on dev/build. Don't edit it; don't commit conflicts in it (regenerate by running `npm run dev`).

Docs: `https://tanstack.com/router/latest`. Context7 ID: `/tanstack/router`.

### 3.2 UI: shadcn/ui + Tailwind v4
- All Tamagui components must be rewritten using shadcn primitives. There is **no automatic conversion**.
- Add components on demand: `npx shadcn@latest add button card input dialog scroll-area separator skeleton sonner tabs avatar progress`
- Theme tokens are in `src/index.css` (`--background`, `--foreground`, `--primary`, etc.). Don't add competing CSS variables.
- Icons: use `lucide-react` (already installed). Mobile used `@tamagui/lucide-icons` — same icon names work.

### 3.3 Auth redirects: TanStack Router `beforeLoad` guards (NOT useEffect)
The PWA's `AuthProvider` only owns **session state**. Redirects are handled in route definitions. Pattern:

```tsx
// src/routes/_authed.tsx — pathless layout that gates everything inside it
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router';
import { supabase } from '@/lib/supabase';

export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: '/login', search: { redirect: location.href } });
    }
  },
  component: () => <Outlet />,
});
```

Then put protected routes under `routes/_authed/` (tabs, chapter, quiz). The login screen lives at `routes/login.tsx` (public).

### 3.4 Why this is NOT a 1:1 port
- Tamagui `<YStack>` / `<XStack>` → shadcn divs with Tailwind flex utilities (`flex flex-col gap-4` etc.)
- Expo Router `useRouter().push()` → TanStack Router `useNavigate()` or `<Link>`
- `useLocalSearchParams` → TanStack's `Route.useParams()` and `Route.useSearch()`
- Expo `Stack.Screen` options (headers, titles) → render your own header component in each route
- `react-native-gesture-handler` + `react-native-reanimated` → **dnd-kit** (see §5) + Tailwind/Framer Motion if you need animations (avoid adding Framer unless needed)
- `ScrollView` → native `<div className="overflow-y-auto">` or shadcn `<ScrollArea>`
- `Pressable` / Tamagui `<Button>` → shadcn `<Button>` (`onClick`, not `onPress`)
- `react-native` `StyleSheet` and inline styles → Tailwind classes

---

## 4. Tamagui → shadcn/Tailwind quick reference

| Tamagui | shadcn / Tailwind |
|---|---|
| `<YStack gap="$3" padding="$4">` | `<div className="flex flex-col gap-3 p-4">` |
| `<XStack gap="$2" alignItems="center">` | `<div className="flex items-center gap-2">` |
| `<Text fontSize="$5" color="$gray11">` | `<p className="text-base text-muted-foreground">` |
| `<H2 fontSize="$6" fontWeight="bold">` | `<h2 className="text-xl font-bold">` |
| `<Button theme="primary" size="$3">` | `<Button>` (shadcn) |
| `<Card elevate bordered padding="$3">` | `<Card><CardContent className="p-3">…</CardContent></Card>` |
| `<Input ... />` | `<Input ... />` (shadcn) |
| `<Spinner />` | `<Loader2 className="animate-spin" />` from lucide |
| `<AlertDialog>` | shadcn `<AlertDialog>` (`npx shadcn@latest add alert-dialog`) |
| `useTheme().primary.val` | use CSS var `var(--primary)` or Tailwind class `bg-primary` |
| `testID="x"` | `data-testid="x"` (or drop — these were for Playwright; reuse if Playwright tests get ported) |

Tamagui token scale (`$1`..`$10`) maps roughly to Tailwind spacing scale `1`..`10` (`4px` * N). Use judgment, not literal conversion.

---

## 5. Drag and drop: use **dnd-kit**

Only `sentence_construction` needs DnD in the active set (`matching` is skipped).

**Recommended:** `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`

- Modern (active 2024–2026), lightweight, modular, no HTML5 DnD dependency
- Built-in **touch support** (critical — this is a mobile PWA)
- Built-in **keyboard accessibility**
- Has `DragOverlay` for smooth visual feedback
- Context7 ID: `/clauderic/dnd-kit` (610 snippets, high reputation, score 79.65)
- Docs: `https://docs.dndkit.com/`

Install:
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### Sentence builder mapping (mobile → dnd-kit)
Mobile uses `Gesture.Pan()` + `useSharedValue`. Web version should use:
- A `<DndContext>` wrapping the whole screen with a `closestCenter` collision detection strategy
- Two droppable zones: the **answer slot area** (top) and **word bank** (bottom)
- Each tile is a `useDraggable` (or part of a `SortableContext` if you want reordering inside the slot area)
- Touch + keyboard sensors enabled: `useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor))`
- Use `<DragOverlay>` so the dragged tile follows the pointer with a shadow
- Hit-test is automatic — no manual `LayoutRectangle` measuring like the mobile code does

Keep these mobile features when porting:
- Tap-to-place (primary interaction — DnD is the secondary one). A tile click should immediately move it from bank → slot.
- Per-tile feedback colors (green correct / orange incorrect on submit)
- "Your answer is also valid!" message for LLM-validated alternatives

### Alternative if dnd-kit feels heavy
`@hello-pangea/dnd` (fork of `react-beautiful-dnd`) — Context7 ID `/hello-pangea/dnd`. Beautiful for sortable lists but less flexible for the "two distinct zones" model. **Stick with dnd-kit** unless you hit a specific blocker.

Do **not** use `react-dnd` (older, HTML5-based, weaker touch support).

---

## 6. File-by-file port map

### 6.1 Routes (mobile `app/` → PWA `src/routes/`)

| Mobile path | PWA path | Notes |
|---|---|---|
| `app/_layout.tsx` | `src/routes/__root.tsx` (already done) | Drop `QuizResumeDialog` here too (port it from mobile) |
| `app/(auth)/_layout.tsx` | `src/routes/_auth.tsx` (pathless layout) | Just renders `<Outlet />` with centered card styling |
| `app/(auth)/login.tsx` | `src/routes/_auth/login.tsx` | Use shadcn `<Card>` + `<Input>` + `<Button>` |
| `app/(auth)/signup.tsx` | `src/routes/_auth/signup.tsx` | |
| `app/(auth)/forgot-password.tsx` | `src/routes/_auth/forgot-password.tsx` | |
| `app/(auth)/reset-password.tsx` | `src/routes/_auth/reset-password.tsx` | Triggered by Supabase email link; `detectSessionInUrl:true` is already set |
| `app/(tabs)/_layout.tsx` | `src/routes/_authed/_tabs.tsx` (pathless layout) | Bottom tab nav. Build with flex + shadcn buttons; mobile-first sticky bottom bar |
| `app/(tabs)/index.tsx` | `src/routes/_authed/_tabs/index.tsx` | Home screen |
| `app/(tabs)/books.tsx` | `src/routes/_authed/_tabs/books.tsx` | |
| `app/(tabs)/generate.tsx` | `src/routes/_authed/_tabs/generate.tsx` | |
| `app/(tabs)/chat.tsx` | `src/routes/_authed/_tabs/chat.tsx` | |
| `app/(tabs)/settings.tsx` | `src/routes/_authed/_tabs/settings.tsx` | |
| `app/(tabs)/theme-demo.tsx` | **SKIP** | Dev-only |
| `app/chapter/[bookId].tsx` | `src/routes/_authed/chapter/$bookId.tsx` | Chapter list for a book |
| `app/chapter/[chapterId]/exercises.tsx` | `src/routes/_authed/chapter/$chapterId/exercises.tsx` | **Strip `matching` and `mixed` from the rendered list** |
| `app/chapter/[chapterId]/vocabulary.tsx` | `src/routes/_authed/chapter/$chapterId/vocabulary.tsx` | |
| `app/chapter/[chapterId]/grammar.tsx` | `src/routes/_authed/chapter/$chapterId/grammar.tsx` | |
| `app/chapter/[chapterId]/dialogues.tsx` | `src/routes/_authed/chapter/$chapterId/dialogues.tsx` | |
| `app/quiz/ai-loading.tsx` | `src/routes/_authed/quiz/ai-loading.tsx` | |
| `app/quiz/loading.tsx` | `src/routes/_authed/quiz/loading.tsx` | |
| `app/quiz/premade.tsx` | `src/routes/_authed/quiz/premade.tsx` | |
| `app/quiz/play.tsx` | `src/routes/_authed/quiz/play.tsx` | The main quiz session screen |
| `app/quiz/[chapterId].tsx` | `src/routes/_authed/quiz/$chapterId.tsx` | |
| `app/+not-found.tsx` | `src/routes/__root.tsx` `notFoundComponent` prop | |
| `app/+html.tsx` | **SKIP** | Expo-only |
| `app/modal.tsx` | **SKIP or convert to shadcn `<Dialog>`** | Only port if referenced from a screen you are porting |

Chapter ID convention (unchanged): `bookId * 100 + chapterNumber` (e.g., Book 2 Chapter 12 → 212). Already documented in `AGENTS.md`.

### 6.2 Components

For each `dangdai-mobile/components/<folder>/<Name>.tsx`, rebuild at `dangdai-pwa/src/components/<folder>/<Name>.tsx` using shadcn primitives. **Read the mobile file, understand the behavior and props, then rewrite — do not copy.**

Active set to port:

**`components/auth/`**
- `LoginForm.tsx`, `SignupForm.tsx`, `ForgotPasswordForm.tsx`, `ResetPasswordForm.tsx`
- `AppleSignInButton.tsx` — **SKIP for now** (web Apple Sign-in needs a different setup; ask the user before tackling)

**`components/chapter/`**
- `BookCard.tsx`, `BookCardSkeleton.tsx`
- `ChapterListItem.tsx`, `ChapterListSkeleton.tsx`
- `ExerciseTypeCard.tsx`
- `VocabularyItem.tsx`, `GrammarPointCard.tsx`, `DialogueBubble.tsx`
- `PremadeExerciseCard.tsx`

**`components/quiz/`** (the active exercise UIs)
- `QuizQuestionCard.tsx` — the wrapper that dispatches to a type-specific renderer
- `AnswerOptionGrid.tsx` — vocab/grammar multiple choice
- `FillInBlankSentence.tsx` — fill_in_blank
- `WordBankSelector.tsx` — used inside fill_in_blank
- `SentenceBuilder.tsx` — **rewrite with dnd-kit (§5)**
- `DialogueCard.tsx` — dialogue_completion
- `ReadingPassageCard.tsx` — reading_comprehension
- `TextInputAnswer.tsx`
- `QuizProgress.tsx`, `PointsCounter.tsx`, `FeedbackOverlay.tsx`
- `CompletionScreen.tsx`
- `ExitConfirmationModal.tsx` — use shadcn `<AlertDialog>`
- `PausedQuizBanner.tsx`
- `ExerciseTypeProgressList.tsx`
- **SKIP: `MatchingExercise.tsx`** (matching is disabled)

**`components/`** (root)
- `MaixinLogo.tsx` — port the SVG
- `SplashScreen.tsx` — show during `AuthProvider` loading; use a Tailwind centered layout
- `Provider.tsx` — **SKIP** (was Tamagui+Query+Toast wrapper; PWA wires these in `main.tsx` already)
- `CurrentToast.tsx` — **SKIP**; replace with shadcn `sonner` (`npx shadcn@latest add sonner`). Add `<Toaster />` in `__root.tsx` and call `toast.error(...)` / `toast.success(...)` where the mobile code used `useToastController()`.

### 6.3 Hooks

All hooks live at `src/hooks/<name>.ts` (folder already exists). Most are pure TanStack Query / Zustand wrappers and should port with **zero code changes**. Just check imports:
- Replace any `import X from 'react-native...'` (rare — almost none use RN)
- Path aliases: prefer `@/lib/...`, `@/types/...`, `@/stores/...` (but relative paths also work)

| Hook | Action |
|---|---|
| `useAuth.ts` | Re-export from `@/providers/AuthProvider` (the PWA AuthProvider already exports `useAuth`) |
| `useSession.ts` | Likely thin wrapper — verify and port |
| `useBooks.ts`, `useChapters.ts`, `useChapterProgress.ts` | Pure Query hooks. Copy verbatim. |
| `useVocabulary.ts`, `useGrammarPoints.ts`, `useDialogues.ts` | Pure. Copy verbatim. |
| `usePremadeExercises.ts`, `usePremadeExercise.ts` | Pure. Copy verbatim. |
| `useExerciseTypeProgress.ts` | Pure. Copy verbatim. |
| `useUserStats.ts` | Pure. Copy verbatim. |
| `useQuizGeneration.ts` | Calls `api.generateQuiz` etc. Already ported in PWA's `lib/api.ts`. Copy. |
| `useQuizPersistence.ts` | Zustand-only. Copy verbatim. |
| `usePauseQuiz.ts`, `usePausedQuiz.ts` | Supabase + Zustand. Copy verbatim. |
| `useAnswerValidation.ts` | Pure logic + API. Copy. |
| `useQuestionTimer.ts` | Pure `setInterval` logic. Copy. |
| `useSound.ts` | **Rewrite for web.** Mobile uses `expo-av`. Web: use `HTMLAudioElement` or `<audio>` refs. Keep the same hook signature so callers don't change. |
| `useResolvedColorScheme.ts` | Mobile reads OS theme via RN APIs. Web: `window.matchMedia('(prefers-color-scheme: dark)')`. Reuse the same return shape. Or skip until dark mode is wired up. |

---

## 7. Suggested phasing

Do it in this order — each phase ends in a buildable, demo-able app.

### Phase 1 — Auth flow (smallest meaningful slice)
1. `npx shadcn@latest add button input label card form sonner`
2. Add `<Toaster />` in `src/routes/__root.tsx`
3. Build `src/routes/_auth.tsx` (centered card layout)
4. Port `LoginForm`, `SignupForm`, `ForgotPasswordForm`, `ResetPasswordForm`
5. Build `src/routes/_authed.tsx` (the `beforeLoad` guard from §3.3)
6. Replace `src/routes/index.tsx` with a redirect: signed-in → `/home`, signed-out → `/login`
7. Verify: can sign up, sign in, sign out, password reset (use real Supabase project; same one as mobile)

### Phase 2 — Books + chapter navigation (no quizzes yet)
1. `npx shadcn@latest add skeleton scroll-area separator avatar tabs`
2. Build the bottom tab bar at `src/routes/_authed/_tabs.tsx` (just Home, Books, Settings to start; add Generate, Chat later)
3. Port `useBooks`, `useChapters`, `useChapterProgress`, then `BookCard`, `ChapterListItem`, and the screens that use them
4. `src/routes/_authed/_tabs/books.tsx`, `src/routes/_authed/chapter/$bookId.tsx`
5. Port content browse screens: `vocabulary`, `grammar`, `dialogues` + their components

### Phase 3 — Quiz flow without DnD (vocab, grammar, fill_in_blank, dialogue, reading)
1. `npx shadcn@latest add progress dialog alert-dialog radio-group`
2. Port quiz hooks: `useQuizGeneration`, `useQuizPersistence`, `useAnswerValidation`, `useQuestionTimer`
3. Port `QuizQuestionCard`, `AnswerOptionGrid`, `FillInBlankSentence`, `WordBankSelector`, `DialogueCard`, `ReadingPassageCard`, `TextInputAnswer`, `QuizProgress`, `PointsCounter`, `FeedbackOverlay`, `CompletionScreen`, `ExitConfirmationModal`, `PausedQuizBanner`
4. Port quiz route screens: `loading`, `ai-loading`, `premade`, `play`, `$chapterId`
5. Wire `QuizResumeDialog` in `__root.tsx`
6. End-to-end test: pick a chapter → generate vocab quiz → complete it → see results saved in Supabase

### Phase 4 — Sentence construction (dnd-kit)
1. `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
2. Build `SentenceBuilder.tsx` from scratch per §5
3. Test on touch device (or Chrome DevTools mobile emulation)
4. Verify tap-to-place still works alongside drag

### Phase 5 — Generate, Chat, Settings tabs
1. Port `generate.tsx` (multi-chapter quiz generation form — uses `api.generateMultiChapterQuiz`)
2. Port `chat.tsx` (RAG Q&A — uses `api.askChat`)
3. Port `settings.tsx`
4. Port `useSound` (web rewrite) if any screen relies on sound effects (check `useSound` callers in mobile)

### Phase 6 — Polish
1. Dark mode (`useResolvedColorScheme` web version + Tailwind `dark:` classes)
2. PWA icons: generate `pwa-192x192.png`, `pwa-512x512.png`, `pwa-maskable-512x512.png`, `apple-touch-icon.png`, `favicon.svg` → place in `public/`
3. Apple Sign-in (if user confirms scope)
4. Lighthouse PWA audit; install prompt UX

---

## 8. Gotchas & things to watch for

1. **TanStack Router type-safety**: route params/search are fully typed. Use `Route.useParams()` and `Route.useSearch()` from each generated route. If you see `'/path' not assignable to undefined`, the router hasn't generated `routeTree.gen.ts` yet — run `npm run dev` once to regenerate.

2. **Strict TS**: `verbatimModuleSyntax: true` means types must use `import type { Foo } from 'bar'`. The mobile codebase usually does this already.

3. **`noUnusedLocals` and `erasableSyntaxOnly`**: PWA tsconfig is stricter than mobile. Expect more `_var` prefixes or trimmed imports when porting.

4. **No `process.env`** in source. Use `import.meta.env.VITE_*`. The PWA scaffold has only three: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`. Add more sparingly and document in `.env.example`.

5. **No `__DEV__`** global. Use `import.meta.env.DEV` (boolean) instead.

6. **Supabase reset-password redirect**: mobile used a deep link `maixin-chinese://reset-password`. PWA AuthProvider already sets `${window.location.origin}/reset-password`. Make sure that route exists at `routes/_auth/reset-password.tsx`. Also confirm in Supabase Auth dashboard that the new web origin is on the allowed redirect URL list.

7. **No deep linking, no Apple Sign In on web (for now)** — both deferred. If a screen depends on Apple sign in, leave a stub button or skip until §6.

8. **Mobile-first sizing**: this is a *mobile* PWA. Design at 360–414px width. Use `max-w-md mx-auto` on screens to keep them narrow on desktop, or simulate phone width with a centered container.

9. **Mobile tests use `testID`** for Playwright. The mobile Playwright suite is at `dangdai-mobile/tests/`. The user has not asked for tests to be ported in the PWA yet — leave `data-testid` props off unless asked. If asked later, mirror the same testIDs as `data-testid` so test files can be ported with minor changes.

10. **`MatchingExercise.tsx` references**: when porting `exercises.tsx` and `QuizQuestionCard.tsx`, search for `matching` and remove dispatch branches. The type still exists in the `ExerciseType` union (backend may send it) but the UI should never render it. Throw or return a "not supported" placeholder if you hit it at runtime, to surface backend bugs early.

11. **Reading comprehension**: mobile's `lib/api.ts` (already ported) has a `resolveComprehensionAnswers` step that resolves sub-question `correct` indices to `correct_answer` strings. Don't duplicate that logic in the renderer.

---

## 9. Verification checklist (run after each phase)

```bash
cd /home/maxime/repos/dangdai-app/dangdai-pwa
npm run build          # tsc -b && vite build (must be green)
npm run dev            # smoke test in browser
```

In Chrome DevTools (or via the chrome-devtools MCP if available):
- No console errors or React warnings
- Network: all requests 200; Supabase REST calls succeed
- Application → Service Workers: SW registers in production (not dev)
- Application → Manifest: valid manifest (production build only)
- Lighthouse mobile audit: aim for PWA installable + green on Performance

---

## 10. Reference docs (use Context7 MCP)

Always prefer Context7 over training data:
- `/tanstack/router` — TanStack Router (file-based routing, beforeLoad guards, typed params)
- `/tanstack/query` — TanStack Query (already familiar to mobile codebase)
- `/clauderic/dnd-kit` — dnd-kit (sortable, draggable, sensors, accessibility)
- `/shadcn-ui/ui` — shadcn/ui components
- `/tailwindlabs/tailwindcss` — Tailwind v4
- `/supabase/supabase` — Supabase JS client (web auth flow)
- `/vite-pwa/vite-plugin-pwa` — vite-plugin-pwa (manifest, Workbox runtime caching)

For schema, RLS, migrations, type generation: use the **Supabase MCP** (`list_tables`, `execute_sql`, `apply_migration`, `generate_typescript_types`, `get_advisors`) — never write SQL by hand.

---

## 11. Out of scope (do NOT do unless user explicitly asks)

- Porting unit tests (`*.test.ts(x)`) from mobile. Wait for the user to ask before adding Jest/Vitest.
- Porting Playwright E2E tests
- Setting up CI for the PWA
- Apple Sign In on web
- Push notifications
- Native modules (camera, audio recording, etc.)
- The `matching` and `mixed` exercise types
- The `(tabs)/theme-demo` dev-only screen
- The `dangdai-rag/` or `dangdai-api/` directories (backend untouched)
- The mobile codebase itself — leave `dangdai-mobile/` alone. The user is keeping both.

When in doubt about scope, ask the user before adding anything not on this doc.
