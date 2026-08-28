'use client'
import { useState, useTransition, useActionState } from 'react'
import type { StaffMember, StaffRole } from '@/lib/staff'
import { addTeamMember, changeTeamRole, removeTeamMember } from './actions'
import { Badge, Button, Card, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
type Props = {
  members: StaffMember[]
  currentRole: StaffRole
}

function roleBadgeVariant(role: StaffRole): 'warning' | 'info' | 'secondary' {
  if (role === 'owner') return 'warning'
  if (role === 'admin') return 'info'
  return 'secondary'
}

function MemberRow({ member, isOwner }: { member: StaffMember; isOwner: boolean }) {
  const [editing, setEditing]     = useState(false)
  const [role, setRole]           = useState<StaffRole>(member.role)
  const [isPending, startTransition] = useTransition()
  const [rowError, setRowError]   = useState('')

  function handleRoleChange() {
    setRowError('')
    startTransition(async () => {
      const result = await changeTeamRole(member.id, role)
      if (result.error) setRowError(result.error)
      else setEditing(false)
    })
  }

  function handleRemove() {
    if (!confirm(`Remove ${member.email} from the team?`)) return
    setRowError('')
    startTransition(async () => {
      const result = await removeTeamMember(member.id)
      if (result.error) setRowError(result.error)
    })
  }

  return (
    <div className="px-6 py-4 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-foreground truncate">{member.email}</p>
        {rowError && <p className="text-[11px] text-destructive mt-0.5">{rowError}</p>}
      </div>

      {editing && isOwner ? (
        <div className="flex items-center gap-2 shrink-0">
          <Select
            value={role}
            onValueChange={(value) => setRole(value as StaffRole)}
            disabled={member.role === 'owner' || isPending}
          >
            <SelectTrigger
              size="sm"
              aria-label={`Role for ${member.email}`}
              title="Team member role"
              className="text-[12px]"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="viewer">viewer</SelectItem>
              <SelectItem value="admin">admin</SelectItem>
              <SelectItem value="owner">owner</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRoleChange}
            disabled={isPending}
          >
            Save
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { setEditing(false); setRole(member.role) }}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3 shrink-0">
          <Badge variant={roleBadgeVariant(member.role)}>
            {member.role}
          </Badge>
          {isOwner && member.role !== 'owner' && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditing(true)}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleRemove}
                disabled={isPending}
              >
                Remove
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function AddMemberForm() {
  const [state, formAction, isPending] = useActionState(addTeamMember, {})

  return (
    <form action={formAction} className="px-6 py-5 flex flex-col sm:flex-row gap-3">
      <Input
        name="email"
        type="email"
        required
        placeholder="colleague@company.com"
        className="flex-1"
      />
      <Select name="role" defaultValue="viewer">
        <SelectTrigger aria-label="Role for new team member" title="New member role" className="w-full sm:w-auto">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="viewer">viewer</SelectItem>
          <SelectItem value="admin">admin</SelectItem>
        </SelectContent>
      </Select>
      <Button
        type="submit"
        variant="outline"
        disabled={isPending}
        className="shrink-0"
      >
        {isPending ? 'Adding...' : 'Add member'}
      </Button>
      {state.error && (
        <p className="text-[12px] text-destructive self-center">{state.error}</p>
      )}
    </form>
  )
}

export function TeamClient({ members, currentRole }: Props) {
  const isOwner = currentRole === 'owner'

  return (
    <div className="flex flex-col gap-6">
      <Card variant="glass" className="p-0">
        <div className="px-6 py-[18px] border-b border-border">
          <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground">Team Members</span>
        </div>
        <div className="divide-y divide-border">
          {members.map(m => (
            <MemberRow key={m.id} member={m} isOwner={isOwner} />
          ))}
          {members.length === 0 && (
            <p className="px-6 py-8 text-[13px] text-muted-foreground">No team members yet.</p>
          )}
        </div>
        {isOwner && (
          <>
            <div className="border border-border bg-background/60 rounded border-t border-border px-6 py-3">
              <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground">Add Member</span>
            </div>
            <AddMemberForm />
          </>
        )}
      </Card>
    </div>
  )
}
