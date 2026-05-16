# dangdai-pwa Handoff (Phase 6 onward)

You are picking up the migration of `dangdai-mobile/` (React Native + Expo + Tamagui) into `dangdai-pwa/` (Vite + React + shadcn/ui + Tailwind v4 + TanStack Router).

**Phases 1 (auth), 2 (books + chapter navigation), 3 (quiz flow without DnD), 4 (sentence construction with `@dnd-kit`), and 5 (Generate / Chat / Settings + real audio + theme application) are complete and live-tested.** Your next job is **Phase 6 polish: PWA icons, Lighthouse audit, dark-mode visual pass, and any deferred cleanup.**

The Supabase project and FastAPI backend are unchanged — same data, same endpoints. Only the client is being rebuilt.

---

## 0. What just got done (Phase 5)

### Real audio in `useSound`
`src/hooks/useSound.ts` is no longer a stub. The HTMLAudioElement port mirrors the mobile `expo-av` impl:
- Module-level `soundCache: Map<SoundName, HTMLAudioElement>` so we don't reallocate per render.
- `preloadSounds()` lazily creates an `Audio()` for each of `correct`, `incorrect`, `celebration` and calls `.load()`.
- `playSound(name)` reads `useSettingsStore.getState().soundEnabled` at call time (matches mobile pattern, avoids stale closures), rewinds via `audio.currentTime = 0`, then `play()`. Failures (notably `NotAllowedError` autoplay before first user gesture) are warn-logged and swallowed — quiz must never crash on sound failure.
- `unloadSounds()` clears the cache on quiz unmount.
- `useSound()` hook returns `{ playSound, preloadSounds, unloadSounds, soundEnabled }`. The `SoundEffect` type alias from the Phase 3 stub is preserved for back-compat, aliased to the new `SoundName` (`'correct' | 'incorrect' | 'celebration'`).

MP3 assets copied verbatim from `dangdai-mobile/assets/sounds/` into `dangdai-pwa/public/sounds/`. Vite-plugin-pwa picks them up automatically — they're in the precache manifest now.

### Generate tab — `_authed/_tabs/generate.tsx`
Full multi-chapter quiz builder. `BookChapterPicker` for start/end (book chips + chapter chips), numeric question count input (5–50, default 10), exercise-type chips (vocabulary, grammar, fill-in-blank, matching, dialogue_completion, sentence_construction, reading_comprehension), a range summary card. On submit:
- Calls `api.generateMultiChapterQuiz(...)`.
- Builds a `QuizResponse` payload, picking `exercise_type` as the single selected type or `'mixed'`.
- `useQuizStore.startQuiz(...)` then `navigate({ to: '/quiz/play' })`.
- Errors surface via `sonner` toast (mobile uses `Alert.alert`, port to web is `toast.error`).

### Chat tab — `_authed/_tabs/chat.tsx`
Textbook RAG Q&A. Stateless: each request includes the current book/lesson/contentType filters. Filter bar at the top (book chips → lesson chips appear after a book is picked → content type Both/Textbook/Workbook). Auto-scrolling message list with user (right) and assistant (left) bubbles; assistant bubbles render a "Sources" section with formatted citations. Enter submits, Shift+Enter not implemented (single-line `<Input>`, not `<Textarea>` — switch if multiline becomes important). Loading row shows a spinner while `api.askChat(...)` is in flight; toast on failure.

### Full Settings tab — `_authed/_tabs/settings.tsx`
Replaced the Phase 1 stub. Shows account email, a 3-button theme group (Light / Dark / System) wired to `useSettingsStore.setTheme`, and a Sound effects toggle (shadcn `Switch`) wired to `toggleSound` — flipping it on plays a `correct` ding via `setTimeout(0)` so the user immediately hears it's working (the store update has to commit first, since `playSound` reads `getState()` at call time). Sign out triggers a `window.confirm` then `signOut()` + `navigate({ to: '/login' })`.

