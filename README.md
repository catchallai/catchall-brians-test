# CatchAllAI.com

## Local Setup:

1. Create a .env file containing the following:

```
VITE_BASE44_APP_ID=6925162397800755912704a9
VITE_BASE44_BACKEND_URL=https://preview--catchall.base44.app
VITE_BASE44_ACCESS_TOKEN=YOUR_BASE44_ACCESS_TOKEN_HERE
```

> How to find your access token:
>
> 1.  Go to https://app.base44.com/apps/6925162397800755912704a9/editor/preview/dashboard
> 2.  Open Dev Tools and go to the Network Tab
> 3.  Scroll down to the "me" network call and copy the string after "Bearer" that's next to "Authorization"

2. Run `npm i`
3. Run `npm run dev`
4. CatchAll should now be live and integrated with the backend on http://localhost:5173/

## Pre-commit Checks & Formatting

This project uses Husky, Prettier, and ESLint to enforce code quality and formatting on every commit.

- On each commit, the following checks run automatically:
  1. Prettier formatting check
  2. ESLint linting check
- If any check fails, the commit is blocked and you’ll see a message with instructions to fix issues.
- To bypass the checklist (not recommended), you can:

  ```sh
  git commit --no-verify -m "your message"
  ```

or disable Husky for a single command:

```sh
HUSKY=0 git commit -m "your message"
```

- In CI environments, you can disable these checks by setting `HUSKY=0` before running Git commands.

### Formatting the Entire Codebase

To format all files with Prettier:

```sh
npx prettier --write .
```

Commit the changes after running this command to ensure a consistent code style.

## Editor Integration: Prettier Extension

For best results, install the Prettier extension in your code editor (recommended: VS Code):

1. Open the Extensions sidebar (⇧⌘X or Ctrl+Shift+X).
2. Search for "Prettier - Code formatter" by Prettier.
3. Click Install.

### Formatting Code in the Editor

- To format the current file: Right-click in the editor and select **Format Document**, or use the shortcut:
  - macOS: `Shift + Option + F`
  - Windows/Linux: `Shift + Alt + F`
- To format on save: Open VS Code settings and enable **Format On Save** (search for "format on save").
- The extension will use your project's `.prettierrc` settings automatically.

## Editor Integration: Deno Extension (backend functions only)

The `base44/functions/` directory runs on Deno, not Node — so the frontend's TypeScript language server can't typecheck it (you'll see `Cannot find name 'Deno'` and similar). Install the official Deno extension and scope it to `base44/` so it doesn't take over your frontend code:

1. Open the Extensions sidebar (⇧⌘X or Ctrl+Shift+X).
2. Search for "Deno" by `denoland` and install it.
3. Add the following to your `.vscode/settings.json` (workspace settings are gitignored, so each developer maintains their own copy):

   ```json
   {
     "deno.enable": false,
     "deno.enablePaths": ["base44"],
     "deno.config": "base44/deno.json"
   }
   ```

4. Reload the window (`⇧⌘P → Developer: Reload Window`). The "Deno" indicator should appear in the status bar when you open a file under `base44/`.

### Backend Typecheck Scripts

Two npm scripts back the same checks the editor runs:

- `npm run typecheck:backend` — runs `deno check` against every `base44/functions/**/entry.ts`. Surfaces pre-existing strict-mode errors as a backlog signal.
- `npm run check:cron-sync` — verifies the `wallClockToUtc` helper duplicated between `checkScheduledPosts` and `updateExpiredPostStatuses` stays byte-identical (Base44's deployer doesn't bundle relative imports, so the helper can't be extracted yet).

Both are also invoked by the pre-commit hook on staged backend files only — so unrelated commits aren't blocked by pre-existing breakage in files you didn't touch.
