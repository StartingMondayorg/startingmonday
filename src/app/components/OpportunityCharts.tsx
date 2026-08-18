export function OpportunityTimingGapChart({ className = 'h-auto w-full' }: { className?: string }) {
  return (
    <svg viewBox="0 0 560 280" className={className} role="img" aria-label="Opportunity timing gap: when you enter vs typical candidates">
      {/* Subtle background gradient definition */}
      <defs>
        <linearGradient id="timelineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1e293b" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#0f172a" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#1e293b" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="startingMondayGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#86efac" stopOpacity="1" />
          <stop offset="100%" stopColor="#4ade80" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id="typicalGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fb923c" stopOpacity="1" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0.8" />
        </linearGradient>
      </defs>

      {/* Main timeline with subtle background */}
      <rect x="40" y="125" width="480" height="36" fill="url(#timelineGradient)" rx="4" />
      <line x1="40" y1="143" x2="520" y2="143" stroke="#475569" strokeWidth="1.5" />

      {/* Timeline dots - more refined */}
      <circle cx="55" cy="143" r="5.5" fill="#64748b" opacity="0.8" />
      <circle cx="130" cy="143" r="5.5" fill="#64748b" opacity="0.8" />
      <circle cx="205" cy="143" r="5.5" fill="#64748b" opacity="0.8" />
      <circle cx="280" cy="143" r="5.5" fill="#64748b" opacity="0.8" />
      <circle cx="355" cy="143" r="5.5" fill="#64748b" opacity="0.8" />
      <circle cx="430" cy="143" r="5.5" fill="#64748b" opacity="0.8" />
      <circle cx="505" cy="143" r="5.5" fill="#64748b" opacity="0.8" />

      {/* Phase labels - refined typography */}
      <text x="55" y="175" fill="#cbd5e1" fontSize="12" fontWeight="500" textAnchor="middle" letterSpacing="0.3">Signal</text>
      <text x="130" y="190" fill="#cbd5e1" fontSize="12" fontWeight="500" textAnchor="middle" letterSpacing="0.3">Shape</text>
      <text x="205" y="175" fill="#cbd5e1" fontSize="12" fontWeight="500" textAnchor="middle" letterSpacing="0.3">Outreach</text>
      <text x="280" y="190" fill="#cbd5e1" fontSize="12" fontWeight="500" textAnchor="middle" letterSpacing="0.3">Open</text>
      <text x="355" y="175" fill="#cbd5e1" fontSize="12" fontWeight="500" textAnchor="middle" letterSpacing="0.3">Interviews</text>
      <text x="430" y="190" fill="#cbd5e1" fontSize="12" fontWeight="500" textAnchor="middle" letterSpacing="0.3">Selection</text>
      <text x="505" y="175" fill="#cbd5e1" fontSize="12" fontWeight="500" textAnchor="middle" letterSpacing="0.3">Start</text>

      {/* Starting Monday entry point - refined */}
      <g>
        <line x1="130" y1="110" x2="130" y2="127" stroke="url(#startingMondayGradient)" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="130" cy="105" r="6.5" fill="#86efac" stroke="#4ade80" strokeWidth="1.5" />
        <text x="130" y="32" fill="#86efac" fontSize="13" fontWeight="600" textAnchor="middle" letterSpacing="0.5">Starting Monday</text>
        <text x="130" y="49" fill="#9ca3af" fontSize="11" textAnchor="middle">enters before</text>
        <text x="130" y="62" fill="#9ca3af" fontSize="11" textAnchor="middle">decision-makers</text>
        <text x="130" y="75" fill="#9ca3af" fontSize="11" textAnchor="middle">form shortlist</text>
      </g>

      {/* Typical candidates entry point - refined */}
      <g>
        <line x1="280" y1="110" x2="280" y2="127" stroke="url(#typicalGradient)" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="280" cy="105" r="6.5" fill="#fb923c" stroke="#f97316" strokeWidth="1.5" />
        <text x="280" y="32" fill="#fb923c" fontSize="13" fontWeight="600" textAnchor="middle" letterSpacing="0.5">Typical candidates</text>
        <text x="280" y="49" fill="#9ca3af" fontSize="11" textAnchor="middle">enter when role</text>
        <text x="280" y="62" fill="#9ca3af" fontSize="11" textAnchor="middle">is publicly posted</text>
        <text x="280" y="75" fill="#9ca3af" fontSize="11" textAnchor="middle">& widely known</text>
      </g>

      {/* Advantage callout - refined */}
      <rect x="40" y="225" width="480" height="1" fill="#475569" opacity="0.4" />
      <text x="280" y="250" fill="#cbd5e1" fontSize="12" fontWeight="600" textAnchor="middle" letterSpacing="0.3">
        Starting early: when role is still taking shape • Better odds: fewer qualified candidates
      </text>
      <text x="280" y="268" fill="#cbd5e1" fontSize="12" fontWeight="600" textAnchor="middle" letterSpacing="0.3">
        Advantage: already known and trusted
      </text>
    </svg>
  )
}