### Theme application + persistence
`src/routes/__root.tsx` now calls a `useThemeSync()` hook that toggles `.dark` on `<html>` based on `useSettingsStore.theme`, with a `matchMedia('(prefers-color-scheme: dark)')` listener for the `'system'` choice. The Tailwind v4 setup already has `@custom-variant dark (&:is(.dark *))` in `src/index.css`, so flipping the class is enough.

`src/stores/useSettingsStore.ts` now uses Zustand `persist` middleware with `localStorage` (key `dangdai-settings`). Mobile doesn't persist settings (RN reload is rare), but on web losing theme/sound on refresh would be a bad UX, so we deliberately diverge from mobile here.

### Tab bar — `_authed/_tabs.tsx`
Now 5 tabs: Home / Books / Generate / Chat / Settings, matching the mobile `(tabs)/_layout.tsx`. Icons: `Home`, `BookOpen`, `Sparkles`, `MessageSquare`, `Settings` from `lucide-react`. Active state still by exact-match for `/`, prefix-match for the rest.

### shadcn additions in Phase 5
`switch` (only one — installed for the sound toggle).

### Verified end-to-end in Chrome DevTools
- `/` → 5-tab nav visible, Generate / Chat / Settings all reachable
- Generate (`/generate`): "From" defaults to Book 2 Ch 11, "To" defaults to Book 3 Ch 3, range summary reads "8 chapters" — all chips, count input, type toggles work
- Chat (`/chat`): book chip selection reveals lesson chips for that book; content type chips toggle; empty state renders
- Settings (`/settings`): clicking Dark adds `.dark` to `<html>` and writes `{"state":{"theme":"dark",...}}` to `localStorage[dangdai-settings]`. Switching back to System removes it. Sound toggle persists.
- `/sounds/correct.mp3` serves 200 OK (`audio/mpeg`, 1062 bytes); `new Audio('/sounds/correct.mp3').play()` resolves successfully (after first user gesture).
- Seeded a 1-question vocabulary quiz in `dangdai-quiz-store`, navigated to `/quiz/play`, picked the correct answer — FeedbackOverlay shows "Correct! +10 pts" + explanation + citation, no console errors. `playSound('correct')` runs through the new code path with no errors.
- `npm run build` is green (main chunk still 588 KB, gzipped 171 KB — sound MP3s add ~3.7 KB to precache total).

### Phase 5 gotchas worth remembering

1. **Browser autoplay policy.** `playSound()` will reject (`NotAllowedError`) if called before any user gesture in the page. Once the user has clicked anything, subsequent plays succeed. The implementation warn-logs and swallows; don't change that without thinking — the alternative is an unhandled promise rejection in production. The Settings sound-on toggle relies on the click being the gesture that unlocks audio, so the immediate ding works.
2. **`playSound` reads from `getState()`, not via subscription.** Same pattern as mobile. Keeps the call site closure-free, and the immediate-on-toggle ding works because `setTimeout(0)` defers the read until after the store commit. Don't rewrite this to take `soundEnabled` as a prop.
3. **Audio elements are NOT attached to the DOM.** `soundCache` holds them as JS objects only. `document.querySelectorAll('audio').length === 0` is expected. Don't be confused into thinking sound isn't preloaded.
4. **`useSettingsStore` is now persisted; mobile is not.** This is a deliberate divergence — if you ever sync mobile<->web settings, write the migration on the mobile side, not by removing persistence here.
5. **Theme `.dark` is toggled on `<html>` (`document.documentElement`), not `<body>`.** Tailwind v4's `@custom-variant dark (&:is(.dark *))` matches anywhere in the ancestor chain — `<html>` is the standard choice and avoids fighting with shadcn's body styles.
6. **Mobile `useSettingsStore` is NOT persisted.** If you compare, don't be alarmed.
7. **Chat input is single-line `<Input>`, not `<Textarea>`.** Mobile uses Tamagui `<Input>` too. If you add multiline support, swap to a shadcn `<Textarea>` (not installed yet) and handle Enter / Shift+Enter explicitly.
8. **`api.askChat` and `api.generateMultiChapterQuiz` are unchanged from Phase 3.** They were already in the API client; Phase 5 just wired UIs to them.
9. **No `pre`/`post` quiz weakness data wiring.** Same as Phase 3/4. Mobile doesn't wire it either — `CompletionScreen` accepts the props but mobile's `play.tsx` never passes them. Considered out of scope (would invent functionality not in the source app). If you ever wire it, you'll need a new hook to query `question_results` aggregated by `vocabulary_item` / `grammar_pattern` for the current chapter, run pre-quiz in `_authed/quiz/loading.tsx` and post-quiz in `_authed/quiz/play.tsx`'s `handleNext` final branch.
10. **Generate uses `sonner` toast for errors, not `window.alert`.** Mobile uses `Alert.alert`. Toast is more web-native and matches the rest of the PWA.

