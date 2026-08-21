export type Diagram = {
  slug: string
  title: string
  description: string
  category: string
  mermaidCode: string
}

export type DiagramCategory = {
  label: string
  diagrams: Diagram[]
}

export const DIAGRAM_CATEGORIES: DiagramCategory[] = [
  {
    label: 'User Flows',
    diagrams: [
      {
        slug: 'site-overview',
        title: 'Site Overview',
        description: 'Full user journey from landing page through authentication to the dashboard',
        category: 'User Flows',
        mermaidCode: `flowchart TD
    VIS(["Visitor"]) --> LP["Landing /"]
    LP --> SU["/signup"]
    LP --> LI["/login"]
    SU --> CB["/auth/callback"]
    LI --> CB
    CB --> OB{"Onboarded?"}
    OB -->|No| ON["/onboarding"]
    OB -->|Yes| DB["/dashboard"]
    ON --> DB
    DB --> FEAT["Dashboard features"]
    DB --> BL["/settings/billing"]
    DB --> ADM["/admin"]

    style VIS fill:#f97316,color:#fff
    style DB fill:#1e293b,color:#fff`,
      },
      {
        slug: 'user-flows',
        title: 'User Flows',
        description: 'All pages reachable from the dashboard, including sub-pages',
        category: 'User Flows',
        mermaidCode: `flowchart LR
    DB["/dashboard"] --> BR["/briefing<br/>Daily intel brief"]
    DB --> CO["/companies<br/>Target pipeline"]
    DB --> KN["/kanban<br/>Opportunity board"]
    DB --> CT["/contacts<br/>Network + recruiters"]
    DB --> ST["/strategy<br/>Search strategy"]
    DB --> SG["/signals<br/>Intel feed"]
    DB --> PR["/profile<br/>Career profile"]
    DB --> SL["/salary<br/>Salary intel"]
    DB --> OF["/offers<br/>Offer tracking"]
    DB --> PC["/positioning-coach<br/>AI coaching"]
    DB --> OR["/opportunity-radar<br/>Radar viz"]
    CO --> CP["/companies/[id]/prep<br/>Interview prep brief"]
    PR --> PT["/profile/tailor<br/>Resume tailoring"]

    style DB fill:#1e293b,color:#fff`,
      },
      {
        slug: 'onboarding',
        title: 'Onboarding',
        description: 'Multi-step onboarding form with quick-start and guided paths',
        category: 'User Flows',
        mermaidCode: `flowchart TD
    A(["User lands on /onboarding"]) --> B["Step 0: Enter name"]
    B --> C{"Quick start or guided?"}

    C -->|Quick start| E
    C -->|Guided setup| D["Step 1: Select persona<br/>C-Suite / VP / Director / Board"]

    D --> D2{"Advanced setup?"}
    D2 -->|Yes| E2["Step 2: Situation<br/>employment status + timeline"]
    D2 -->|No| E

    E2 --> E3{"Passive / opportunistic?"}
    E3 -->|Yes| E["Step 4: Target companies"]
    E3 -->|No| E4["Step 3: Import LinkedIn<br/>or manual entry"]
    E4 --> E

    E --> F{"Advanced setup?"}
    F -->|Yes| G["Step 5: Briefing time"]
    F -->|No| H

    G --> H["Step 6: Done preview<br/>+ streaming intel"]

    H --> I{"Submit"}
    I -->|completeOnboarding| J[("Supabase: profile<br/>+ companies saved")]
    I -->|skipOnboarding| J

    J --> K(["Redirect to /dashboard"])

    style A fill:#f97316,color:#fff
    style K fill:#f97316,color:#fff
    style J fill:#1e293b,color:#fff`,
      },
    ],
  },
  {
    label: 'Authentication',
    diagrams: [
      {
        slug: 'authentication',
        title: 'Authentication',
        description: 'Email/password, OAuth (Google/Apple), and magic link flows',
        category: 'Authentication',
        mermaidCode: `sequenceDiagram
    participant U as User
    participant App as Next.js
    participant RL as Rate Limiter
    participant SB as Supabase Auth
    participant DB as Database

    Note over U,DB: Email / Password
    U->>App: POST /api/auth/verify-and-signin
    App->>RL: 5 req/min per IP
    RL-->>App: OK or 429
    App->>SB: signInWithPassword(email, password)
    SB-->>App: session + user
    App->>DB: fetch user_profile
    App-->>U: set-cookie + redirect /dashboard

    Note over U,DB: OAuth (Google / Apple)
    U->>App: POST /api/auth/verify-and-oauth
    App->>SB: signInWithOAuth(provider)
    SB-->>U: redirect to provider
    U->>App: GET /auth/callback?code=
    App->>SB: exchangeCodeForSession
    SB-->>App: session
    App-->>U: redirect /dashboard

    Note over U,DB: Magic Link
    U->>App: POST /api/auth/verify-and-magic-link
    App->>SB: signInWithOtp(email)
    SB-->>U: email with link
    U->>App: GET /auth/callback#token
    App->>SB: verifyOtp(token)
    App-->>U: redirect /dashboard`,
      },
    ],
  },
  {
    label: 'AI and Intelligence',
    diagrams: [
      {
        slug: 'briefing-generation',
        title: 'Briefing Generation',
        description: 'Nightly cron job assembles context per user and delivers via email',
        category: 'AI and Intelligence',
        mermaidCode: `flowchart TD
    CJ(["Cron: briefing-job"]) --> TZ{"User timezone<br/>+ scheduled time?"}
    TZ -->|Match| AC["Assemble context"]
    TZ -->|No match| SK(["Skip user"])

    AC --> PRF["User profile<br/>+ positioning"]
    AC --> SCN["Scan results<br/>career page hits"]
    AC --> SIG["Signals<br/>news + funding + exec changes"]
    AC --> CON["Contacts<br/>recent activity"]
    AC --> PIP["Pipeline velocity<br/>interview stage"]

    PRF & SCN & SIG & CON & PIP --> CL["Claude Sonnet<br/>generate briefing"]
    CL --> TPL["Handlebars<br/>email template"]
    TPL --> RS["Resend API<br/>send email"]
    RS --> LOG[("Log to briefs table")]
    RS --> TRK["Tracking pixel<br/>+ click links"]

    style CJ fill:#1e293b,color:#fff
    style SK fill:#94a3b8,color:#fff
    style CL fill:#f97316,color:#fff`,
      },
      {
        slug: 'prep-brief-generation',
        title: 'Prep Brief Generation',
        description: 'On-demand streaming brief for a target company, gated by subscription tier',
        category: 'AI and Intelligence',
        mermaidCode: `sequenceDiagram
    participant U as User
    participant API as /api/prep/[id]
    participant Guard as Feature Guard
    participant DB as Supabase
    participant CL as Claude Opus/Sonnet

    U->>API: GET /api/prep/[id] (stream)
    API->>Guard: auth + tier + rate limit
    Guard-->>API: OK or 403/429
    API->>DB: company + user profile
    API->>DB: contacts + scan results
    API->>DB: signals (90 days)
    API->>DB: company documents
    DB-->>API: full context
    API->>CL: stream request with context
    CL-->>API: markdown chunks
    API-->>U: SSE stream to browser
    API->>DB: log to llm_traces
    Note over API,CL: Sections: background, challenges, priorities, questions, tech-stack, leadership, competitive`,
      },
      {
        slug: 'signals-intelligence',
        title: 'Signals and Intelligence',
        description: 'Multi-source data ingestion, Haiku classification, and user feed',
        category: 'AI and Intelligence',
        mermaidCode: `flowchart TD
    SJ(["Cron: signal-job"]) --> S1["GNews / RSS<br/>news articles"]
    SJ --> S2["Crunchbase<br/>funding rounds"]
    SJ --> S3["People Data Labs<br/>exec changes"]
    SJ --> S4["SEC EDGAR<br/>8-K filings"]
    S1 & S2 & S3 & S4 --> CL["Claude Haiku<br/>classify + summarize"]
    CL --> T1["funding_round"]
    CL --> T2["exec_change"]
    CL --> T3["hiring_surge"]
    CL --> T4["reorg"]
    CL --> T5["product_launch"]
    T1 & T2 & T3 & T4 & T5 --> DB[("company_signals")]
    DB --> AL["Email alert via Resend"]
    DB --> FD["Signals feed /signals"]
    DB --> BR["Included in next briefing"]

    style SJ fill:#1e293b,color:#fff
    style CL fill:#f97316,color:#fff`,
      },
    ],
  },
  {
    label: 'Revenue',
    diagrams: [
      {
        slug: 'revenue-billing',
        title: 'Revenue and Billing',
        description: 'Stripe checkout flow, webhook processing, and subscription-based feature gating',
        category: 'Revenue',
        mermaidCode: `flowchart TD
    U(["User"]) --> PP["Pricing page"]
    PP --> CH["POST /api/billing/checkout<br/>create Stripe session"]
    CH --> ST["Stripe Checkout"]
    ST --> WH["POST /api/webhooks/stripe"]
    WH --> E1["checkout.session.completed"]
    WH --> E2["subscription.updated"]
    WH --> E3["subscription.deleted"]
    WH --> E4["invoice.payment_failed"]
    E1 --> DB[("Update users table<br/>tier + status")]
    E2 --> DB
    E3 --> DB
    E4 --> DB
    DB --> FG["requireFeatureAccess"]
    FG --> T1["free: pipeline only"]
    FG --> T2["passive $49: scan + alerts"]
    FG --> T3["active $129-199: AI + prep + outreach"]
    FG --> T4["executive $249-499: Opus + daily scan + salary"]

    style U fill:#f97316,color:#fff
    style ST fill:#635bff,color:#fff
    style DB fill:#1e293b,color:#fff`,
      },
    ],
  },
  {
    label: 'Infrastructure',
    diagrams: [
      {
        slug: 'integrations',
        title: 'Integrations',
        description: 'All external services connected to the Next.js app and background worker',
        category: 'Infrastructure',
        mermaidCode: `flowchart LR
    APP["Next.js App"] <--> SB[("Supabase<br/>DB + Auth")]
    APP --> STR["Stripe<br/>billing"]
    APP --> RSD["Resend<br/>email"]
    APP --> ANT["Anthropic<br/>Claude API"]
    APP --> SNT["Sentry<br/>errors"]
    APP --> PHG["PostHog<br/>analytics"]
    APP --> GCA["Google Calendar<br/>OAuth"]
    STR --> APP

    WRK["Worker"] <--> SB
    WRK --> RSD
    WRK --> ANT
    WRK --> BWL["browserless.io<br/>career page scraping"]
    WRK --> GNW["GNews<br/>news articles"]
    WRK --> CBF["Crunchbase<br/>funding data"]
    WRK --> PDL["People Data Labs<br/>exec roster"]
    WRK --> SEC["SEC EDGAR<br/>8-K filings"]

    style APP fill:#1e293b,color:#fff
    style WRK fill:#1e293b,color:#fff
    style SB fill:#f97316,color:#fff`,
      },
      {
        slug: 'observability-sre',
        title: 'Observability and SRE',
        description: 'API request guard chain, structured logging, and worker reliability patterns',
        category: 'Infrastructure',
        mermaidCode: `flowchart TD
    REQ(["API Request"]) --> AH["requireAuth<br/>validate session"]
    AH --> FA["requireFeatureAccess<br/>tier + rate limit"]
    FA --> ZD["Zod validation"]
    ZD --> BL["Business logic"]
    BL --> OK(["200 OK"])
    BL --> ERR{"Error"}
    ERR --> E401["401 Unauthorized"]
    ERR --> E403["403 Feature gate"]
    ERR --> E429["429 Rate limited"]
    ERR --> E500["500 + Sentry report"]
    BL --> TR[("llm_traces<br/>AI call log")]
    BL --> CW["CloudWatch<br/>JSON structured log"]

    WRK(["Worker job"]) --> AL["Advisory lock<br/>prevent duplicates"]
    AL --> TO["Job timeout guard"]
    TO --> JB["Job logic"]
    JB --> SNT["Sentry"]
    JB --> OW["Owner alert on failure"]

    style REQ fill:#f97316,color:#fff
    style WRK fill:#1e293b,color:#fff`,
      },
    ],
  },
]
