# Dangdai App

A cross-platform mobile application for learning Chinese through interactive quizzes, powered by AI-generated content.

## Overview

Dangdai App helps users learn Chinese by providing:

- **Vocabulary & Grammar Quizzes**: AI-generated questions based on book chapters
- **Progress Tracking**: Monitor your learning journey with points, streaks, and completion percentages
- **Gamification**: Earn rewards and maintain learning streaks
- **Multi-language Support**: UI available in English, French, Japanese, and Korean

## Architecture

This project consists of two main components:

1. **Mobile App** (`dangdai-mobile/`): React Native + Expo cross-platform application
2. **AI Backend** (`dangdai-api/`): Python service for quiz generation using RAG and LLMs

### Tech Stack

**Mobile App:**
- React Native + Expo (managed workflow)
- Tamagui for UI components and theming
- Expo Router for file-based navigation
- TanStack Query for server state management
- Zustand for local state management
- Supabase for authentication and data storage

**Backend:**
- Python 3.11+ with FastAPI
- LangGraph for AI quiz generation workflows
- LangChain for LLM integration
- Supabase pgvector for RAG retrieval
- Azure Container Apps for hosting

## Getting Started

### Prerequisites

- Node.js 18+ and Yarn
- Python 3.11+
- Supabase account
- LLM API key (OpenAI, Anthropic, etc.)
- Azure account (for backend deployment)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd dangdai-app
```

### 2. Set Up the Mobile App

```bash
# Initialize the mobile app using Tamagui Expo Router template
yarn create tamagui@latest --template expo-router

# Move into the mobile directory
cd dangdai-mobile

# Install dependencies
yarn install

# Create environment file
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_API_URL=http://localhost:8000  # For local development
```

### 3. Set Up the Python Backend

```bash
# Install LangGraph CLI
pip install -U "langgraph-cli[inmem]"

# Create new LangGraph project
langgraph new --template=new-langgraph-project-python dangdai-api

# Move into the backend directory
cd dangdai-api

# Install dependencies
pip install -e .

# Create environment file
cp .env.example .env
```

Edit `.env` with your configuration:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
LLM_API_KEY=your-llm-api-key
LANGSMITH_API_KEY=your-langsmith-key  # Optional
```

### 4. Set Up Supabase Database

1. Create a new Supabase project
2. Run migrations to create the necessary tables:
   - `users` - User profiles and cached aggregates
   - `quiz_attempts` - Individual quiz records
   - `chapter_progress` - Per-chapter completion tracking
   - `daily_activity` - Streak tracking

3. Enable pgvector extension for RAG functionality
4. Upload Dangdai content embeddings to the vector store

### 5. Run the Development Servers

**Terminal 1 - Mobile App:**

```bash
cd dangdai-mobile
yarn start
```

This will start the Expo development server. You can:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan the QR code with Expo Go app on your phone

**Terminal 2 - Python Backend:**

```bash
cd dangdai-api
uvicorn src.api.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

## Project Structure

```
dangdai-app/
├── dangdai-mobile/          # Mobile application
│   ├── app/                 # Expo Router screens
│   │   ├── (auth)/         # Authentication screens
│   │   ├── (tabs)/         # Main app tabs
│   │   ├── quiz/           # Quiz screens
│   │   └── chapter/        # Chapter selection
│   ├── components/         # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   ├── stores/             # Zustand state stores
│   ├── lib/                # Utilities and API clients
│   └── types/              # TypeScript type definitions
│
├── dangdai-api/            # Python backend
│   ├── src/
│   │   ├── agent/          # LangGraph quiz generation
│   │   ├── api/            # FastAPI routes
│   │   ├── services/       # Business logic
│   │   └── utils/          # Helper functions
│   └── tests/              # Backend tests
│
└── terraform/              # Infrastructure as Code
    └── *.tf                # Azure deployment config
```

## Development Workflow

### Mobile App Development

```bash
# Start development server
yarn start

# Run type checking
yarn tsc

# Run linting
yarn lint

# Run tests
yarn test
```

### Backend Development

```bash
# Start development server with auto-reload
uvicorn src.api.main:app --reload

# Run tests
pytest

# Type checking
mypy src/

# Linting
ruff check src/
```

## Key Features

### Authentication
- Email/password sign-up and login
- Apple Sign-In integration
- Powered by Supabase Auth

### Quiz Generation
1. User selects a chapter
2. Mobile app sends request to Python backend
3. Backend uses RAG to retrieve relevant content from pgvector
4. LLM generates quiz questions based on chapter content
5. Questions are returned to the mobile app
6. User completes quiz and results are saved to Supabase

### Progress Tracking
- Individual quiz scores stored in `quiz_attempts`
- Chapter completion percentage updated in `chapter_progress`
- User aggregates (points, streaks) cached on `users` table
- Real-time synchronization across devices

### Gamification
- Points awarded for quiz completion
- Daily streak tracking
- Activity calendar (GitHub-style)
- Rewards and achievements

## Deployment

### Mobile App

Using Expo Application Services (EAS):

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to app stores
eas submit
```

### Python Backend

Using Terraform for Azure Container Apps:

```bash
cd terraform

# Initialize Terraform
terraform init

# Preview changes
terraform plan

# Deploy
terraform apply
```

The backend will be deployed with:
- Auto-scaling (0-10 instances)
- Scale-to-zero for cost optimization
- Environment variables configured from Terraform

## Environment Variables

### Mobile App (.env.local)

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `EXPO_PUBLIC_API_URL` | Python backend URL |

### Python Backend (.env)

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key |
| `LLM_API_KEY` | API key for LLM provider |
| `LANGSMITH_API_KEY` | Optional: LangSmith observability |

## Testing

### Mobile App

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test --watch

# Run tests with coverage
yarn test --coverage
```

### Python Backend

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src

# Run specific test file
pytest tests/test_quiz_generation.py
```

## Architecture Decisions

For detailed architectural decisions, patterns, and implementation guidelines, see:

- **Architecture Document**: `_bmad-output/planning-artifacts/architecture.md`
- **Product Requirements**: `_bmad-output/planning-artifacts/prd.md`
- **UX Specification**: `_bmad-output/planning-artifacts/ux-design-specification.md`

### Key Architectural Patterns

**Naming Conventions:**
- Database: `snake_case` (tables, columns)
- TypeScript: `PascalCase` for components, `camelCase` for functions
- API: RESTful endpoints with `snake_case` JSON

**State Management:**
- Server state: TanStack Query (caching, sync, optimistic updates)
- Local state: Zustand (quiz state, UI preferences)

**Error Handling:**
- Automatic retry (once) for API calls
- User-friendly error messages with retry buttons
- Toast notifications for recoverable errors

## Contributing

1. Follow the established naming conventions
2. Co-locate tests with source files (`.test.tsx` suffix)
3. Use TypeScript strict mode
4. Follow the architectural patterns documented
5. Ensure all tests pass before committing

## Performance Targets

- Quiz generation: < 5 seconds
- App launch: < 3 seconds
- Navigation: < 500ms
- Concurrent users: 100 (MVP target)

## License

[Your License Here]

## Support

For questions or issues, please refer to the architecture documentation or contact the development team.