---

## 0a. What just got done (Phase 4)

### Dependencies added
`npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities` — see `package.json`. `@dnd-kit/sortable` is installed but currently unused; Phase 5 / 6 can drop it if no other feature needs it. `@dnd-kit/utilities` is also a transitive dep but installed explicitly so future features can import `CSS` / `transform` helpers without churn.

### Sentence construction component
`src/components/quiz/SentenceBuilder.tsx` — full rewrite for web, none of the mobile DnD code copied:
- **`@dnd-kit/core`** with `PointerSensor` (distance: 5px activation constraint so onClick still fires for tap-to-place) + `KeyboardSensor` (space to pick up, arrow keys to move, space to drop, esc to cancel).
- **Two droppable zones** via `useDroppable`: `sentence-builder-answer-area` (top) and `sentence-builder-word-bank` (bottom). Each renders an `<DropZone>` wrapper that highlights with a ring when hovered.
- **Each tile** is a `<DraggableTile>` (`useDraggable` + `<button>`) — both draggable AND clickable. `onClick` does the tap-to-place / tap-to-return; drag is secondary. Tap-to-place remains the primary interaction (per the original Phase 0 plan).
- **`<DragOverlay>`** renders a non-interactive `<TileButton>` clone during drag so the tile visually follows the cursor smoothly.
- **State** lives in `useQuizStore.placedTileIds` — same store the mobile component used. Each tile id is `tile-N` where N is the index into `scrambled_words[]`. Duplicate words get distinct ids.
- **`onDragEnd`**: if `over.id === ANSWER_AREA_ID` and the tile is not yet placed → `placeTile(id)`. If `over.id === WORD_BANK_ID` and the tile is placed → `removeTile(id)`. Everything else is a no-op (the snap-back animation is implicit because dnd-kit clears the transform on drop).
- **Submit flow**: disabled until `placedTileIds.length === scrambled_words.length`. On submit, calls `useAnswerValidation().validate(...)` synchronously (no LLM — see §0a Phase 3 notes), then sets per-tile feedback (correct = green, incorrect = red, all-green for an LLM-confirmed alternative ordering), shows internal "Correct! / Not quite / Your answer is also valid!" feedback section with the correct sentence reveal when wrong, plus explanation + source citation. Immediately calls `onAnswer(result.isCorrect)` so `play.tsx` can fire its `FeedbackOverlay` for the Next button.
- **Double-submit guard**: `isSubmittingRef` flips synchronously before any state updates so a fast second tap is a no-op (same pattern as mobile M1 fix).

### Routing changes
`src/routes/_authed/quiz/play.tsx`:
- New import: `SentenceBuilder` from `@/components/quiz/SentenceBuilder`.
- New callback: `handleSentenceConstructionAnswer(isCorrect)` — same shape as `handleDialogueAnswer`. Reads `placedTileIds` from `useQuizStore.getState()` on call (not via subscription) and joins them with `scrambled_words` into a `userSentence` string, then `setAnswer / addScore / saveQuestionResult / handleAnswerResult`.
- Replaced the Phase 3 "coming soon" card for `sentence_construction` with a real `<SentenceBuilder>` render, gated on `currentQuestion.scrambled_words && currentQuestion.correct_order` so malformed payloads still fall back to a safe (null) render. The `matching` placeholder is unchanged — that type is permanently skipped per HANDOFF scope.

