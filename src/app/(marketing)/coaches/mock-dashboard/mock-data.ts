export type MockClient = {
  id: string
  name: string
  roleTrack: string
  status: 'High risk' | 'Needs intervention' | 'Stable'
  momentum: number
  overdueActions: number
  lastSessionDate: string
  nextSessionDate: string
  nextSessionObjective: string
  coachNarrative: string
  riskSignals: string[]
  thisWeekCommitments: Array<{
    task: string
    owner: string
    status: 'On track' | 'At risk' | 'Overdue'
    due: string
  }>
  sessionAgenda: string[]
  interventionPlan: string[]
  recentSignals: Array<{
    label: string
    detail: string
    at: string
  }>
}

export const MOCK_CLIENTS: MockClient[] = [
  {
    id: 'dana-r',
    name: 'Dana R.',
    roleTrack: 'Enterprise CTO',
    status: 'High risk',
    momentum: 42,
    overdueActions: 4,
    lastSessionDate: 'Thu, Jun 4',
    nextSessionDate: 'Mon, Jun 8',
    nextSessionObjective: 'Recover stalled outreach and align interview prep to board-level narrative.',
    coachNarrative:
      'Dana is doing strong strategic thinking, but execution cadence broke after two missed follow-through windows.',
    riskSignals: [
      'No outbound touches logged in 6 days.',
      'Interview prep brief drafted but not reviewed before target call.',
      'Two priority contacts moved from warm to no response.',
    ],
    thisWeekCommitments: [
      { task: 'Finalize Salesforce interview narrative', owner: 'Dana', status: 'At risk', due: 'Today' },
      { task: 'Send outreach revision to 2 CIO contacts', owner: 'Dana', status: 'Overdue', due: 'Yesterday' },
      { task: 'Coach review of prep brief', owner: 'Coach', status: 'On track', due: 'Tonight' },
    ],
    sessionAgenda: [
      'Rebuild confidence with evidence-backed wins from last transformation.',
      'Prioritize top 2 opportunities and cut low-probability distractions.',
      'Lock one weekly operating ritual for outreach and prep.',
    ],
    interventionPlan: [
      'Run a 20-minute commitment reset at the start of session.',
      'Set non-negotiable daily signal check with one accountability prompt.',
      'Require next-session prep brief completion 24 hours before call.',
    ],
    recentSignals: [
      { label: 'Momentum drop', detail: 'Score fell from 58 to 42 over 9 days.', at: 'Today 8:12 AM' },
      { label: 'Overdue action spike', detail: 'Overdue count rose from 1 to 4 this week.', at: 'Today 7:40 AM' },
      { label: 'Outreach slowdown', detail: 'No logged touchpoint since May 31.', at: 'Yesterday 6:10 PM' },
    ],
  },
  {
    id: 'marcus-t',
    name: 'Marcus T.',
    roleTrack: 'VP Engineering',
    status: 'Stable',
    momentum: 71,
    overdueActions: 1,
    lastSessionDate: 'Wed, Jun 3',
    nextSessionDate: 'Tue, Jun 9',
    nextSessionObjective: 'Sharpen shortlist narrative and prepare for second-round panel discussion.',
    coachNarrative:
      'Marcus is executing consistently. Main leverage is increasing specificity in his panel narrative.',
    riskSignals: [
      'One delayed follow-up to retained search contact.',
      'Target list expanded faster than capacity to follow through.',
      'Messaging variance across opportunities.',
    ],
    thisWeekCommitments: [
      { task: 'Refine shortlist narrative for panel', owner: 'Marcus', status: 'On track', due: 'Tomorrow' },
      { task: 'Follow up with retained search partner', owner: 'Marcus', status: 'At risk', due: 'Today' },
      { task: 'Coach feedback on panel story arc', owner: 'Coach', status: 'On track', due: 'Tomorrow' },
    ],
    sessionAgenda: [
      'Pressure-test panel narrative against role-fit criteria.',
      'Tighten evidence for leadership scope and outcomes.',
      'Set one clear weekly priority to protect momentum.',
    ],
    interventionPlan: [
      'Use scorecard to calibrate message consistency across openings.',
      'Trim target list to top 5 opportunities for execution focus.',
      'Add one sponsor update to strengthen confidence signal.',
    ],
    recentSignals: [
      { label: 'Momentum steady', detail: 'Maintained 70+ score for three weeks.', at: 'Today 9:02 AM' },
      { label: 'Pipeline quality up', detail: 'Two interview-stage opportunities active.', at: 'Yesterday 3:14 PM' },
      { label: 'Follow-up lag', detail: 'One search-firm follow-up now 1 day late.', at: 'Yesterday 1:51 PM' },
    ],
  },
  {
    id: 'alicia-k',
    name: 'Alicia K.',
    roleTrack: 'CIO Transition',
    status: 'Needs intervention',
    momentum: 38,
    overdueActions: 6,
    lastSessionDate: 'Tue, Jun 2',
    nextSessionDate: 'Mon, Jun 8',
    nextSessionObjective: 'Re-establish weekly operating rhythm and recover sponsor confidence.',
    coachNarrative:
      'Alicia has strong strategic credibility but execution confidence is dropping because commitments are not closing.',
    riskSignals: [
      'Six overdue actions across outreach and prep.',
      'No sponsor update sent in the last week.',
      'Session notes incomplete for two consecutive calls.',
    ],
    thisWeekCommitments: [
      { task: 'Send sponsor update summary', owner: 'Alicia', status: 'Overdue', due: 'Yesterday' },
      { task: 'Complete prep worksheet before Monday session', owner: 'Alicia', status: 'At risk', due: 'Sunday' },
      { task: 'Coach-led operating cadence reset', owner: 'Coach', status: 'On track', due: 'Monday' },
    ],
    sessionAgenda: [
      'Reset operating cadence with realistic weekly load.',
      'Identify one credibility win to communicate to sponsors.',
      'Clarify next-step ownership for every commitment.',
    ],
    interventionPlan: [
      'Move to twice-weekly accountability check for two weeks.',
      'Use commitment tracker with due dates visible to both coach and client.',
      'Reduce active targets to improve completion rate.',
    ],
    recentSignals: [
      { label: 'Risk alert', detail: 'Crossed intervention threshold at 38 momentum.', at: 'Today 7:44 AM' },
      { label: 'Commitment drift', detail: 'Overdue actions up from 3 to 6 in five days.', at: 'Today 7:10 AM' },
      { label: 'Sponsor silence', detail: 'No update logged since last Tuesday.', at: 'Yesterday 5:08 PM' },
    ],
  },
]

export const MOCK_PORTFOLIO_KPIS = [
  { label: 'Active clients', value: '14', note: 'all in one command center' },
  { label: 'High-risk clients', value: '3', note: 'flagged before session week' },
  { label: 'Overdue actions', value: '11', note: 'visible without manual follow-up' },
  { label: 'Avg momentum', value: '67', note: 'portfolio trend this week' },
]

export function findMockClient(clientId: string): MockClient | undefined {
  return MOCK_CLIENTS.find((client) => client.id === clientId)
}
