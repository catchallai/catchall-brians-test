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

This project uses Husky, lint-staged, Prettier, and ESLint to enforce code quality and formatting on every commit.

- On each commit, the following checks run automatically:
  1. Prettier formatting check
  2. ESLint linting check
  3. lint-staged (checks only staged files)
- If any check fails, the commit is blocked and you’ll see a message with instructions to fix issues.
- To bypass the checklist (not recommended), use:

  ```sh
  git commit --skip-checklist -m "your message"
  ```

- The checklist is automatically skipped in CI environments.

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
