'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible'

interface Person {
  id: string
  first_name: string
  last_name: string
  title?: string
  company?: string
  source: 'scanner' | 'user_added' | 'linkedin' | 'other'
  linkedin_url?: string
  notes?: string
}

export default function RelationshipsPage() {
  const supabase = createClient()
  const [relationships, setRelationships] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newPerson, setNewPerson] = useState({
    firstName: '',
    lastName: '',
    title: '',
    company: '',
    linkedinUrl: '',
    notes: '',
  })

  useEffect(() => {
    async function loadData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        // Load user's relationships
        const { data: relData } = await supabase
          .from('user_relationships')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        setRelationships(relData || [])

      } catch (error) {
        console.error('Error loading relationships:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase])

  const scannerSuggestions = relationships.filter((r) => r.source === 'scanner')
  const customAdded = relationships.filter((r) => r.source !== 'scanner')

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-[32px] font-bold tracking-tight text-white sm:text-[40px]">
          Key Relationships
        </h1>
        <p className="text-[16px] leading-relaxed text-slate-300 max-w-2xl">
          Build your target list of people to connect with. Discover them from signals and LinkedIn.
        </p>
      </div>

      {/* Research insight card */}
      <Card variant="glass" className="border-orange-400/30 bg-orange-500/5 p-6 sm:p-8">
        <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-orange-300 mb-3">
          From coaching research
        </p>
        <p className="text-[15px] leading-relaxed text-slate-100">
          "The fastest path to an offer is usually through someone already inside. Relationships matter more than cold outreach. Build a list of 8-12 people at each target company - people who can advocate for you, introduce you to hiring managers, or move you through their process faster."
        </p>
      </Card>

      {/* Suggested people from scanner */}
      {scannerSuggestions.length > 0 && (
        <Card variant="glass" className="border-teal-400/30 bg-teal-500/5 p-6 sm:p-8">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-teal-300 mb-4">
            Suggested from company signals ({scannerSuggestions.length})
          </h2>
          <p className="text-[13px] text-slate-300 mb-4">
            These people appeared in your company signals. Consider researching them next.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {scannerSuggestions.map((person) => (
              <Card
                key={person.id}
                variant="glass"
                className="rounded-lg border-teal-400/30 bg-teal-950/40 px-4 py-3"
              >
                <p className="font-semibold text-[14px] text-teal-100">
                  {person.first_name} {person.last_name}
                </p>
                {person.title && <p className="text-[12px] text-teal-300">{person.title}</p>}
                {person.company && <p className="text-[12px] text-teal-300">{person.company}</p>}
                {person.linkedin_url && (
                  <Button
                    render={<Link href={person.linkedin_url} target="_blank" />}
                    variant="link"
                    className="mt-2 h-auto p-0 text-[11px] text-teal-400 hover:text-teal-300"
                  >
                    View LinkedIn →
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* Custom relationships section */}
      <Card variant="glass" className="border-orange-400/30 bg-orange-500/5 p-6 sm:p-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-orange-300 mb-1">
              Your relationships ({customAdded.length})
            </p>
            <p className="text-[12px] text-slate-300">
              People you've added or researched
            </p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            variant="outline"
            size="sm"
            className="border-orange-400/30 bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 hover:text-orange-200"
          >
            {showForm ? 'Cancel' : '+ Add person'}
          </Button>
        </div>

        <Collapsible open={showForm}>
          <CollapsibleContent>
            <div className="rounded-lg bg-slate-950/50 border border-slate-700/50 p-4 mb-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="rel-first-name" className="sr-only">First name</Label>
                  <Input
                    id="rel-first-name"
                    type="text"
                    placeholder="First name"
                    value={newPerson.firstName}
                    onChange={(e) => setNewPerson({ ...newPerson, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rel-last-name" className="sr-only">Last name</Label>
                  <Input
                    id="rel-last-name"
                    type="text"
                    placeholder="Last name"
                    value={newPerson.lastName}
                    onChange={(e) => setNewPerson({ ...newPerson, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="rel-title" className="sr-only">Title</Label>
                  <Input
                    id="rel-title"
                    type="text"
                    placeholder="Title (e.g., VP Engineering)"
                    value={newPerson.title}
                    onChange={(e) => setNewPerson({ ...newPerson, title: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rel-company" className="sr-only">Company</Label>
                  <Input
                    id="rel-company"
                    type="text"
                    placeholder="Company"
                    value={newPerson.company}
                    onChange={(e) => setNewPerson({ ...newPerson, company: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rel-linkedin" className="sr-only">LinkedIn URL</Label>
                <Input
                  id="rel-linkedin"
                  type="url"
                  placeholder="LinkedIn URL"
                  value={newPerson.linkedinUrl}
                  onChange={(e) => setNewPerson({ ...newPerson, linkedinUrl: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rel-notes" className="sr-only">Notes</Label>
                <Textarea
                  id="rel-notes"
                  placeholder="Notes about this person (background, relationship, introduction path...)"
                  value={newPerson.notes}
                  onChange={(e) => setNewPerson({ ...newPerson, notes: e.target.value })}
                  rows={2}
                />
              </div>

              <Button
                onClick={() => setShowForm(false)}
                className="w-full"
              >
                Save person
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {customAdded.length > 0 && (
          <div className="space-y-3">
            {customAdded.map((person) => (
              <Card
                key={person.id}
                variant="glass"
                className="rounded-lg border-orange-400/30 bg-orange-950/40 flex-row items-start justify-between px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-[14px] text-orange-100">
                    {person.first_name} {person.last_name}
                  </p>
                  {person.title && <p className="text-[12px] text-orange-300">{person.title}</p>}
                  {person.company && <p className="text-[12px] text-orange-300">{person.company}</p>}
                  {person.notes && <p className="text-[12px] text-slate-400 mt-1">{person.notes}</p>}
                </div>
                {person.linkedin_url && (
                  <Button
                    render={<Link href={person.linkedin_url} target="_blank" />}
                    variant="link"
                    className="h-auto whitespace-nowrap p-0 ml-2 text-[11px] text-orange-300 hover:text-orange-200"
                  >
                    LinkedIn →
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}

        {customAdded.length === 0 && !showForm && (
          <p className="text-[13px] text-slate-400">No people added yet. Start with searches or discoveries from company signals.</p>
        )}
      </Card>

      {/* Research tools */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card variant="glass" className="border-white/10 bg-slate-900/40 p-6">
          <p className="text-[13px] font-semibold text-slate-200 mb-2">🔍 Research Company Leaders</p>
          <p className="text-[12px] text-slate-400 mb-4">
            Use trusted sources to identify decision-makers at your target companies by role and department.
          </p>
          <span className="text-[12px] text-slate-300">Use company websites, press releases, and LinkedIn to validate current roles.</span>
        </Card>

        <Card variant="glass" className="border-white/10 bg-slate-900/40 p-6">
          <p className="text-[13px] font-semibold text-slate-200 mb-2">🔗 Search LinkedIn</p>
          <p className="text-[12px] text-slate-400 mb-4">
            Find people by company, title, and location. Save profiles as you research.
          </p>
          <Button
            render={<a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" />}
            variant="link"
            className="h-auto p-0 text-[12px] text-blue-400 hover:text-blue-300"
          >
            Open LinkedIn →
          </Button>
        </Card>
      </div>

      {/* Next steps */}
      <Card variant="glass" className="border-white/10 bg-slate-900/40 p-6 sm:p-8">
        <p className="text-[13px] font-semibold text-slate-300 mb-3">Next: Craft your messages</p>
        <p className="text-[14px] leading-relaxed text-slate-100 mb-4">
          Once you've built your relationships list, move to Communications Prep to write tailored outreach messages for each person and company.
        </p>
        <Button
          render={<Link href="/prep/communications" />}
          variant="link"
          className="px-0 text-orange-300 hover:text-orange-200"
        >
          Write your communications →
        </Button>
      </Card>
    </div>
  )
}
