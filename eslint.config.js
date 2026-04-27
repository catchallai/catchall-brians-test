import globals from 'globals';
import pluginJs from '@eslint/js';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import pluginUnusedImports from 'eslint-plugin-unused-imports';
import pluginTs from '@typescript-eslint/eslint-plugin';
import parserTs from '@typescript-eslint/parser';

export default [
  // Global ignores — keep build output and other generated artifacts out of lint scope.
  // base44/ runs on Deno, not Node — it has its own typecheck via `deno check` and
  // isn't part of the frontend tsconfig, so the type-aware TS parser below would
  // fail to parse it ("file not found in any of the provided project(s)").
  {
    ignores: ['dist/**', 'base44/**'],
  },
  // JS/JSX config (no TS parser)
  {
    files: ['**/*.{js,mjs,cjs,jsx}'],
    ...pluginJs.configs.recommended,
    ...pluginReact.configs.flat.recommended,
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    plugins: {
      react: pluginReact,
      'react-hooks': pluginReactHooks,
      'unused-imports': pluginUnusedImports,
    },
    rules: {
      'no-unused-vars': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],
      // Disabling because AI seems to like writing single-line if statements without curly braces
      curly: 'off',
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      // React
      'react/jsx-uses-vars': 'error',
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/no-unknown-property': ['error', { ignore: ['cmdk-input-wrapper', 'toast-close'] }],
      // React Hooks
      'react-hooks/rules-of-hooks': 'error',
      // Unused imports/vars
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  // TS/TSX config (with TS parser and project)
  {
    files: ['**/*.{ts,tsx,d.ts}'],
    ...pluginReact.configs.flat.recommended,
    languageOptions: {
      parser: parserTs,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: process.cwd(),
        sourceType: 'module',
        ecmaVersion: 2022,
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: globals.browser,
    },
    plugins: {
      '@typescript-eslint': pluginTs,
      'unused-imports': pluginUnusedImports,
      'react-hooks': pluginReactHooks,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
];
