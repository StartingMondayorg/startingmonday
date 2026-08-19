# Google Calendar Integration Plan

This document captures the current reminder workflow and the recommended path to move from file-based calendar imports to a true Google Calendar API sync.

## Current Baseline

Today, calendar reminders are generated as `.ics` files and imported into Google Calendar manually.

- [public/calendar/starting-monday-outreach-reminders.ics](../public/calendar/starting-monday-outreach-reminders.ics)
- [startingmonday-posting-reminders.ics](operations/reminders/startingmonday-posting-reminders.ics)

This is reliable, low-risk, and works well for one-off or quarterly schedules.

## Recommended Target

Build a Google Calendar sync that creates and updates reminder events directly from the app or worker.

### Preferred auth model

- Use Google OAuth for the connected user calendar.
- Store refresh tokens encrypted in Supabase.
- Fall back to `.ics` export if the Google connection is not authorized.

### Why this path

- Works for a personal Google Calendar.
- Avoids manual import steps.
- Lets the app update, cancel, or deduplicate events when the schedule changes.
- Keeps the current `.ics` workflow as a safe fallback.

## Proposed Architecture

### Data model

Add a small sync layer in Supabase or the existing app database:

- `calendar_integrations`
  - `id`
  - `user_id`
  - `provider` (`google`)
  - `calendar_id`
  - `access_token_encrypted`
  - `refresh_token_encrypted`
  - `token_expiry`
  - `scopes`
  - `created_at`
  - `updated_at`

- `calendar_events`
  - `id`
  - `user_id`
  - `integration_id`
  - `source_type` (`posting_reminder`, `social_post`, `email_send`)
  - `source_id`
  - `google_event_id`
  - `title`
  - `start_at`
  - `end_at`
  - `timezone`
  - `description`
  - `status`
  - `last_synced_at`

### Sync flow

1. Generate posting reminders from the existing schedule source.
2. Map each reminder into a calendar event payload.
3. Upsert events into Google Calendar using `calendarId` and `google_event_id`.
4. Save the Google event id locally for future updates.
5. On changes, update the existing event instead of creating duplicates.
6. On disconnect, stop syncing and preserve local records.

## Implementation Plan

### Phase 1: Keep the `.ics` fallback

- Keep the current file-based reminder exports.
- Treat them as the fallback if Google auth is not connected.
- Keep importing these files into Google Calendar until API sync is ready.

### Phase 2: Add Google Calendar connection

- Add a Google OAuth connection flow.
- Request the minimum scopes needed for calendar event creation and updates.
- Add a settings page for connect / disconnect / choose calendar.

### Phase 3: Create the sync job

- Add a worker job or server action that reads upcoming reminders.
- Upsert events into the selected calendar.
- Record sync success and failures.
- Retry token refresh on authorization expiry.

### Phase 4: Add observability

- Log created, updated, skipped, and failed events.
- Show last sync time and next scheduled sync in the UI.
- Add a simple health check for calendar integration status.

## Security And Permissions

- Use least-privilege calendar scopes.
- Encrypt refresh tokens at rest.
- Allow the user to disconnect and revoke access.
- Never reuse a token for another user or calendar.

## Acceptance Criteria

- A signed-in user can connect Google Calendar.
- The app can create a reminder event in a selected calendar.
- Updates to the schedule update the same Google event, not a duplicate.
- Disconnecting Google Calendar stops future syncs.
- The existing `.ics` import file still works as a fallback.

## Recommended Next Step

If you want this built next, the cleanest order is:

1. Add the database tables.
2. Add the Google OAuth connection UI.
3. Add the sync worker/job.
4. Keep `.ics` export as a fallback for manual import.
