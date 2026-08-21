## doc_id: sm-people-to-know-brief version: 1.0 date: 2026-08-21 status: ready-to-commit home: Starting Monday repo → docs/strategy/ scope: Starting Monday ONLY (MandateSignal out of scope — D14/D15 reconciliation is its own future decision) rule: a copy of this doc not committed at its home is a DRAFT

# Build Brief for Sol — People to Know: Public Names + Guided Hand-off

*Implements Options 1 and 2 from the Apollo-tension decision (Rich, 2026-08-21): show verified public-record names with evidence; hand contact-detail lookup to the user's own tools. No contact data (email/phone) is ever fetched, stored, or displayed by Starting Monday.*

## 0. The bright line (governs everything below)

Contact data flows provider → user directly, never through our servers. We display: name (public-source-verified, cited, dated) · role · why-them · links out. We never display, fetch, cache, or store: email addresses, phone numbers, or any Apollo-derived field. A grep/CI gate enforces this (PTK-4).

## 1. PTK-0 — Decisions and verifications (first)

  - **V-A (source policy).** A name may render ONLY with a public citation from the Appendix A source registry. Two-layer rule: **discovery** tools (search APIs) may FIND a page, but the **citation** is always the underlying page itself — "per Google" is never a citation, and neither is any aggregator. LinkedIn is a link-out target, never a scraped source (existing rule, restated). Confidence rule: verified name + Tier 1–4 citation → render; anything less → render the role title only. No guessed names, ever. Conflict rule: most recent Tier 1/Tier 2 source wins; a press release announcing a change beats a stale leadership page; a name REMOVED from a leadership page demotes to title-only immediately (and is itself a signal).
  - **V-B (staleness).** Every rendered name carries its source and observed date ("per acme.com/leadership, Aug 2026"). Names older than 90 days re-verify before rendering in a new brief; if re-verification fails, degrade to title-only. Executives move; a wrong name costs more trust than no name.
  - **V-C (storage shape).** Names are stored as company-scoped evidence claims (company_id · role_family · name · source_url · observed_at), refreshable and deletable — NOT as person profiles. No person-level enrichment, tracking, or history. This keeps the Starting Monday shape compatible with the MandateSignal constitution if the layer is ever reused.
  - **D-A (Rich).** Confirm the Apollo referral path: does Apollo have an affiliate/referral program we can join? One email to Apollo partnerships (three questions: referral program? listed-integration path? OEM pricing at our scale?). Until answered, the hand-off ships as a plain link — the button does not wait on the deal.

## 2. Build stories

### PTK-1 — Public names resolver

Given company + target role lane, resolve up to 3 names from allowed sources (V-A), returning name · role · source_url · observed_at. Reuses the existing scanner/source machinery (robots rules, blocked-state handling) — no new fetching stack.

  - AC1: every rendered name has citation + date; a planted uncited name fails CI.
  - AC2: unresolvable role → clean title-only fallback (current behavior), never an empty or guessed slot.
  - AC3: storage matches V-C shape; schema review confirms no person-profile table.
  - AC4: blocked/unfetchable sources degrade silently to title-only, logged.

### PTK-2 — LinkedIn deep-link builder

Per target role: a prefilled LinkedIn people-search URL (current company + title keywords). Works with or without a resolved name (name known → people search on name + company; unknown → title + company).

  - AC1: link opens the correctly filtered search for both cases.
  - AC2: pure link-out — no LinkedIn fetching anywhere in the code path (existing no-scraping test stays green).

### PTK-3 — Contact hand-off ("Find their contact details")

Per person/role: a hand-off block — LinkedIn link (primary) + "Look them up with your own Apollo account (free tier available)" link (referral-tagged once D-A resolves; plain until then).

  - AC1: hand-off links are plain outbound URLs; zero server-side Apollo API calls on any user-facing path (our internal BD Apollo usage is unaffected and stays internal).
  - AC2: trust copy renders with the block (see PTK-4 §copy).
  - AC3: click-throughs on both links are logged (aggregate counts only) — this is the demand signal that later prices the OEM decision.

### PTK-4 — Copy, gates, and surface updates

  - "People to know" section (brief + future Zone 2 column) renders: name (cited, dated) or title · one-line why-them/angle · hand-off block.
  - Trust copy (verbatim, one line, lexicon-gated): "We verify who matters from public sources. Their contact details stay theirs — reach out through LinkedIn or your own tools."
  - CI gate: no email/phone-shaped fields in user-facing schemas or payloads for people data (regex on schema + API responses); planted-violation test.
  - Claims-manifest entries for the section's language; CLR-8 lexicon pass on all new copy.
  - Update the Mo brief's §5.4 "People to know" spec to this format (cited names now allowed — it currently says titles-only; this brief supersedes that line).

## 3. Sequencing

PTK-0 (V-A/V-B/V-C are one review; D-A email sent same day) → PTK-2 + PTK-3 (small, ship first — links work even before names resolve) → PTK-1 → PTK-4 gates before any of it reaches users. Estimated scope: small; PTK-1 is the only story with real depth.

