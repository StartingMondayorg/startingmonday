export type GuideEntry = {
  id: string
  title: string
  body: string
  type: string
  url: string
  tags?: string[]
  qualityWeight?: number
}

export type GuideIntent =
  | 'getting_started'
  | 'api_docs'
  | 'billing'
  | 'articles'
  | 'troubleshooting'
  | 'feature_howto'
  | 'general'

export type RankedGuideEntry = {
  entry: GuideEntry
  score: number
  lexicalScore: number
  bm25Score: number
  semanticScore: number
  snippet: string
}

export type RetrievalEvalCase = {
  question: string
  expectedAnyOfUrls: string[]
}

export type RetrievalEvalSummary = {
  total: number
  recallAt1: number
  recallAt3: number
  recallAt5: number
  misses: Array<{ question: string; topUrls: string[]; expectedAnyOfUrls: string[] }>
}

export type RetrievalResult = {
  intent: GuideIntent
  tokens: string[]
  ranked: RankedGuideEntry[]
  confidence: number
  conservative: boolean
}

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'get', 'how', 'i', 'in', 'is', 'it', 'of', 'on', 'or', 'that', 'the', 'to', 'what', 'where', 'which', 'who', 'why', 'with', 'you',
])

const SYNONYMS: Record<string, string[]> = {
  onboarding: ['setup', 'start', 'get-started'],
  setup: ['onboarding', 'start', 'checklist'],
  profile: ['resume', 'positioning'],
  contact: ['contacts', 'people'],
  company: ['companies', 'target', 'pipeline'],
  outreach: ['message', 'messaging', 'follow-up'],
  billing: ['invoice', 'subscription', 'payment', 'revenue'],
  article: ['blog', 'post'],
  api: ['endpoint', 'automation', 'route'],
  automation: ['workflow', 'job', 'api'],
  help: ['guide', 'support', 'docs'],
  docs: ['guide', 'documentation'],
  documented: ['guide', 'documentation'],
  fix: ['troubleshoot', 'issue', 'problem'],
  broken: ['issue', 'problem', 'troubleshoot'],
}

const VECTOR_DIM = 192

function compactText(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim()
}

function tokenizeBase(input: string): string[] {
  return compactText(input)
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOPWORDS.has(token))
}

export function normalizeTokens(input: string): string[] {
  const base = tokenizeBase(input)
  const expanded = new Set<string>(base)

  for (const token of base) {
    for (const synonym of SYNONYMS[token] ?? []) expanded.add(synonym)
  }

  return [...expanded]
}

export function extractPhrases(input: string): string[] {
  const quoted = [...input.matchAll(/"([^"]{3,})"/g)].map((match) => compactText(match[1]))
  const words = compactText(input).split(' ').filter(Boolean)
  const bigrams: string[] = []

  for (let i = 0; i < words.length - 1; i += 1) {
    const first = words[i]
    const second = words[i + 1]
    if (STOPWORDS.has(first) || STOPWORDS.has(second)) continue
    bigrams.push(`${first} ${second}`)
  }

  return [...new Set([...quoted, ...bigrams])].filter((phrase) => phrase.length >= 5)
}

