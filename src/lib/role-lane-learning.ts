import { type RoleFamily, type RoleTitle } from '@/lib/role-taxonomy'

export type TutorialAsset = {
  title: string
  format: 'article' | 'video' | 'chat_prompt'
  href: string
  description: string
}

export type PublicTutorialAsset = TutorialAsset & {
  ctaLabel: string
}

export type ManagerToolsBridge = {
  href: string
  keywords: string[]
}

export type RecruiterToolkitAsset = {
  title: string
  type: 'message_pack' | 'cadence_guide' | 'proof_asset'
  href: string
  description: string
}

export type RecruiterToolkit = {
  lane: string
  cadence: string[]
  assets: RecruiterToolkitAsset[]
}

export type RecruiterMessagePack = {
  audience: 'recruiter' | 'hiring_manager'
  subject: string
  opening: string
  proofPoints: string[]
}

export function getRoleLaneTutorials(roleFamily: RoleFamily | null | undefined): TutorialAsset[] {
  if (roleFamily === 'technical_leadership') {
    return [
      {
        title: 'Technical leadership positioning playbook',
        format: 'article',
        href: '/blog/retained-search-candidate-preparation',
        description: 'Frame architecture depth, influence scope, and delivery outcomes for interviews.',
      },
      {
        title: 'Interview readiness: technical narrative drills',
        format: 'video',
        href: '/blog/ciso-interview-preparation',
        description: 'Practice concise architecture and tradeoff storytelling for high-stakes rounds.',
      },
      {
        title: 'Chat prompt: turn project history into technical impact bullets',
        format: 'chat_prompt',
        href: '/dashboard/chat',
        description: 'Use chat to convert long project history into role-specific proof points.',
      },
    ]
  }

  if (roleFamily === 'delivery_leadership') {
    return [
      {
        title: 'Program leadership readiness guide',
        format: 'article',
        href: '/blog/executive-job-search-daily-routine',
        description: 'Build a concise story around execution rhythm, risk handling, and stakeholder outcomes.',
      },
      {
        title: 'Delivery leadership interview prep',
        format: 'video',
        href: '/blog/executive-search-operating-system',
        description: 'Prepare answers for planning, prioritization, and cross-functional execution questions.',
      },
      {
        title: 'Chat prompt: build a stakeholder risk and dependency brief',
        format: 'chat_prompt',
        href: '/dashboard/chat',
        description: 'Generate stakeholder-focused talking points for TPM, program, and project manager paths.',
      },
    ]
  }

  return [
    {
      title: 'Executive search operating system',
      format: 'article',
      href: '/blog/executive-search-operating-system',
      description: 'Baseline operating rhythm for active and near-term leadership transitions.',
    },
    {
      title: 'Interview series for senior roles',
      format: 'video',
      href: '/blog/cio-board-presentation',
      description: 'Strengthen executive communication, board-facing narratives, and role-fit signals.',
    },
    {
      title: 'Chat prompt: sharpen your leadership narrative',
      format: 'chat_prompt',
      href: '/dashboard/chat',
      description: 'Use chat to refine role narrative, objections, and outreach positioning before interviews.',
    },
  ]
}

export function getPublicRoleLaneTutorials(roleFamily: RoleFamily | null | undefined): PublicTutorialAsset[] {
  return getRoleLaneTutorials(roleFamily).map((asset) => {
    if (asset.format === 'chat_prompt') {
      return {
        ...asset,
        href: '/signup?utm_source=role-lane&utm_medium=tutorials&utm_campaign=chat-prompt',
        ctaLabel: 'Start guided chat prompt',
      }
    }

    if (asset.format === 'video') {
      return {
        ...asset,
        ctaLabel: 'Open guide',
      }
    }

    return {
      ...asset,
      ctaLabel: 'Read guide',
    }
  })
}

export function getManagerToolsBridge(roleTitle: RoleTitle | null | undefined): ManagerToolsBridge {
  const keywords = [
    '1:1 agenda',
    'performance conversation',
    'delegation framework',
    'career ladder',
    'team health metrics',
  ]

  if (roleTitle === 'manager' || roleTitle === 'senior_manager' || roleTitle === 'director' || roleTitle === 'senior_director') {
    keywords.push('manager coaching cadence')
  }

  if (roleTitle === 'program_manager' || roleTitle === 'senior_program_manager' || roleTitle === 'tpm' || roleTitle === 'senior_tpm') {
    keywords.push('execution operating rhythm')
  }

  return {
    href: '/managertools',
    keywords,
  }
}

