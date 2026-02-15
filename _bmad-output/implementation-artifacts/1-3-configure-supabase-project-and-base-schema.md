# Story 1.3: Configure Supabase Project and Base Schema

Status: ready-for-dev

## Story

As a developer,
I want to configure the Supabase project with the base database schema,
So that authentication and data storage foundations are ready.

## Acceptance Criteria

1. **Given** a Supabase project exists
   **When** I apply the initial migration
   **Then** the `users` table is created with columns: id, email, display_name, total_points, current_streak, streak_updated_at, created_at, updated_at

2. **Given** the migration is applied
   **When** I check Supabase Auth settings
   **Then** Supabase Auth is configured for email and Apple Sign-In

3. **Given** the users table exists
   **When** I check Row Level Security
   **Then** RLS is enabled on the users table with appropriate policies

4. **Given** the Supabase project is configured
   **When** the mobile app attempts to connect
   **Then** the connection succeeds using environment variables

## Tasks / Subtasks

- [ ] Task 1: Verify/Create Supabase project (AC: #1)
  - [ ] 1.1 Log into Supabase dashboard or use CLI
  - [ ] 1.2 Verify project exists or create new project
  - [ ] 1.3 Note project URL and anon key for later use
  - [ ] 1.4 Note service role key for Python backend (KEEP SECRET)

- [ ] Task 2: Create users table migration (AC: #1)
  - [ ] 2.1 Create migration file for users table
  - [ ] 2.2 Include all required columns with proper types
  - [ ] 2.3 Set up trigger for auto-creating user on auth.users insert
  - [ ] 2.4 Apply migration via Supabase dashboard or CLI

- [ ] Task 3: Configure Supabase Auth (AC: #2)
  - [ ] 3.1 Enable Email authentication provider
  - [ ] 3.2 Configure email templates (optional for MVP)
  - [ ] 3.3 Enable Apple Sign-In provider
  - [ ] 3.4 Configure Apple Sign-In credentials (requires Apple Developer account)

- [ ] Task 4: Enable Row Level Security (AC: #3)
  - [ ] 4.1 Enable RLS on users table
  - [ ] 4.2 Create policy: users can read their own data
  - [ ] 4.3 Create policy: users can update their own data
  - [ ] 4.4 Test RLS policies work correctly

- [ ] Task 5: Document connection details (AC: #4)
  - [ ] 5.1 Update mobile app `.env.example` with Supabase vars
  - [ ] 5.2 Update Python backend `.env.example` with Supabase vars
  - [ ] 5.3 Verify connection works from both apps

## Dev Notes

### Critical Architecture Requirements

**Database Schema from Architecture:**

The `users` table is the foundation for all user data. It includes cached aggregates for fast dashboard loads.

### Users Table Migration

Create this migration in Supabase SQL Editor or via CLI:

```sql
-- Migration: create_users_table
-- Description: Create users table with profile and cached aggregates

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    total_points INTEGER DEFAULT 0 NOT NULL,
    current_streak INTEGER DEFAULT 0 NOT NULL,
    streak_updated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own data
CREATE POLICY "Users can view own data"
    ON public.users
    FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data"
    ON public.users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Users can insert their own data (for initial profile creation)
CREATE POLICY "Users can insert own data"
    ON public.users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to users table
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create function to auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, display_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create user profile when auth.users row is created
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
```

### Database Naming Conventions (MUST FOLLOW)

From Architecture specification:
- **Tables:** snake_case, plural (`users`, `quiz_attempts`, `chapter_progress`)
- **Columns:** snake_case (`user_id`, `created_at`, `total_points`)
- **Foreign keys:** `{table}_id` (`user_id`, `chapter_id`)
- **Indexes:** `idx_{table}_{column}` (`idx_users_email`)
- **Constraints:** `{table}_{type}_{column}` (`users_pkey`)

### Column Specifications

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, FK to auth.users | User's unique ID from Supabase Auth |
| email | TEXT | NOT NULL | User's email address |
| display_name | TEXT | NULLABLE | User's display name |
| total_points | INTEGER | DEFAULT 0, NOT NULL | Cached total points earned |
| current_streak | INTEGER | DEFAULT 0, NOT NULL | Cached current streak days |
| streak_updated_at | TIMESTAMPTZ | NULLABLE | When streak was last calculated |
| created_at | TIMESTAMPTZ | DEFAULT NOW(), NOT NULL | Record creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW(), NOT NULL | Last update timestamp |

### Supabase Auth Configuration

**Email Provider:**
1. Go to Authentication > Providers
2. Email should be enabled by default
3. Configure settings:
   - Enable email confirmations (optional for MVP, can disable)
   - Set site URL for redirects

**Apple Sign-In Provider:**
1. Go to Authentication > Providers > Apple
2. Enable Apple provider
3. Configure:
   - Service ID (from Apple Developer)
   - Team ID
   - Key ID
   - Private Key (p8 file contents)

**Note:** Apple Sign-In requires Apple Developer Program membership ($99/year).

### Row Level Security (RLS) Policies

The migration includes these RLS policies:

| Policy | Operation | Rule |
|--------|-----------|------|
| Users can view own data | SELECT | `auth.uid() = id` |
| Users can update own data | UPDATE | `auth.uid() = id` |
| Users can insert own data | INSERT | `auth.uid() = id` |

**Testing RLS:**
```sql
-- Test as authenticated user (replace with actual user ID)
SET request.jwt.claims = '{"sub": "user-uuid-here"}';

-- Should return user's own data
SELECT * FROM public.users;

-- Should fail for other users' data
SELECT * FROM public.users WHERE id != auth.uid();
```

### Environment Variables

**Mobile App (.env.local):**
```bash
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

**Python Backend (.env):**
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...  # Service role key for admin access
```

**SECURITY WARNING:**
- NEVER commit `.env` files with real credentials
- NEVER expose service role key to client apps
- Mobile app uses anon key only
- Python backend uses service role key for admin operations

### Supabase CLI Alternative

If using Supabase CLI instead of dashboard:

```bash
# Initialize Supabase in project
supabase init

# Link to existing project
supabase link --project-ref your-project-ref

# Create migration
supabase migration new create_users_table

# Apply migrations
supabase db push

# Generate TypeScript types (for mobile app)
supabase gen types typescript --project-id your-project-ref > types/supabase.ts
```

### Anti-Patterns to Avoid

- **DO NOT** store passwords - Supabase Auth handles this
- **DO NOT** use `auth.users` directly for app data - use `public.users`
- **DO NOT** disable RLS in production
- **DO NOT** expose service role key to client applications
- **DO NOT** store sensitive data without encryption consideration
- **DO NOT** use camelCase for database columns

### Verification Steps

```sql
-- Verify table exists
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'users';

-- Verify columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users';

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';

-- Verify policies exist
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users';

-- Verify trigger exists
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users';
```

### Dependencies from Epic 1

- **Depends on:** None (can be done in parallel with Stories 1-1 and 1-2)
- **Blocks:** Story 1-4 (mobile app needs Supabase to configure client)

### Future Tables (Not in This Story)

These tables will be created in later epics:
- `quiz_attempts` - Epic 6, Story 6.1
- `chapter_progress` - Epic 6, Story 6.1
- `daily_activity` - Epic 7, Story 7.2

### References

- [Source: architecture.md#Data-Architecture] - Schema approach
- [Source: architecture.md#Database-Naming-Conventions] - Naming patterns
- [Source: epics.md#Story-1.3] - Story requirements
- [Source: epics.md#Additional-Requirements] - Infrastructure requirements

### External Documentation

- Supabase Auth: https://supabase.com/docs/guides/auth
- Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security
- Apple Sign-In Setup: https://supabase.com/docs/guides/auth/social-login/auth-apple

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
