---
applyTo: "src/app/(marketing)/{coaches,partners,for-coaches,executives,for-executives,search-firms,for-outplacement,outplacement}/**"
---

# Narrative Page Standard

Every conversion page in this workspace follows a fixed emotional arc.
Do not add sections, reorder sections, or introduce card-nesting without explicit instruction.

## The Arc (in order)

1. **Hero** — name the audience's situation, not the product
2. **Pain** — 3 named breakdowns (title + one-sentence cause, no product mention)
3. **Antidote** — two flat columns (platform jobs vs user/coach jobs), background section, no nested cards
4. **Objections** — 3 italic quoted doubts with direct antidote responses, flat rows
5. **Brighter future + CTA** — 3 outcome lines merged into a single dark close section with one primary CTA

## Cognitive Load Rules

- **No boxes inside boxes.** Use dividers, borders, background sections, or flat rows — never a card inside a card.
- **One eyebrow label per section maximum.** Small orange uppercase. Do not add more than one per section.
- **Pain section never mentions the product.** Name the reality the reader already feels.
- **Antidote section uses job-to-be-done language.** Action-verb first. No marketing adjectives.
- **Objections section:** italic quoted doubt + one concrete antidote action. Not a sales pitch.
- **One primary CTA per page.** A secondary link is permitted but must be visually subordinate (border style, not filled).
- **Brighter future = 3 lines, present tense, reader's perspective.** → arrow prefix.
- **No section labels on the close.** The dark background signals the end; a label is redundant.

## Type Reference

See `src/lib/narrative-page-types.ts` for the `NarrativePageData` interface.
The coaches page (`src/app/coaches/page.tsx`) is the canonical reference implementation.

## Canonical Section Structure (Tailwind reference)

```
Pain section:         bg-slate-50  |  flat label + space-y-8 row grid [title | detail]
Antidote section:     bg-orange-50/60 border-y border-orange-100  |  md:divide-x two-column list
Objections section:   bg-slate-50  |  flat label + space-y-7 row grid [italic title | detail]
Close section:        bg-slate-900 text-white  |  h2 + → list + CTAs (no wrapper box)
```
