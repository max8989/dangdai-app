# CGC Report

_Generated: 2026-05-15 22:42 UTC_


## God Nodes — Highest Fan-In
_These nodes are called from many places. High fan-in increases risk: a change here affects every caller._

| Kind | Name | File | In-degree |
| --- | --- | --- | --- |
| Function | useAuth | providers/AuthProvider.tsx | 14 |
| Function | getState | quiz/play.test.tsx | 13 |
| Function | styled | quiz/CompletionScreen.test.tsx | 9 |
| Function | useQuizStore | quiz/play.test.tsx | 7 |
| Class | QuizGenerationError | types/quiz.ts | 5 |
| Function | usePauseQuiz | hooks/usePauseQuiz.ts | 5 |
| Function | useAllPausedQuizzes | hooks/usePausedQuiz.ts | 5 |
| Function | useQuizPersistence | hooks/useQuizPersistence.ts | 4 |
| Function | adaptPremadeContent | lib/premadeExerciseAdapter.ts | 4 |
| Function | playSound | hooks/useSound.ts | 3 |
| Function | useUpdateExerciseTypeProgress | hooks/useExerciseTypeProgress.ts | 3 |
| Function | unloadSounds | hooks/useSound.ts | 3 |
| Function | useExerciseTypeProgress | hooks/useExerciseTypeProgress.ts | 3 |
| Function | parseCorrectAnswers | lib/validateFillInBlank.ts | 3 |
| Function | uid | factories/quiz-factory.ts | 3 |


## Most Complex Functions
_Cyclomatic complexity > 10 is a refactoring candidate._

| Function | File | Cyclomatic Complexity |
| --- | --- | --- |
| QuizPlayScreen | quiz/play.tsx | 170 |
| PremadeExerciseScreen | quiz/premade.tsx | 105 |
| AuthProvider | providers/AuthProvider.tsx | 50 |
| MatchingExercise | quiz/MatchingExercise.tsx | 43 |
| SignupForm | auth/SignupForm.tsx | 39 |
| ResetPasswordForm | auth/ResetPasswordForm.tsx | 37 |
| QuizLoadingScreen | quiz/loading.tsx | 36 |
| transformMatchingData | quiz/play.tsx | 34 |
| GenerateScreen | (tabs)/generate.tsx | 33 |
| SentenceBuilder | quiz/SentenceBuilder.tsx | 31 |
| DialogueCard | quiz/DialogueCard.tsx | 29 |
| LoginForm | auth/LoginForm.tsx | 27 |
| ChatScreen | (tabs)/chat.tsx | 24 |
| ReadingPassageCard | quiz/ReadingPassageCard.tsx | 21 |
| AILoadingScreen | quiz/ai-loading.tsx | 21 |


## Cross-Module Connections
_Calls that cross package boundaries — review for unexpected coupling._

