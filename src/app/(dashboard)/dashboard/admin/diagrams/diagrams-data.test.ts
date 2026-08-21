import { describe, it, expect } from 'vitest'
import { DIAGRAM_CATEGORIES } from './diagrams-data'

const allDiagrams = DIAGRAM_CATEGORIES.flatMap((category) => category.diagrams)

describe('DIAGRAM_CATEGORIES', () => {
  it('exposes at least one category, each with diagrams', () => {
    expect(DIAGRAM_CATEGORIES.length).toBeGreaterThan(0)
    for (const category of DIAGRAM_CATEGORIES) {
      expect(category.label.trim()).not.toBe('')
      expect(category.diagrams.length).toBeGreaterThan(0)
    }
  })

  it('gives every diagram a non-empty slug, title, description and mermaid body', () => {
    for (const diagram of allDiagrams) {
      expect(diagram.slug.trim(), `slug for ${diagram.title}`).not.toBe('')
      expect(diagram.title.trim(), `title for ${diagram.slug}`).not.toBe('')
      expect(diagram.description.trim(), `description for ${diagram.slug}`).not.toBe('')
      expect(diagram.mermaidCode.trim(), `mermaidCode for ${diagram.slug}`).not.toBe('')
    }
  })

  it('uses slugs that are unique and URL-safe', () => {
    const slugs = allDiagrams.map((diagram) => diagram.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const slug of slugs) {
      expect(slug, `slug ${slug}`).toMatch(/^[a-z0-9-]+$/)
    }
  })

  it('keeps each diagram category field in step with its containing category', () => {
    for (const category of DIAGRAM_CATEGORIES) {
      for (const diagram of category.diagrams) {
        expect(diagram.category, `category for ${diagram.slug}`).toBe(category.label)
      }
    }
  })

  it('opens every mermaid body with a recognised diagram directive', () => {
    const directive = /^(flowchart|graph|sequenceDiagram|erDiagram|stateDiagram(-v2)?|classDiagram|journey|gantt|pie|mindmap|timeline)\b/
    for (const diagram of allDiagrams) {
      expect(diagram.mermaidCode.trim(), `mermaidCode for ${diagram.slug}`).toMatch(directive)
    }
  })
})
