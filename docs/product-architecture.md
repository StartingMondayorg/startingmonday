# Product Architecture — Starting Monday

Owner: Documentation Operations
Status: active
Last reviewed: 2026-06-07
Review cadence: quarterly
Source of truth: yes


## Concept

"We get you to Starting Monday." — the only AI career search platform purpose-built
for the $300K+ executive job seeker, serving all experience levels through a tiered model.
Targeted execution, not spray-and-pray auto-apply.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACES                          │
│                                                                 │
│   Web Dashboard          Chat Interface        Email / Mobile   │
│   (pipeline, scores,     (ask anything,        (daily briefing, │
│    follow-up calendar)    draft messages)       match alerts)    │
└────────────────┬─────────────────┬──────────────────┬──────────┘
                 │                 │                  │
                 ▼                 ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                         NEXT.JS APP                             │
│                                                                 │
│   /dashboard    /chat    /profile    /companies    /api/*       │
│                                                                 │
│   API Routes:                                                   │
│   POST /api/chat          ← conversational AI                   │
│   GET  /api/pipeline      ← current job pipeline state         │
│   POST /api/companies     ← add/update watched company          │
│   GET  /api/briefing      ← today's action list                 │
│   POST /api/draft         ← draft outreach message              │
└──────────┬──────────────────────────────────────────┬──────────┘
           │                                          │
           ▼                                          ▼
┌──────────────────────┐                 ┌────────────────────────┐
│   POSTGRESQL DB       │                 │    CLAUDE API          │
│   (Supabase)          │◄────context────►│    (claude-opus-4-7)   │
│                       │                 │                        │
│   users               │                 │   • Chat interface     │
│   user_profiles       │                 │   • Daily briefing     │
│   companies           │                 │   • Outreach drafting  │
│   scan_results        │                 │   • Interview prep     │
│   follow_ups          │                 │   • Opportunity score  │
│   conversations       │                 │   • Tool use calls     │
│   notifications       │                 │                        │
└──────────┬───────────┘                 └────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKGROUND WORKERS                          │
│                     (Railway cron jobs)                         │
│                                                                 │
│   scan-worker.js         briefing-worker.js    followup-worker  │
│   Mon/Thu 6am            Daily 7am user tz     Checks daily     │
│   Playwright +           Pulls pipeline state, Finds overdue    │
│   browserless.io         calls Claude, sends   contacts, queues │
│   Scores hits            email via Resend       reminder email   │
│                                                                 │
│   signal-worker.js                                              │
│   Daily 5am UTC                                                 │
│   Queries NewsAPI for each watched company, Claude Haiku        │
│   classifies signal type, stores company_signals, alerts        │
└──────────┬──────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                             │
│                                                                 │
│   browserless.io    Resend          Stripe        Google OAuth  │
│   (cloud browser    (transactional  (subscription  (Gmail +     │
│    automation)       email)          billing)       Calendar)   │
│                                                                 │
│   NewsAPI.org       (triggering event intelligence — V1)        │
│   Crunchbase API    (funding signals — V2, requires licensing)  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend + API | Next.js 14 (App Router) | Full-stack, fast to build, deploys to Vercel |
| Database | PostgreSQL via Supabase | Managed, includes auth, realtime, free tier |
| Auth | Supabase Auth | Built-in to the DB layer, handles OAuth |
| Background jobs | Railway + node-cron | Simple, cheap, close to the existing Node.js code |
| Browser automation | browserless.io | Cloud Playwright — no headless Chrome on your server |
| AI | Claude API (claude-opus-4-7) | Best context window, tool use, long-form reasoning |
| Email | Resend | Simple API, good deliverability, React Email templates |
| Payments | Stripe | Subscription billing, customer portal |
| Hosting | Vercel (web) + Railway (workers) | Vercel for the app, Railway for long-running jobs |

---

## Database Schema

```sql
-- Core user record
users (
  id uuid PRIMARY KEY,
  email text UNIQUE,
  stripe_customer_id text,
  subscription_tier text,  -- 'individual' | 'executive' | 'coach'
  subscription_status text,
  created_at timestamptz
)

-- Everything Claude needs to know about the user's search
user_profiles (
  user_id uuid REFERENCES users,
  resume_text text,           -- full resume as plain text
  target_titles text[],       -- ['CIO', 'VP IT', 'Head of IT']
  target_sectors text[],      -- ['Logistics', 'HR Tech', 'Streaming']
  target_salary_min int,
  target_locations text[],    -- ['Remote', 'San Francisco', 'New York']
  positioning_summary text,   -- 2-3 sentence bio Claude uses for drafting
  search_started_at date
)

-- Companies the user is watching
companies (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users,
  name text,
  career_page_url text,
  sector text,
  fit_score int,              -- 1-10, user-assigned
  stage text,                 -- 'Not contacted' | 'Applied' | 'Responded' | 'Interview' | 'Closed'
  contact_name text,
  contact_title text,
  contact_notes text,
  last_checked_at timestamptz,
  updated_at timestamptz
)

-- Results from each career page scan
scan_results (
  id uuid PRIMARY KEY,
  company_id uuid REFERENCES companies,
  scanned_at timestamptz,
  status text,                -- 'ok' | 'error' | 'match'
  raw_hits jsonb,             -- array of matched text strings
  ai_score int,               -- Claude's 1-10 relevance score
  ai_summary text,            -- Claude's one-line summary of the match
  notified_at timestamptz
)

-- Recruiter and executive contacts
contacts (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users,
  name text,
  firm text,
  title text,
  status text,                -- 'pending' | 'responded' | 'active' | 'closed'
  channel text,               -- 'linkedin' | 'email'
  contacted_at date,
  follow_up_at date,
  notes text
)

-- Follow-up reminders
follow_ups (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users,
  contact_id uuid REFERENCES contacts,
  company_id uuid REFERENCES companies,
  due_date date,
  action text,
  status text,                -- 'pending' | 'sent' | 'done' | 'snoozed'
  notified_at timestamptz
)

-- Triggering event signals detected for watched companies
company_signals (
  id uuid PRIMARY KEY,
  company_id uuid REFERENCES companies,
  user_id uuid REFERENCES users,
  signal_type text,        -- 'funding' | 'executive_departure' | 'acquisition' | 'ipo' | 'headcount_change'
  signal_summary text,     -- one-sentence description of the event
  source_url text,
  signal_date date,        -- date of the event
  outreach_angle text,     -- AI-generated suggested outreach approach
  notified_at timestamptz,
  detected_at timestamptz
)

-- Conversation history for the AI chat interface
conversations (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users,
  messages jsonb,             -- array of {role, content} objects
  created_at timestamptz,
  updated_at timestamptz
)
```

---

## Claude API Integration — Four Patterns

### Pattern 1: Conversational Interface (Chat)

The most visible feature. User asks questions, Claude responds with full knowledge of
their search. Uses tool use so Claude can read and write pipeline state.

```javascript
// api/chat/route.js

const SYSTEM_PROMPT = (profile, pipeline) => `
You are an executive career recruiter working exclusively for this candidate.
You know everything about their search and act with the urgency of a retained recruiter.

CANDIDATE PROFILE:
${profile.positioning_summary}

Target titles: ${profile.target_titles.join(', ')}
Target sectors: ${profile.target_sectors.join(', ')}
Search started: ${profile.search_started_at}

CURRENT PIPELINE (${pipeline.companies.length} companies):
${pipeline.companies.map(c =>
  `- ${c.name} (${c.sector}) — Fit: ${c.fit_score}/10 — Stage: ${c.stage}` +
  (c.contact_name ? ` — Contact: ${c.contact_name}, ${c.contact_title}` : '')
).join('\n')}

OVERDUE FOLLOW-UPS:
${pipeline.overdue.map(f => `- ${f.contact_name} at ${f.firm} — due ${f.due_date}`).join('\n')}

RECENT SCAN RESULTS:
${pipeline.recentMatches.map(m =>
  `- ${m.company}: "${m.ai_summary}" (score ${m.ai_score}/10) — found ${m.scanned_at}`
).join('\n')}

Your job:
- Give specific, actionable advice — never generic platitudes
- Draft messages on request that sound like a sharp executive, not AI copy
- Flag urgency when something needs immediate action
- Be direct about what isn't working and what to do instead
`;

export async function POST(req) {
  const { messages, userId } = await req.json();

  const [profile, pipeline] = await Promise.all([
    getUserProfile(userId),
    getPipelineState(userId),
  ]);

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 2048,
    system: SYSTEM_PROMPT(profile, pipeline),
    messages,
    tools: RECRUITER_TOOLS,   // see tool definitions below
    stream: true,
  });

  return streamResponse(response);  // stream back to UI
}
```

**Tool definitions Claude can call during chat:**

```javascript
const RECRUITER_TOOLS = [
  {
    name: 'update_company_stage',
    description: 'Update the pipeline stage for a target company',
    input_schema: {
      type: 'object',
      properties: {
        company_name: { type: 'string' },
        stage: { type: 'string', enum: ['Applied', 'Responded', 'Interview', 'Offer', 'Closed'] },
        notes: { type: 'string' },
      },
      required: ['company_name', 'stage'],
    },
  },
  {
    name: 'schedule_follow_up',
    description: 'Schedule a follow-up reminder for a contact or company',
    input_schema: {
      type: 'object',
      properties: {
        contact_name: { type: 'string' },
        due_date: { type: 'string', description: 'ISO date string' },
        action: { type: 'string' },
      },
      required: ['contact_name', 'due_date', 'action'],
    },
  },
  {
    name: 'add_company',
    description: 'Add a new company to the user\'s watchlist',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        career_page_url: { type: 'string' },
        sector: { type: 'string' },
        fit_score: { type: 'number' },
      },
      required: ['name', 'career_page_url'],
    },
  },
  {
    name: 'get_company_scan_history',
    description: 'Get recent scan results for a specific company',
    input_schema: {
      type: 'object',
      properties: { company_name: { type: 'string' } },
      required: ['company_name'],
    },
  },
];
```

---

### Pattern 2: Daily Briefing (Proactive, Scheduled)

Runs every morning at 7am in the user's timezone. No user input — Claude generates
a prioritized action list based on current pipeline state and sends it by email.

```javascript
// workers/briefing-worker.js

async function generateDailyBriefing(userId) {
  const [profile, pipeline, overdue, newMatches] = await Promise.all([
    getUserProfile(userId),
    getPipelineState(userId),
    getOverdueFollowUps(userId),
    getNewScanMatches(userId, { since: daysAgo(1) }),
  ]);

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: `
        Generate today's job search briefing for this executive.

        OVERDUE FOLLOW-UPS (${overdue.length}):
        ${overdue.map(f => `- ${f.contact_name} at ${f.firm} — ${f.action} (due ${f.due_date})`).join('\n')}

        NEW SCAN MATCHES SINCE YESTERDAY:
        ${newMatches.length === 0 ? 'None' : newMatches.map(m =>
          `- ${m.company}: ${m.ai_summary}`
        ).join('\n')}

        PIPELINE SUMMARY:
        - Hot leads (stage = Responded or Interview): ${pipeline.hot.map(c => c.name).join(', ')}
        - Idle (no contact > 14 days): ${pipeline.idle.map(c => c.name).join(', ')}
        - Not yet contacted (fit 8+): ${pipeline.untouched.map(c => c.name).join(', ')}

        Write a sharp, direct 3-5 item action list for today. Lead with the highest-leverage
        action. Be specific — name companies and people. No generic advice.
        Format as a numbered list. Under 200 words total.
      `,
    }],
  });

  const briefingText = response.content[0].text;

  await sendEmail({
    to: profile.email,
    subject: `Your search briefing — ${todayFormatted()}`,
    body: briefingTemplate(briefingText, overdue, newMatches),
  });
}
```

---

### Pattern 3: Outreach Drafting (On-Demand)

User says "draft a LinkedIn message to the Simpplr CEO" in chat, or clicks
"Draft Outreach" on a company card. Claude writes something that sounds like
the user, not like AI.

```javascript
async function draftOutreach({ userId, targetName, targetTitle, company, channel }) {
  const profile = await getUserProfile(userId);
  const companyRecord = await getCompany(userId, company);

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 500,
    system: `
      You are writing on behalf of ${profile.name}.
      Their background: ${profile.positioning_summary}
      Their resume highlights: ${profile.resume_text.slice(0, 2000)}

      Writing rules — these are non-negotiable:
      - Sound like a sharp executive, not a job seeker
      - No AI-sounding phrases: "I hope this finds you well", "I wanted to reach out",
        "leveraging", "synergies", "passionate about"
      - Lead with something specific about their company or recent news
      - State a concrete value thesis — what would you do for them, specifically
      - Under 100 words for LinkedIn. Under 150 words for email.
      - End with a single low-friction ask (20 minutes, a call)
    `,
    messages: [{
      role: 'user',
      content: `
        Draft a ${channel} message to ${targetName}, ${targetTitle} at ${company}.

        What I know about this company:
        - Sector: ${companyRecord.sector}
        - Fit score: ${companyRecord.fit_score}/10
        - Notes: ${companyRecord.contact_notes || 'none'}

        Channel: ${channel}
        Warm intro available: no — this is cold outreach
      `,
    }],
  });

  return response.content[0].text;
}
```

---

### Pattern 4: Scan-to-Score Pipeline (Background)

When the Playwright scanner finds a keyword hit, Claude evaluates it before
alerting the user — filtering noise so only real matches generate notifications.

```javascript
// workers/scan-worker.js  (extends existing check-careers.js logic)

async function scoreHit(hit, userProfile) {
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',  // fast + cheap for batch scoring
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: `
        Job search hit to evaluate:
        "${hit.text}" — found on ${hit.company} careers page

        Candidate targets: ${userProfile.target_titles.join(', ')}
        Candidate sectors: ${userProfile.target_sectors.join(', ')}

        Score 1-10: is this a real job posting matching the candidate's target titles?
        1 = marketing copy / false positive, 10 = exact title match, clearly a job posting.

        Respond with JSON only: {"score": N, "summary": "one line"}
      `,
    }],
  });

  return JSON.parse(response.content[0].text);
}

async function runScan(userId) {
  const [profile, companies] = await Promise.all([
    getUserProfile(userId),
    getUserCompanies(userId),
  ]);

  for (const company of companies) {
    const hits = await scrapeCareerPage(company.career_page_url);

    for (const hit of hits) {
      const { score, summary } = await scoreHit(hit, profile);

      await saveScanResult({ companyId: company.id, hit, score, summary });

      if (score >= 7) {
        await queueNotification(userId, {
          type: 'match',
          company: company.name,
          summary,
          score,
          url: company.career_page_url,
        });
      }
    }
  }
}
```

Note: uses `claude-haiku-4-5-20251001` for batch scoring (fast, cheap) and
`claude-opus-4-7` for the chat and briefing (best reasoning quality).

---

### Pattern 5: Triggering Event Intelligence (Background, Daily)

Runs daily before the briefing worker. Queries NewsAPI for each watched company,
classifies signals with Claude Haiku, stores results, and surfaces them in the briefing.

```javascript
// workers/signal-worker.js

async function detectSignalsForUser(userId) {
  const companies = await getUserCompanies(userId);

  for (const company of companies) {
    const articles = await fetchNewsForCompany(company.name); // NewsAPI query
    if (!articles.length) continue;

    for (const article of articles) {
      const signal = await classifySignal(article, company);
      if (!signal) continue;

      // Deduplicate: skip if same company + type + date already stored
      const exists = await checkSignalExists(company.id, signal.type, signal.date);
      if (exists) continue;

      const outreachAngle = await generateOutreachAngle(signal, company, userId);

      await saveSignal({
        companyId: company.id,
        userId,
        signalType: signal.type,
        signalSummary: signal.summary,
        sourceUrl: article.url,
        signalDate: signal.date,
        outreachAngle,
      });
    }
  }
}

async function classifySignal(article, company) {
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 150,
    messages: [{
      role: 'user',
      content: `Classify this news article about ${company.name}.
Article headline: ${article.title}
Article snippet: ${article.description}

Is this a triggering event for an executive job search? If yes, return JSON:
{"type": "funding|executive_departure|acquisition|ipo|headcount_change", "summary": "one sentence", "date": "YYYY-MM-DD"}
If not a relevant signal, return: {"type": null}`,
    }]
  });

  const result = JSON.parse(response.content[0].text);
  return result.type ? result : null;
}
```

Model: `claude-haiku-4-5-20251001` — fast and cheap for batch classification.
External dependency: NewsAPI.org (free tier: 100 requests/day; sufficient for early scale).
V2: replace with Crunchbase API for funding signals (more reliable than news parsing).

---

## Build Order

### Phase 1 — Validate (4-6 weeks, no UI)
- [ ] Externalize config: move COMPANIES and KEYWORDS to a JSON config file per user
- [ ] Add email output: send scan results to user's email instead of console
- [ ] Deploy scan worker to Railway with Mon/Thu cron
- [ ] Add daily briefing email (no Claude yet — just a formatted email of overdue items)
- [ ] 5 beta users at $49/month. Validate they find it useful.

### Phase 2 — Add AI (4-6 weeks)
- [ ] Integrate Claude API for scan scoring (Pattern 4) — filters noise before emailing
- [ ] Add Claude-generated daily briefing (Pattern 2) — replaces static email
- [ ] Add outreach draft endpoint (Pattern 3) — accessible via email reply "draft message"
- [ ] Raise price to $99/month for new signups

### Phase 3 — Web product (8-12 weeks)
- [ ] Next.js app with Supabase auth
- [ ] Dashboard UI replacing DASHBOARD.md
- [ ] Company watchlist management UI
- [ ] Chat interface with streaming (Pattern 1) — the full "your own recruiter" experience
- [ ] Stripe subscription billing
- [ ] Launch publicly at $199/month

### Phase 4 — Coach tier (4-6 weeks)
- [ ] Multi-user account management (coach sees all clients)
- [ ] Coach dashboard: all clients' pipelines in one view
- [ ] White-label option for outplacement firms
- [ ] Pricing: $499/month for up to 10 clients

---

## Cost Structure at Scale

| Service | Cost | At 100 users | At 1000 users |
|---|---|---|---|
| browserless.io | ~$0.10/session | ~$80/month | ~$800/month |
| Claude API (chat + briefing) | ~$0.05/user/day | ~$150/month | ~$1,500/month |
| Supabase | $25/month base | $25/month | ~$100/month |
| Railway (workers) | ~$20/month | $20/month | ~$80/month |
| Vercel (web) | $20/month | $20/month | $20/month |
| Resend (email) | $20/month | $20/month | $60/month |
| **Total infra** | | **~$315/month** | **~$2,560/month** |
| **Revenue at $199/month** | | **$19,900/month** | **$199,000/month** |
| **Gross margin** | | **~98%** | **~99%** |

Infrastructure is not the constraint. Customer acquisition is.

---

## What's Reusable from Hunter Today

| Hunter File | Maps To |
|---|---|
| `check-careers.js` | `workers/scan-worker.js` — core Playwright logic survives, gains multi-user config |
| `DASHBOARD.md` | Database schema + web dashboard UI |
| `job-scorecard.md` | Claude scoring prompt (Pattern 4) |
| `writing-guidelines.md` | Claude system prompt for outreach drafting (Pattern 3) |
| `.env` credential pattern | Per-user encrypted credential storage in DB |
| `COMPANIES` array | `companies` table, user-configurable via UI |
| `KEYWORDS` regex | Per-profile `target_titles` array, drives regex at scan time |