### Verified end-to-end in Chrome DevTools
Seeded `dangdai-quiz-store` localStorage with a 2-question `sentence_construction` payload, then navigated to `/quiz/play`:
- Q1 ("我很喜歡咖啡。"): tap-to-place all five tiles in correct order → Submit enables → tap Submit → tiles flash green (per-tile feedback) → internal "Correct!" + explanation + citation render → FeedbackOverlay shows "+10 pts" + Next button.
- Q2 ("你是學生嗎？"): seeded fresh state advanced cleanly (no stale placedTileIds bleed-over). Placed tiles in WRONG order ("學生是你嗎？") → Submit → tiles flash red → internal "Not quite" + "Correct sentence: 你是學生嗎？" + explanation render → FeedbackOverlay shows "Next" → CompletionScreen renders with 1/2 correct (50%), "Sentence Construction" progress row at 50%, "You struggled with" entry showing the wrong answer.
- Tap-to-return: tapping a placed tile sends it back to the word bank, answer area returns to "Tap or drag words below to place them here" placeholder.
- Drag-and-drop: the live region announces drop events (`"Draggable item tile-3 was dropped over droppable area sentence-builder-word-bank"`), proving the dnd-kit wiring fires. The chrome-devtools `drag` tool's simulated drag-end coordinates are imprecise so the smoke test didn't successfully verify a cross-zone drag visually — verify by hand in real Chrome if you change the layout. Tap-to-place is the primary interaction, so this is a low-stakes path.
- No console errors or warnings during any of the above.
- `npm run build` is green (main chunk 587 KB, gzipped 170 KB — `@dnd-kit` added ~30 KB minified to the play chunk, splitting still a Phase 6 concern).

### Phase 4 gotchas worth remembering

1. **`PointerSensor` needs an activation distance, not delay.** With `{ distance: 5 }`, a click that doesn't move ≥5px fires `onClick`, so tap-to-place still works. Without the constraint, every press would start a drag and onClick would never fire. Don't use `{ delay }` — it adds a 250ms wait before press feels responsive.
2. **The draggable element is also the click target.** Putting the `onClick` directly on the `<button>` that also has `setNodeRef`/`{...listeners}` is fine *because* of the activation constraint. If you split them (e.g. inner button with onClick, outer div with listeners), the listeners' pointer events will block the click — don't refactor that way without good reason.
3. **`onClick`-only mode for keyboard users requires `aria-description`.** The `KeyboardSensor` wires up space/arrow/escape automatically and dnd-kit announces drag actions via a hidden live region, but the explicit `aria-description` on each tile spells out the tap-vs-drag affordance for screen readers.
4. **Live region announcement labels the drop targets.** dnd-kit reads droppable `id`s verbatim — so `sentence-builder-answer-area` and `sentence-builder-word-bank` become user-facing strings. Don't rename them to short ids without checking how they sound.
5. **`useQuizStore.getState()` inside the play.tsx callback** is intentional — `placedTileIds` is not persisted and isn't part of the callback closure. Reading via `getState()` at call time avoids stale-closure bugs and keeps the callback dep list small.
6. **Internal feedback section duplicates the FeedbackOverlay's explanation/citation.** Same as DialogueCard (Phase 3). The internal section gives per-tile color feedback and the correct sentence reveal that the overlay can't; the overlay owns the Next button. Both render — that's the established pattern, don't try to consolidate without a UX call.
7. **`@dnd-kit/sortable` is installed but unused.** The mobile SentenceBuilder doesn't support reordering within the answer area (placeTile just appends), and neither does this one. If a Phase 5+ feature needs sortable reordering inside a placed-tiles row, the package is already in `node_modules`. Otherwise it's safe to drop with `npm uninstall @dnd-kit/sortable` if you're trimming bundle size in Phase 6.
8. **No `pre`/`post` quiz weakness data is wired yet.** Same as Phase 3 — `CompletionScreen` accepts `preQuizWeaknesses` / `postQuizWeaknesses` props but `play.tsx` doesn't pass them. Carry-over for Phase 5.

