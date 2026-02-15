# Story 1.7: Configure CI/CD with GitHub Actions

Status: ready-for-dev

## Story

As a developer,
I want to set up GitHub Actions workflows for CI/CD,
So that code quality is validated and deployments are automated.

## Acceptance Criteria

1. **Given** the repository contains mobile app and Python backend
   **When** I push code to the repository
   **Then** CI workflow runs lint, type-check, and tests for both projects

2. **Given** CI workflow is configured
   **When** I push to the main branch
   **Then** Python backend deployment workflow triggers

3. **Given** mobile app CI is configured
   **When** I trigger a build
   **Then** EAS Build workflow is configured for mobile app builds

4. **Given** all workflows are configured
   **When** I make a clean commit
   **Then** all workflows pass successfully

## Tasks / Subtasks

- [ ] Task 1: Create GitHub Actions directory structure (AC: #1)
  - [ ] 1.1 Create `.github/workflows/` directory in project root
  - [ ] 1.2 Create CI workflow file for mobile app
  - [ ] 1.3 Create CI workflow file for Python backend
  - [ ] 1.4 Create deployment workflow for Python backend

- [ ] Task 2: Configure mobile app CI workflow (AC: #1)
  - [ ] 2.1 Set up Node.js environment
  - [ ] 2.2 Install dependencies with yarn
  - [ ] 2.3 Run lint check (ESLint)
  - [ ] 2.4 Run type check (TypeScript)
  - [ ] 2.5 Run tests (if any exist)

- [ ] Task 3: Configure Python backend CI workflow (AC: #1)
  - [ ] 3.1 Set up Python 3.11 environment
  - [ ] 3.2 Install dependencies
  - [ ] 3.3 Run lint check (ruff or flake8)
  - [ ] 3.4 Run type check (mypy)
  - [ ] 3.5 Run tests (pytest)

- [ ] Task 4: Configure Python deployment workflow (AC: #2)
  - [ ] 4.1 Trigger on push to main branch
  - [ ] 4.2 Build Docker image
  - [ ] 4.3 Push to container registry (GHCR or ACR)
  - [ ] 4.4 Deploy to Azure Container Apps

- [ ] Task 5: Configure EAS Build workflow (AC: #3)
  - [ ] 5.1 Create EAS build workflow file
  - [ ] 5.2 Configure for preview builds
  - [ ] 5.3 Configure for production builds
  - [ ] 5.4 Set up required secrets (EXPO_TOKEN)

- [ ] Task 6: Test all workflows (AC: #4)
  - [ ] 6.1 Commit and push changes
  - [ ] 6.2 Verify CI workflows pass
  - [ ] 6.3 Verify deployment workflow triggers on main
  - [ ] 6.4 Fix any failing checks

## Dev Notes

### Critical Architecture Requirements

**From Architecture - CI/CD:**
- GitHub Actions for all workflows
- CI: lint, type-check, tests for both projects
- Python backend: auto-deploy on main branch
- Mobile app: EAS Build for app distribution

### Workflow Directory Structure

```
.github/
└── workflows/
    ├── ci-mobile.yml           # Mobile app CI
    ├── ci-backend.yml          # Python backend CI
    ├── deploy-backend.yml      # Python backend deployment
    └── eas-build.yml           # Mobile app EAS builds
```

### Mobile App CI Workflow

**Create `.github/workflows/ci-mobile.yml`:**

```yaml
name: Mobile App CI

on:
  push:
    branches: [main, develop]
    paths:
      - 'dangdai-app/**'
      - '.github/workflows/ci-mobile.yml'
  pull_request:
    branches: [main]
    paths:
      - 'dangdai-app/**'

defaults:
  run:
    working-directory: dangdai-app

jobs:
  lint-and-test:
    name: Lint, Type Check, Test
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'yarn'
          cache-dependency-path: dangdai-app/yarn.lock

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: Run ESLint
        run: yarn lint

      - name: Run TypeScript check
        run: yarn tsc --noEmit

      - name: Run tests
        run: yarn test --passWithNoTests
```

### Python Backend CI Workflow

**Create `.github/workflows/ci-backend.yml`:**

```yaml
name: Python Backend CI

on:
  push:
    branches: [main, develop]
    paths:
      - 'dangdai-api/**'
      - '.github/workflows/ci-backend.yml'
  pull_request:
    branches: [main]
    paths:
      - 'dangdai-api/**'

defaults:
  run:
    working-directory: dangdai-api

jobs:
  lint-and-test:
    name: Lint, Type Check, Test
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -e ".[dev]"

      - name: Run Ruff linter
        run: ruff check src/ tests/

      - name: Run Ruff formatter check
        run: ruff format --check src/ tests/

      - name: Run mypy type check
        run: mypy src/

      - name: Run pytest
        run: pytest tests/ -v --tb=short
```

### Python Backend Deployment Workflow

**Create `.github/workflows/deploy-backend.yml`:**

```yaml
name: Deploy Python Backend

on:
  push:
    branches: [main]
    paths:
      - 'dangdai-api/**'
      - '.github/workflows/deploy-backend.yml'
  workflow_dispatch:  # Allow manual trigger

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}/dangdai-api

jobs:
  build-and-deploy:
    name: Build and Deploy
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=
            type=raw,value=latest,enable=${{ github.ref == 'refs/heads/main' }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: dangdai-api
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}

      - name: Deploy to Azure Container Apps
        uses: azure/container-apps-deploy-action@v1
        with:
          resourceGroup: ${{ secrets.AZURE_RESOURCE_GROUP }}
          containerAppName: dangdai-api
          imageToDeploy: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
        env:
          AZURE_CREDENTIALS: ${{ secrets.AZURE_CREDENTIALS }}
```

### EAS Build Workflow

**Create `.github/workflows/eas-build.yml`:**

```yaml
name: EAS Build

on:
  workflow_dispatch:
    inputs:
      platform:
        description: 'Platform to build'
        required: true
        default: 'all'
        type: choice
        options:
          - ios
          - android
          - all
      profile:
        description: 'Build profile'
        required: true
        default: 'preview'
        type: choice
        options:
          - development
          - preview
          - production

defaults:
  run:
    working-directory: dangdai-app

jobs:
  build:
    name: EAS Build
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'yarn'
          cache-dependency-path: dangdai-app/yarn.lock

      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: Build iOS
        if: ${{ inputs.platform == 'ios' || inputs.platform == 'all' }}
        run: eas build --platform ios --profile ${{ inputs.profile }} --non-interactive

      - name: Build Android
        if: ${{ inputs.platform == 'android' || inputs.platform == 'all' }}
        run: eas build --platform android --profile ${{ inputs.profile }} --non-interactive
```

### Required GitHub Secrets

Configure these secrets in repository settings:

| Secret | Description | Where to Get |
|--------|-------------|--------------|
| `EXPO_TOKEN` | Expo access token | https://expo.dev/accounts/[username]/settings/access-tokens |
| `AZURE_CREDENTIALS` | Azure service principal JSON | Azure CLI: `az ad sp create-for-rbac` |
| `AZURE_RESOURCE_GROUP` | Azure resource group name | From Terraform output |

### Creating Azure Service Principal

```bash
# Create service principal for GitHub Actions
az ad sp create-for-rbac \
  --name "github-actions-dangdai" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/dangdai-rg \
  --sdk-auth

# Copy the JSON output and save as AZURE_CREDENTIALS secret
```

### Package.json Scripts

Add these scripts to `dangdai-app/package.json`:

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx",
    "test": "jest",
    "tsc": "tsc"
  }
}
```

### Python Dev Dependencies

Add dev dependencies to `dangdai-api/pyproject.toml`:

```toml
[project.optional-dependencies]
dev = [
    "pytest>=7.0",
    "pytest-asyncio>=0.21",
    "ruff>=0.1.0",
    "mypy>=1.0",
]
```

### EAS Configuration

Ensure `dangdai-app/eas.json` exists:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "distribution": "store"
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Workflow Triggers Summary

| Workflow | Trigger | Conditions |
|----------|---------|------------|
| ci-mobile | push, PR | Changes in `dangdai-app/` |
| ci-backend | push, PR | Changes in `dangdai-api/` |
| deploy-backend | push to main | Changes in `dangdai-api/` |
| eas-build | manual | workflow_dispatch |

### Path Filtering

The workflows use path filtering to only run when relevant files change:

```yaml
paths:
  - 'dangdai-app/**'  # Only mobile app changes
  - 'dangdai-api/**'  # Only backend changes
```

This prevents unnecessary CI runs when unrelated files are modified.

### Anti-Patterns to Avoid

- **DO NOT** commit secrets to workflow files
- **DO NOT** skip CI checks with `[skip ci]` regularly
- **DO NOT** use `latest` tag for production deployments
- **DO NOT** run all workflows on every file change (use path filters)
- **DO NOT** skip caching - it significantly speeds up builds
- **DO NOT** hardcode versions - use variables or dependabot

### Verification Steps

```bash
# Test mobile CI locally
cd dangdai-app
yarn lint
yarn tsc --noEmit
yarn test

# Test backend CI locally
cd dangdai-api
ruff check src/ tests/
mypy src/
pytest tests/

# Verify workflows exist
ls -la .github/workflows/
```

### GitHub Actions Best Practices

1. **Use caching:** Node modules and pip packages
2. **Path filtering:** Only run on relevant changes
3. **Fail fast:** Fix issues before merging
4. **Status checks:** Require CI to pass for merges
5. **Manual approval:** For production deployments (optional)

### Branch Protection Rules

Consider adding these branch protection rules for `main`:

- Require status checks to pass (ci-mobile, ci-backend)
- Require pull request reviews
- Dismiss stale reviews
- Require linear history (optional)

### Dependencies from Epic 1

- **Depends on:** Stories 1-1 through 1-6 (all components exist)
- **Blocks:** None (final story in Epic 1)

### References

- [Source: architecture.md#Build-Deployment] - CI/CD strategy
- [Source: architecture.md#GitHub-Workflows] - Workflow structure
- [Source: epics.md#Story-1.7] - Story requirements

### External Documentation

- GitHub Actions: https://docs.github.com/en/actions
- EAS Build: https://docs.expo.dev/build/introduction/
- Azure Container Apps Deploy: https://github.com/Azure/container-apps-deploy-action
- Docker Build Push: https://github.com/docker/build-push-action

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