| Caller | Caller File | Callee | Callee File | Confidence |
| --- | --- | --- | --- | --- |
| QuizResumeDialog | app/_layout.tsx | useQuizStore | quiz/play.test.tsx | AMBIGUOUS |
| quiz-generation.test.ts | tests/quiz-generation.test.ts | stub | fixtures/network-fixture.ts | AMBIGUOUS |
| quiz-play.test.ts | tests/quiz-play.test.ts | createQuizQuestion | factories/quiz-factory.ts | EXTRACTED |
| quiz-play.test.ts | tests/quiz-play.test.ts | createQuizQuestion | factories/quiz-factory.ts | EXTRACTED |
| quiz-play.test.ts | tests/quiz-play.test.ts | createQuizQuestion | factories/quiz-factory.ts | EXTRACTED |
| quiz-play.test.ts | tests/quiz-play.test.ts | createQuizResult | factories/quiz-factory.ts | EXTRACTED |
| quiz-play.test.ts | tests/quiz-play.test.ts | createQuizResult | factories/quiz-factory.ts | EXTRACTED |
| resetStore | hooks/useQuizPersistence.test.ts | getState | quiz/play.test.tsx | EXTRACTED |
| getStore | hooks/useQuizPersistence.test.ts | getState | quiz/play.test.tsx | EXTRACTED |
| useQuizPersistence.ts | hooks/useQuizPersistence.ts | getState | quiz/play.test.tsx | EXTRACTED |
| useQuizPersistence.ts | hooks/useQuizPersistence.ts | getState | quiz/play.test.tsx | EXTRACTED |
| useQuizStore.test.ts | stores/useQuizStore.test.ts | getState | quiz/play.test.tsx | EXTRACTED |
| useQuizStore.test.ts | stores/useQuizStore.test.ts | getState | quiz/play.test.tsx | EXTRACTED |
| useQuizStore.test.ts | stores/useQuizStore.test.ts | getState | quiz/play.test.tsx | EXTRACTED |
| useQuizStore.test.ts | stores/useQuizStore.test.ts | getState | quiz/play.test.tsx | EXTRACTED |
| useQuizStore.test.ts | stores/useQuizStore.test.ts | getState | quiz/play.test.tsx | EXTRACTED |
| useQuizStore.test.ts | stores/useQuizStore.test.ts | getState | quiz/play.test.tsx | EXTRACTED |
| useQuizStore.test.ts | stores/useQuizStore.test.ts | getState | quiz/play.test.tsx | EXTRACTED |
| useQuizStore.test.ts | stores/useQuizStore.test.ts | getState | quiz/play.test.tsx | EXTRACTED |
| useQuizStore.test.ts | stores/useQuizStore.test.ts | getState | quiz/play.test.tsx | EXTRACTED |


## Potential Dead Code
_Functions with zero callers (not guaranteed dead — may be entry points or called via reflection)._

| Function | File |
| --- | --- |
| AuthLayout | (auth)/_layout.tsx |
| ForgotPasswordScreen | (auth)/forgot-password.tsx |
| LoginScreen | (auth)/login.tsx |
| ResetPasswordScreen | (auth)/reset-password.tsx |
| SignupScreen | (auth)/signup.tsx |
| TabLayout | (tabs)/_layout.tsx |
| BooksScreen | (tabs)/books.tsx |
| ChatScreen | (tabs)/chat.tsx |
| MessageBubble | (tabs)/chat.tsx |
| BookChapterPicker | (tabs)/generate.tsx |
| GenerateScreen | (tabs)/generate.tsx |
| HomeScreen | (tabs)/index.tsx |
| StatCard | (tabs)/index.tsx |
| SettingsScreen | (tabs)/settings.tsx |
| ThemeOption | (tabs)/settings.tsx |
| handleSignOut | (tabs)/settings.tsx |
| Wrapper | (tabs)/theme-demo.test.tsx |
| AnimatePresenceDemo | (tabs)/theme-demo.tsx |
| AnimatedBox | (tabs)/theme-demo.tsx |
| PrimaryButtonDemo | (tabs)/theme-demo.tsx |


## Suggested Cypher Queries
_Copy these into `execute_cypher_query` to explore further._

### Callers of a specific function
```cypher
MATCH (caller)-[:CALLS]->(fn:Function {name: 'yourFunctionName'})
RETURN caller.name, caller.path LIMIT 20
```

### Class hierarchy for a specific class
```cypher
MATCH path = (c:Class {name: 'YourClass'})-[:INHERITS*]->(parent)
RETURN [n IN nodes(path) | n.name] AS hierarchy
```

### Most-injected Spring beans
```cypher
MATCH ()-[:INJECTS]->(bean:Class)
RETURN bean.name, count(*) AS injection_count
ORDER BY injection_count DESC LIMIT 10
```

### All external library dependencies
```cypher
MATCH (m:MavenModule)-[:USES_LIBRARY]->(lib:ExternalLibrary)
RETURN m.artifact_id, lib.group_id, lib.artifact_id, lib.version
ORDER BY lib.artifact_id
```

### CALLS edges with low confidence (potential mis-resolutions)
```cypher
MATCH (a)-[c:CALLS]->(b)
WHERE c.confidence_label = 'AMBIGUOUS'
RETURN a.name, b.name, c.resolution_tier, a.path LIMIT 20
```