function hashString(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

function vectorize(tokens: string[], phrases: string[]): number[] {
  const vector = Array.from({ length: VECTOR_DIM }, () => 0)

  for (const token of tokens) {
    const index = hashString(`tok:${token}`) % VECTOR_DIM
    vector[index] += 1.2
  }

  for (const phrase of phrases) {
    const index = hashString(`phr:${phrase}`) % VECTOR_DIM
    vector[index] += 2
  }

  for (const token of tokens) {
    if (token.length < 4) continue
    for (let i = 0; i <= token.length - 3; i += 1) {
      const trigram = token.slice(i, i + 3)
      const index = hashString(`tri:${trigram}`) % VECTOR_DIM
      vector[index] += 0.35
    }
  }

  return vector
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

function inferIntent(tokens: string[]): GuideIntent {
  const hasApi = tokens.some((token) => ['api', 'endpoint', 'automation', 'route', 'docs', 'documentation'].includes(token))
  const hasBilling = tokens.some((token) => ['billing', 'payment', 'invoice', 'subscription', 'refund'].includes(token))
  const hasArticle = tokens.some((token) => ['article', 'blog', 'post', 'read'].includes(token))
  const hasTroubleshoot = tokens.some((token) => ['fix', 'broken', 'error', 'issue', 'problem', 'troubleshoot'].includes(token))
  const hasStart = tokens.some((token) => ['start', 'setup', 'onboarding', 'checklist', 'first'].includes(token))
  const hasHow = tokens.some((token) => ['how', 'feature', 'workflow', 'guide', 'help'].includes(token))

  if (hasApi) return 'api_docs'
  if (hasBilling) return 'billing'
  if (hasArticle) return 'articles'
  if (hasTroubleshoot) return 'troubleshooting'
  if (hasStart) return 'getting_started'
  if (hasHow) return 'feature_howto'
  return 'general'
}

function getIntentWeight(intent: GuideIntent, entry: GuideEntry): number {
  if (intent === 'api_docs') {
    if (entry.url === '/guide') return 2.4
    if (entry.type === 'api') return 1.7
    if (entry.type === 'article') return 0.7
  }

  if (intent === 'getting_started') {
    if (['/dashboard', '/settings/help', '/guide'].includes(entry.url)) return 2.6
    if (entry.type === 'get-started') return 1.8
    if (entry.type === 'article') return 0.65
  }

  if (intent === 'billing') {
    if (entry.url.includes('/settings/billing')) return 2.5
    if (entry.type === 'api') return 0.85
  }

  if (intent === 'articles') {
    if (entry.type === 'article') return 1.9
  }

  if (intent === 'troubleshooting') {
    if (entry.type === 'how-to' || entry.type === 'feature') return 1.4
  }

  if (intent === 'feature_howto' && ['how-to', 'feature', 'get-started'].includes(entry.type)) {
    return 1.35
  }

  return 1
}

function termFrequency(text: string, token: string): number {
  const normalized = compactText(text)
  if (!normalized || !token) return 0
  let count = 0
  const words = normalized.split(' ')
  for (const word of words) {
    if (word === token) count += 1
    else if (word.includes(token)) count += 0.4
  }
  return count
}

function bm25Score(entryText: string, tokens: string[], docFreq: Map<string, number>, totalDocs: number, avgDocLen: number): number {
  const k1 = 1.2
  const b = 0.75
  const terms = compactText(entryText).split(' ').filter(Boolean)
  const docLen = Math.max(terms.length, 1)

  let score = 0
  for (const token of tokens) {
    const df = docFreq.get(token) ?? 0
    const idf = Math.log(1 + (totalDocs - df + 0.5) / (df + 0.5))
    const tf = termFrequency(entryText, token)
    if (tf <= 0) continue

    const denom = tf + k1 * (1 - b + b * (docLen / Math.max(avgDocLen, 1)))
    score += idf * ((tf * (k1 + 1)) / denom)
  }

  return score
}

function lexicalScore(entry: GuideEntry, tokens: string[], phrases: string[]): number {
  const title = compactText(entry.title)
  const body = compactText(entry.body)
  const url = compactText(entry.url)
  const tags = compactText((entry.tags ?? []).join(' '))
  const haystack = `${title} ${body} ${url} ${tags}`

  let score = 0

  for (const phrase of phrases) {
    if (!phrase) continue
    if (title.includes(phrase)) score += 22
    if (url.includes(phrase)) score += 18
    if (haystack.includes(phrase)) score += 10
  }

  for (const token of tokens) {
    if (!token) continue
    if (title === token) score += 14
    if (title.includes(token)) score += 8
    if (url.includes(token)) score += 7
    if (tags.includes(token)) score += 5
    if (body.includes(token)) score += 2.5
  }

  return score
}

function splitSentences(input: string): string[] {
  return input
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
}

export function bestSnippet(entry: GuideEntry, question: string): string {
  const tokens = normalizeTokens(question)
  const phrases = extractPhrases(question)
  const sentences = splitSentences(entry.body)

  if (sentences.length === 0) return entry.body.slice(0, 180)

  let best = sentences[0]
  let bestScore = -1

  for (const sentence of sentences) {
    const text = compactText(sentence)
    let score = 0

    for (const phrase of phrases) {
      if (phrase && text.includes(phrase)) score += 8
    }

    for (const token of tokens) {
      if (!token) continue
      if (text.includes(token)) score += 2
    }

    if (score > bestScore) {
      best = sentence
      bestScore = score
    }
  }

  return best.length <= 200 ? best : `${best.slice(0, 197)}...`
}

function computeConfidence(ranked: RankedGuideEntry[], intent: GuideIntent): { confidence: number; conservative: boolean } {
  if (ranked.length === 0) return { confidence: 0, conservative: true }

  const top = ranked[0].score
  const second = ranked[1]?.score ?? 0
  const gap = top - second
  const normGap = Math.max(0, Math.min(gap / Math.max(top, 1), 1))
  const base = Math.max(0, Math.min(top / 130, 1))

  let confidence = (0.65 * base) + (0.35 * normGap)

  if (intent === 'api_docs' && ranked[0].entry.url === '/guide') confidence += 0.08
  if (ranked[0].entry.type === 'article' && intent !== 'articles') confidence -= 0.1

  confidence = Math.max(0, Math.min(confidence, 1))
  const conservative = confidence < 0.45

  return { confidence, conservative }
}

export function retrieveGuide(entries: GuideEntry[], question: string, limit = 5): RetrievalResult {
  const tokens = normalizeTokens(question)
  const phrases = extractPhrases(question)
  const intent = inferIntent(tokens)

  if (tokens.length === 0 && phrases.length === 0) {
    return { intent, tokens: [], ranked: [], confidence: 0, conservative: true }
  }

  const queryVector = vectorize(tokens, phrases)
  const corpusTexts = entries.map((entry) => `${entry.title} ${entry.body} ${(entry.tags ?? []).join(' ')}`)

  const docFreq = new Map<string, number>()
  let totalDocLen = 0

  for (const text of corpusTexts) {
    const terms = compactText(text).split(' ').filter(Boolean)
    totalDocLen += terms.length
    const seen = new Set<string>()
    for (const term of terms) {
      if (seen.has(term)) continue
      seen.add(term)
      docFreq.set(term, (docFreq.get(term) ?? 0) + 1)
    }
  }

  const avgDocLen = corpusTexts.length > 0 ? totalDocLen / corpusTexts.length : 1

  const ranked = entries
    .map((entry, index) => {
      const text = corpusTexts[index]
      const lexical = lexicalScore(entry, tokens, phrases)
      const bm25 = bm25Score(text, tokens, docFreq, entries.length, avgDocLen)
      const semantic = cosineSimilarity(queryVector, vectorize(normalizeTokens(text), extractPhrases(text)))
      const quality = entry.qualityWeight ?? 1
      const intentWeight = getIntentWeight(intent, entry)

      const score = ((lexical * 1.1) + (bm25 * 24) + (semantic * 34) + (quality * 8)) * intentWeight

      return {
        entry,
        score,
        lexicalScore: lexical,
        bm25Score: bm25,
        semanticScore: semantic,
        snippet: bestSnippet(entry, question),
      }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  const { confidence, conservative } = computeConfidence(ranked, intent)

  return {
    intent,
    tokens,
    ranked,
    confidence,
    conservative,
  }
}

export function rankGuideEntries(entries: GuideEntry[], question: string, limit = 5): RankedGuideEntry[] {
  return retrieveGuide(entries, question, limit).ranked
}

function hasAnyExpectedUrl(ranked: RankedGuideEntry[], expectedAnyOfUrls: string[]): boolean {
  const expected = new Set(expectedAnyOfUrls)
  return ranked.some((item) => expected.has(item.entry.url))
}

export function evaluateGuideRetrieval(evalSet: RetrievalEvalCase[], entries: GuideEntry[]): RetrievalEvalSummary {
  let hitsAt1 = 0
  let hitsAt3 = 0
  let hitsAt5 = 0
  const misses: RetrievalEvalSummary['misses'] = []

  for (const testCase of evalSet) {
    const ranked = rankGuideEntries(entries, testCase.question, 5)

    if (hasAnyExpectedUrl(ranked.slice(0, 1), testCase.expectedAnyOfUrls)) hitsAt1 += 1
    if (hasAnyExpectedUrl(ranked.slice(0, 3), testCase.expectedAnyOfUrls)) hitsAt3 += 1
    if (hasAnyExpectedUrl(ranked.slice(0, 5), testCase.expectedAnyOfUrls)) hitsAt5 += 1

    if (!hasAnyExpectedUrl(ranked.slice(0, 3), testCase.expectedAnyOfUrls)) {
      misses.push({
        question: testCase.question,
        topUrls: ranked.slice(0, 3).map((item) => item.entry.url),
        expectedAnyOfUrls: testCase.expectedAnyOfUrls,
      })
    }
  }

  const total = Math.max(evalSet.length, 1)

  return {
    total: evalSet.length,
    recallAt1: hitsAt1 / total,
    recallAt3: hitsAt3 / total,
    recallAt5: hitsAt5 / total,
    misses,
  }
}