export function OpportunityTimingGapChartMobile({ className = 'h-auto w-full' }: { className?: string }) {
  return (
    <svg viewBox="0 0 360 320" className={className} role="img" aria-label="Opportunity timing gap: Starting Monday enters while the role is taking shape; typical candidates enter at the public posting">
      <circle cx="18" cy="26" r="7" fill="#86efac" stroke="#4ade80" strokeWidth="1.5" />
      <text x="34" y="31" fill="#86efac" fontSize="16" fontWeight="600">Starting Monday</text>
      <text x="34" y="53" fill="#cbd5e1" fontSize="13">enters while the role is still taking shape</text>

      <circle cx="18" cy="88" r="7" fill="#fb923c" stroke="#f97316" strokeWidth="1.5" />
      <text x="34" y="93" fill="#fb923c" fontSize="16" fontWeight="600">Typical candidates</text>
      <text x="34" y="115" fill="#cbd5e1" fontSize="13">enter when the posting is public and crowded</text>

      <line x1="30" y1="190" x2="330" y2="190" stroke="#475569" strokeWidth="1.5" />
      <circle cx="45" cy="190" r="5" fill="#64748b" />
      <circle cx="92" cy="190" r="5" fill="#64748b" />
      <circle cx="139" cy="190" r="5" fill="#64748b" />
      <circle cx="186" cy="190" r="5" fill="#64748b" />
      <circle cx="233" cy="190" r="5" fill="#64748b" />
      <circle cx="280" cy="190" r="5" fill="#64748b" />
      <circle cx="327" cy="190" r="5" fill="#64748b" />

      <line x1="92" y1="160" x2="92" y2="182" stroke="#4ade80" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="92" cy="155" r="6.5" fill="#86efac" stroke="#4ade80" strokeWidth="1.5" />
      <line x1="186" y1="160" x2="186" y2="182" stroke="#f97316" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="186" cy="155" r="6.5" fill="#fb923c" stroke="#f97316" strokeWidth="1.5" />

      <text x="45" y="215" fill="#cbd5e1" fontSize="13" fontWeight="500" textAnchor="middle">Signal</text>
      <text x="186" y="215" fill="#cbd5e1" fontSize="13" fontWeight="500" textAnchor="middle">Open</text>
      <text x="327" y="215" fill="#cbd5e1" fontSize="13" fontWeight="500" textAnchor="middle">Start</text>

      <line x1="30" y1="248" x2="330" y2="248" stroke="#475569" strokeWidth="1" opacity="0.4" />
      <text x="30" y="276" fill="#cbd5e1" fontSize="13.5" fontWeight="600">Enter early: fewer rivals, more shaping power.</text>
      <text x="30" y="300" fill="#cbd5e1" fontSize="13.5" fontWeight="600">By posting day, you are already known and trusted.</text>
    </svg>
  )
}

