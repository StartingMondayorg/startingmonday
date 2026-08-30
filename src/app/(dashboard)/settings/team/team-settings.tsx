'use client'
import { useState, useCallback, useEffect } from 'react'
import {
  WHITE_LABEL_DEFAULT_SETTINGS,
  WHITE_LABEL_TIERS,
  WHITE_LABEL_TRACKS,
  formatWhiteLabelTierPrice,
  getWhiteLabelTier,
  getWhiteLabelTrack,
  type WhiteLabelSettings,
} from '@/lib/white-label'
import {
  PARTNER_PROGRAM_IDS,
  SPONSOR_TEMPLATE_VARIANTS,
  WEEKDAY_IDS,
  type PartnerProgramSettings,
} from '@/lib/partner-program-settings'
import { Alert, AlertDescription, AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, Badge, Button, Card, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Textarea } from '@/components/ui'
type SeatStatus = {
  profileDone: boolean
  companyAdded: boolean
  briefGenerated: boolean
}

type Seat = {
  id: string
  member_email: string
  member_user_id: string | null
  status: 'pending' | 'accepted'
  invited_at: string
  accepted_at: string | null
  seatStatus: SeatStatus | null
}

type WhiteLabelFormState = WhiteLabelSettings
type ProgramSettingsFormState = PartnerProgramSettings

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function StatusDot({ done, label }: { done: boolean; label: string }) {
  return (
    <Badge variant={done ? 'success' : 'secondary'} className="gap-1.5">
      <span className={`size-1.5 rounded-full ${done ? 'bg-success' : 'bg-muted-foreground'}`} />
      {label}
    </Badge>
  )
}

