# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev          # Start Vite dev server at http://localhost:5173
npm run build        # Production build
npm run lint         # ESLint check (warnings allowed; --max-warnings=0 only enforced in pre-commit hook)
npm run lint:fix     # Auto-fix ESLint issues
npm run typecheck    # TypeScript type checking via tsc (frontend, src/)
npm run typecheck:backend  # Deno typecheck for base44/functions/**/entry.ts
npm run format       # Format all files with Prettier
```

Pre-commit hooks (Husky) run `npx prettier --check` on staged `.js/.jsx/.ts/.tsx/.css/.md/.json` files, `npx eslint --max-warnings=0` on `.js/.jsx/.ts/.tsx`, and `deno check` on staged `base44/functions/**/*.ts`. Commits are blocked if checks fail.
To bypass: `git commit --no-verify` or `HUSKY=0 git commit`.

## Local Setup

Create a `.env` file with the following variables:

- `VITE_BASE44_APP_ID`: The Base44 application ID for this frontend.
- `VITE_BASE44_BACKEND_URL`: The Base44 backend HTTP(S) URL that the app should call.
- `VITE_BASE44_ACCESS_TOKEN`: (Local development only) Used on localhost to bypass the normal login flow. **Do not use in production** — `VITE_` vars are embedded in the client bundle and are not secret. In production, auth comes from the login flow / `access_token` URL param (see `/src/lib/app-params.js`).

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

- **Enums:** All enum-like values (finite sets of named string/number constants) belong in `/src/types/enums.ts` — never inline in components. This includes pipeline stages, platform lists, roles, status configs, channel lists, audience/tone options, etc. Pair each enum with an `OPTIONS` array for form/select use. When you encounter duplicated constants across files (e.g., `STAGES`, `PLATFORMS`, `ROLES`, `CHANNELS`), extract them to `enums.ts` and import from there.
- **UI copy:** All user-facing strings belong in `/src/lib/copy.ts` under a nested feature key. This includes: toast messages (`toast.success('...')`), placeholder text, empty-state titles/descriptions, button labels, form labels, helper text, and error messages. Never hard-code these in components. Use template functions in `copy.ts` for strings with dynamic values (e.g., `tagAdded: (count: number) => \`Tag added to ${count} contacts\``).
- **Utilities:** Before writing a new utility function, check `/src/utils/` for an existing one that covers the need. New general-purpose utilities go in `/src/utils/index.ts` (or a dedicated file if focused on a specific domain, matching the existing pattern).

- **Imports:** Use `@/` path alias (maps to `src/`), e.g. `@/components/ui/button`
- **Shared components:** Always build UI elements as shared, reusable components in `/src/components/`. Check for an existing component before building a new one. Embedding UI logic directly in a page or feature-specific component is not the preferred pattern.
- **Language:** TypeScript (`.ts`/`.tsx`) is the default for all new files. The codebase is migrating from JS to TS incrementally — most existing files are still `.jsx`, but all new components, hooks, utils, and libs should be `.tsx`/`.ts`. TypeScript has `checkJs: true`, so existing JS files get partial type checking. Only use `.js`/`.jsx` when TS doesn't make sense (e.g., config files, Base44 SDK bootstrap).
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