export function RoleLandingProbabilityChart({ className = 'h-auto w-full' }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 292" className={className} role="img" aria-label="Role landing probability chart comparing Starting Monday and typical paths">
      <line x1="56" y1="32" x2="56" y2="214" stroke="#334155" strokeWidth="2" />
      <line x1="56" y1="214" x2="492" y2="214" stroke="#334155" strokeWidth="2" />

      <rect x="56" y="138" width="436" height="76" fill="#2b1c2a" opacity="0.32" />
      <rect x="248" y="32" width="244" height="106" fill="#0f3a2f" opacity="0.26" />
      <line x1="56" y1="178" x2="492" y2="178" stroke="#1f2f4a" strokeWidth="1" />
      <line x1="56" y1="142" x2="492" y2="142" stroke="#1f2f4a" strokeWidth="1" />
      <line x1="56" y1="106" x2="492" y2="106" stroke="#1f2f4a" strokeWidth="1" />
      <line x1="56" y1="70" x2="492" y2="70" stroke="#1f2f4a" strokeWidth="1" />

      <text x="18" y="218" fill="#94a3b8" fontSize="12">0%</text>
      <text x="14" y="182" fill="#94a3b8" fontSize="12">25%</text>
      <text x="14" y="146" fill="#94a3b8" fontSize="12">50%</text>
      <text x="14" y="110" fill="#94a3b8" fontSize="12">75%</text>
      <text x="10" y="74" fill="#94a3b8" fontSize="12">100%</text>

      <text x="20" y="24" fill="#cbd5e1" fontSize="12" fontWeight="700">Probability of landing role</text>

      <line x1="84" y1="214" x2="84" y2="220" stroke="#475569" strokeWidth="1.5" />
      <line x1="138" y1="214" x2="138" y2="220" stroke="#475569" strokeWidth="1.5" />
      <line x1="194" y1="214" x2="194" y2="220" stroke="#475569" strokeWidth="1.5" />
      <line x1="248" y1="214" x2="248" y2="220" stroke="#475569" strokeWidth="1.5" />
      <line x1="302" y1="214" x2="302" y2="220" stroke="#475569" strokeWidth="1.5" />
      <line x1="356" y1="214" x2="356" y2="220" stroke="#475569" strokeWidth="1.5" />
      <line x1="410" y1="214" x2="410" y2="220" stroke="#475569" strokeWidth="1.5" />
      <line x1="468" y1="214" x2="468" y2="220" stroke="#475569" strokeWidth="1.5" />

      <text x="84" y="234" fill="#cbd5e1" fontSize="12" textAnchor="middle">Signal</text>
      <text x="138" y="248" fill="#cbd5e1" fontSize="12" textAnchor="middle">Shape</text>
      <text x="194" y="234" fill="#cbd5e1" fontSize="12" textAnchor="middle">Outreach</text>
      <text x="248" y="248" fill="#cbd5e1" fontSize="12" textAnchor="middle">Open</text>
      <text x="302" y="234" fill="#cbd5e1" fontSize="12" textAnchor="middle">Prep</text>
      <text x="356" y="248" fill="#cbd5e1" fontSize="12" textAnchor="middle">Interviews</text>
      <text x="410" y="234" fill="#cbd5e1" fontSize="12" textAnchor="middle">Selection</text>
      <text x="468" y="248" fill="#cbd5e1" fontSize="12" textAnchor="middle">Start</text>

      <circle cx="84" cy="198" r="5.6" fill="#64748b" />
      <circle cx="138" cy="190" r="5.6" fill="#64748b" />
      <circle cx="194" cy="178" r="5.6" fill="#64748b" />
      <circle cx="248" cy="164" r="5.6" fill="#64748b" />
      <circle cx="302" cy="154" r="5.6" fill="#64748b" />
      <circle cx="356" cy="144" r="5.6" fill="#64748b" />

      <circle cx="84" cy="188" r="6.5" fill="#38bdf8" />
      <circle cx="138" cy="171" r="6.5" fill="#38bdf8" />
      <circle cx="194" cy="154" r="6.5" fill="#38bdf8" />
      <circle cx="248" cy="137" r="6.5" fill="#38bdf8" />
      <circle cx="302" cy="120" r="6.5" fill="#38bdf8" />
      <circle cx="356" cy="103" r="6.5" fill="#38bdf8" />
      <circle cx="410" cy="86" r="6.5" fill="#38bdf8" />
      <circle cx="468" cy="70" r="6.5" fill="#38bdf8" />

      <polyline points="84,188 138,171 194,154 248,137 302,120 356,103 410,86 468,70" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 3" opacity="0.95" />
      <polyline points="84,198 138,190 194,178 248,164 302,154 356,144" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 4" opacity="0.9" />

      <text x="16" y="274" fill="#cbd5e1" fontSize="14" fontWeight="700">Without structure, momentum stalls at interviews. Starting Monday carries you through selection to day one.</text>

      <rect x="504" y="36" width="86" height="52" rx="6" fill="#0f1a2e" stroke="#1e3a5f" strokeWidth="1" />
      <circle cx="516" cy="52" r="5" fill="#38bdf8" />
      <text x="526" y="56" fill="#cbd5e1" fontSize="11">With SM</text>
      <circle cx="516" cy="74" r="5" fill="#64748b" />
      <text x="526" y="78" fill="#94a3b8" fontSize="11">Typical</text>
    </svg>
  )
}
