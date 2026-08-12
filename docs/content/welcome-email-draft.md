# Post-Onboarding Welcome Email - Draft for Rich's Review

Ticket: SMK-462
Source: Manager Tools trial feedback (Judd, Aug 11 2026) - "An email acknowledging what I've done and welcoming me to the app would be amazing. It's also my chance to meet you and answer 'Who am I putting my job search in the hands of?'"
Status: DRAFT - needs Rich's edits and sign-off before implementation. Founder note reuses Option B from `managertools-founder-note-draft.md` (also pending sign-off).

Send trigger: within minutes of onboarding completion (from `completeOnboarding()` or the onboarding automation surface), via Resend.
Personalization variables shown as `{curly_braces}` - all available from `user_profiles` at completion time.

---

**Subject:** Your search is set up. Here's what happens next.

**From:** Rich Rothschild <richard@startingmonday.app>

---

{first_name},

Your setup is done, and your search is now running. Here's what we understood:

- **You:** {current_title}{, at {current_company} if present}
- **Targeting:** {target_titles, first 3}
- **Watching:** {company_names, comma-separated}

**What happens next**

- **Tomorrow at {briefing_time}:** your first briefing arrives. It covers movement at the companies you're watching - leadership changes, funding, signals that a role may be taking shape - and what to do about it.
- **This week:** we'll surface your first relationship move - a specific person worth knowing at one of your target companies, with a draft note to start from.
- **Every week:** your shortlist sharpens as we learn which signals matter for your targets.

Nothing you entered is shared with recruiters, employers, or anyone else. Your search stays private.

**Who am I?**

I spent twenty years as a Transformation CIO before I went into search. I built Starting Monday after running my own C-suite campaign and finding the process broken: the job boards and recruiters existed, but nothing gave me an early, private read on where a role was headed. This is still early, and I read every reply.

If you'd like to walk through the product together, grab a time: calendly.com/richard-startingmonday

- Rich Rothschild, Founder

---

## Notes for Rich

1. **This is transactional, not marketing.** Recommend sending regardless of the email-nudges opt-in (`drip_unsubscribed_at`) - it acknowledges an action the user just took and sets expectations. Flag if you disagree.
2. The "Tomorrow at {briefing_time}" line is a promise the product must keep. If the first briefing can miss that window for any signup time (e.g. completed onboarding at 11 PM), we should compute and state the actual first-briefing time instead.
3. For passive-track users (`briefing_frequency` weekly), swap the first bullet for the Sunday digest framing.
4. Judd also asked for this in-app: the done screen already previews next steps; the email is the piece that survives after the tab closes.
