import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  // === Global ignores ===
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.github/skills/**',
      'eslint.config.mjs',
    ],
  },

  // === Public JS (loaded via <script> tags — ESLint can't trace HTML usage) ===
  {
    files: ['app/public/js/**/*.js', 'demo/public/js/**/*.js'],
    ...js.configs.recommended,
    languageOptions: {
      sourceType: 'script',
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
    },
    rules: {
      'no-unused-vars': 'off', // functions called from HTML onclick / inline scripts
    },
  },

  // === Base: plain JS (CJS servers in backend, demo, internal, and root-level scripts) ===
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    ignores: [
      'app/src/**', // app frontend is TS/TSX, handled below
      'website/src/**', // website frontend is JSX, handled below
      'app/public/js/**', // handled above
      'demo/public/js/**', // handled above
      '**/.github/skills/impeccable/**', // ES modules, handled below
    ],
    ...js.configs.recommended,
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
    },
  },

  // === TypeScript / TSX (app/src) ===
  ...tseslint.configs.strictTypeChecked.map((c) => ({
    ...c,
    files: ['app/src/**/*.{ts,tsx}', 'app/vite.config.ts'],
  })),
  ...tseslint.configs.stylisticTypeChecked.map((c) => ({
    ...c,
    files: ['app/src/**/*.{ts,tsx}', 'app/vite.config.ts'],
  })),
  {
    files: ['app/src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true, allowExportNames: ['useAuth', 'useToast'] },
      ],
    },
    settings: {
      react: { version: 'detect' },
    },
  },

  // === Vite config (TS, module) ===
  {
    files: ['app/vite.config.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      sourceType: 'module',
      globals: globals.node,
    },
  },

  // === JSX (website/src — no TypeScript) ===
  {
    files: ['website/src/**/*.jsx'],
    ...js.configs.recommended,
    languageOptions: {
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      'react/prop-types': 'off', // website JSX is not TypeScript; adding PropTypes to 50+ props is low-value here
    },
    settings: {
      react: { version: 'detect' },
    },
  },

  // === Vite/Node config files (MJS/JS module) ===
  {
    files: ['**/vite.config.mjs', '**/tailwind.config.js'],
    languageOptions: {
      sourceType: 'module',
      globals: globals.node,
    },
  },

  // === Prettier: disable conflicting rules (must be last) ===
  prettierConfig
);
