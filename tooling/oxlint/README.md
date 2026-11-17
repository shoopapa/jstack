# @jstack/oxlint-config

Shared [oxlint](https://oxc.rs/docs/guide/usage/linter) configuration for the monorepo. oxlint has
its own Rust parser and, for type-aware rules, drives `typescript-go`/`oxlint-tsgolint` — it never
calls the JS TypeScript compiler API, so it works with a single `typescript: ^7.x`.

## Layout

Presets are plain `.oxlintrc.json` files, composed by each package via oxlint `extends`:

| Preset              | Purpose                                                                                                                                                                                       |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `base.json`         | core + `typescript` + `import` rules, type-aware `no-misused-promises`, `consistent-type-imports`, and the `turbo/no-undeclared-env-vars` rule via the `eslint-plugin-turbo` JS-plugin bridge |
| `react.json`        | `react` plugin (jsx-runtime, rules-of-hooks, exhaustive-deps)                                                                                                                                 |
| `nextjs.json`       | `@next/next` rules (recommended + core-web-vitals)                                                                                                                                            |
| `restrict-env.json` | the `process.env` guard (`no-restricted-properties`/`-imports`), applied only where t3-env is used                                                                                            |

A package opts in with, e.g.:

```jsonc
{
  "extends": [
    "../../tooling/oxlint/base.json",
    "../../tooling/oxlint/react.json",
  ],
  "ignorePatterns": ["**/*.config.*"],
}
```

## Gotchas (learned the hard way)

- **`extends` does NOT merge `ignorePatterns`** — only `rules`, `plugins`, `overrides`, `jsPlugins`.
  So ignore globs must live in each package's own `.oxlintrc.json`. Every package ignores
  `**/*.config.*`; env-guarded packages also ignore `**/env.ts` (the file that legitimately reads
  `process.env`). oxlint respects `.gitignore` automatically, so `dist/`, `.next/`, etc. need no entry.
- **Type-aware mode** requires `oxlint-tsgolint` (installed as a dep) and TS7. Each package lints with
  `oxlint --type-aware`; tsgolint resolves the package's own `tsconfig.json`.
- **Disable directives** — existing `// eslint-disable-next-line <rule>` comments keep working; oxlint
  aliases the `@typescript-eslint/*` and `react-hooks/*` prefixes to its native rule names.

## React Compiler rules

Oxlint 1.87 replaces the retired `react/react-compiler` umbrella rule with granular
React Compiler rules. `react.json` enables the recommended checks at `error`,
including `react/unsupported-syntax` and `react/void-use-memo`. Existing exceptions
use the specific rule and sit on the reported line (for example,
`react/incompatible-library` on a TanStack Table or React Hook Form call).

See the [upstream migration guide](https://oxc.rs/blog/2026-08-18-react-compiler-support).