## 4. Metrics

LinkedIn link CTR and Apollo link CTR per brief (aggregate) · % of target roles resolving to a cited name · name re-verification failure rate · user answer in walkthroughs: "did you figure out who to reach and how?" If Apollo CTR is near zero after 60 days, the OEM/licensing question answers itself.

## 5. Out of scope

MandateSignal surfaces (D14/D15 untouched) · any contact-data provider integration (BYO-Apollo OAuth waits on Apollo's authorization — D-A) · person-level tracking or enrichment · automated outreach.

## 6. Appendix A — Source registry for public name citations

Every source gets a rights-register row (source · license/ToS posture · citable? · verified date), same discipline as the MandateSignal rights register. Most of this stack overlaps MandateSignal's source catalog — reuse its ingestion where it exists; build nothing twice.

### Tier 1 — Company self-declared (highest authority for CURRENT role)

  - Company leadership / about / team page (primary; its absence-diff is also a signal).
  - Company newsroom press releases (exec appointment/departure announcements).
  - Company investor-relations pages; annual report PDFs (officer lists).
  - Company blog author bios; company-published event or webinar host bios.
  - Cite: page URL + observed date. Freshness: strongest source but silently rots — V-B's 90-day re-verify exists for exactly this tier.

### Tier 2 — Regulatory / government (highest authority for EXACT title + effective date; public cos and regulated verticals)

  - SEC EDGAR: 8-K Item 5.02 (appointments/departures with effective dates), DEF 14A officer/director tables, 10-K Item 10, **Forms 3/4/5** (Section 16 insider filings — machine-readable, name + officer title, near-real-time; the single most underused exact source for public-co officers).
  - Foreign equivalents where relevant: SEDAR+ (Canada), Companies House officers register (UK — free API), EU national registers.
  - US state Secretary-of-State corporate filings (officers/registered agents; coverage varies by state).
  - IRS Form 990 Part VII (nonprofits — officers, directors, key employees).
  - SAM.gov entity registrations (gov contractors); vertical registries where they apply (FINRA BrokerCheck for finance, NPI for healthcare, state licensing boards).
  - Cite: filing URL + filing date. Note: authoritative but lagging (proxies are annual; 990s lag ~1yr) — great for verification, weaker for "current as of today."

### Tier 3 — Wire services and reputable press

  - PR Newswire / Business Wire / GlobeNewswire / Accesswire releases (company-authored — effectively Tier 1 authority on a third-party host).
  - Trade and business press (TechCrunch, industry verticals, local business journals): cite + link the article; never republish body text; respect paywalls (a paywalled citation is still a valid citation — the fact cited is the name/title, visible in headline/dek in most cases).
  - Funding/M&A announcements (name founders and named executives).

### Tier 4 — Appearances (name + role attested by a third party, weaker but citable)

  - Conference agendas and speaker pages; summit/webinar registration pages.
  - Podcast episode pages and show notes; YouTube video titles/descriptions on official channels.
  - University/association announcements (board seats, awards, alumni news).
  - Rule: Tier 4 alone renders only when nothing higher exists AND the appearance is <12 months old; prefer it as corroboration, not primary.

### Discovery layer (finders, never citations)

  - **Google Programmable Search JSON API** (the ToS-compliant way to "use Google" — scraping Google SERPs, including via SerpAPI-style services, violates Google's ToS and is off-limits per house rules).
  - Brave Search API, Exa, Bing/Azure equivalents — all fine as finders under their API terms.
  - GDELT for press coverage discovery; company-site sitemap/robots-respecting crawl (existing scanner).
  - Wayback Machine CDX (already in the MandateSignal stack as F-6): used to DATE a claim ("listed as CFO as of the June snapshot") and to detect leadership-page removals — cite the live page, use Wayback for the observed-at evidence trail.

### Explicitly NOT citable (rights or reliability)

  - LinkedIn in any scraped form (existing rule; link-out only).
  - Apollo, ZoomInfo, RocketReach, Lusha, ContactOut et al. — provider data, license-restricted.
  - Crunchbase (ToS restricts commercial reuse without a license — usable only if licensed; park it in the rights register as "pending").
  - Bloomberg/WSJ/FT executive profiles (licensed content).
  - The Org, SignalHire, and similar aggregators (unverifiable provenance; many launder scraped LinkedIn).
  - Wikipedia allowed with caution for notable execs (CC BY-SA, cite the article; verify against a Tier 1–3 source because vandalism happens). **Wikidata is CC0** and safe as a finder/corroborator; still cite the underlying source it references.
  - Generic "a Google search shows" — never; the citation is the page, not the search.

## 7. Founder items (Rich)

1.  Send the Apollo partnerships email (D-A — three questions; I can draft it).
2.  Approve the trust copy line and the "why-them" format.
3.  Align sales conversations to the new position: we provide verified names with evidence and the angle — not phone numbers. (Retires the contact-data promises logged in the call-evidence corpus §4.)
