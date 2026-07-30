import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActivationStatus } from "@/lib/activation";
import { resolveCareerMode } from "@/lib/career-mode";
import { LogoutButton } from "./logout-button";
import { HelpQuickButton } from "@/components/HelpQuickButton";
import {
  saveQuickProfile,
  saveWeeklyGoal,
  dismissStallNudge,
} from "./profile/actions";
import { markPlaced } from "./placed/actions";
import { OpportunityRadar } from "./opportunity-radar";
import { ActivityChart, type WeekActivity } from "@/components/ActivityChart";
import {
  PipelineVelocity,
  type VelocityRow,
} from "@/components/PipelineVelocity";
import {
  DailyMomentumPlan,
  type DailyMomentumAction,
} from "@/components/DailyMomentumPlan";
import { getStaffMember, hasAdminHeaderAccess } from "@/lib/staff";
import { DashboardPipelineSection } from "./dashboard-pipeline-section";
import { DashboardDisclosureSection } from "./dashboard-disclosure-section";
import { DashboardStatusBanners } from "./dashboard-status-banners";
import { DashboardProfileIntelligenceSection } from "./dashboard-profile-intelligence-section";
import { DashboardWelcomeNudgeSection } from "./dashboard-welcome-nudge-section";
import { DashboardAdvancedModulesSection } from "./dashboard-advanced-modules-section";
import { DashboardTopShellSection } from "./dashboard-top-shell-section";
import { DashboardCampaignFoundationSection } from "./dashboard-campaign-foundation-section";
import { DashboardProgressFeedSection } from "./dashboard-progress-feed-section";
import { buildExecutiveRiskModel } from "./dashboard-executive-risk-utils";
import { buildDailyMomentumActions } from "./dashboard-momentum-actions";
import {
  WarmPathsSection,
  PatternAlertsSection,
  CompanySignalsSection,
} from "./dashboard-signal-sections";
import { DashboardPostPlacementView } from "./dashboard-post-placement-view";
import { DashboardDecisionTimelineSection } from "./dashboard-decision-timeline-section";
import {
  OnDemandScanButton,
  OnDemandEnrichButton,
} from "./dashboard-on-demand-actions";
import { updateDecisionOwner } from "./actions";
import {
  decisionMarkerForStage,
  extractDecisionOwnerFromNotes,
} from "./dashboard-decision-timeline-utils";
import { bumpWeek, getWeekMonday, weekLabel } from "./dashboard-week-utils";
import { canAccessFeature, getUserSubscription } from "@/lib/subscription";
import { greetingInTz, fullDateInTz } from "@/lib/date";
import { FirstMileTelemetry } from "@/components/FirstMileTelemetry";
import { applyDashboardSignalContract } from "@/lib/dashboard-signal-contract";
import { rankSignals } from "@/lib/intelligence-quality";
import { stripStaleRelativeTime } from "@/lib/follow-up-copy";

// Full class strings - must not be constructed dynamically (Tailwind scanner needs to see them)
const STAGE: Record<string, { label: string; cls: string }> = {
  watching: { label: "Watching", cls: "bg-white/10 text-slate-300" },
  researching: { label: "Researching", cls: "bg-blue-500/15 text-blue-200" },
  applied: { label: "In Process", cls: "bg-indigo-500/15 text-indigo-200" },
  interviewing: {
    label: "Interviewing",
    cls: "bg-amber-500/15 text-amber-200",
  },
  offer: { label: "Offer", cls: "bg-emerald-500/15 text-emerald-200" },
};

const PAGE_SIZE = 50;

export const metadata = { title: "Dashboard" };

export function shouldRedirectToStartDashboard(opts: {
  isFirstRunDashboard: boolean;
  hasSeenFirstRun: boolean;
  focus: string | undefined;
}) {
  return (
    opts.isFirstRunDashboard && !opts.hasSeenFirstRun && opts.focus !== "main"
  );
}

type ProfileRow = {
  full_name: string | null;
  search_started_at: string | null;
  briefing_timezone: string | null;
  onboarding_completed_at: string | null;
  target_titles: string[] | null;
  target_sectors: string[] | null;
  target_locations: string[] | null;
  resume_text: string | null;
  positioning_summary: string | null;
  briefing_time: string | null;
  briefing_frequency: string | null;
  current_title: string | null;
  placed_at: string | null;
  placement_company: string | null;
  search_status: string | null;
  weekly_goal: number | null;
  stall_nudge_dismissed_at: string | null;
  search_path: string | null;
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
  fit_score: number | null;
  notes: string | null;
  updated_at: string | null;
  career_page_url?: string | null;
};