export function TeamSettings({
  seats: initialSeats,
  whiteLabel: initialWhiteLabel,
  programSettings: initialProgramSettings,
}: {
  seats: Seat[]
  whiteLabel: WhiteLabelSettings | null
  programSettings: PartnerProgramSettings | null
}) {
  const [seats, setSeats] = useState(initialSeats)
  const [email, setEmail] = useState('')
  const [bulkInput, setBulkInput] = useState('')
  const [sending, setSending] = useState(false)
  const [bulkSending, setBulkSending] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [bulkSummary, setBulkSummary] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [removing, setRemoving] = useState<string | null>(null)
  const [whiteLabel, setWhiteLabel] = useState<WhiteLabelFormState | null>(initialWhiteLabel)
  const [whiteLabelSaving, setWhiteLabelSaving] = useState(false)
  const [whiteLabelMessage, setWhiteLabelMessage] = useState<string | null>(null)
  const [whiteLabelError, setWhiteLabelError] = useState('')
  const [programSettings, setProgramSettings] = useState<ProgramSettingsFormState | null>(initialProgramSettings)
  const [programSaving, setProgramSaving] = useState(false)
  const [programMessage, setProgramMessage] = useState<string | null>(null)
  const [programError, setProgramError] = useState('')

  // Role management
  type RoleRow = { id: string; user_id: string; role: string; granted_at: string }
  const [roles, setRoles] = useState<RoleRow[] | null>(null)
  const [roleUserId, setRoleUserId] = useState('')
  const [roleValue, setRoleValue] = useState('counselor')
  const [roleSaving, setRoleSaving] = useState(false)
  const [roleMessage, setRoleMessage] = useState<string | null>(null)
  const [roleError, setRoleError] = useState('')

  const loadRoles = useCallback(async () => {
    try {
      const res = await fetch('/api/team/roles')
      if (!res.ok) return
      const data = await res.json().catch(() => null)
      setRoles(data?.data ?? [])
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (initialWhiteLabel) loadRoles()
  }, [initialWhiteLabel, loadRoles])

  async function handleAssignRole(e: React.FormEvent) {
    e.preventDefault()
    if (!roleUserId.trim()) return
    setRoleSaving(true)
    setRoleMessage(null)
    setRoleError('')
    try {
      const res = await fetch('/api/team/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: roleUserId.trim(), role: roleValue }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) { setRoleError(data?.error ?? 'Failed to assign role.'); return }
      setRoleMessage(`Role '${roleValue}' assigned.`)
      setRoleUserId('')
      loadRoles()
    } catch {
      setRoleError('Something went wrong.')
    } finally {
      setRoleSaving(false)
    }
  }

  async function performRevokeRole(roleId: string) {
    try {
      const res = await fetch(`/api/team/roles/${roleId}`, { method: 'DELETE' })
      if (!res.ok) return
      loadRoles()
    } catch { /* ignore */ }
  }

  async function handleWhiteLabelSave(e: React.FormEvent) {
    e.preventDefault()
    if (!whiteLabel) return

    setWhiteLabelSaving(true)
    setWhiteLabelMessage(null)
    setWhiteLabelError('')

    try {
      const res = await fetch('/api/team/white-label', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(whiteLabel),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setWhiteLabelError(data?.error ?? 'Failed to save white-label settings.')
        return
      }

      setWhiteLabel(data.data as WhiteLabelFormState)
      setWhiteLabelMessage('White-label settings saved.')
    } catch {
      setWhiteLabelError('Something went wrong.')
    } finally {
      setWhiteLabelSaving(false)
    }
  }

  async function handleProgramSettingsSave(e: React.FormEvent) {
    e.preventDefault()
    if (!programSettings) return

    setProgramSaving(true)
    setProgramMessage(null)
    setProgramError('')

    try {
      const res = await fetch('/api/team/program-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(programSettings),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setProgramError(data?.error ?? 'Failed to save program settings.')
        return
      }

      setProgramSettings(data.data as ProgramSettingsFormState)
      setProgramMessage('Program settings saved.')
    } catch {
      setProgramError('Something went wrong.')
    } finally {
      setProgramSaving(false)
    }
  }

  const performRemove = useCallback(async (seatId: string) => {
    setRemoving(seatId)
    try {
      const res = await fetch(`/api/team/seat/${seatId}`, { method: 'DELETE' })
      if (!res.ok) { setError('Failed to remove member.'); return }
      setSeats(prev => prev.filter(s => s.id !== seatId))
    } catch {
      setError('Something went wrong.')
    } finally {
      setRemoving(null)
    }
  }, [])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setError('')
    setSentTo(null)
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Invite failed.'); return }
      setSentTo(email.trim())
      setEmail('')
    } catch {
      setError('Something went wrong.')
    } finally {
      setSending(false)
    }
  }

  async function handleBulkInvite(e: React.FormEvent) {
    e.preventDefault()
    setBulkSending(true)
    setError('')
    setSentTo(null)
    setBulkSummary(null)

    const emails = [...new Set(
      bulkInput
        .split(/[\n,;]+/)
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
    )]

    if (emails.length === 0) {
      setError('Add at least one email for bulk invite.')
      setBulkSending(false)
      return
    }

    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error ?? 'Bulk invite failed.')
        return
      }

      const invitedCount = Number(data?.invitedCount ?? 0)
      const duplicateCount = Number(data?.duplicateCount ?? 0)
      const failedCount = Number(data?.failedCount ?? 0)
      setBulkSummary(`Invited ${invitedCount}. Duplicates ${duplicateCount}. Failed ${failedCount}.`)
      setBulkInput('')
    } catch {
      setError('Something went wrong.')
    } finally {
      setBulkSending(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-primary/30 shadow-md p-6">
        <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-primary mb-2">
          White-label admin
        </p>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-[18px] font-bold text-foreground leading-tight">
              Brand, track, and pricing settings for partner delivery
            </h2>
            <p className="text-[13px] text-muted-foreground mt-1">
              Adjust the delivery brand and program tier without changing the shared core product.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:max-w-2xl">
            {(whiteLabel ? [
              { label: 'Brand', value: whiteLabel.brandName },
              { label: 'Track', value: getWhiteLabelTrack(whiteLabel.trackId).label },
              { label: 'Tier', value: getWhiteLabelTier(whiteLabel.tierId).name },
            ] : [
              { label: 'Brand', value: WHITE_LABEL_DEFAULT_SETTINGS.brandName },
              { label: 'Track', value: getWhiteLabelTrack(WHITE_LABEL_DEFAULT_SETTINGS.trackId).label },
              { label: 'Tier', value: getWhiteLabelTier(WHITE_LABEL_DEFAULT_SETTINGS.tierId).name },
            ]).map((item) => (
              <Card key={item.label} className="bg-muted p-3">
                <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-[13px] font-semibold text-foreground">{item.value}</p>
              </Card>
            ))}
          </div>
        </div>

        {whiteLabel ? (
          <form onSubmit={handleWhiteLabelSave} className="mt-5 grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Brand name</Label>
                <Input
                  value={whiteLabel.brandName}
                  onChange={(event) => setWhiteLabel((current) => current ? { ...current, brandName: event.target.value } : current)}
                  placeholder="Nash Transition Group"
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Support email</Label>
                <Input
                  type="email"
                  value={whiteLabel.supportEmail}
                  onChange={(event) => setWhiteLabel((current) => current ? { ...current, supportEmail: event.target.value } : current)}
                  placeholder="support@example.com"
                />
              </div>
              <div>
                <Label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Track</Label>
                <Select
                  value={whiteLabel.trackId}
                  onValueChange={(value) => setWhiteLabel((current) => current ? { ...current, trackId: value as WhiteLabelSettings['trackId'] } : current)}
                >
                  <SelectTrigger className="w-full" title="White-label track">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WHITE_LABEL_TRACKS.map((track) => (
                      <SelectItem key={track.id} value={track.id}>{track.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Tier</Label>
                <Select
                  value={whiteLabel.tierId}
                  onValueChange={(value) => setWhiteLabel((current) => current ? { ...current, tierId: value as WhiteLabelSettings['tierId'] } : current)}
                >
                  <SelectTrigger className="w-full" title="White-label tier">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WHITE_LABEL_TIERS.map((tier) => (
                      <SelectItem key={tier.id} value={tier.id}>{tier.name} · {formatWhiteLabelTierPrice(tier)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Primary color</Label>
                <Input
                  type="text"
                  value={whiteLabel.primaryColor}
                  onChange={(event) => setWhiteLabel((current) => current ? { ...current, primaryColor: event.target.value } : current)}
                  placeholder="#0f172a"
                />
              </div>
              <div>
                <Label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Accent color</Label>
                <Input
                  type="text"
                  value={whiteLabel.accentColor}
                  onChange={(event) => setWhiteLabel((current) => current ? { ...current, accentColor: event.target.value } : current)}
                  placeholder="#f97316"
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Logo URL</Label>
                <Input
                  type="url"
                  value={whiteLabel.logoUrl ?? ''}
                  onChange={(event) => setWhiteLabel((current) => current ? { ...current, logoUrl: event.target.value } : current)}
                  placeholder="https://example.com/logo.svg"
                />
              </div>
            </div>

            <Card className="bg-muted p-4 space-y-4">
              <div>
                <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-2">Preview</p>
                <Card className="p-4">
                  <p className="text-[12px] font-semibold text-foreground">{whiteLabel.brandName || WHITE_LABEL_DEFAULT_SETTINGS.brandName}</p>
                  <p className="text-[12px] text-muted-foreground mt-1">{getWhiteLabelTrack(whiteLabel.trackId).summary}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
                    <Badge variant="outline" className="bg-muted">{whiteLabel.primaryColor}</Badge>
                    <Badge variant="outline" className="bg-muted">{whiteLabel.accentColor}</Badge>
                    <span>{whiteLabel.supportEmail}</span>
                  </div>
                </Card>
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-2">Selected tier includes</p>
                <ul className="space-y-1.5">
                  {getWhiteLabelTier(whiteLabel.tierId).inclusions.map((item) => (
                    <li key={item} className="text-[12px] text-muted-foreground">• {item}</li>
                  ))}
                </ul>
              </div>
              <Button type="submit" disabled={whiteLabelSaving}>
                {whiteLabelSaving ? 'Saving...' : 'Save white-label settings'}
              </Button>
              {whiteLabelMessage && (
                <Alert variant="success">
                  <AlertDescription>{whiteLabelMessage}</AlertDescription>
                </Alert>
              )}
              {whiteLabelError && (
                <Alert variant="destructive">
                  <AlertDescription>{whiteLabelError}</AlertDescription>
                </Alert>
              )}
            </Card>
          </form>
        ) : (
          <Card className="bg-muted mt-5 px-4 py-5 text-[13px] text-muted-foreground">
            White-label settings will appear once a partner workspace is linked to this account.
          </Card>
        )}
      </Card>

      <Card className="p-6">
        <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-2">
          Program settings
        </p>
        <p className="text-[12px] text-muted-foreground mb-4">
          Configure tenant defaults for outplacement program mapping and sponsor report template behavior.
        </p>

        {programSettings ? (
          <form onSubmit={handleProgramSettingsSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Default program</Label>
              <Select
                value={programSettings.defaultProgram}
                onValueChange={(value) => setProgramSettings((current) => current ? { ...current, defaultProgram: value as PartnerProgramSettings['defaultProgram'] } : current)}
              >
                <SelectTrigger className="w-full" title="Default outplacement program">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PARTNER_PROGRAM_IDS.map((programId) => (
                    <SelectItem key={programId} value={programId}>{programId.replace('outplacement_', '').replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Sponsor template</Label>
              <Select
                value={programSettings.sponsorTemplateVariant}
                onValueChange={(value) => setProgramSettings((current) => current ? { ...current, sponsorTemplateVariant: value as PartnerProgramSettings['sponsorTemplateVariant'] } : current)}
              >
                <SelectTrigger className="w-full" title="Sponsor report template">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPONSOR_TEMPLATE_VARIANTS.map((variant) => (
                    <SelectItem key={variant} value={variant}>{variant.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Weekly summary day</Label>
              <Select
                value={programSettings.weeklySummaryDay}
                onValueChange={(value) => setProgramSettings((current) => current ? { ...current, weeklySummaryDay: value as PartnerProgramSettings['weeklySummaryDay'] } : current)}
              >
                <SelectTrigger className="w-full" title="Weekly summary day">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEEKDAY_IDS.map((day) => (
                    <SelectItem key={day} value={day}>{day[0].toUpperCase() + day.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="block text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-1">Cohort naming prefix</Label>
              <Input
                type="text"
                value={programSettings.cohortNamingPrefix ?? ''}
                onChange={(event) => setProgramSettings((current) => current ? { ...current, cohortNamingPrefix: event.target.value } : current)}
                placeholder="NTG"
              />
            </div>

            <div className="sm:col-span-2 flex items-center gap-3">
              <Button type="submit" variant="secondary" disabled={programSaving}>
                {programSaving ? 'Saving...' : 'Save program settings'}
              </Button>
              {programMessage && (
                <Alert variant="success">
                  <AlertDescription>{programMessage}</AlertDescription>
                </Alert>
              )}
              {programError && (
                <Alert variant="destructive">
                  <AlertDescription>{programError}</AlertDescription>
                </Alert>
              )}
            </div>
          </form>
        ) : (
          <Card className="bg-muted px-4 py-5 text-[13px] text-muted-foreground">
            Program settings will appear once a partner workspace is linked to this account.
          </Card>
        )}
      </Card>

      {initialWhiteLabel && (
        <Card className="p-6">
          <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-2">
            Partner roles
          </p>
          <p className="text-[12px] text-muted-foreground mb-4">
            Assign counselor, sponsor viewer, or participant roles to users in this partner workspace.
            Firm admin can manage all roles.
          </p>

          <form onSubmit={handleAssignRole} className="flex flex-wrap gap-3 mb-4">
            <Input
              type="text"
              value={roleUserId}
              onChange={(e) => setRoleUserId(e.target.value)}
              placeholder="User ID (UUID)"
              className="flex-1 min-w-[200px]"
            />
            <Select value={roleValue} onValueChange={(value) => value && setRoleValue(value)}>
              <SelectTrigger title="Role to assign">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['firm_admin', 'counselor', 'participant', 'sponsor_viewer'] as const).map((r) => (
                  <SelectItem key={r} value={r}>{r.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" variant="secondary" disabled={roleSaving || !roleUserId.trim()}>
              {roleSaving ? 'Assigning…' : 'Assign role'}
            </Button>
          </form>
          {roleMessage && (
            <Alert variant="success" className="mb-2">
              <AlertDescription>{roleMessage}</AlertDescription>
            </Alert>
          )}
          {roleError && (
            <Alert variant="destructive" className="mb-2">
              <AlertDescription>{roleError}</AlertDescription>
            </Alert>
          )}

          {roles === null ? (
            <p className="text-[12px] text-muted-foreground">Loading roles…</p>
          ) : roles.length === 0 ? (
            <p className="text-[12px] text-muted-foreground">No partner roles assigned yet.</p>
          ) : (
            <Card className="overflow-hidden">
              <Table className="text-[12px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Granted</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-mono truncate max-w-[160px]">{role.user_id.slice(0, 8)}…</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{role.role}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{new Date(role.granted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger render={<Button type="button" variant="ghost" size="sm" className="text-destructive" />}>
                            Revoke
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Revoke this role?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will immediately remove the &apos;{role.role}&apos; role from this user.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction variant="destructive" onClick={() => performRevokeRole(role.id)}>
                                Revoke
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </Card>
      )}

      <Card className="p-6">
        <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-4">
          Invite a member
        </p>
        <form onSubmit={handleInvite} className="flex gap-3">
          <Input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="colleague@company.com"
            required
            className="flex-1"
          />
          <Button type="submit" variant="secondary" disabled={sending || !email.trim()} className="shrink-0">
            {sending ? 'Sending...' : 'Send invite'}
          </Button>
        </form>
        {sentTo && (
          <Alert variant="success" className="mt-2.5">
            <AlertDescription>Invite sent to {sentTo}.</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive" className="mt-2.5">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </Card>

      <Card className="p-6">
        <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-2">
          Bulk invite
        </p>
        <p className="text-[12px] text-muted-foreground mb-3">
          Paste one email per line, or separate with commas.
        </p>
        <form onSubmit={handleBulkInvite} className="flex flex-col gap-3">
          <Textarea
            value={bulkInput}
            onChange={(e) => setBulkInput(e.target.value)}
            placeholder={'client1@company.com\nclient2@company.com'}
            rows={5}
          />
          <div>
            <Button type="submit" variant="secondary" disabled={bulkSending || !bulkInput.trim()}>
              {bulkSending ? 'Sending...' : 'Send bulk invites'}
            </Button>
          </div>
        </form>
        {bulkSummary && (
          <Alert variant="success" className="mt-2.5">
            <AlertDescription>{bulkSummary}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive" className="mt-2.5">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </Card>

      {seats.length > 0 ? (
        <Card className="overflow-hidden p-0">
          <div className="px-6 py-3.5 border-b border-border">
            <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground">
              Members ({seats.length})
            </p>
          </div>
          <Table>
            <TableBody>
              {seats.map(seat => (
                <TableRow key={seat.id}>
                  <TableCell className="px-6 py-4 whitespace-normal">
                    <p className="text-[13px] font-semibold text-foreground truncate">{seat.member_email}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {seat.status === 'accepted' && seat.accepted_at
                        ? `Joined ${formatDate(seat.accepted_at)}`
                        : `Invited ${formatDate(seat.invited_at)}`}
                    </p>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    {seat.status === 'accepted' && seat.seatStatus ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusDot done={seat.seatStatus.profileDone} label="Profile" />
                        <StatusDot done={seat.seatStatus.companyAdded} label="Company" />
                        <StatusDot done={seat.seatStatus.briefGenerated} label="Brief" />
                      </div>
                    ) : (
                      <Badge variant="warning">Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <AlertDialog>
                      <AlertDialogTrigger render={<Button type="button" variant="ghost" size="sm" className="text-destructive" disabled={removing === seat.id} />}>
                        {removing === seat.id ? 'Removing…' : 'Remove'}
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove this member?</AlertDialogTitle>
                          <AlertDialogDescription>
                            They will lose access immediately.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction variant="destructive" onClick={() => performRemove(seat.id)}>
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card className="px-6 py-10 text-center">
          <p className="text-[14px] text-muted-foreground">No members yet. Invite your first member above.</p>
        </Card>
      )}
    </div>
  )
}