export function getRecruiterToolkit(
  roleFamily: RoleFamily | null | undefined,
  roleTitle: RoleTitle | null | undefined,
): RecruiterToolkit {
  const lane =
    roleFamily === 'technical_leadership'
      ? 'Technical leadership recruiter toolkit'
      : roleFamily === 'delivery_leadership'
        ? 'Delivery leadership recruiter toolkit'
        : 'Leadership recruiter toolkit'

  const cadence = [
    'Day 0: send role-lane first touch to priority recruiter and hiring manager targets.',
    'Day 3: send value-forward follow-up with one concrete lane-specific proof point.',
    'Day 7: send close-loop note and queue next contact if no response.',
  ]

  if (roleTitle === 'avp' || roleTitle === 'vp' || roleTitle === 'executive') {
    cadence.unshift('Pre-Day 0: align mandate narrative for board, search partner, and executive peer audiences.')
  }

  if (roleTitle === 'tpm' || roleTitle === 'senior_tpm' || roleTitle === 'program_manager' || roleTitle === 'senior_program_manager') {
    cadence.push('Day 10: add execution-risk narrative and cross-functional stakeholder map in the final follow-up.')
  }

  const assets: RecruiterToolkitAsset[] = [
    {
      title: 'Outreach hub role-lane message packs',
      type: 'message_pack',
      href: '/dashboard/contacts',
      description: 'Generate recruiter and hiring-manager first-touch drafts with role-aware language.',
    },
    {
      title: 'Search-firm lane context and proof angles',
      type: 'proof_asset',
      href: '/search-firms',
      description: 'Use lane-specific positioning to improve retained-search and recruiter conversations.',
    },
    {
      title: 'Executive outreach trigger and cadence guide',
      type: 'cadence_guide',
      href: '/blog/executive-search-operating-system',
      description: 'Follow a strict, non-spam cadence with trigger-driven follow-ups and quality control.',
    },
  ]

  if (roleFamily === 'technical_leadership') {
    assets[2] = {
      title: 'Technical leadership conversation cadence',
      type: 'cadence_guide',
      href: '/blog/ciso-interview-preparation',
      description: 'Package architecture and delivery proof for recruiter and panel conversations.',
    }
  }

  if (roleFamily === 'delivery_leadership') {
    assets[2] = {
      title: 'Delivery leadership cadence and follow-up flow',
      type: 'cadence_guide',
      href: '/blog/executive-job-search-daily-routine',
      description: 'Use execution-focused messaging for TPM, program, and delivery leadership channels.',
    }
  }

  return {
    lane,
    cadence,
    assets,
  }
}

export function getRecruiterMessagePacks(
  roleFamily: RoleFamily | null | undefined,
  roleTitle: RoleTitle | null | undefined,
): RecruiterMessagePack[] {
  const laneLabel =
    roleFamily === 'technical_leadership'
      ? 'technical leadership'
      : roleFamily === 'delivery_leadership'
        ? 'delivery leadership'
        : 'leadership'

  const seniorityLabel = roleTitle === 'vp' || roleTitle === 'avp' || roleTitle === 'executive'
    ? 'executive-scope'
    : roleTitle && roleTitle.startsWith('senior_')
      ? 'senior-scope'
      : 'core-scope'

  const recruiterProof = [
    'Role-lane narrative clarity in first-touch messages.',
    'Specific mandate-fit evidence instead of generic profile language.',
    'Structured day-0/day-3/day-7 follow-up cadence with anti-spam guardrails.',
  ]

  const hiringManagerProof = [
    'Audience-specific storyline for mandate outcomes and execution risk.',
    'Interview-prep artifacts linked to role-lane priorities.',
    'Weekly operating rhythm that keeps follow-up quality high across cycles.',
  ]

  if (roleFamily === 'technical_leadership') {
    recruiterProof[1] = 'Technical tradeoff and architecture-impact proof for recruiter screening.'
    hiringManagerProof[1] = 'Architecture-to-outcome narrative for technical panel and executive review.'
  }

  if (roleFamily === 'delivery_leadership') {
    recruiterProof[1] = 'Execution-risk and stakeholder-control proof for delivery leadership mandates.'
    hiringManagerProof[1] = 'Dependency and operating-rhythm evidence for TPM and program leadership loops.'
  }

  return [
    {
      audience: 'recruiter',
      subject: `Role-lane intro (${laneLabel}, ${seniorityLabel})`,
      opening: `I am exploring ${laneLabel} transitions and wanted to share a concise, role-specific view of where I can add immediate value.`,
      proofPoints: recruiterProof,
    },
    {
      audience: 'hiring_manager',
      subject: `Mandate-fit conversation (${laneLabel})`,
      opening: `I am reaching out with a focused ${laneLabel} narrative tied to execution outcomes relevant to your current mandate.`,
      proofPoints: hiringManagerProof,
    },
  ]
}