---

## 0b. What just got done (Phase 3)

### shadcn components added
`progress`, `dialog`, `alert-dialog`, `radio-group`. The `radio-group` import is queued for future use — Phase 3 itself doesn't render radio inputs (multiple-choice is buttons), but it's available.

### Hooks ported
`useQuizGeneration`, `useQuizPersistence`, `useAnswerValidation`, `useQuestionTimer`, `usePausedQuiz` (+ `useAllPausedQuizzes`), `usePauseQuiz`, `usePremadeExercises`, `usePremadeExercise`, `useExerciseTypeProgress` (+ `useUpdateExerciseTypeProgress`), `useUserStats`. All logic verbatim from mobile, only imports adjusted to `@/` aliases. `useSound` is a **stub** (no-op `playSound`/`preloadSounds`/`unloadSounds`) — Phase 5 will replace with `HTMLAudioElement`. Don't import from `expo-av` anywhere.

### Quiz components (rewritten with shadcn/Tailwind — none direct copies)
`QuizQuestionCard`, `AnswerOptionGrid` (grid for short answers, list for >15 chars), `QuizProgress` (uses shadcn `Progress`), `PointsCounter` (raf count-up, no Reanimated), `FeedbackOverlay` (correct/incorrect colors via Tailwind, not `<Theme>`), `FillInBlankSentence`, `WordBankSelector` (horizontal scroll via `overflow-x-auto`), `DialogueCard` (chat bubbles via Tailwind, `useAnswerValidation` for hybrid validation), `ReadingPassageCard`, `TextInputAnswer`, `ExerciseTypeProgressList`, `CompletionScreen`, `ExitConfirmationModal` (shadcn `Dialog`), `PausedQuizBanner`. **Skipped per HANDOFF scope**: `MatchingExercise`, `SentenceBuilder` (Phase 4 will do SentenceBuilder with `@dnd-kit`).

### Quiz routes added
| Route | File |
|---|---|
| `/quiz/$chapterId` | `_authed/quiz/$chapterId.tsx` — exercise type selection landing (8 cards: Mixed + 7 types), shows `PausedQuizBanner` for any paused quiz, plus quick-links to `/chapter/$chapterId/{vocabulary,grammar,dialogues}` for content browsing |
| `/quiz/loading` | `_authed/quiz/loading.tsx` — `useQuizGeneration` mutation, tip rotation, simulated progress bar, retry/back error states. `validateSearch` reads `chapterId`, `bookId`, `exerciseType`, `resumePaused` |
| `/quiz/ai-loading` | `_authed/quiz/ai-loading.tsx` — alternative `api.generateExercise` flow with `AbortController` cancel-on-unmount, adapts via `premadeExerciseAdapter` |
| `/quiz/play` | `_authed/quiz/play.tsx` — main quiz playback. Renders the active question by `exercise_type` (vocabulary/grammar MCQ, fill-in-blank, dialogue, reading comprehension, text input). For `matching` and `sentence_construction`, shows a "coming soon" card directing the user back. Hooks up `FeedbackOverlay` + Next button, `ExitConfirmationModal` for pause/cancel, `useQuizPersistence` writes |
| `/quiz/premade` | `_authed/quiz/premade.tsx` — premade workbook exercises via `usePremadeExercise` + `adaptPremadeContent`. Mirrors play.tsx but skips AI-quiz extras. `validateSearch` reads `exerciseId`, `chapterId`, `bookId` |

### Routing changes outside `quiz/`
- `_authed/chapter/$bookId.tsx` — `handleChapterClick` now navigates to `/quiz/$chapterId` (the new exercise type selection screen), not directly to `/chapter/$chapterId/vocabulary`. The vocabulary/grammar/dialogues content screens are still reachable from the quick-links on the chapter detail page.

