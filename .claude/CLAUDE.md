# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev          # Start Vite dev server at http://localhost:5173
npm run build        # Production build
npm run lint         # ESLint check (strict: max-warnings=0)
npm run lint:fix     # Auto-fix ESLint issues
npm run typecheck    # TypeScript type checking via tsc
npm run format       # Format all files with Prettier
```

Pre-commit hooks (Husky + lint-staged) run Prettier and ESLint on staged `.js/.jsx/.ts/.tsx` files. Commits are blocked if checks fail.
To bypass: `git commit --no-verify` or `HUSKY=0 git commit`.

## Local Setup

Create a `.env` file with the following variables:

- `VITE_BASE44_APP_ID`: The Base44 application ID for this frontend.
- `VITE_BASE44_BACKEND_URL`: The Base44 backend HTTP(S) URL that the app should call.
- `VITE_BASE44_ACCESS_TOKEN`: A secret API/access token used by the frontend to authenticate with the Base44 backend.

Then run `npm i && npm run dev`.

## Architecture

**Stack:** React 18 + React Router v6 + Vite (SWC) + Base44 SDK + Tailwind CSS + shadcn/ui + React Query v5

### Backend (Base44)

- `/src/api/base44Client.js` — SDK instance creation
- `/src/api/integrations.js` — exported helpers: `InvokeLLM`, `SendEmail`, `SendSMS`, `UploadFile`, `GenerateImage`, `ExtractDataFromUploadedFile`
- `/base44/entities/` — entity schema definitions (Contact, Company, Deal, etc.)
- `/base44/functions/` — 76 serverless functions (Deno runtime), authenticated via `createClientFromRequest(req)`. Categories: CRM, analytics, email, social, SEO, automation, documents. Check here before implementing new server-side logic.

### Frontend

- **Routing:** Auto-generated in `/src/pages.config.js` — **do not edit** except for the `mainPage` property. Adding a file to `/src/pages/` auto-registers a route.
- **Layout:** `/src/Layout.jsx` wraps all pages with sidebar navigation, header, notifications.
- **Auth:** `/src/lib/AuthContext.jsx` provides `user`, `isAuthenticated`, `logout()`, `navigateToLogin()` via React context. App params (appId, serverUrl, token) are resolved from env vars or URL params in `/src/lib/app-params.js`.
- **AI editing:** `/src/lib/VisualEditAgent.jsx` — AI-powered visual edit agent. Do not duplicate this logic.
- **Error handling:** `/src/components/ui/ErrorBoundary.jsx` — use this for error boundaries rather than rolling custom ones.

### Key Hooks

In `/src/components/hooks/`:

- `useFeatures()` — feature flag management; returns `isEnabled(featureKey)`
- `useRBAC()` — role-based access control; checks `can_view`, `can_create`, `can_edit`, `can_delete` per module
- `useAIEnabled()` — checks if AI features are active
- `useUnsavedChangesGuard()` — blocks navigation on unsaved changes; provides `guardedClose()` and `discardDialogProps`
- `useDebounce(value, delay)` / `useDebouncedCallback(fn, delay)` — debounce utilities
- `useCustomFieldValues()` — custom field management

In `/src/hooks/`:

- `useIsMobile()` — responsive breakpoint detection via media query

### Data Fetching Pattern

All server state uses React Query with Base44 entity methods:

```javascript
// Query
const { data, isLoading } = useQuery({
  queryKey: ['contacts'],
  queryFn: () => base44.entities.Contact.list('-created_date', 1000),
  staleTime: 5 * 60 * 1000,
});

// Mutation
const mutation = useMutation({
  mutationFn: (data) => base44.entities.Contact.create(data),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contacts'] }),
});
```

Entity methods: `.list(sort, limit)`, `.get(id)`, `.create(data)`, `.update(id, data)`, `.delete(id)`

Query client defaults (`/src/lib/query-client.js`): `refetchOnWindowFocus: false`, `retry: 1`.

## Code Conventions

- **Imports:** Use `@/` path alias (maps to `src/`), e.g. `@/components/ui/button`
- **Mixed JS/TS:** Most files are `.jsx`; new utilities may use `.ts/.tsx`. TypeScript has `checkJs: true`.
- **Types:** `/src/types/` — TypeScript type definitions live here.
- **Constants:** `/src/constants/` — project constants live here.
- **UI components:** Use existing shadcn/ui components from `/src/components/ui/`. Radix UI primitives underneath, Lucide icons.
- **Styling:** Tailwind utility classes. Dark mode via CSS class strategy. Theme variables in `/src/globals.css`.
- **Forms:** react-hook-form + Zod validation
- **Drag & drop:** `@dnd-kit` (sortable lists) and `@hello-pangea/dnd` (complex board-style DnD)
- **Notifications:** `sonner` is preferred for new code; `react-hot-toast` also present
- **Code splitting:** `React.lazy()` for page-level components

## Testing

There is no test framework configured in this project (no Jest/Vitest). Do not add test files unless explicitly asked.

## ESLint Rules to Know

- `no-console` — only `console.warn` and `console.error` allowed
- `unused-imports/no-unused-imports` — auto-removes unused imports
- `unused-imports/no-unused-vars` — prefix unused vars with `_`
- `eqeqeq` — strict equality required
- `prefer-const`, `no-var` — no `var` declarations
- `react/prop-types` — disabled (no PropTypes needed)

## Prettier Config

Single quotes, trailing commas, semicolons, 100-char line width, 2-space indent.
