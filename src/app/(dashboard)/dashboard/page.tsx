import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActivationStatus } from "@/lib/onboarding/activation";
import { resolveCareerMode } from "@/lib/career-mode";
import { LogoutButton } from "./logout-button";
import { HelpQuickButton } from "@/app/components/HelpQuickButton";
import { Button, Card } from "@/components/ui";
import { getStaffMember, hasAdminHeaderAccess } from "@/lib/staff";
import { DashboardPostPlacementView } from "./_components/post-placement-view";
import { canAccessFeature, getUserSubscription } from "@/lib/billing/subscription";
import { greetingInTz, fullDateInTz } from "@/lib/date";
import { FirstMileTelemetry } from "@/app/components/FirstMileTelemetry";
import { applyDashboardSignalContract } from "@/lib/intelligence/dashboard-signal-contract";
import { rankSignals } from "@/lib/intelligence/intelligence-quality";
const PAGE_SIZE = 50;

export const metadata = { title: "Dashboard" };

type DashboardPosture = "active" | "exploring" | "not_looking";

type ThreeZoneNextMove = {
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  href: string;
};

// The stored posture wins (R-4: every new user picks one on screen one); search_path
// is the fallback for accounts onboarded before posture was asked explicitly.
export function resolveThreeZoneDashboardPosture(
  searchPath: string | null,
  searchPosture?: string | null,
): DashboardPosture {
  if (searchPosture === "active" || searchPosture === "exploring" || searchPosture === "not_looking") {
    return searchPosture;
  }
  if (searchPath === "campaign") return "active";
  if (searchPath === "watcher" || searchPath === "nurture") return "exploring";
  return "not_looking";
}

