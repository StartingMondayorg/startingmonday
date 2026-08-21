/**
 * ProofStrip - reusable executive-page proof attribution block.
 *
 * Renders a compact trust strip with denominator, window, and a link to the
 * Evidence Hub. Used across all /for-* executive role pages as
 * part of EXUX-201 (role-specific proof strips with conservative board-safe
 * language).
 */

interface ProofStripProps {
  /** Primary stat shown in large numerals, e.g. "1-3 wks" */
  metric: string
  /** One-line explanation of what the metric measures */
  label: string
  /** Source window and denominator, e.g. "Internal timing model - method notes at /references" */
  source: string
  /** Optional note about variability */
  caveat?: string
}

export function ProofStrip({ metric, label, source, caveat }: ProofStripProps) {
  return (
    <div
      data-emi-proof="role_proof_strip"
      className="rounded-xl border border-success/50 bg-success/20 px-5 py-4 my-6"
    >
      <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-success mb-2">
        Pilot evidence
      </p>
      <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-2">
        <span className="text-[28px] font-bold text-success leading-none">{metric}</span>
        <span className="text-[14px] text-success leading-snug">{label}</span>
      </div>
      <p className="text-[12px] text-muted-foreground">
        {source}.{' '}
        <a href="/evidence-hub" className="underline text-success transition-colors">
          See Evidence Hub
        </a>
        .{' '}
        {caveat ?? 'Results vary by market, role level, and campaign consistency.'}
      </p>
    </div>
  )
}

