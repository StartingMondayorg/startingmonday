---
name: frontend-components
description: Conventions for writing frontend/React code in this repo and managing shadcn/ui components and dependencies. Use whenever adding or editing UI, importing from components/ui, installing a shadcn component, styling with Tailwind colors, or creating a new base/primitive component.
---

# Frontend component conventions

This repo uses shadcn/ui (`components.json`: style `base-nova`, base color
`neutral`, icons `lucide`) as the base component library, generated into
`src/components/ui/`. These rules keep that library consistent instead of
drifting into one-off imports and ad-hoc styling.

## 1. Always import from the `components/ui` barrel

`src/components/ui/index.ts` re-exports every primitive in that directory.
Import from the barrel, never from an individual file.

```ts
// GOOD
import { Button, Card } from '@/components/ui'

// BAD
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
```

(The repo's path alias is `@/*` → `./src/*`, so the barrel import is
`@/components/ui`, not `components/ui`.)

**Note:** a large number of files still import directly from individual
`@/components/ui/<file>` paths — that predates this convention. Don't do a
mass migration; when you touch a file for other reasons, switch its imports
to the barrel opportunistically.

### 1a. Keep the barrel up to date

Every file in `src/components/ui/` must have a matching
`export * from './<file>'` line in `src/components/ui/index.ts`. Whenever you
add a new shadcn component (see §2/§3), add its export to the barrel in the
same change — check the barrel first; if the export is missing, add it
before using the component elsewhere.

## 2. Prefer shadcn components over custom ones

If shadcn already provides the primitive you need (button, dialog, select,
table, etc.), use it. Don't hand-roll a styled `<div>`/`<button>` that
duplicates something shadcn already ships.

## 3. Check shadcn before building a new base component

Before creating a new primitive/base component from scratch:

1. Check whether it already exists in `src/components/ui/`.
2. If not, check shadcn's registry for it (see §5 — use the docs or MCP
   server to search) rather than assuming it doesn't exist.
3. If shadcn has it, install it with the CLI:
   ```
   npx shadcn@latest add <component>
   ```
   This drops the generated file into `src/components/ui/`.
4. Add the new file's export to `src/components/ui/index.ts` (§1a).
5. Only write a fully custom base component when shadcn genuinely has no
   equivalent — and place it alongside the others in `src/components/ui/`
   with a barrel export, following the same primitive conventions (see §6).

## 4. No custom colors — use the tokens in `globals.css`

`src/app/globals.css` defines the full color system as CSS variables
(`--background`, `--foreground`, `--primary`, `--muted`, `--destructive`,
`--success`, `--warning`, `--info`, `--border`, `--card`, `--sidebar-*`,
`--chart-*`, etc.), consumed through the matching Tailwind tokens (`bg-primary`,
`text-muted-foreground`, `border-border`, `bg-destructive`, ...).

- Don't introduce arbitrary Tailwind colors (`text-[#123456]`, `bg-red-500`,
  `border-slate-200`) or new hex/oklch values in component code.
- If a needed semantic color doesn't exist yet, add a variable to
  `globals.css` (light **and** dark values) and use the token — don't inline
  a one-off color at the call site.

## 5. Use official shadcn docs and the MCP server

Don't guess at shadcn component APIs. Check https://ui.shadcn.com/docs for
usage before wiring up a component, especially for composed/compound
components (`Dialog`, `Select`, `Command`, `DropdownMenu`, etc.) where prop
shape and required subcomponents aren't obvious from the generated file
alone.

If a shadcn MCP server isn't already configured, set one up rather than
avoiding it:

```
npx shadcn@latest mcp init --client claude
```

Then restart and check `/mcp`. Use it to look up components, blocks, and
usage examples straight from the registry instead of relying on memory.

## 6. Don't edit generated shadcn files directly

Files in `src/components/ui/` are generated output from the shadcn CLI.
Avoid hand-editing them:

- To customize appearance, prefer variant props (`buttonVariants`,
  `badgeVariants`, etc.), `className` overrides at the call site, or new
  `globals.css` tokens (§4).
- To extend behavior, wrap the shadcn component in your own component
  (e.g. in a route's `_components/` or shared `app/components/`) rather than
  modifying the primitive in place.
- If a primitive genuinely needs to change for everyone (e.g. a real shadcn
  upstream bug, or a variant shadcn doesn't offer), it's fine to edit the
  generated file — just do it deliberately, and update the barrel/docs if
  the exported API changes. Re-running `npx shadcn@latest add <component>`
  later will overwrite hand edits, so keep them minimal and expected.