export function formatDashboardSignalAge(signalDate: string, todayISO: string): string {
  const signalTime = new Date(`${signalDate}T12:00:00Z`).getTime();
  const todayTime = new Date(`${todayISO}T12:00:00Z`).getTime();
  if (!Number.isFinite(signalTime) || !Number.isFinite(todayTime)) return "recently";
  const days = Math.max(0, Math.floor((todayTime - signalTime) / 86400000));
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export function buildThreeZoneNextMove(opts: {
  posture: DashboardPosture;
  offerCompanyName?: string | null;
  interviewingCompanyName?: string | null;
  overdueCount: number;
  freshSignal?: { companyName: string | null; summary: string; href: string } | null;
  stalled: boolean;
  nextSetup?: { label: string; href: string } | null;
  companyCount: number;
  scanAgeLabel: string;
  nextScanDay: string;
}): ThreeZoneNextMove {
  const postureTouch = opts.posture === "active"
    ? "decide who to contact"
    : opts.posture === "exploring"
      ? "consider one relationship touch"
      : "save the context for later";

  if (opts.offerCompanyName) {
    return {
      eyebrow: "Your next move",
      title: `${opts.offerCompanyName} needs attention today.`,
      body: opts.posture === "active"
        ? "Review the brief and prepare the next conversation."
        : "Review the context before taking the next step.",
      cta: "Review brief",
      href: "/dashboard/briefing",
    };
  }

  if (opts.interviewingCompanyName) {
    return {
      eyebrow: "Your next move",
      title: `${opts.interviewingCompanyName} has an active conversation.`,
      body: opts.posture === "exploring"
        ? "Review the context before you respond."
        : "Review the brief and prepare the next conversation.",
      cta: "Review brief",
      href: "/dashboard/briefing",
    };
  }

  if (opts.overdueCount > 0) {
    return {
      eyebrow: "Your next move",
      title: `${opts.overdueCount} follow-up${opts.overdueCount === 1 ? " is" : "s are"} due.`,
      body: opts.posture === "not_looking"
        ? "Review what is due before taking any step."
        : "Pick the one follow-up most likely to move a relationship forward.",
      cta: "View follow-ups",
      href: "/dashboard/follow-ups",
    };
  }

  if (opts.freshSignal) {
    const company = opts.freshSignal.companyName ?? "A tracked company";
    return {
      eyebrow: "Your next move",
      title: `${company} has a fresh signal.`,
      body: `${opts.freshSignal.summary} Open the brief and ${postureTouch}.`,
      cta: "Get brief",
      href: opts.freshSignal.href,
    };
  }

  if (opts.stalled) {
    return {
      eyebrow: "Your next move",
      title: opts.posture === "active" ? "Restart with one company." : "Keep one relationship warm.",
      body: opts.posture === "active"
        ? "Pick one company and restart with a brief."
        : "Pick one company for a low-pressure touch.",
      cta: "Pick a company",
      href: "/dashboard#companies",
    };
  }

  if (opts.nextSetup) {
    return {
      eyebrow: "Your next move",
      title: `Finish ${opts.nextSetup.label}.`,
      body: "This keeps Monday calibrated to the companies and relationships that matter.",
      cta: "Finish setup",
      href: opts.nextSetup.href,
    };
  }

  return {
    eyebrow: "Your next move",
    title: opts.posture === "active"
      ? `Nothing new across your ${opts.companyCount} companies.`
      : "Nothing needs you today.",
    body: `Last checked ${opts.scanAgeLabel}. Next scan ${opts.nextScanDay}.`,
    cta: "View companies",
    href: "/dashboard#companies",
  };
}

type ProfileRow = {
  full_name: string | null;
  search_started_at: string | null;
  briefing_timezone: string | null;
  onboarding_completed_at: string | null;
  target_titles: string[] | null;
  positioning_summary: string | null;
  briefing_time: string | null;
  placed_at: string | null;
  placement_company: string | null;
  search_status: string | null;
  stall_nudge_dismissed_at: string | null;
  search_path: string | null;
  search_posture: string | null;
  role_type: string | null;
  search_persona: string | null;
};

type UserRow = {
  subscription_status: string | null;
  trial_ends_at: string | null;
  subscription_tier: string | null;
};

type SignalRow = {
  id: string;
  signal_type: string;
  signal_summary: string;
  outreach_angle?: string | null;
  signal_date: string;
  company_id: string;
  companies: { id: string; name: string } | null;
  confidence?: number | null;
  source_kind?: string | null;
};

type CompanyRow = {
  id: string;
  name: string;
  sector: string | null;
  stage: string;
  updated_at: string | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const subscription = await getUserSubscription(user.id, supabase);
  if (canAccessFeature(subscription, "coach_dashboard")) {
    redirect("/dashboard/coach");
  }

  const { data: profileRaw } = await supabase
    .from("user_profiles")
    .select(
      "full_name, search_started_at, briefing_timezone, onboarding_completed_at, target_titles, positioning_summary, briefing_time, placed_at, placement_company, search_status, stall_nudge_dismissed_at, search_path, search_posture, role_type, search_persona",
    )
    .eq("user_id", user.id)
    .single();
  const profile = profileRaw as ProfileRow | null;

  if (!profile?.onboarding_completed_at) {
    redirect("/onboarding");
  }

  const careerMode = resolveCareerMode({
    placedAt: profile?.placed_at,
    searchStatus: profile?.search_status,
  });
  if (careerMode === "post_search") {
    redirect("/dashboard/progress");
  }

  const tz = profile?.briefing_timezone ?? "UTC";
  const todayISO = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(
    new Date(),
  );
  const greeting = greetingInTz(tz);
  const today = fullDateInTz(tz);

  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const since14d = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const since70d = new Date(
    Date.now() - 70 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const [
    { data: rawCompanies },
    { data: followUps },
    { data: rawUserRow },
    { data: rawSignals },
    { data: rawPatternAlerts },
    activation,
    { count: contactCountRaw },
    { data: actCompanies },
    { data: actContacts },
    { data: actBriefs },
    { data: actFollowUps },
  ] = await Promise.all([
    supabase
      .from("companies")
      .select("id, name, sector, stage, updated_at")
      .eq("user_id", user.id)
      .is("archived_at", null),
    supabase
      .from("follow_ups")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .lte("due_date", todayISO)
      .limit(20),
    supabase
      .from("users")
      .select("subscription_status, trial_ends_at, subscription_tier")
      .eq("id", user.id)
      .single(),
    supabase
      .from("company_signals")
      .select(
        "id, signal_type, signal_summary, outreach_angle, signal_date, company_id, confidence, source_kind, companies(id, name)",
      )
      .eq("user_id", user.id)
      .neq("signal_type", "pattern_alert")
      .gte("signal_date", since7d)
      .order("signal_date", { ascending: false })
      .limit(5),
    supabase
      .from("company_signals")
      .select(
        "id, signal_type, signal_summary, outreach_angle, signal_date, company_id, confidence, source_kind, companies(id, name)",
      )
      .eq("user_id", user.id)
      .eq("signal_type", "pattern_alert")
      .gte("signal_date", since14d)
      .order("signal_date", { ascending: false })
      .limit(3),
    getActivationStatus(user.id),
    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "active")
      .not("company_id", "is", null),
    // Last-activity probes (70 days) feed the stalled state only.
    supabase
      .from("companies")
      .select("created_at")
      .eq("user_id", user.id)
      .is("archived_at", null)
      .gte("created_at", since70d),
    supabase
      .from("contacts")
      .select("created_at")
      .eq("user_id", user.id)
      .gte("created_at", since70d),
    supabase
      .from("briefs")
      .select("created_at")
      .eq("user_id", user.id)
      .gte("created_at", since70d),
    supabase
      .from("follow_ups")
      .select("created_at")
      .eq("user_id", user.id)
      .gte("created_at", since70d),
  ]);

  const allList = (rawCompanies ?? []) as CompanyRow[];
  const userRow = rawUserRow as UserRow | null;
  const { companySignals: contractCompanySignals, patternAlerts: contractPatternAlerts } =
    applyDashboardSignalContract([
      ...((rawSignals ?? []) as unknown as SignalRow[]),
      ...((rawPatternAlerts ?? []) as unknown as SignalRow[]),
    ]);
  // Signal parity contract: the signals index applies rankSignals suppression
  // (low confidence, stale, duplicate) before display, so the dashboard must
  // count and render the same visible set or the two routes disagree.
  const suppressedSignalIds = new Set(
    rankSignals(
      [...contractCompanySignals, ...contractPatternAlerts],
      { roleType: profile?.role_type, searchPersona: profile?.search_persona },
      { includeSuppressed: true },
    )
      .filter((entry) => entry.suppressed)
      .map((entry) => entry.signal.id),
  );
  const signalsDeduped = contractCompanySignals.filter(
    (signal) => !suppressedSignalIds.has(signal.id),
  );
  const patternAlerts = contractPatternAlerts.filter(
    (signal) => !suppressedSignalIds.has(signal.id),
  );

  const allActivityDates = [
    ...(actCompanies ?? []).map((r) => r.created_at),
    ...(actContacts ?? []).map((r) => r.created_at),
    ...(actBriefs ?? []).map((r) => r.created_at),
    ...(actFollowUps ?? []).map((r) => r.created_at),
  ];
  const lastActivityMs =
    allActivityDates.length > 0
      ? Math.max(...allActivityDates.map((d) => new Date(d).getTime()))
      : 0;
  const daysSinceLastAction =
    lastActivityMs > 0
      ? Math.floor((Date.now() - lastActivityMs) / 86400000)
      : null;

  const searchPath = profile?.search_path ?? null;
  const contactCount = contactCountRaw ?? 0;
  const totalCount = allList.length;
  const hasAdvancedStage = allList.some((c) =>
    ["interviewing", "applied", "offer"].includes(c.stage),
  );

  // Stalled state (Zone 1 precedence rule 4): at least 14 days into the search,
  // nothing has moved for 14 days, and no live conversation is in flight.
  // A dismissal within the last 7 days keeps it quiet.
  const dismissedAt = profile?.stall_nudge_dismissed_at;
  const dismissedDaysAgo = dismissedAt
    ? Math.floor((Date.now() - new Date(dismissedAt).getTime()) / 86400000)
    : Infinity;
  const daysSinceStart = profile?.search_started_at
    ? Math.floor((Date.now() - new Date(profile.search_started_at).getTime()) / 86400000)
    : null;
  const isStalled =
    !profile?.placed_at &&
    dismissedDaysAgo > 7 &&
    daysSinceStart !== null &&
    daysSinceStart >= 14 &&
    totalCount > 0 &&
    !hasAdvancedStage &&
    (contactCount === 0 || (daysSinceLastAction !== null && daysSinceLastAction >= 14));

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  let scannerCompletedCount = 0;
  if (allList.length > 0) {
    const companyIds = allList.map((c) => c.id);
    const { data: latestScans } = await supabase
      .from("scan_results")
      .select("company_id, scanned_at")
      .in("company_id", companyIds)
      .order("scanned_at", { ascending: false })
      .limit(companyIds.length * 3);
    scannerCompletedCount = new Set(
      (latestScans ?? []).map((row) => row.company_id),
    ).size;
  }

  const overdueCount = (followUps ?? []).length;
  const signalCount = signalsDeduped.length + patternAlerts.length;

  const isFirstRunDashboard =
    totalCount === 0 &&
    !!profile?.onboarding_completed_at &&
    !profile?.placed_at;
  const trialEndsAt = userRow?.trial_ends_at
    ? new Date(userRow.trial_ends_at)
    : null;
  const isTrialing = userRow?.subscription_status === "trialing";
  const staffMember = await getStaffMember(user.email ?? "");
  const isRothschildAdmin = hasAdminHeaderAccess(staffMember);
  const canUseOutreachHub =
    staffMember?.role === "owner" || staffMember?.role === "admin";
  const trialDaysLeft = trialEndsAt
    ? Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  const offerCompany = !profile?.placed_at
    ? (allList.find((c) => c.stage === "offer") ?? null)
    : null;
  const interviewingCompany =
    allList.find((c) => c.stage === "interviewing") ?? null;

  const weekOneNextScanDay = (() => {
    const scanDays = [1, 3, 5]; // Mon, Wed, Fri
    const d = new Date();
    for (let i = 1; i <= 7; i++) {
      const candidate = new Date(d.getTime() + i * 86400000);
      if (scanDays.includes(candidate.getUTCDay())) {
        return candidate.toLocaleDateString("en-US", {
          weekday: "long",
          timeZone: "UTC",
        });
      }
    }
    return "Monday";
  })();
  const weekOneBriefingTime = (() => {
    const raw = profile?.briefing_time;
    if (!raw) return "7:00 AM";
    const [h, m] = raw.split(":").map((n) => parseInt(n, 10));
    if (Number.isNaN(h)) return "7:00 AM";
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${String(Number.isNaN(m) ? 0 : m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
  })();

  const setupSteps = [
    {
      done: activation.a1_resume,
      label: "Upload your resume or import LinkedIn",
      href: "/dashboard/profile",
    },
    {
      done: activation.a2_company,
      label: "Add your first target company",
      href: "/dashboard/companies/new",
    },
    {
      done: activation.a3_prep_brief,
      label: "Generate your first prep brief",
      href: "/dashboard",
    },
    {
      done: activation.a4_contact,
      label: "Add your first contact",
      href: "/dashboard/contacts",
    },
    {
      done: activation.a5_briefing,
      label: "Set up your daily briefing",
      href: "/dashboard/profile",
    },
    {
      done: activation.a6_follow_up,
      label: "Log your first follow-up reminder",
      href: "/dashboard/contacts",
    },
  ];

  // Post-placement: Career Intelligence mode
  if (profile?.placed_at) {
    const placedCompany = profile?.placement_company;
    const isPaid = userRow?.subscription_status === "active";
    const tier = userRow?.subscription_tier ?? "free";
    return (
      <DashboardPostPlacementView
        greeting={greeting}
        firstName={firstName}
        today={today}
        placedCompany={placedCompany}
        isPaid={isPaid}
        tier={tier}
        totalCount={totalCount}
        allList={allList}
        canUseOutreachHub={canUseOutreachHub}
        isRothschildAdmin={isRothschildAdmin}
        profileNameOrEmail={profile?.full_name ?? user.email ?? ""}
      />
    );
  }

  const dashboardPosture = resolveThreeZoneDashboardPosture(searchPath, profile?.search_posture ?? null);
  const latestSignalByCompany = new Map<string, SignalRow>();
  for (const signal of [...signalsDeduped, ...patternAlerts]) {
    if (!latestSignalByCompany.has(signal.company_id)) {
      latestSignalByCompany.set(signal.company_id, signal);
    }
  }
  const freshSignal = signalsDeduped[0] ?? patternAlerts[0] ?? null;
  const freshSignalAge = freshSignal
    ? formatDashboardSignalAge(freshSignal.signal_date, todayISO)
    : null;
  const threeZoneNextMove = buildThreeZoneNextMove({
    posture: dashboardPosture,
    offerCompanyName: offerCompany?.name ?? null,
    interviewingCompanyName: interviewingCompany?.name ?? null,
    overdueCount,
    freshSignal: freshSignal
      ? {
          companyName: freshSignal.companies?.name ?? null,
          summary: `${freshSignal.signal_summary} - ${freshSignalAge}.`,
          href: `/dashboard/companies/${freshSignal.company_id}/prep`,
        }
      : null,
    stalled: isStalled,
    nextSetup: activation.isComplete
      ? null
      : setupSteps.find((step) => !step.done) ?? null,
    companyCount: totalCount,
    scanAgeLabel: scannerCompletedCount > 0 ? "today" : "not yet",
    nextScanDay: weekOneNextScanDay,
  });
  const targetRoles = ((profile?.target_titles as string[] | null) ?? [])
    .filter(Boolean)
    .slice(0, 3);
  const sectorByCompanyId = new Map(
    allList.map((company) => [company.id, company.sector] as const),
  );
  const companyRows = [...allList]
    .sort((a, b) => {
      const aSignal = latestSignalByCompany.get(a.id)?.signal_date ?? "";
      const bSignal = latestSignalByCompany.get(b.id)?.signal_date ?? "";
      return bSignal.localeCompare(aSignal) || a.name.localeCompare(b.name);
    })
    .slice(0, PAGE_SIZE);
  const nextBriefingLabel = profile?.briefing_time
    ? `Next briefing at ${weekOneBriefingTime}`
    : "Briefing time not set";

  return (
    <div className="relative min-h-screen overflow-hidden bg-background font-sans text-foreground">
      <FirstMileTelemetry
        eventName="dashboard_viewed"
        pageName="dashboard"
        properties={{
          company_count: totalCount,
          contact_count: contactCount,
          has_advanced_stage: hasAdvancedStage,
          onboarding_completed: true,
          is_first_run: isFirstRunDashboard,
          layout: "three_zone",
          posture: dashboardPosture,
        }}
      />

      <header className="sticky top-0 z-20 border-b border-border bg-background/72 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <span className="shrink-0 text-[13px] font-bold uppercase tracking-[0.16em] text-foreground/90">
            <span className="text-foreground">Starting </span>
            <span className="text-primary">Monday</span>
          </span>
          <Link href="/dashboard/progress" className="ml-auto text-[12px] font-semibold text-muted-foreground hover:text-foreground">
            Progress
          </Link>
          <LogoutButton label="Sign out" />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="mb-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary/90">Dashboard</p>
          <h1 className="mt-2 font-serif text-[30px] font-bold leading-tight text-foreground sm:text-[42px]">
            What should I do today?
          </h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">
            We watch your companies for signals, then turn the strongest ones into a company, people, and angle to act on.
          </p>
        </div>

        <section aria-labelledby="next-move-heading" data-first-mile-section="dashboard_next_move" className="mb-6">
          <Card variant="glass" className="p-5 sm:p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary/90">{threeZoneNextMove.eyebrow}</p>
            <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <h2 id="next-move-heading" className="text-[24px] font-bold leading-tight text-foreground sm:text-[30px]">
                  {threeZoneNextMove.title}
                </h2>
                <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-muted-foreground">{threeZoneNextMove.body}</p>
                {isTrialing && (
                  <p className="mt-3 text-[12px] font-semibold text-muted-foreground">
                    Trial: day {Math.max(1, 30 - trialDaysLeft)} of 30. You keep your data when the trial ends.
                  </p>
                )}
              </div>
              <Button className="min-h-[44px] px-5 text-[13px] font-semibold" render={<Link href={threeZoneNextMove.href} data-dashboard-action="next_move" />}>
                {threeZoneNextMove.cta}
              </Button>
            </div>
          </Card>
        </section>

        <section id="companies" aria-labelledby="companies-heading" data-first-mile-section="dashboard_companies" className="mb-6 scroll-mt-24">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary/90">Your companies</p>
              <h2 id="companies-heading" className="mt-1 text-[22px] font-bold text-foreground">Company, people, angle.</h2>
              <p className="mt-1 text-[12px] text-muted-foreground">Signals mean a role may be forming before it is posted.</p>
            </div>
            <Link href="/dashboard/companies/new" className="text-[13px] font-semibold text-primary">
              Add company
            </Link>
          </div>

          {companyRows.length === 0 ? (
            <Card variant="glass" className="p-5">
              <p className="text-[15px] font-semibold text-foreground">Add a company you would want to be shortlisted at.</p>
              <p className="mt-1 text-[13px] text-muted-foreground">We start watching it today and tell you when something matters.</p>
              <Button className="mt-4 min-h-[44px] text-[13px]" render={<Link href="/dashboard/companies/new" />}>
                Add company
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {companyRows.map((company) => {
                const latestSignal = latestSignalByCompany.get(company.id);
                const signalAge = latestSignal ? formatDashboardSignalAge(latestSignal.signal_date, todayISO) : null;
                return (
                  <Card key={company.id} variant="glass" className="p-4 sm:p-5">
                    <div className="grid gap-4 lg:grid-cols-[1.1fr_1.4fr_1.2fr_auto] lg:items-center">
                      <div>
                        <p className="text-[15px] font-semibold text-foreground">{company.name}</p>
                        <p className="mt-0.5 text-[12px] text-muted-foreground">{sectorByCompanyId.get(company.id) ?? "Sector not set"}</p>
                      </div>
                      <div>
                        <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Latest signal</p>
                        <p className="mt-1 text-[13px] leading-relaxed text-foreground">
                          {latestSignal ? `${latestSignal.signal_summary} - ${signalAge}` : "No fresh signal this week."}
                        </p>
                      </div>
                      <div>
                        <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Who to know</p>
                        <p className="mt-1 text-[13px] leading-relaxed text-foreground">
                          {targetRoles.length > 0 ? targetRoles.join(", ") : "Add target role titles in your profile."}
                        </p>
                      </div>
                      <Link href={`/dashboard/companies/${company.id}/prep`} data-dashboard-action="company_brief" className="inline-flex min-h-[44px] items-center justify-center rounded border border-primary/30 px-4 text-[13px] font-semibold text-primary hover:text-foreground">
                        Get brief
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        <section aria-labelledby="week-heading" data-first-mile-section="dashboard_this_week" className="mb-10">
          <Card variant="glass" className="p-4 sm:p-5">
            <div className="mb-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary/90">This week</p>
              <h2 id="week-heading" className="mt-1 text-[20px] font-bold text-foreground">Quiet operating strip.</h2>
              <p className="mt-1 text-[12px] text-muted-foreground">Only the weekly numbers that change action.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Link href="/dashboard/follow-ups" className="rounded border border-border bg-muted/40 p-3">
                <span className="block text-[22px] font-bold text-foreground">{overdueCount}</span>
                <span className="text-[12px] text-muted-foreground">follow-ups due</span>
              </Link>
              <Link href="/dashboard/signals" className="rounded border border-border bg-muted/40 p-3">
                <span className="block text-[22px] font-bold text-foreground">{signalCount}</span>
                <span className="text-[12px] text-muted-foreground">new signals this week</span>
              </Link>
              <Link href="/dashboard/profile#section-briefing" className="rounded border border-border bg-muted/40 p-3">
                <span className="block text-[14px] font-bold text-foreground">{nextBriefingLabel}</span>
                <span className="text-[12px] text-muted-foreground">briefing time</span>
              </Link>
            </div>
          </Card>
        </section>
      </main>
      <HelpQuickButton source="dashboard" href="/settings/help#how-this-works" />
    </div>
  );
}
