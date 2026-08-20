# Weekly Dashboard Automation Spec

This file defines how to automatically track thresholds from the agent org chart in Notion and HubSpot.

## 1) Data model

Primary table (Notion): Weekly Agent Dashboard

Required properties
- Week Start (date)
- Metric Key (text)
- Agent Role (select)
- Metric Name (text)
- Threshold Operator (select: >=, <=)
- Threshold Value (number)
- Actual Value (number)
- Variance (formula)
- Status (formula)
- Source System (select)
- Source Field (text)
- Owner (person/text)
- Action If Breached (text)
- Notes (text)

Formula guidance
- Variance formula:
  - if operator is >= then Actual Value - Threshold Value
  - if operator is <= then Threshold Value - Actual Value
- Status formula:
  - GREEN if threshold passed
  - RED if threshold failed
  - PENDING if Actual Value is empty

## 2) HubSpot mapping

Use [notion-hubspot-property-map.csv](notion-hubspot-property-map.csv) as source of truth.

HubSpot entities used
- contacts
- deals
- activities
- meetings
- tasks
- workflows
- accounts

Custom HubSpot properties to create (if missing)
- required_fields_complete_pct
- next_step_with_date_pct
- followup_sla_24h_pct
- lead_reply_pct
- positive_reply_pct
- call_booked_pct
- compliance_incident_count
- partner_meeting_to_pilot_pct
- inactive_partner_30d_count

## 3) Update schedule

Daily sync (Mon-Fri, 7:00 local)
- Pull source metrics from HubSpot, PostHog, Stripe, Resend
- Write Actual Value for all mapped metric_key rows
- Recompute Variance and Status in Notion

Friday pre-review sync (16:00 local)
- Force full refresh for all metrics
- Export CSV snapshot to docs/business/assets/tmp/weekly-dashboard-snapshot-YYYY-MM-DD.csv

## 4) Alert rules

Immediate alerts to founder when any of these fail 2 consecutive weeks
- global_outreach_to_call < 5
- global_trial_to_paid < 15
- global_week2_activation < 50

Daily alert for data integrity
- analytics_event_coverage < 95
- analytics_break_detect_time > 24

## 5) Implementation sequence

1. Import [weekly-agent-dashboard-template.csv](weekly-agent-dashboard-template.csv) into Notion database.
2. Create/verify HubSpot properties listed above.
3. Run the snapshot exporter using metric_key as id:
  - `npm run growth:agent-dashboard:snapshot`
  - strict mode: `npm run growth:agent-dashboard:snapshot:strict`
  - optional week override: `npm run growth:agent-dashboard:snapshot -- --week-start=2026-07-06`
4. Wire this command into your scheduler (GitHub Action, cron, or Railway job) for daily and Friday refresh.
5. Run 7-day dry run and validate status outputs.
6. Move to production cadence.

Required environment variables for automated pulls
- `HUBSPOT_PRIVATE_APP_TOKEN`
- `POSTHOG_PROJECT_ID`
- `POSTHOG_PERSONAL_API_KEY`
- `STRIPE_SECRET_KEY`

Optional environment variables
- `POSTHOG_HOST` (defaults to `https://us.i.posthog.com`)
- `HUBSPOT_BASE_URL` (defaults to `https://api.hubapi.com`)
- `HUBSPOT_TRIAL_STARTED_STAGE_ID` (enables `global_trial_starts`)
- `HUBSPOT_PARTNER_MEETING_TAG` (enables `partner_meetings` based on title tag)

## 6) Ownership and QA

- System owner: Executive Control-Tower Agent
- Data QA owner: Growth Analytics Agent
- CRM QA owner: Revenue Operations Agent

Weekly QA checklist
- 100% metric rows updated before Friday review
- No blank Actual Value for mapped automated metrics
- Threshold and operator unchanged from template unless founder-approved