### Verified end-to-end in Chrome DevTools
- Sign in → `/books` → Book 1 → Chapter 1 → `/quiz/101` renders all 8 exercise cards + content quick-links
- Clicking "Vocabulary Quiz" → `/quiz/loading?...` renders loading state, then transitions to error state when backend is unreachable (expected — no FastAPI running locally)
- Seeded `dangdai-quiz-store` localStorage manually, navigated to `/quiz/play`: full quiz playback works
  - Question 1: correct answer → "Correct!" feedback + +10 pts + explanation + citation, Next advances
  - Question 2: incorrect answer → "Not quite" feedback + correct answer reveal, Next completes quiz
  - CompletionScreen renders title, points counter, stats (1/2 correct, 50%, 0 min), per-exercise-type progress list (Vocabulary at 50%, others "New"), "You struggled with" section, Continue button
  - Leave button opens `ExitConfirmationModal` with Pause / Cancel / Stay
- No console errors or React warnings on the seeded play flow
- `npm run build` is green (main chunk 587 KB, gzipped 170 KB — Phase 6 can split later)

### Phase 3 gotchas worth remembering

1. **`useSound` is a no-op stub.** Phase 5 must replace `src/hooks/useSound.ts` with an `HTMLAudioElement` impl. Until then, correct/incorrect feedback is silent. Don't be confused — the FeedbackOverlay still renders.
2. **Search params, not path params, for quiz navigation.** `/quiz/loading`, `/quiz/ai-loading`, `/quiz/premade` use `validateSearch`. Path params (`chapterId`) live only on `/quiz/$chapterId`. When linking from `_authed/quiz/$chapterId.tsx` → `/quiz/loading`, pass values via `search:` not `params:`.
3. **`window.history.back()` is the back-nav primitive.** Mobile uses `router.back()` from Expo Router. PWA uses `window.history.back()` directly (TanStack Router doesn't expose a router-level back). Pause/cancel/leave flows all use it. Works fine in Chrome but be aware it may behave differently in deep-link scenarios.
4. **`matching` and `sentence_construction` show a "coming soon" card in play.tsx.** Phase 4 fills in sentence construction with `@dnd-kit`. Matching is permanently skipped per HANDOFF scope. The two types are still in the `ExerciseType` union and the exercise type cards still show them — clicking through generates a quiz that the play screen handles with the placeholder card.
5. **No `pre`/`post` quiz weakness data is wired yet.** `CompletionScreen` accepts `preQuizWeaknesses`/`postQuizWeaknesses` props (per mobile) but `play.tsx` doesn't pass them, so the "Focus Areas Update" section never renders. Wire this in Phase 5 if needed alongside `useUserStats`.
6. **`updateExerciseTypeProgress` fires on `CompletionScreen` mount.** Verified working via the test localStorage flow — the Vocabulary row went from "New" to 50% after one quiz. The mutation uses `useAuth` for the user id, so it depends on the authed session being present. If a user lands directly on `/quiz/play` without auth (unlikely — `_authed` guard prevents it), the mutation silently skips.
7. **`ChapterListItem` clicks now land on `/quiz/$chapterId`, not vocabulary.** Phase 2 docs said vocabulary; that changed in Phase 3 to match the mobile chapter-detail flow. The new landing page has quick-links to vocabulary/grammar/dialogues at the top.

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
`button`, `input`, `label`, `card`, `sonner` (Phase 1), `skeleton`, `scroll-area`, `separator`, `avatar`, `tabs` (Phase 2), `progress`, `dialog`, `alert-dialog`, `radio-group` (Phase 3). No shadcn additions in Phase 4. Phase 5 added `switch`.

### Non-shadcn deps added in Phase 4
`@dnd-kit/core`, `@dnd-kit/sortable` (unused — see Phase 4 gotcha 7), `@dnd-kit/utilities`. No new deps in Phase 5.

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
| `src/components/quiz/*` | ✅ Phase 3 (QuizQuestionCard, AnswerOptionGrid, QuizProgress, PointsCounter, FeedbackOverlay, FillInBlankSentence, WordBankSelector, DialogueCard, ReadingPassageCard, TextInputAnswer, ExerciseTypeProgressList, CompletionScreen, ExitConfirmationModal, PausedQuizBanner) |
| `src/hooks/{useQuizGeneration,useQuizPersistence,useAnswerValidation,useQuestionTimer,usePausedQuiz,usePauseQuiz,usePremadeExercises,usePremadeExercise,useExerciseTypeProgress,useUserStats}.ts` | ✅ Phase 3 |
| `src/hooks/useSound.ts` | ✅ Phase 5 (real `HTMLAudioElement` impl) |
| `src/routes/_authed/quiz/{$chapterId,loading,ai-loading,play,premade}.tsx` | ✅ Phase 3 (play.tsx extended with `SentenceBuilder` integration in Phase 4) |
| `src/components/quiz/SentenceBuilder.tsx` | ✅ Phase 4 (`@dnd-kit/core` + tap-to-place + drag-and-drop) |
| `src/routes/_authed/_tabs/{generate,chat,settings}.tsx` | ✅ Phase 5 (Generate, Chat, full Settings — settings replaces Phase 1 stub) |
| `src/routes/_authed/_tabs.tsx` | ✅ Phase 5 (5 tabs now: Home / Books / Generate / Chat / Settings) |
| `src/routes/__root.tsx` | ✅ Phase 5 (added `useThemeSync` hook to apply `.dark` on `<html>`) |
| `src/stores/useSettingsStore.ts` | ✅ Phase 5 (added `persist` middleware → `localStorage[dangdai-settings]`) |
| `public/sounds/{correct,incorrect,celebration}.mp3` | ✅ Phase 5 (copied verbatim from `dangdai-mobile/assets/sounds/`) |

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

## 5. Drag and drop (Phase 4 — done; reference only)

`sentence_construction` is the only DnD-using exercise in the active set, and it's now wired (see §0 Phase 4). **Skip `matching` and `mixed` entirely** — `matching` is disabled in mobile due to a Reanimated bug; `mixed` is hidden for now. Keep them in the `ExerciseType` union but never render UI for them.

If you add another DnD feature later, follow the SentenceBuilder pattern: `PointerSensor` with a 5px activation distance + `KeyboardSensor`, `<DragOverlay>` for visual feedback, and tap-to-place wired on the same button that's the draggable so simple interactions don't require dragging.

---

## 6. Remaining phases at a glance

Phase 5 is done; Phase 6 is next.

### Phase 6 — Polish
- **Dark-mode visual pass.** Phase 5 wired theme application (`.dark` class + `matchMedia` listener for system) and the Settings selector. Now walk every screen in Dark and fix any contrast / token-mismatch issues. Most components use semantic tokens (`bg-card`, `text-muted-foreground`, `border`) so they should adapt automatically — watch for places that hardcoded `text-blue-500` etc. (the book cover colors in `BookCard.tsx` are intentional, those stay).
- **PWA icons.** `pwa-192x192.png`, `pwa-512x512.png`, `pwa-maskable-512x512.png`, `apple-touch-icon.png`, `favicon.svg`. Currently `public/` has only `favicon.svg`, `logo.png`, `maixin-chinese-logo.svg`, and the new `sounds/` dir. Generate the icons from `logo.png` or the SVG.
- **Lighthouse audit.** Mobile PWA category. Should be installable + green performance after icons.
- **Apple Sign-in** only if user confirms scope. Skip otherwise.
- **Optional:** drop `@dnd-kit/sortable` if nothing else uses it (Phase 4 gotcha 7); split the play chunk if Lighthouse flags it.

### Carry-overs (still unwired, intentionally)
- `pre`/`post` quiz weakness data in `CompletionScreen` — Phase 5 left this unwired because mobile doesn't wire it either. See Phase 5 gotcha 9 for the wiring sketch if it ever becomes needed.

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