type ContactStatRow = {
  company_id: string | null;
  enrichment_source?: string | null;
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    stage?: string;
    page?: string;
    profile_saved?: string;
    focus?: string;
    preview?: string;
    timelinePage?: string;
    timelineSort?: string;
  }>;
}) {
  const {
    q,
    stage,
    page: pageParam,
    profile_saved,
    focus,
    preview,
    timelinePage: timelinePageParam,
    timelineSort: timelineSortParam,
  } = await searchParams;
  const page = Math.max(0, parseInt(pageParam ?? "0", 10) || 0);
  const timelinePage = Math.max(0, parseInt(timelinePageParam ?? "0", 10) || 0);
  const timelineSort =
    timelineSortParam === "recent_desc" || timelineSortParam === "name_asc"
      ? timelineSortParam
      : "stalled_desc";
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
      "full_name, search_started_at, briefing_timezone, onboarding_completed_at, target_titles, target_sectors, target_locations, resume_text, positioning_summary, briefing_time, briefing_frequency, current_title, placed_at, placement_company, search_status, weekly_goal, stall_nudge_dismissed_at, search_path, role_type, search_persona",
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
    redirect("/dashboard/post-search");
  }

  const tz = profile?.briefing_timezone ?? "UTC";
  const todayISO = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(
    new Date(),
  );
  const greeting = greetingInTz(tz);
  const today = fullDateInTz(tz);

  // Build filtered company query (server-side) with pagination
  let companyQuery = supabase
    .from("companies")
    .select(
      "id, name, sector, stage, fit_score, notes, updated_at, career_page_url",
      { count: "planned" },
    )
    .eq("user_id", user.id)
    .is("archived_at", null)
    .order("fit_score", { ascending: false, nullsFirst: false });

  if (q) companyQuery = companyQuery.ilike("name", `%${q}%`);
  if (stage) companyQuery = companyQuery.eq("stage", stage);

  const start = page * PAGE_SIZE;
  companyQuery = companyQuery.range(start, start + PAGE_SIZE - 1);

  // Stats query: total + active count (unfiltered)
  const statsQuery = supabase
    .from("companies")
    .select("id, stage, name, notes, updated_at, career_page_url")
    .eq("user_id", user.id)
    .is("archived_at", null);

  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const since14d = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const since70d = new Date(
    Date.now() - 70 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const thisMonday = (() => {
    const d = new Date();
    const day = d.getDay();
    d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  })();

  const adminClient = createAdminClient();
  const isPartnerPromise = Promise.resolve(
    adminClient
      .from("partners")
      .select("id", { count: "exact", head: true })
      .eq("email", user.email ?? "")
      .eq("is_active", true),
  )
    .then((r) => (r.count ?? 0) > 0)
    .catch(() => false);

  const [
    { data: rawCompanies, count: filteredCount },
    { data: allCompanies },
    { data: followUps },
    { data: rawUserRow },
    { data: rawSignals },
    { data: rawPatternAlerts },
    activation,
    { data: momentumData },
    { data: contactRows },
    { data: enrichmentRows },
    { count: draftReadyCount },
    { data: actCompanies },
    { data: actContacts },
    { data: actBriefs },
    { data: actFollowUps },
    { count: outreachThisWeek },
    { count: prospectContactCount },
    { data: briefedCompanyRows },
  ] = await Promise.all([
    companyQuery,
    statsQuery,
    supabase
      .from("follow_ups")
      .select("id, due_date, action, companies(name)")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .lte("due_date", todayISO)
      .order("due_date", { ascending: true })
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
    // Separate query - columns added in migration 022; returns { data: null } gracefully if not yet applied
    supabase
      .from("user_profiles")
      .select("momentum_score, momentum_computed_at")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("contacts")
      .select("company_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .not("company_id", "is", null),
    // Enrichment stats are best-effort: the enrichment_source column ships in a
    // later migration, so this query may fail on older databases. It must never
    // poison the core contact counts above.
    supabase
      .from("contacts")
      .select("company_id, enrichment_source" as never)
      .eq("user_id", user.id)
      .eq("status", "active")
      .not("company_id", "is", null),
    supabase
      .from("company_signals")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .not("outreach_draft", "is", null)
      .gte("signal_date", since14d),
    // Activity chart queries (last 10 weeks)
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
    supabase
      .from("briefs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("type", "outreach")
      .gte("created_at", thisMonday),
    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "active")
      .eq("outreach_status", "prospect"),
    supabase
      .from("briefs")
      .select("company_id")
      .eq("user_id", user.id)
      .eq("type", "prep")
      .not("company_id", "is", null)
      .limit(500),
  ]);

  const companies = rawCompanies as CompanyRow[] | null;
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
  const contactStatRows = (contactRows ?? []) as unknown as ContactStatRow[];
  const enrichmentStatRows = (enrichmentRows ??
    []) as unknown as ContactStatRow[];

  // Build weekly activity chart data (last 10 weeks)
  const weekSlots: WeekActivity[] = [];
  for (let i = 9; i >= 0; i--) {
    const d = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000);
    weekSlots.push({
      week: weekLabel(getWeekMonday(d)),
      companies: 0,
      contacts: 0,
      briefs: 0,
      followUps: 0,
    });
  }
  const weekMap = new Map(weekSlots.map((slot) => [slot.week, slot]));
  for (const r of actCompanies ?? [])
    bumpWeek(weekMap, r.created_at, "companies");
  for (const r of actContacts ?? [])
    bumpWeek(weekMap, r.created_at, "contacts");
  for (const r of actBriefs ?? []) bumpWeek(weekMap, r.created_at, "briefs");
  for (const r of actFollowUps ?? [])
    bumpWeek(weekMap, r.created_at, "followUps");

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

  // Nurture path - derived from profile; showNurtureWelcome computed after totalCount and daysSinceOnboard
  const searchPath = profile?.search_path ?? null;
  const isNurturePath = searchPath === "nurture";

  // Stall detection - pattern-specific nudge shown after 14 days of low activity
  type StallNudge = {
    headline: string;
    body: string;
    action: string;
    href: string;
  } | null;
  let stallNudge: StallNudge = null;
  const dismissedAt = profile?.stall_nudge_dismissed_at;
  const dismissedDaysAgo = dismissedAt
    ? Math.floor((Date.now() - new Date(dismissedAt).getTime()) / 86400000)
    : Infinity;
  const searchStartedAt = profile?.search_started_at
    ? new Date(profile.search_started_at)
    : null;
  const daysSinceStart = searchStartedAt
    ? Math.floor((Date.now() - searchStartedAt.getTime()) / 86400000)
    : null;
  const contactCount = contactStatRows.length;
  const totalCompanies = (allCompanies ?? []).length;
  const hasAdvancedStage = (allCompanies ?? []).some((c) =>
    ["interviewing", "applied", "offer"].includes(c.stage),
  );

  if (
    !profile?.placed_at &&
    dismissedDaysAgo > 7 &&
    daysSinceStart !== null &&
    daysSinceStart >= 14
  ) {
    if (totalCompanies > 0 && contactCount === 0) {
      stallNudge = {
        headline: "Companies tracked. No contacts added.",
        body: "Your target list is built. Adding the people you know at these companies is usually what holds the first outreach back. Even one contact changes the shape of the conversation.",
        action: "Add a contact",
        href: "/dashboard/contacts",
      };
    } else if (
      contactCount > 0 &&
      !hasAdvancedStage &&
      daysSinceLastAction !== null &&
      daysSinceLastAction >= 14
    ) {
      const hasSummary = !!profile?.positioning_summary;
      stallNudge = {
        headline: "No activity in two weeks.",
        body: hasSummary
          ? "You have contacts to work but nothing has moved. Run a strategy brief to see where the gap is."
          : "You have contacts to work but no positioning summary. That is usually what holds the first outreach back - you are not sure what to say yet.",
        action: hasSummary ? "Run strategy brief" : "Add your positioning",
        href: hasSummary ? "/dashboard/strategy" : "/dashboard/profile",
      };
    } else if (
      totalCompanies > 0 &&
      !hasAdvancedStage &&
      daysSinceLastAction !== null &&
      daysSinceLastAction >= 21
    ) {
      stallNudge = {
        headline: "Nothing has moved in three weeks.",
        body: "Every company is still at watching or researching. Either the target list needs narrowing, or the outreach has not started. Both are diagnosable.",
        action: "Run a strategy brief",
        href: "/dashboard/strategy",
      };
    }
  }

  // Pipeline velocity rows (all companies, sorted by staleness)
  const velocityRows: VelocityRow[] = (companies ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    stage: c.stage,
    updated_at: c.updated_at ?? null,
  }));

  // isPartnerPromise was started before the main await above so it ran in parallel
  const isPartner = await isPartnerPromise;
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const allList = allCompanies ?? [];
  const totalCount = allList.length;
  const scannableCount = allList.filter((c) =>
    Boolean(c.career_page_url),
  ).length;
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

  const enrichedContactRows = enrichmentStatRows.filter(
    (row) =>
      row.enrichment_source === "apollo" ||
      row.enrichment_source === "anthropic",
  );
  const enrichedCompanyIds = new Set(
    enrichedContactRows
      .map((row) => row.company_id)
      .filter(
        (value): value is string =>
          typeof value === "string" && value.length > 0,
      ),
  );
  const enrichmentQueueCount = Math.max(
    0,
    totalCount - enrichedCompanyIds.size,
  );

  const activeCount = allList.filter((c) =>
    ["interviewing", "applied", "offer"].includes(c.stage),
  ).length;
  const overdueCount = (followUps ?? []).length;
  const signalCount = signalsDeduped.length + patternAlerts.length;

  const stalledCampaignRows = velocityRows
    .map((row) => {
      if (!row.updated_at) return null;
      const daysStalled = Math.floor(
        (Date.now() - new Date(row.updated_at).getTime()) / 86400000,
      );
      if (daysStalled < 14) return null;
      return { ...row, daysStalled };
    })
    .filter((row): row is VelocityRow & { daysStalled: number } => !!row)
    .sort((a, b) => b.daysStalled - a.daysStalled);

  const cadenceScore = Math.min(100, (outreachThisWeek ?? 0) * 20);
  const followThroughScore = Math.max(0, 100 - overdueCount * 15);
  const conversionScore =
    totalCount > 0
      ? Math.min(100, Math.round((activeCount / totalCount) * 100))
      : 0;
  const campaignHealthScore = Math.round(
    cadenceScore * 0.4 + followThroughScore * 0.35 + conversionScore * 0.25,
  );
  const campaignHealthBand =
    campaignHealthScore >= 75
      ? "Strong"
      : campaignHealthScore >= 50
        ? "Watch"
        : "Needs cadence";
  const topStalledCampaigns = stalledCampaignRows.slice(0, 5);

  const decisionTimelineItemsAll = (allList ?? []).map((company) => {
    const stageLabel = STAGE[company.stage]?.label ?? company.stage;
    const updatedAtMs = company.updated_at
      ? new Date(company.updated_at).getTime()
      : null;
    const daysSinceUpdate = updatedAtMs
      ? Math.floor((Date.now() - updatedAtMs) / 86400000)
      : null;
    const stalled = (daysSinceUpdate ?? 0) >= 14;
    const marker = decisionMarkerForStage(company.stage);
    const assignedOwner =
      extractDecisionOwnerFromNotes(company.notes) ?? "Account owner";

    return {
      id: company.id,
      name: company.name,
      stageLabel,
      nextDecisionMarker: marker.marker,
      decisionWindowLabel: marker.decisionWindowLabel,
      daysSinceUpdate,
      stalled,
      ownerLabel: assignedOwner,
      href: `/dashboard/companies/${company.id}`,
    };
  });

  const decisionTimelineItemsSorted = [...decisionTimelineItemsAll].sort(
    (a, b) => {
      if (timelineSort === "name_asc") return a.name.localeCompare(b.name);
      if (timelineSort === "recent_desc")
        return (a.daysSinceUpdate ?? 0) - (b.daysSinceUpdate ?? 0);
      if (a.stalled !== b.stalled) return a.stalled ? -1 : 1;
      return (b.daysSinceUpdate ?? 0) - (a.daysSinceUpdate ?? 0);
    },
  );

  const timelinePageSize = 6;
  const timelineTotalPages = Math.max(
    1,
    Math.ceil(decisionTimelineItemsSorted.length / timelinePageSize),
  );
  const safeTimelinePage = Math.min(timelinePage, timelineTotalPages - 1);
  const decisionTimelineItems = decisionTimelineItemsSorted.slice(
    safeTimelinePage * timelinePageSize,
    safeTimelinePage * timelinePageSize + timelinePageSize,
  );
  const isFirstRunDashboard =
    totalCount === 0 &&
    !!profile?.onboarding_completed_at &&
    !profile?.placed_at;
  const cookieStore = await cookies();
  const hasSeenFirstRun = cookieStore.get("sm_first_run_seen")?.value === "1";

  if (
    shouldRedirectToStartDashboard({
      isFirstRunDashboard,
      hasSeenFirstRun,
      focus,
    })
  ) {
    redirect("/dashboard/start");
  }

  // Warm paths: contacts at companies with recent signals
  const signalCompanyIds = [
    ...new Set(
      [...signalsDeduped, ...patternAlerts]
        .map((s) => s.company_id)
        .filter(Boolean),
    ),
  ];
  type WarmPath = {
    contactId: string;
    contactName: string;
    contactTitle: string | null;
    companyId: string;
    companyName: string;
    signal: SignalRow;
  };
  let warmPaths: WarmPath[] = [];
  if (signalCompanyIds.length > 0) {
    const { data: warmContacts } = await supabase
      .from("contacts")
      .select("id, name, title, company_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .in("company_id", signalCompanyIds)
      .limit(10);
    if (warmContacts && warmContacts.length > 0) {
      const seen = new Set<string>();
      for (const ct of warmContacts) {
        if (!ct.company_id) continue;
        const sig = [...signalsDeduped, ...patternAlerts].find(
          (s) => s.company_id === ct.company_id,
        );
        if (!sig || !sig.companies) continue;
        const key = `${ct.id}-${sig.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        warmPaths.push({
          contactId: ct.id,
          contactName: ct.name,
          contactTitle: ct.title,
          companyId: ct.company_id,
          companyName: sig.companies.name,
          signal: sig,
        });
      }
      warmPaths = warmPaths.slice(0, 5);
    }
  }

  const contactCountMap = new Map<string, number>();
  for (const row of contactStatRows) {
    if (row.company_id) {
      contactCountMap.set(
        row.company_id,
        (contactCountMap.get(row.company_id) ?? 0) + 1,
      );
    }
  }

  const briefedCompanyIds = new Set(
    (briefedCompanyRows ?? [])
      .map((b) => b.company_id)
      .filter(Boolean) as string[],
  );
  const companiesWithoutContact = (allCompanies ?? []).filter(
    (c) => c.id && !contactCountMap.has(c.id),
  );
  const companiesWithoutBrief = (allCompanies ?? []).filter(
    (c) => c.id && !briefedCompanyIds.has(c.id),
  );
  const numIntelGaps = [
    companiesWithoutContact.length > 0,
    (prospectContactCount ?? 0) > 0,
    companiesWithoutBrief.length > 0,
  ].filter(Boolean).length;

  const filtered = companies ?? [];
  const totalFiltered = filteredCount ?? 0;
  const totalPages = Math.ceil(totalFiltered / PAGE_SIZE);
  const hasFilters = !!(q || stage);

  const trialEndsAt = userRow?.trial_ends_at
    ? new Date(userRow.trial_ends_at)
    : null;
  const isTrialing = userRow?.subscription_status === "trialing";
  const isExecutive = userRow?.subscription_tier === "executive";
  const isExecutivePreview = preview === "executive-v2";
  const isExecutiveMode = isExecutive || isExecutivePreview;
  const isCoach = userRow?.subscription_tier === "coach";
  const staffMember = await getStaffMember(user.email ?? "");
  const isRothschildAdmin = hasAdminHeaderAccess(staffMember);
  const canUseOutreachHub =
    staffMember?.role === "owner" || staffMember?.role === "admin";
  const roleLensLabel = isRothschildAdmin
    ? "Admin"
    : isPartner
      ? "Partner"
      : isCoach
        ? "Coach"
        : "Executive";
  const trialDaysLeft = trialEndsAt
    ? Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  const profileSections = [
    {
      label: "Identity",
      done: !!profile?.full_name,
      anchor: "section-identity",
    },
    {
      label: "Targets",
      done: ((profile?.target_titles as string[] | null)?.length ?? 0) > 0,
      anchor: "section-targets",
    },
    {
      label: "Resume",
      done: (profile?.resume_text?.length ?? 0) >= 200,
      anchor: "section-resume",
    },
    {
      label: "Positioning",
      done: (profile?.positioning_summary?.length ?? 0) >= 50,
      anchor: "section-positioning",
    },
    {
      label: "Briefing",
      done: !!profile?.briefing_time,
      anchor: "section-briefing",
    },
  ];
  const profileScore = Math.round(
    (profileSections.filter((s) => s.done).length / 5) * 100,
  );
  const nextProfileSection = profileSections.find((s) => !s.done);
  const profileHref = nextProfileSection
    ? `/dashboard/profile#${nextProfileSection.anchor}`
    : "/dashboard/profile";

  const stats = [
    {
      value: totalCount,
      label: "Companies",
      alert: false,
      amber: false,
      href: "#pipeline",
    },
    {
      value: activeCount,
      label: "Active pipeline",
      alert: false,
      amber: activeCount > 0,
      href: "#pipeline",
    },
    {
      value: signalCount,
      label: "Signals",
      alert: false,
      amber: signalCount > 0,
      href: "#briefs",
    },
    {
      value: overdueCount,
      label: "Due Now",
      alert: overdueCount > 0,
      amber: false,
      href: "#plan-panel",
    },
  ];

  const offerCompany = !profile?.placed_at
    ? (allList.find((c) => c.stage === "offer") ?? null)
    : null;
  const offerCompanies = allList.filter((c) => c.stage === "offer");
  const interviewingCompany =
    allList.find((c) => c.stage === "interviewing") ?? null;

  const daysSinceOnboard = profile?.onboarding_completed_at
    ? Math.floor(
        (Date.now() - new Date(profile.onboarding_completed_at).getTime()) /
          86400000,
      )
    : null;
  const showWeekOneBanner = daysSinceOnboard !== null && daysSinceOnboard <= 6;
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
  const showWeek3Prompt =
    daysSinceOnboard !== null &&
    daysSinceOnboard >= 18 &&
    daysSinceOnboard <= 28;
  const showNurtureWelcome =
    isNurturePath &&
    totalCount === 0 &&
    daysSinceOnboard !== null &&
    daysSinceOnboard <= 7;
  const showCampaignWelcome =
    searchPath === "campaign" &&
    totalCount === 0 &&
    daysSinceOnboard !== null &&
    daysSinceOnboard <= 7;
  const showWatcherWelcome =
    searchPath === "watcher" &&
    totalCount === 0 &&
    daysSinceOnboard !== null &&
    daysSinceOnboard <= 7;

  const momentumScore =
    typeof momentumData?.momentum_score === "number"
      ? momentumData.momentum_score
      : null;
  const momentumStatus: "low" | "medium" | "strong" =
    momentumScore !== null
      ? momentumScore >= 70
        ? "strong"
        : momentumScore >= 40
          ? "medium"
          : "low"
      : signalCount + overdueCount + activeCount >= 3
        ? "strong"
        : signalCount + overdueCount + activeCount > 0
          ? "medium"
          : "low";
  const operatingStateLabel =
    momentumStatus === "strong"
      ? "Operating state: stable"
      : momentumStatus === "medium"
        ? "Operating state: watch"
        : "Operating state: reset";

  const rolesFormingStageLabel = warmPaths[0]
    ? (STAGE[allList.find((c) => c.id === warmPaths[0].companyId)?.stage ?? ""]
        ?.label ?? null)
    : null;
  const rolesFormingIsLive = warmPaths[0]
    ? ["applied", "interviewing", "offer"].includes(
        allList.find((c) => c.id === warmPaths[0].companyId)?.stage ?? "",
      )
    : false;
  const rolesFormingHeadline = warmPaths[0]
    ? rolesFormingIsLive
      ? `New leverage for your live ${warmPaths[0].companyName} process (${rolesFormingStageLabel}).`
      : `${warmPaths[0].companyName} may be moving toward a role window.`
    : null;
  const rolesFormingCard = warmPaths[0]
    ? {
        companyName: warmPaths[0].companyName,
        summary: `${warmPaths[0].signal.signal_summary}${!rolesFormingIsLive && rolesFormingStageLabel ? ` Already in your pipeline at the ${rolesFormingStageLabel} stage.` : ""}`,
        href: "/dashboard/signals",
      }
    : signalCount > 0
      ? {
          companyName: null,
          summary:
            "Open the freshest company signal and turn it into a relationship move before the posting becomes public.",
          href: "/dashboard/signals",
        }
      : null;

  const dailyMomentumActions: DailyMomentumAction[] = buildDailyMomentumActions({
    warmPath: warmPaths[0] ?? null,
    overdueCount,
    interviewingCompany: interviewingCompany
      ? { id: interviewingCompany.id, name: interviewingCompany.name }
      : null,
    profileScore,
    profileHref,
    signalCount,
    totalCount,
    targetTitles: (profile?.target_titles as string[] | null) ?? [],
    targetSectors: (profile?.target_sectors as string[] | null) ?? [],
  });

  const sponsorCoveragePercent =
    totalCount > 0 ? Math.round((contactCountMap.size / totalCount) * 100) : 0;
  const signalToActionPercent =
    signalCount > 0
      ? Math.min(100, Math.round(((draftReadyCount ?? 0) / signalCount) * 100))
      : 0;
  const followUpSlaPercent =
    overdueCount === 0 ? 100 : Math.max(0, 100 - overdueCount * 15);
  const decisionLagDays =
    offerCompanies.length > 0 ? (daysSinceLastAction ?? 0) : null;

  const executiveStageLabel =
    offerCompanies.length > 0
      ? "Offer and Decision"
      : activeCount > 0 || !!interviewingCompany
        ? "Interviewing and Conversion"
        : totalCount > 0 && contactCount > 0
          ? "Market Activation"
          : totalCount > 0
            ? "Target and Narrative Design"
            : "Trigger and Identity Reset";

  const { riskItems, executivePrimaryRisk, executiveDecisionBrief } =
    buildExecutiveRiskModel({
      daysSinceLastAction,
      daysSinceOnboard,
      totalCount,
      profileScore,
      sponsorCoveragePercent,
      offerCount: offerCompanies.length,
      signalCount,
      overdueCount,
    });

  const offerCockpit = {
    show: offerCompanies.length > 0,
    offerCount: offerCompanies.length,
    offerCompanyName: offerCompany?.name ?? null,
    contextSignals: [
      {
        label: "Role thesis clarity",
        ok: (profile?.positioning_summary?.length ?? 0) >= 80,
      },
      {
        label: "Context constraints captured",
        ok: !!profile?.briefing_timezone,
      },
      { label: "Sponsor confirmation path", ok: sponsorCoveragePercent >= 50 },
    ],
  };

  const setupSteps = [
    {
      done: activation.a1_resume,
      label: "Upload your resume or import LinkedIn",
      sub: "Drives every brief, every briefing, and every AI response you get.",
      href: "/dashboard/profile",
      cta: "Go to profile",
    },
    {
      done: activation.a2_company,
      label: "Add your first target company",
      sub: "Include the career page URL - we scan it within minutes and alert you to matching roles.",
      href: "/dashboard/companies/new",
      cta: "Company",
    },
    {
      done: activation.a3_prep_brief,
      label: "Generate your first prep brief",
      sub: "Open any target company and run the brief. Leadership signals, likely objections, best outreach angle.",
      href: "/dashboard",
      cta: "Companies",
    },
    {
      done: activation.a4_contact,
      label: "Add your first contact",
      sub: "Who do you know at target companies? Roles at this level fill through relationships, not applications.",
      href: "/dashboard/contacts",
      cta: "Contacts",
    },
    {
      done: activation.a5_briefing,
      label: "Set up your daily briefing",
      sub: "Signals and due actions in your inbox before you start work.",
      href: "/dashboard/profile",
      cta: "Briefing",
    },
    {
      done: activation.a6_follow_up,
      label: "Log your first follow-up reminder",
      sub: "The difference between an active search and a passive one is whether the next action is scheduled.",
      href: "/dashboard/contacts",
      cta: "Contacts",
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

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {isFirstRunDashboard && (
        <FirstMileTelemetry
          eventName="dashboard_first_run_viewed"
          pageName="dashboard_first_run"
          properties={{
            company_count: totalCount,
            contact_count: contactCount,
            has_advanced_stage: hasAdvancedStage,
            onboarding_completed: true,
          }}
        />
      )}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(circle_at_top_left,_rgba(193,127,59,0.2),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.16),_transparent_34%),linear-gradient(180deg,_rgba(9,14,26,0.98)_0%,_rgba(11,17,30,0.95)_54%,_rgba(10,15,28,0.98)_100%)]" />

      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/72 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:gap-6 sm:px-6">
          <span className="text-[13px] font-bold tracking-[0.16em] uppercase text-white/90 shrink-0">
            <span className="text-white">Starting </span>
            <span className="text-orange-500">Monday</span>
          </span>
          <div className="ml-auto flex items-center gap-2">
            <LogoutButton label="Sign out" />
          </div>
        </div>
      </header>

      <main className="dashboard-landing-theme max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-10">
        <h1 className="sr-only">Dashboard</h1>
        <DashboardTopShellSection
          firstName={firstName}
          briefingTimezone={profile?.briefing_timezone ?? null}
          signalCount={signalCount}
          overdueCount={overdueCount}
          canUseOutreachHub={canUseOutreachHub}
          isRothschildAdmin={isRothschildAdmin}
          profileSaved={!!profile_saved}
          isTrialing={isTrialing}
          trialDaysLeft={trialDaysLeft}
          totalCount={totalCount}
          offerCount={offerCompanies.length}
          offerName={offerCompanies[0]?.name ?? null}
          offerCompanyName={offerCompany?.name ?? null}
          onMarkPlaced={markPlaced}
          activationComplete={activation.isComplete}
          activationCompletedCount={activation.completedCount}
          setupSteps={setupSteps}
          isExecutiveMode={isExecutiveMode}
          isExecutivePreview={isExecutivePreview}
          executiveStageLabel={executiveStageLabel}
          executivePrimaryRisk={executivePrimaryRisk}
          executiveDecisionBrief={executiveDecisionBrief}
        />

        {showWeekOneBanner && (
          <div className="mb-6 rounded border border-orange-300/30 bg-orange-500/10 px-5 py-3 text-[13px] text-slate-100">
            <span className="font-semibold text-orange-200">
              Day {(daysSinceOnboard ?? 0) + 1} of your first week.
            </span>{" "}
            Next briefing: tomorrow at {weekOneBriefingTime}. Next career-page
            scan: {weekOneNextScanDay}. Today&apos;s action:{" "}
            <a href="#to-do-now" className="font-semibold underline">
              one step in To do now
            </a>
            .
          </div>
        )}

        <DashboardCampaignFoundationSection
          targetTitles={(profile?.target_titles as string[] | null) ?? []}
          targetSectors={(profile?.target_sectors as string[] | null) ?? []}
          targetLocations={(profile?.target_locations as string[] | null) ?? []}
          positioningSummary={profile?.positioning_summary ?? null}
          currentTitle={profile?.current_title ?? null}
        />

        <DailyMomentumPlan
          actions={dailyMomentumActions}
          dateKey={todayISO}
          status={momentumStatus}
        />

        <DashboardProgressFeedSection
          todayISO={todayISO}
          followUps={(followUps ?? []) as {
            id: string;
            due_date: string;
            action: string;
            companies: { name: string } | null;
          }[]}
          warmPaths={warmPaths}
          patternAlerts={patternAlerts}
          signals={signalsDeduped}
          isExecutiveMode={isExecutiveMode}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-8 items-start mb-8">
          <aside className="hidden lg:block rounded-2xl border border-white/15 bg-white/5 p-5 shadow-[0_22px_66px_rgba(15,23,42,0.18)] backdrop-blur-md lg:sticky lg:top-24">
            <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-300 mb-3">
              On this page
            </p>
            <nav className="flex flex-col gap-2.5 text-[13px]">
              <a href="#to-do-now" className="text-slate-200 hover:text-white">
                To do now
              </a>
              <a href="#companies" className="text-slate-300 hover:text-white">
                Companies
              </a>
              <a
                href="#relationships"
                className="text-slate-300 hover:text-white"
              >
                Relationships
              </a>
              <a href="#plan-panel" className="text-slate-300 hover:text-white">
                Plan
              </a>
              <a href="#briefs" className="text-slate-300 hover:text-white">
                Briefs
              </a>
            </nav>
          </aside>

          <div className="space-y-5">
            <section
              id="to-do-now"
              className="scroll-mt-24 rounded-2xl border border-white/15 bg-white/5 p-5 sm:p-6 shadow-[0_22px_66px_rgba(15,23,42,0.18)] backdrop-blur-md"
            >
              <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-orange-200/90 mb-1">
                To do now
              </p>
              <h2 className="text-[22px] sm:text-[26px] font-serif font-bold text-white leading-tight">
                Today at a glance
              </h2>
              <p className="text-[13px] text-slate-300 mt-2">{today}</p>
              <p className="text-[12px] text-slate-400 mt-1">
                {operatingStateLabel}
              </p>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <section
                id="companies-panel"
                className="rounded-2xl border border-white/15 bg-white/5 p-5 shadow-[0_22px_66px_rgba(15,23,42,0.18)] backdrop-blur-md"
              >
                <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-300 mb-1">
                  Companies
                </p>
                <p className="text-[20px] font-bold text-white">{totalCount}</p>
                <p className="text-[12px] text-slate-300 mt-2">
                  Scanner status:{" "}
                  {totalCount > 0
                    ? `${scannerCompletedCount} of ${totalCount} scanned`
                    : "Waiting for companies"}
                </p>
                {scannableCount === 0 && totalCount > 0 && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    No career-page URLs yet.
                  </p>
                )}
                <p className="text-[12px] text-slate-400 mt-1">
                  Signals this week: {signalCount}
                </p>
                <OnDemandScanButton
                  companyNames={allList.slice(0, 8).map((c) => c.name)}
                />
                <Link
                  href="/dashboard/signals"
                  className="inline-block mt-3 text-[12px] font-semibold text-orange-300 hover:text-orange-200"
                >
                  Signals
                </Link>
              </section>

              <section
                id="relationships-panel"
                className="rounded-2xl border border-white/15 bg-white/5 p-5 shadow-[0_22px_66px_rgba(15,23,42,0.18)] backdrop-blur-md"
              >
                <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-300 mb-1">
                  Relationships
                </p>
                <p className="text-[20px] font-bold text-white">
                  {contactCount}
                </p>
                <p className="text-[12px] text-slate-300 mt-2">
                  {enrichmentQueueCount} compan
                  {enrichmentQueueCount === 1 ? "y" : "ies"} not yet enriched
                </p>
                <p className="text-[12px] text-slate-400 mt-1">
                  {contactCount === 0
                    ? "While enrichment runs, adding one contact you already know unblocks outreach today."
                    : enrichedContactRows.length > 0
                      ? `Enriched contacts: ${enrichedContactRows.length}`
                      : `${contactCount} active contact${contactCount === 1 ? "" : "s"} across ${contactCountMap.size} compan${contactCountMap.size === 1 ? "y" : "ies"}`}
                </p>
                {totalCount > 0 && enrichedContactRows.length === 0 && (
                  <OnDemandEnrichButton />
                )}
                <Link
                  href="/dashboard/contacts"
                  className="inline-block mt-3 text-[12px] font-semibold text-orange-300 hover:text-orange-200"
                >
                  Contacts
                </Link>
              </section>

              <section
                id="week-tasks-panel"
                className="rounded-2xl border border-white/15 bg-white/5 p-5 shadow-[0_22px_66px_rgba(15,23,42,0.18)] backdrop-blur-md"
              >
                <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-300 mb-1">
                  Follow-ups overdue
                </p>
                {(followUps ?? []).length > 0 ? (
                  <ul className="space-y-2 mt-2">
                    {(
                      (followUps ?? []) as Array<{
                        id: string;
                        due_date: string;
                        action: string;
                        companies: { name: string } | null;
                      }>
                    )
                      .slice(0, 3)
                      .map((item) => {
                        const dueLabel = new Date(
                          `${item.due_date}T12:00:00Z`,
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        });
                        const daysOverdue = Math.max(
                          0,
                          Math.floor(
                            (new Date(`${todayISO}T12:00:00Z`).getTime() -
                              new Date(
                                `${item.due_date}T12:00:00Z`,
                              ).getTime()) /
                              86400000,
                          ),
                        );
                        const cleanAction = stripStaleRelativeTime(item.action);
                        return (
                          <li
                            key={item.id}
                            className="rounded border border-white/10 bg-white/5 px-3 py-2"
                          >
                            <p className="text-[12px] font-semibold text-white">
                              {cleanAction || item.action}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {item.companies?.name ?? "General"} ·{" "}
                              {daysOverdue > 0
                                ? `Due ${dueLabel}`
                                : "Due today"}
                            </p>
                          </li>
                        );
                      })}
                  </ul>
                ) : (
                  <p className="text-[12px] text-slate-300 mt-2">
                    Nothing due today. Your follow-through is clean.
                  </p>
                )}
                <Link
                  href="/dashboard/calendar"
                  className="inline-block mt-3 text-[12px] font-semibold text-orange-300 hover:text-orange-200"
                >
                  Calendar
                </Link>
              </section>
            </div>
          </div>
        </div>

        {/* Tenet: Companies */}
        <section id="companies" className="scroll-mt-24 mb-8">
          <h2 className="text-[10px] font-bold tracking-[0.14em] uppercase text-orange-200/90 mb-4">
            Companies
          </h2>

          <DashboardPipelineSection
            q={q ?? ""}
            stage={stage ?? ""}
            page={page}
            start={start}
            pageSize={PAGE_SIZE}
            totalCount={totalCount}
            totalFiltered={totalFiltered}
            totalPages={totalPages}
            hasFilters={hasFilters}
            filtered={filtered}
            contactCountMap={contactCountMap}
            stageMap={STAGE}
            stageOptions={Object.entries(STAGE).map(([key, { label }]) => ({
              key,
              label,
            }))}
            activationResumeDone={activation.a1_resume}
            showWrapUpLink={
              !profile?.placed_at &&
              (isTrialing || userRow?.subscription_status === "active")
            }
          />

          {rolesFormingCard && (
            <div className="mt-5 rounded border border-white/10 bg-white/5 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[13px] text-slate-200 min-w-0">
                <span className="font-semibold text-orange-200/90">
                  Roles forming:
                </span>{" "}
                {rolesFormingHeadline ??
                  "New leverage may be opening in your tracked pipeline."}
              </p>
              <Link
                href={rolesFormingCard.href}
                className="text-[12px] font-semibold text-orange-300 hover:text-orange-200 shrink-0"
              >
                Signals
              </Link>
            </div>
          )}

          <div className="mt-4">
            <DashboardDisclosureSection
              id="health-modules"
              title="Pipeline health and decision timeline"
              defaultOpen={focus === "health"}
            >
              <section className="mb-6 rounded-2xl border border-white/15 bg-white/5 p-4 shadow-[0_22px_66px_rgba(15,23,42,0.18)] backdrop-blur-md sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-[13px] font-semibold text-orange-200/90">
                      Campaign health
                    </h2>
                    <p className="text-[20px] font-bold text-white mt-1">
                      {campaignHealthScore}/100{" "}
                      <span className="text-[13px] font-semibold text-slate-300">
                        {campaignHealthBand}
                      </span>
                    </p>
                    <p className="text-[13px] text-slate-200 mt-1">
                      Cadence, follow-through, and stage progression combined
                      into one execution score.
                    </p>
                    {cadenceScore === 0 && (
                      <p className="text-[12px] text-slate-400 mt-1">
                        Cadence only counts outreach sent this week. Signal
                        review and prep work do not register here.
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center w-full sm:w-auto">
                    <div className="rounded border border-white/15 bg-white/5 px-3 py-2">
                      <p className="text-[13px] text-slate-300 font-semibold">
                        Cadence
                      </p>
                      <p className="text-[16px] font-bold text-white">
                        {cadenceScore}
                      </p>
                    </div>
                    <div className="rounded border border-white/15 bg-white/5 px-3 py-2">
                      <p className="text-[13px] text-slate-300 font-semibold">
                        Follow-through
                      </p>
                      <p className="text-[16px] font-bold text-white">
                        {followThroughScore}
                      </p>
                    </div>
                    <div className="rounded border border-white/15 bg-white/5 px-3 py-2">
                      <p className="text-[13px] text-slate-300 font-semibold">
                        Conversion
                      </p>
                      <p className="text-[16px] font-bold text-white">
                        {conversionScore}
                      </p>
                    </div>
                  </div>
                </div>

                {topStalledCampaigns.length > 0 && (
                  <div className="mt-4 rounded-lg border border-amber-300/40 bg-amber-500/10 p-3">
                    <p className="text-[13px] font-semibold text-amber-200 mb-2">
                      Stalled alerts
                    </p>
                    <ul className="space-y-1.5">
                      {topStalledCampaigns.map((item) => (
                        <li
                          key={item.id}
                          className="text-[13px] text-amber-100"
                        >
                          <span className="font-semibold">{item.name}</span>{" "}
                          {item.updated_at
                            ? `has had no stage updates since ${new Date(item.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}.`
                            : "has had no recent stage updates."}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>

              <DashboardDecisionTimelineSection
                roleLensLabel={roleLensLabel}
                items={decisionTimelineItems}
                stalledCount={stalledCampaignRows.length}
                sort={timelineSort}
                page={safeTimelinePage}
                totalPages={timelineTotalPages}
                updateDecisionOwner={updateDecisionOwner}
              />
            </DashboardDisclosureSection>

            {signalsDeduped.length > 0 && (
              <DashboardDisclosureSection
                id="company-signals-modules"
                title={`Company signals (${signalsDeduped.length})`}
                defaultOpen={focus === "signals"}
              >
                <CompanySignalsSection signals={signalsDeduped} />
              </DashboardDisclosureSection>
            )}
          </div>
        </section>

        {/* Tenet: Relationships */}
        <section id="relationships" className="scroll-mt-24 mb-8">
          <h2 className="text-[10px] font-bold tracking-[0.14em] uppercase text-orange-200/90 mb-4">
            Relationships
          </h2>
          <div className="rounded-2xl border border-white/15 bg-white/5 p-5 sm:p-6 shadow-[0_22px_66px_rgba(15,23,42,0.18)] backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[13px] text-slate-200">
                {contactCount} active contact{contactCount === 1 ? "" : "s"}{" "}
                across {contactCountMap.size} compan
                {contactCountMap.size === 1 ? "y" : "ies"}
              </p>
              <Link
                href="/dashboard/contacts"
                className="text-[12px] font-semibold text-orange-300 hover:text-orange-200"
              >
                Contacts
              </Link>
            </div>
            {warmPaths.length === 0 && (
              <p className="text-[13px] text-slate-300 mt-3">
                No warm paths this week. When a company you track shows a fresh
                signal and you know someone there, the opening appears here.
              </p>
            )}
          </div>
          {warmPaths.length > 0 && (
            <div className="mt-5">
              <DashboardDisclosureSection
                id="warm-paths-modules"
                title={`Warm paths (${warmPaths.length})`}
                defaultOpen
              >
                <WarmPathsSection warmPaths={warmPaths} />
              </DashboardDisclosureSection>
            </div>
          )}
        </section>

        <DashboardDisclosureSection
          id="profile-modules"
          title="Profile and intelligence modules"
          defaultOpen={focus === "profile"}
        >
          <DashboardProfileIntelligenceSection
            profileScore={profileScore}
            profileHref={profileHref}
            nextProfileSection={nextProfileSection}
            onSaveQuickProfile={saveQuickProfile}
            quickProfileDefaults={{
              fullName: profile?.full_name ?? "",
              currentTitle: profile?.current_title ?? "",
              positioningSummary: profile?.positioning_summary ?? "",
            }}
            stats={stats}
            totalCount={totalCount}
            contactCoverageCount={contactCountMap.size}
            numIntelGaps={numIntelGaps}
            companiesWithoutContact={companiesWithoutContact.map((c) => ({
              name: c.name,
            }))}
            prospectContactCount={prospectContactCount ?? 0}
            companiesWithoutBrief={companiesWithoutBrief.map((c) => ({
              name: c.name,
            }))}
            opportunityRadar={<OpportunityRadar />}
            isExecutiveMode={isExecutiveMode}
          />
        </DashboardDisclosureSection>

        <DashboardWelcomeNudgeSection
          showNurtureWelcome={showNurtureWelcome}
          showCampaignWelcome={showCampaignWelcome}
          showWatcherWelcome={showWatcherWelcome}
          stallNudge={stallNudge}
          onDismissStallNudge={dismissStallNudge}
        />

        {/* Tenet: Plan */}
        <section id="plan-panel" className="scroll-mt-24 mb-8">
          <h2 className="text-[10px] font-bold tracking-[0.14em] uppercase text-orange-200/90 mb-4">
            Plan
          </h2>
          <div className="mb-5 rounded-2xl border border-white/15 bg-white/5 px-5 py-4 sm:px-6 flex flex-wrap items-center justify-between gap-2 shadow-[0_22px_66px_rgba(15,23,42,0.18)] backdrop-blur-md">
            <p className="text-[13px] text-slate-200">
              <span className="font-semibold text-white">Weekly plan.</span>{" "}
              Choose one relationships move, one opportunities move, and one
              prep move for the week.
            </p>
            <Link
              href="/dashboard/plan"
              className="text-[12px] font-semibold text-orange-300 hover:text-orange-200 shrink-0"
            >
              Open weekly plan →
            </Link>
          </div>
          <DashboardDisclosureSection
            id="advanced-modules"
            title="Weekly performance and advanced modules"
            defaultOpen={focus === "advanced"}
          >
            {/* Mobile contract anchor: grid grid-cols-2 sm:grid-cols-6 gap-2 sm:gap-3 */}
            <DashboardAdvancedModulesSection
              weeklyGoal={profile?.weekly_goal ?? null}
              outreachThisWeek={outreachThisWeek ?? 0}
              onSaveWeeklyGoal={saveWeeklyGoal}
              momentumData={
                (momentumData as {
                  momentum_score: number | null;
                  momentum_computed_at: string | null;
                } | null) ?? null
              }
              daysSinceLastAction={daysSinceLastAction}
              weekSlots={weekSlots}
              velocityRows={velocityRows}
              activationComplete={activation.isComplete}
              hasFilters={hasFilters}
              setupSteps={setupSteps}
              totalCount={totalCount}
              isExecutive={isExecutive}
              signalCount={signalCount}
              draftReadyCount={draftReadyCount ?? 0}
              overdueCount={overdueCount}
              activeCount={activeCount}
              isExecutiveMode={isExecutiveMode}
              executiveStageLabel={executiveStageLabel}
              riskItems={riskItems}
              offerCockpit={offerCockpit}
              signalToActionPercent={signalToActionPercent}
              followUpSlaPercent={followUpSlaPercent}
              sponsorCoveragePercent={sponsorCoveragePercent}
              decisionLagDays={decisionLagDays}
            />
          </DashboardDisclosureSection>
        </section>

        {/* Tenet: Briefs */}
        <section id="briefs" className="scroll-mt-24 mb-8">
          <h2 className="text-[10px] font-bold tracking-[0.14em] uppercase text-orange-200/90 mb-4">
            Briefs
          </h2>
          <div className="rounded-2xl border border-white/15 bg-white/5 p-5 sm:p-6 shadow-[0_22px_66px_rgba(15,23,42,0.18)] backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/dashboard/briefing"
                  className="inline-flex min-h-[36px] items-center rounded border border-white/15 bg-white/5 px-3 text-[13px] font-semibold text-slate-100 transition-colors hover:border-white/30 hover:bg-white/10"
                >
                  Briefing
                </Link>
                <Link
                  href="/dashboard/strategy"
                  className="inline-flex min-h-[36px] items-center rounded border border-white/15 bg-white/5 px-3 text-[13px] font-semibold text-slate-100 transition-colors hover:border-white/30 hover:bg-white/10"
                >
                  Strategy brief
                </Link>
                <Link
                  href="/dashboard/signals"
                  className="inline-flex min-h-[36px] items-center rounded border border-white/15 bg-white/5 px-3 text-[13px] font-semibold text-slate-100 transition-colors hover:border-white/30 hover:bg-white/10"
                >
                  Signals
                </Link>
              </div>
              <p className="text-[12px] text-slate-400">
                {signalCount > 0
                  ? `${signalCount} fresh signal${signalCount === 1 ? "" : "s"} this week`
                  : "No fresh signals this week"}
              </p>
            </div>
            {patternAlerts.length > 0 ? (
              <DashboardDisclosureSection
                id="pattern-alerts-modules"
                title={`Pattern alerts (${patternAlerts.length})`}
                defaultOpen
              >
                <PatternAlertsSection patternAlerts={patternAlerts} />
              </DashboardDisclosureSection>
            ) : (
              <p className="text-[13px] text-slate-300">
                No pattern alerts right now. Your daily briefing will flag the
                next market move worth acting on.
              </p>
            )}
          </div>
        </section>
      </main>
      <HelpQuickButton source="dashboard" />
    </div>
  );
}
